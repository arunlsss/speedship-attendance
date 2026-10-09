import './auth.js';
(async () => {
  const viewer = await SSS.requireDashboard(['hr','admin','super_admin']);
  if (!viewer) return;
  let lastStatus = null, busy = false, photoSupported = false, photoBusy = false;
  let statusLoaded = false, lastFinishedAt = null;
  async function loadStatus() {
    try {
      const health = await SSS.request('health');
      photoSupported = health.capabilities?.employeePhotoSync === true;
      if (!health.capabilities?.employeeSheetImport) { lastStatus = {status:'unavailable'}; }
      else {
        lastStatus = await SSS.request('getEmployeeSyncStatus', {dashboard:true});
        const finishedAt = lastStatus.finishedAt || null;
        if (statusLoaded && finishedAt && finishedAt !== lastFinishedAt && !busy) {
          document.getElementById('refreshBtn')?.click();
        }
        lastFinishedAt = finishedAt;
        statusLoaded = true;
      }
    } catch (error) { lastStatus = {status:'error', error:error.message}; }
    renderStatus();
  }
  function renderStatus() {
    const box = document.getElementById('employeeSync'); if (!box) return;
    const button = box.querySelector('button');
    if (button) button.disabled = busy || !lastStatus || ['unavailable','running'].includes(lastStatus.status);
    const photoButton = box.querySelector('[data-sync-photos]');
    if (photoButton) photoButton.disabled = busy || !photoSupported;
    const status = box.querySelector('.employee-sync-status');
    const row = lastStatus;
    status.replaceChildren();
    if (!row) { status.textContent = 'Checking availability...'; return; }
    if (row.status === 'unavailable') { status.textContent = 'Employee sync will be available after the backend update.'; return; }
    if ((busy && !photoBusy) || row.status === 'running') { status.textContent = 'Syncing employees and status...'; return; }
    if (row.status === 'not_run') { status.textContent = 'The first employee sync has not run yet.'; return; }
    const labels = [['Imported',row.created||0],['Already present',row.existing||0],['Status updated',row.statusUpdated||0],['Skipped',row.skipped||0],['Failed',row.failed||0]];
    labels.forEach(([label,count]) => { const item = document.createElement('span'); item.append(Object.assign(document.createElement('span'),{textContent:label}),document.createTextNode(': '),Object.assign(document.createElement('strong'),{textContent:count}),document.createTextNode(' · ')); status.append(item); });
    if (row.finishedAt) { const time = document.createElement('time'); time.dataset.noTranslate = ''; time.textContent = new Date(row.finishedAt).toLocaleString(document.documentElement.lang==='th'?'th-TH':'en-GB',{timeZone:'Asia/Bangkok'}); status.append(time); }
    if (row.error) { const p = document.createElement('p'); p.textContent = row.error; status.append(p); }
    const details = box.querySelector('details'); details.hidden = !row.skippedRows?.length;
    details.querySelector('ul').innerHTML = (row.skippedRows||[]).map(item=>'<li><span>Sheet row</span> <span data-no-translate>'+SSS.esc(item.row)+'</span>: <span>'+SSS.esc(item.reason)+'</span></li>').join('');
  }
  function mount() {
    const anchor = document.getElementById('addEmployeeBtn');
    if (!anchor || document.getElementById('employeeSync')) return;
    const box = document.createElement('section'); box.id = 'employeeSync'; box.className = 'employee-sync';
    box.innerHTML = '<div class="employee-sync-heading"><h3>Employee spreadsheet sync</h3>' + (['hr','super_admin'].includes(viewer.role) ? '<div class="employee-sync-actions"><button class="btn btn-soft" type="button">Sync employees and status</button><button class="btn btn-soft" type="button" data-sync-photos disabled>Sync employee photos</button></div>' : '') + '</div><p>Adds missing employees and updates existing employee statuses from the Employees sheet every day at 12:00 PM Bangkok time. Other existing employee details are preserved.</p><p class="employee-sync-status" role="status"></p><p class="employee-photo-sync-status" role="status"></p><details hidden><summary>Rows needing review</summary><ul></ul><p>Shows the first 50 skipped rows.</p></details>';
    anchor.closest('.card').after(box);
    const button = box.querySelector('button');
    if (button) button.onclick = async () => {
      if (busy) return;
      busy = true; renderStatus();
      try {
        lastStatus = await SSS.request('syncMissingEmployees', {method:'POST',dashboard:true,body:{}});
        await loadStatus();
        SSS.toast('Employee sync complete','success');
        document.getElementById('refreshBtn')?.click();
      } catch (error) { SSS.toast(error.message,'error'); await loadStatus(); }
      finally { busy = false; renderStatus(); }
    };
    const photoButton = box.querySelector('[data-sync-photos]');
    if (photoButton) photoButton.onclick = async () => {
      if (busy || !photoSupported) return;
      busy = true; photoBusy = true; renderStatus();
      const message = box.querySelector('.employee-photo-sync-status');
      message.textContent = 'Syncing employee photo links...';
      try {
        const result = await SSS.request('syncEmployeePhotos', {method:'POST',dashboard:true,body:{}});
        message.replaceChildren();
        for (const [label, count] of [['Photo links updated',result.updated],['Skipped',result.skipped]]) {
          const item = document.createElement('span');
          item.append(Object.assign(document.createElement('span'),{textContent:label}),document.createTextNode(': '),Object.assign(document.createElement('strong'),{textContent:count}),document.createTextNode(' · '));
          message.append(item);
        }
        SSS.toast('Employee photo sync complete','success');
      } catch (error) { message.textContent = error.message; SSS.toast(error.message,'error'); }
      finally { busy = false; photoBusy = false; renderStatus(); }
    };
    renderStatus();
  }
  const observer = new MutationObserver(mount); observer.observe(document.getElementById('dashboardRoot'),{childList:true,subtree:true});
  mount(); await loadStatus();
  // Refresh status while a scheduled run is in progress or another HR user runs it.
  setInterval(() => { if (!busy && !document.hidden && document.getElementById('employeeSync')) loadStatus(); }, 60000);
})();
