import { matchesEmployeeQuery } from './employee-filter.js?v=20261027';
import './auth.js';
import { expandDateRange, requestStage, workflowSteps, requestRange } from './pto-model.js?v=20261028-request-details';
const root = document.getElementById('ptoRoot'), errorBox = document.getElementById('ptoError');
const esc = SSS.esc, management = new URLSearchParams(location.search).get('view') === 'management';
const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let year = Number(today.slice(0,4)), state, actor, requestId = crypto.randomUUID(), busy = false;
const managementFilters = {employee:'', status:'all'};
const statuses = {pending:'รออนุมัติ / Pending',approved:'CEO อนุมัติแล้ว / CEO Approved',hr_recorded:'HR บันทึกแล้ว / HR Recorded',rejected:'ไม่อนุมัติ / Rejected',cancelled:'ยกเลิก / Cancelled'};
document.getElementById('ptoTheme').onclick = () => SSS.cycleTheme();
const showError = e => { errorBox.textContent = e.message || String(e); errorBox.hidden = false; };
const call = (action, body) => SSS.request(action,{dashboard:true,method:body ? 'POST':'GET',body,query:body ? {} : {year}});
function metrics(b) {
  return '<div class="pto-grid">'+[['สิทธิ์ประจำปี / Allowance',b.allowance],['ใช้แล้ว / Used',b.used],['รออนุมัติ / Pending',b.pending],['ยื่นลาได้ / Available',b.available]].map(([label,value])=>'<div class="pto-stat"><span>'+label+'</span><strong>'+ (value===null?'ยังไม่กำหนด':esc(value))+'</strong><span>วัน / days</span></div>').join('')+'</div>';
}
const yearControl = () => '<label class="pto-year">ปี / Year<input id="ptoYear" type="number" min="2020" max="2099" value="'+year+'"></label>';
function dateText(value, withTime=false) {
  if (!value) return '—';
  const date = new Date(withTime ? value : value+'T12:00:00+07:00');
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'th-TH',{
    timeZone:'Asia/Bangkok',day:'numeric',month:'short',year:'numeric',
    ...(withTime?{hour:'2-digit',minute:'2-digit'}:{})
  }).format(date);
}
const dateMarkup = (value,withTime=false) => value ? '<time data-no-translate datetime="'+esc(value)+'" '+(withTime?'data-pto-time':'data-pto-date')+'="'+esc(value)+'">'+esc(dateText(value,withTime))+'</time>' : '<span data-no-translate>—</span>';
function rangeMarkup(r) {
  const range=requestRange(r);
  if (!range.continuous) return range.dates.map(d=>dateMarkup(d)).join(', ');
  return dateMarkup(range.start)+(range.end!==range.start?' <span data-no-translate>–</span> '+dateMarkup(range.end):'');
}
function requestMarkup(r) {
  const stage=requestStage(r);
  return '<article class="pto-request"><div class="pto-row pto-request-heading"><h3 data-no-translate>'+esc(r.employeeName || state.employee?.name || r.employeeId)+'</h3><span class="pto-status '+esc(stage)+'">'+esc(statuses[stage] || r.status)+'</span></div><p class="pto-request-dates">'+rangeMarkup(r)+' <span class="pto-day-count">'+esc(r.days)+' วัน / days</span></p><p class="pto-reason" data-no-translate>'+esc(r.reason || '—')+'</p><div class="pto-request-footer"><span class="pto-help"><span>ยื่นเมื่อ / Submitted</span> '+dateMarkup(r.requestedAt || r.createdAt,true)+'</span><button type="button" class="btn btn-soft" data-details="'+esc(r.id)+'">รายละเอียด / Details</button></div></article>';
}
function requestActions(r) {
  return (management&&state.canRecord&&r.status==='approved'&&!r.hrRecordedAt?'<button type="button" class="btn btn-primary" data-record="'+esc(r.id)+'">ยืนยัน HR บันทึกแล้ว / Mark HR Recorded</button>':'')+
    (management&&state.canManage&&r.status==='pending'?'<button type="button" class="btn btn-primary" data-decision="approved">อนุมัติ / Approve</button><button type="button" class="btn btn-soft" data-decision="rejected">ไม่อนุมัติ / Reject</button>':'')+
    ((!management&&r.status==='pending')||(management&&state.canManage&&r.status==='approved')?'<button type="button" class="btn btn-ghost" data-decision="cancelled">ยกเลิกคำขอ / Cancel request</button>':'');
}
function detailsDialog(r, trigger) {
  const dialog=document.createElement('dialog'), range=requestRange(r);
  dialog.id='ptoDetailsDialog';dialog.className='pto-details-dialog';dialog.setAttribute('aria-labelledby','ptoDetailsTitle');
  const field=(label,value)=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>';
  const terminal=['rejected','cancelled'].includes(r.status);
  dialog.innerHTML='<div class="pto-details-header"><div><p class="eyebrow">คำขอลา / Leave request</p><h2 id="ptoDetailsTitle">รายละเอียดคำขอ / Request details</h2></div><button type="button" class="btn btn-ghost pto-dialog-close" data-close aria-label="ปิด / Close">×</button></div><div class="pto-details-body">'+
    '<div class="pto-row pto-details-status"><span class="pto-status '+esc(requestStage(r))+'">'+esc(statuses[requestStage(r)]||r.status)+'</span><span class="pto-help" title="'+esc(r.id)+'" data-no-translate>#'+esc(r.id.slice(0,8))+'</span></div>'+
    (terminal?'<div class="pto-terminal"><strong>'+esc(statuses[r.status])+'</strong><p>'+dateMarkup(r.decidedAt||r.updatedAt,true)+(r.decidedByName?' · <span data-no-translate>'+esc(r.decidedByName)+'</span>':'')+'</p></div>':'')+
    '<ol class="pto-workflow" aria-label="ขั้นตอนคำขอ / Request progress">'+workflowSteps(r).map((step,i)=>'<li class="'+(step.complete?'is-complete':'is-waiting')+'"'+(step.current?' aria-current="step"':'')+'><span class="pto-step-icon" aria-hidden="true">'+(step.complete?'✓':i+1)+'</span><div><strong>'+step.label+'</strong><span class="pto-step-state">'+(step.complete?'เสร็จแล้ว / Completed':terminal?'ไม่ได้ดำเนินการ / Not completed':'รอดำเนินการ / Waiting')+'</span>'+(step.at?dateMarkup(step.at,true):'')+(step.by?'<span data-no-translate>'+esc(step.by)+'</span>':'')+'</div></li>').join('')+'</ol>'+
    '<dl class="pto-detail-grid">'+field('พนักงาน / Employee','<span data-no-translate>'+esc(r.employeeName||state.employee?.name||r.employeeId)+'</span>')+field('รหัสพนักงาน / Employee ID','<span data-no-translate>'+esc(r.employeeId)+'</span>')+field('วันเริ่มต้นการลา / Leave start date',dateMarkup(range.start))+field('วันที่สิ้นสุดการลา / Leave end date',dateMarkup(range.end))+field('จำนวนวันที่ใช้สิทธิ์ / Leave days','<span>'+esc(r.days)+' วัน / days</span>')+field('ปีที่ใช้สิทธิ์ / Allowance year','<span data-no-translate>'+esc(r.year||range.start?.slice(0,4)||year)+'</span>')+'</dl>'+
    '<section class="pto-detail-section"><h3>เหตุผลการลา / Leave reason</h3><p class="pto-detail-text" data-no-translate>'+esc(r.reason||'—')+'</p></section>'+
    '<details class="pto-detail-section"><summary>วันที่ใช้สิทธิ์ลา / Charged leave dates</summary><div class="pto-date-list">'+range.dates.map(d=>dateMarkup(d)).join('')+'</div>'+(r.excludedDates?.length?'<p class="pto-help">วันหยุดที่ HR บันทึกไว้ ไม่นับเป็นวันลา / Recorded days off are excluded</p><div class="pto-date-list">'+r.excludedDates.map(d=>dateMarkup(d)).join('')+'</div>':'')+'</details>'+
    (r.decisionNote?'<section class="pto-detail-section"><h3>หมายเหตุการพิจารณา / Decision note</h3><p class="pto-detail-text" data-no-translate>'+esc(r.decisionNote)+'</p></section>':'')+
    (management&&state.canRecord&&r.status==='approved'&&!r.hrRecordedAt?'<p class="pto-help">HR บันทึกคำขอที่ CEO อนุมัติแล้ว โดยไม่หักสิทธิ์ซ้ำ / HR records the approved request without deducting leave again.</p>':'')+
    '</div><footer class="pto-details-footer"><button type="button" class="btn btn-soft" data-close>ปิด / Close</button><div class="pto-actions">'+requestActions(r)+'</div></footer>';
  const previousFocus=trigger||document.activeElement;
  dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close());
  dialog.querySelectorAll('[data-decision]').forEach(button=>button.onclick=()=>{dialog.close();decisionDialog(r,button.dataset.decision);});
  const record=dialog.querySelector('[data-record]');
  if(record)record.onclick=()=>{
    const message='ยืนยัน HR บันทึกคำขอนี้แล้ว ระบบจะไม่หักสิทธิ์ซ้ำ / Confirm this request has been recorded by HR. Leave will not be deducted again.';
    if(confirm(window.SSSLanguage?.translate(message)||message)){dialog.close();mutate('recordPtoRequest',{id:r.id,expectedVersion:r.version});}
  };
  dialog.addEventListener('close',()=>{dialog.remove();if(previousFocus?.isConnected)previousFocus.focus();},{once:true});
  document.body.append(dialog);dialog.showModal();
}
function bindDetails() {
  root.querySelectorAll('[data-details]').forEach(button=>button.onclick=()=>{
    const request=state.requests.find(r=>r.id===button.dataset.details);
    if(request)detailsDialog(request,button);
  });
}
function employeeMarkup() {
  const disabled=state.balance.available===null||state.balance.available<1;
  return '<section class="card"><div class="pto-row"><div><h2 data-no-translate>'+esc(state.employee.name)+'</h2><p data-no-translate>'+esc(state.employee.id)+'</p></div>'+yearControl()+'<button class="btn btn-soft" id="ptoRefresh">Refresh</button><button class="btn btn-ghost" id="ptoLogout">Sign out</button></div>'+metrics(state.balance)+'</section><section class="card"><h2>ยื่นคำขอลาพักร้อน / Request PTO</h2><p class="pto-help">เลือกวันเริ่มต้นและวันที่สิ้นสุดการลา หากลาวันเดียวให้เลือกวันเดียวกันทั้งสองช่อง / Select the start and end dates. For one day of leave, select the same date in both fields.</p><form id="ptoRequestForm" class="pto-form"><div class="pto-date-range"><div class="field"><label for="ptoStartDate">วันเริ่มต้นการลา / Leave start date</label><input id="ptoStartDate" type="date" required min="'+esc(today>year+'-01-01'?today:year+'-01-01')+'" max="'+year+'-12-31" aria-describedby="ptoRangeSummary"></div><div class="field"><label for="ptoEndDate">วันที่สิ้นสุดการลา / Leave end date</label><input id="ptoEndDate" type="date" required min="'+esc(today>year+'-01-01'?today:year+'-01-01')+'" max="'+year+'-12-31" aria-describedby="ptoRangeSummary"></div></div><div id="ptoRangeSummary" class="pto-range-summary" role="status">กรุณาเลือกวันเริ่มต้นและวันที่สิ้นสุดการลา / Select a leave start and end date</div><p class="pto-help">นับรวมวันเริ่มต้นและวันสิ้นสุด ยกเว้นวันหยุดที่ HR บันทึกไว้ สูงสุด 31 วันต่อคำขอ / Both dates are included. Recorded days off are excluded. Maximum 31 leave days per request.</p><div class="field"><label for="ptoReason">เหตุผลการลา / Leave reason</label><textarea id="ptoReason" required maxlength="500" rows="3"></textarea></div>'+(disabled?'<p class="pto-help pto-quota-notice">'+(state.balance.available===null?'ยังยื่นลาไม่ได้ กรุณาให้ CEO กำหนดสิทธิ์ลาประจำปีก่อน / Ask the CEO to set your annual allowance before requesting leave.':'สิทธิ์ลาคงเหลือไม่เพียงพอ / No available leave balance.')+'</p>':'')+'<button class="btn btn-primary" id="ptoSubmit" '+(disabled?'disabled':'')+'>ส่งคำขอ / Submit request</button><p class="pto-help">คำขอที่รออนุมัติจะสำรองสิทธิ์ลาไว้ ไม่มีการยกยอดอัตโนมัติ / Pending requests reserve your leave balance. There is no automatic carryover.</p></form></section><section class="card"><h2>คำขอของฉัน / My requests</h2>'+(state.requests.map(r=>requestMarkup(r)).join('')||'<p>ยังไม่มีคำขอ / No requests</p>')+'</section>';
}
function managementMarkup() {
  const configured = state.ceoEmail ? 'CEO: '+esc(state.ceoEmail) : 'ยังไม่ได้กำหนดบัญชี CEO / CEO account has not been designated';
  return '<section class="card"><div class="pto-row"><div><h2>จัดการสิทธิ์และคำขอลา / PTO management</h2><p>'+configured+'</p></div>'+yearControl()+'<button class="btn btn-soft" id="ptoRefresh">Refresh</button><a class="btn btn-soft" href="'+SSS.routeForRole(actor.role)+'">Dashboard</a></div><p class="pto-help">เฉพาะ CEO ที่ได้รับมอบหมายเท่านั้นที่กำหนดสิทธิ์และอนุมัติได้ HR บันทึกคำขอที่ CEO อนุมัติแล้วและเชื่อมบัญชีพนักงานได้ / Only the designated CEO can set allowances and approve requests. HR records approved requests and links employee accounts.</p><div class="field"><label for="ptoEmployeeSearch">ค้นหาชื่อพนักงาน / Search employee name</label><input type="search" id="ptoEmployeeSearch" placeholder="ชื่อ ชื่อเล่น รหัส หรืออีเมล / Name, nickname, ID or email" aria-describedby="ptoFilterHelp"><p class="pto-help" id="ptoFilterHelp">ใช้กับสิทธิ์รายบุคคล คำขอลา และการเชื่อมบัญชี / Filters allowances, leave requests and account linking.</p><button class="btn btn-ghost" type="button" id="ptoClearFilters">ล้างตัวกรอง / Clear filters</button></div></section>'+
    (state.canDesignate?'<section class="card"><details><summary>กำหนดบัญชี CEO / Designate CEO</summary><form id="ptoCeoForm" class="pto-form"><div class="field"><label for="ptoCeoEmail">อีเมลบัญชี C-Level หรือ Super Admin / Account email</label><input type="email" required id="ptoCeoEmail" value="'+esc(state.ceoEmail)+'"></div><button class="btn btn-primary">Save CEO</button></form></details></section>':'')+
    (state.canLink?'<section class="card"><details><summary>เชื่อมบัญชีพนักงาน / Link employee account</summary><p class="pto-help">พนักงานสร้างบัญชีและยืนยันอีเมลในหน้าขอลาก่อน จากนั้น HR เชื่อมอีเมลกับรหัสพนักงาน การเชื่อมใหม่จะยกเลิกบัญชีเดิมของพนักงาน / Employee creates and verifies a leave account first. HR then links it here. Relinking replaces that employee’s previous access.</p><form id="ptoLinkForm" class="pto-form"><div class="field"><label for="ptoLinkEmployee">พนักงาน / Employee</label><select id="ptoLinkEmployee" required><option value="">เลือกพนักงาน / Select employee</option>'+state.employees.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+' ('+esc(e.id)+')'+(e.email?' · '+esc(e.email):'')+'</option>').join('')+'</select></div><div class="field"><label for="ptoLinkEmail">อีเมลที่ยืนยันแล้ว / Verified account email</label><input id="ptoLinkEmail" type="email" required></div><button class="btn btn-primary">Link account</button></form></details></section>':'')+
    '<section class="card"><h2>สิทธิ์รายบุคคล / Employee allowances</h2><p id="ptoEmployeeCount" class="pto-help" role="status"></p><p id="ptoEmployeeEmpty" class="pto-help" hidden>ไม่พบพนักงาน / No matching employees</p><div class="pto-table"><table><thead><tr><th>Employee</th><th>Allowance</th><th>Used</th><th>Pending</th><th>Available</th>'+(state.canManage?'<th>Action</th>':'')+'</tr></thead><tbody>'+state.employees.map(e=>'<tr data-employee-row data-employee-id="'+esc(e.id)+'"><td>'+esc(e.name)+'<br><small>'+esc(e.id)+'</small></td><td>'+(state.canManage?'<input type="number" min="0" max="366" step="1" data-allowance="'+esc(e.id)+'" aria-label="Allowance for '+esc(e.name)+'" value="'+(e.balance.allowance ?? '')+'" placeholder="Not set">':esc(e.balance.allowance ?? 'ยังไม่กำหนด'))+'</td><td>'+e.balance.used+'</td><td>'+e.balance.pending+'</td><td>'+esc(e.balance.available ?? 'ยังไม่กำหนด')+'</td>'+(state.canManage?'<td><button class="btn btn-soft" data-save-allowance="'+esc(e.id)+'">Save</button></td>':'')+'</tr>').join('')+'</tbody></table></div></section><section class="card"><h2>คำขอลา / Leave requests</h2><div class="field"><label for="ptoStatusFilter">สถานะ / Status</label><select id="ptoStatusFilter"><option value="pending">รออนุมัติ / Pending</option><option value="all">ทั้งหมด / All</option><option value="approved">CEO อนุมัติแล้ว / CEO Approved</option><option value="hr_recorded">HR บันทึกแล้ว / HR Recorded</option><option value="rejected">ไม่อนุมัติ / Rejected</option><option value="cancelled">ยกเลิก / Cancelled</option></select></div><div id="ptoRequests"></div></section>';
}
async function mutate(action,body) {
  if(busy)return; busy=true; errorBox.hidden=true;
  root.querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=true);
  try { await call(action,body);  requestId=crypto.randomUUID(); await load(); SSS.toast('บันทึกสำเร็จ / Saved','success'); }
  catch(e){showError(e);root.querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=false);if(!management&&(state.balance.available===null||state.balance.available<1))document.getElementById('ptoSubmit').disabled=true;}
  finally{busy=false;if(!management)updateRangeSummary();}
}
function selectedRange() {
  return expandDateRange(document.getElementById('ptoStartDate').value,document.getElementById('ptoEndDate').value,{year,today,nonWorkingDates:state.nonWorkingDates||[]});
}
function updateRangeSummary() {
  const summary=document.getElementById('ptoRangeSummary');
  if(!summary)return;
  const start=document.getElementById('ptoStartDate'),end=document.getElementById('ptoEndDate');
  end.min=start.value||start.min;end.setCustomValidity('');
  const submit=document.getElementById('ptoSubmit');
  if(!start.value||!end.value){summary.textContent='กรุณาเลือกวันเริ่มต้นและวันที่สิ้นสุดการลา / Select a leave start and end date';summary.classList.remove('is-invalid');submit.disabled=state.balance.available===null||state.balance.available<1;return;}
  try {
    const range=selectedRange(),available=state.balance.available;
    summary.classList.remove('is-invalid');
    summary.innerHTML='<strong>'+range.days+' วัน / days</strong>'+(range.excludedDates.length?'<span><span>ไม่นับวันหยุดที่บันทึกไว้ / Recorded days off excluded</span>: <span data-no-translate>'+range.excludedDates.length+'</span></span>':'')+(available!==null?'<span><span>สิทธิ์คงเหลือหลังยื่นคำขอ / Available after submitting</span>: <span data-no-translate>'+(available-range.days)+'</span></span>':'');
    if(available!==null&&range.days>available)throw new Error('สิทธิ์ลาคงเหลือไม่เพียงพอ / Insufficient available leave');
    submit.disabled=available===null||busy;
  } catch(error) {summary.textContent=error.message;summary.classList.add('is-invalid');end.setCustomValidity(error.message);submit.disabled=true;}
}
async function decisionDialog(r,decision) {
  const previousFocus=document.activeElement;
  const dialog=document.createElement('dialog');dialog.className='card pto-decision-dialog';dialog.setAttribute('aria-labelledby','ptoDecisionTitle');
  dialog.innerHTML='<form method="dialog"><h2 id="ptoDecisionTitle">'+esc(statuses[decision])+'</h2><p><span data-no-translate>'+esc(r.employeeName)+'</span> · <span>'+r.days+' วัน / days</span></p><p data-no-translate>'+r.dates.map(esc).join(', ')+'</p><div class="field"><label for="ptoDecisionNote">เหตุผล / Reason'+(decision==='approved'||!management?' (optional)':'')+'</label><textarea id="ptoDecisionNote" maxlength="500" '+((decision!=='approved'&&management)?'required':'')+'></textarea></div><div class="pto-actions"><button class="btn btn-ghost" value="back" formnovalidate>กลับ / Back</button><button class="btn btn-primary" value="confirm">ยืนยัน / Confirm</button></div></form>';
  document.body.append(dialog);dialog.showModal();
  dialog.addEventListener('close',()=>{const note=dialog.querySelector('textarea').value,confirmed=dialog.returnValue==='confirm';dialog.remove();previousFocus?.isConnected&&previousFocus.focus();if(confirmed)mutate(management?'reviewPtoRequest':'cancelMyPto',{id:r.id,decision,note,expectedVersion:r.version});},{once:true});
}
function bind() {
  document.getElementById('ptoYear').onchange=e=>{const y=Number(e.target.value);if(!Number.isInteger(y)||y<2020||y>2099){showError(new Error('Invalid year'));return;}year=y;load().catch(showError);};
  document.getElementById('ptoRefresh').onclick=()=>load().catch(showError);
  bindDetails();
  if(!management) {
    document.getElementById('ptoLogout').onclick=async()=>{await SSSAuth.logout();location.reload();};
    ['ptoStartDate','ptoEndDate'].forEach(id=>document.getElementById(id).oninput=()=>{requestId=crypto.randomUUID();updateRangeSummary();});
    document.getElementById('ptoReason').oninput=()=>{requestId=crypto.randomUUID();};
    document.getElementById('ptoRequestForm').onsubmit=e=>{
      e.preventDefault();errorBox.hidden=true;
      try {
        const range=selectedRange();
        if(state.balance.available===null||range.days>state.balance.available)throw new Error('สิทธิ์ลาคงเหลือไม่เพียงพอ / Insufficient available leave');
        mutate('submitPtoRequest',{year,startDate:document.getElementById('ptoStartDate').value,endDate:document.getElementById('ptoEndDate').value,reason:document.getElementById('ptoReason').value,requestId});
      }catch(error){showError(error);}
    };
    return;
  }
  const employeeById = new Map(state.employees.map(e => [e.id,e]));
  const renderRequests = () => {
    const requests = state.requests.filter(r => {
      const employee = employeeById.get(r.employeeId);
      return (managementFilters.status === 'all' || requestStage(r) === managementFilters.status)
        && matchesEmployeeQuery({...employee, employeeId:r.employeeId, employeeName:r.employeeName}, managementFilters.employee);
    });
    document.getElementById('ptoRequests').innerHTML = '<p class="pto-help" role="status">'+requests.length+' / '+state.requests.length+' คำขอ / requests</p>'
      + (requests.map(r=>requestMarkup(r,state.canManage)).join('') || '<p>ไม่มีคำขอที่ตรงกับตัวกรอง / No matching requests</p>');
    bindDetails();

  };
  const applyEmployeeFilter = () => {
    const employees = state.employees.filter(e=>matchesEmployeeQuery(e,managementFilters.employee));
    const ids = new Set(employees.map(e=>e.id));
    root.querySelectorAll('[data-employee-row]').forEach(row=>row.hidden=!ids.has(row.dataset.employeeId));
    document.getElementById('ptoEmployeeCount').textContent=employees.length+' / '+state.employees.length+' พนักงาน / employees';
    document.getElementById('ptoEmployeeEmpty').hidden=employees.length>0;
    const select=document.getElementById('ptoLinkEmployee');
    if(select) {
      const selectedId=select.value;
      select.innerHTML='<option value="">เลือกพนักงาน / Select employee</option>'+employees.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+' ('+esc(e.id)+')'+(e.email?' · '+esc(e.email):'')+'</option>').join('');
      select.value=ids.has(selectedId)?selectedId:'';
    }
    renderRequests();
  };
  const search=document.getElementById('ptoEmployeeSearch'), status=document.getElementById('ptoStatusFilter');
  search.value=managementFilters.employee;status.value=managementFilters.status;
  search.oninput=e=>{managementFilters.employee=e.target.value;applyEmployeeFilter();};
  status.onchange=e=>{managementFilters.status=e.target.value;renderRequests();};
  document.getElementById('ptoClearFilters').onclick=()=>{
    managementFilters.employee='';managementFilters.status='all';
    search.value='';status.value='all';applyEmployeeFilter();search.focus();
  };
  applyEmployeeFilter();
  root.querySelectorAll('[data-save-allowance]').forEach(b=>b.onclick=()=>{const employeeId=b.dataset.saveAllowance,input=Array.from(root.querySelectorAll('[data-allowance]')).find(i=>i.dataset.allowance===employeeId);if(!input.value||!input.reportValidity())return;mutate('setPtoAllowance',{employeeId,year,allowance:Number(input.value),expectedVersion:state.employees.find(e=>e.id===employeeId).balance.version});});
  const link=document.getElementById('ptoLinkForm');if(link)link.onsubmit=e=>{e.preventDefault();mutate('linkPtoEmployee',{employeeId:document.getElementById('ptoLinkEmployee').value,email:document.getElementById('ptoLinkEmail').value});};
  const ceo=document.getElementById('ptoCeoForm');if(ceo)ceo.onsubmit=e=>{e.preventDefault();mutate('designatePtoCeo',{email:document.getElementById('ptoCeoEmail').value,expectedVersion:state.configVersion});};
}
async function load() {
  errorBox.hidden=true;state=await call(management?'getPtoManagement':'getMyPto');root.innerHTML=management?managementMarkup():employeeMarkup();bind();
}
function loginMarkup(user) {
  root.innerHTML='<section class="card pto-form"><h2>บัญชีสำหรับยื่นลา / Leave account</h2><p class="pto-help">สร้างบัญชี ยืนยันอีเมล แล้วให้ HR เชื่อมบัญชีกับรหัสพนักงาน บัญชีนี้ใช้ยื่นลา การลงเวลายังใช้ขั้นตอนเดิม / Create an account, verify your email, and ask HR to link your employee record.</p>'+(user?'<p>'+esc(user.email)+'</p><div class="pto-actions"><button class="btn btn-soft" id="ptoVerify">ส่งอีเมลยืนยันอีกครั้ง / Resend verification</button><button class="btn btn-primary" id="ptoContinue">ตรวจสอบอีกครั้ง / Check again</button><button class="btn btn-ghost" id="ptoLogout">Sign out</button></div>':'<form id="ptoLoginForm"><div class="field"><label for="ptoEmail">Email</label><input id="ptoEmail" type="email" autocomplete="email" required></div><div class="field"><label for="ptoPassword">Password</label><input id="ptoPassword" type="password" autocomplete="current-password" required minlength="8"></div><div class="pto-actions"><button class="btn btn-primary" name="mode" value="login">Sign in</button><button class="btn btn-soft" name="mode" value="register">Create account</button><button class="btn btn-ghost" id="ptoReset" type="button">Reset password</button></div></form>')+'</section>';
  if(user) {
    document.getElementById('ptoVerify').onclick=async()=>{try{await SSSAuth.resendVerification();SSS.toast('Verification email sent');}catch(e){showError(e);}};
    document.getElementById('ptoContinue').onclick=()=>location.reload();
    document.getElementById('ptoLogout').onclick=async()=>{await SSSAuth.logout();location.reload();};return;
  }
  document.getElementById('ptoLoginForm').onsubmit=async e=>{
    e.preventDefault();if(busy)return;busy=true;errorBox.hidden=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);
    const email=document.getElementById('ptoEmail').value,password=document.getElementById('ptoPassword').value;
    try {if(e.submitter?.value==='register'){await SSSAuth.register({email,password});loginMarkup(SSSAuth.currentUser());SSS.toast('ยืนยันอีเมลแล้วให้ HR เชื่อมบัญชี / Verify your email, then ask HR to link your account');}else{await SSSAuth.login(email,password);await SSSAuth.idToken(true);await load();}}
    catch(err){showError(err);if(SSSAuth.currentUser())loginMarkup(SSSAuth.currentUser());}finally{busy=false;root.querySelectorAll('button').forEach(b=>b.disabled=false);}
  };
  document.getElementById('ptoReset').onclick=async()=>{try{const email=document.getElementById('ptoEmail');if(!email.value||!email.reportValidity())return;await SSSAuth.resetPassword(email.value);SSS.toast('Password reset email sent');}catch(e){showError(e);}};
}
try {
  const health=await SSS.request('health');if(!health.capabilities?.ptoRequests)throw new Error('ระบบขอลายังไม่เปิดใช้งาน กรุณาติดต่อ HR / PTO requests will be available after the backend update.');
  if(management){actor=await SSS.requireDashboard(['hr','executive','super_admin']);if(actor)await load();}
  else {const user=await SSSAuth.ready();if(!user)loginMarkup(null);else{await SSSAuth.idToken(true);try{await load();}catch(e){loginMarkup(user);showError(e);}}}
}catch(e){root.innerHTML='<section class="card"><p>ยังไม่สามารถเปิดหน้าขอลาได้ / Leave portal is unavailable.</p><a href="index.html" class="btn btn-soft">กลับหน้าลงเวลา / Back to attendance</a></section>';showError(e);}




// The shared language layer also updates lang after content changes. Avoid writing
// identical text here, otherwise the two observers can trigger each other forever.
new MutationObserver(()=>document.querySelectorAll('[data-pto-date],[data-pto-time]').forEach(element=>{
  const formatted=dateText(element.dataset.ptoTime||element.dataset.ptoDate,!!element.dataset.ptoTime);
  if(element.textContent!==formatted)element.textContent=formatted;
})).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
