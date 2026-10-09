import './auth.js';
(async()=>{
 const viewer=await SSS.requireDashboard(['hr','admin','super_admin']);if(!viewer)return;
 let busy=false,loaded=null;
 const esc=SSS.esc;
 async function request(action,body={}){return SSS.request(action,{method:'POST',dashboard:true,body});}
 async function load(){
  if(busy)return;busy=true;
  try{loaded=await request('listAttendanceDevices');render();}
  catch(e){const box=document.getElementById('attendanceDevices');if(box)box.querySelector('[data-device-status]').textContent=e.message;}
  finally{busy=false;}
 }
 function render(){
  const box=document.getElementById('attendanceDevices');if(!box||!loaded)return;
  box.innerHTML=`<h2>อุปกรณ์ลงเวลา / Attendance devices</h2><p data-device-status role="status">${loaded.enforced?'เปิดการป้องกันแล้ว — เฉพาะอุปกรณ์ที่อนุมัติเท่านั้น / Protection active — approved devices only':'ระหว่างเตรียมพร้อม — ยังลงเวลาได้ตามปกติ / Preparation — existing clock-in remains available'}</p><p>ตรวจสอบรหัสอุปกรณ์กับผู้ขอด้วยตนเองก่อนอนุมัติ การอนุมัติมีอายุ 90 วันและยกเลิกได้ทันที / Verify the device code with its owner before approval. Approval lasts 90 days and can be revoked immediately.</p><button class="btn btn-soft" type="button" data-device-refresh>รีเฟรช / Refresh</button><div class="table-wrap"><table class="table"><thead><tr><th>รหัส / Code</th><th>อุปกรณ์ / Device</th><th>ขอบเขต / Scope</th><th>สถานะ / Status</th><th>จัดการ / Action</th></tr></thead><tbody>${loaded.devices.map(d=>`<tr><td data-no-translate>${esc(d.code)}</td><td>${esc(d.label)}</td><td>${d.mode==='shared'?'อุปกรณ์ส่วนกลาง — พนักงานทุกคนที่สาขานี้ / Shared device — all assigned employees':'โทรศัพท์ส่วนตัว / Personal phone: '+esc(d.employeeId)}<br>${esc(d.locationId)}</td><td>${esc(d.status)}${d.expiresAtMs?'<br>'+esc(new Date(d.expiresAtMs).toLocaleDateString('en-GB')):''}</td><td>${d.status==='pending'?'<button type="button" class="btn btn-primary" data-device-approve="'+esc(d.id)+'">อนุมัติ / Approve</button>':''}${['pending','approved'].includes(d.status)?'<button type="button" class="btn btn-soft" data-device-revoke="'+esc(d.id)+'">ยกเลิก / Revoke</button>':''}</td></tr>`).join('')||'<tr><td colspan="5">ยังไม่มีคำขอ / No device requests</td></tr>'}</tbody></table></div>${!loaded.enforced&&viewer.role==='super_admin'?`<div style="margin-top:16px"><h3>เปิดการป้องกันหลังอนุมัติอุปกรณ์ / Enable after approving devices</h3><p>อนุมัติอุปกรณ์ที่พนักงานใช้งานให้ครบก่อนเปิด อุปกรณ์ที่ยังไม่อนุมัติจะลงเวลาไม่ได้ พนักงานไม่ต้องมีบัญชีหรือเข้าสู่ระบบ / Approve every required clock-in device first. Once enabled, unapproved devices cannot clock in. Employees do not need accounts or sign-in.</p><label for="deviceEnableText">พิมพ์ ENABLE / Type ENABLE</label><input id="deviceEnableText" autocomplete="off"><button type="button" class="btn btn-primary" data-device-enable>เปิดการป้องกัน / Enable protection</button></div>`:''}`;
  box.querySelector('[data-device-refresh]').onclick=load;
  box.querySelectorAll('[data-device-approve],[data-device-revoke]').forEach(button=>button.onclick=async()=>{
   if(busy)return;
   const approve=button.hasAttribute('data-device-approve');
   if(!confirm(approve?'ได้ตรวจสอบรหัสอุปกรณ์และขอบเขตที่แสดงแล้วใช่ไหม? / Have you verified this device code and its displayed scope?':'ยกเลิกการอนุมัติอุปกรณ์นี้ทันที? / Revoke this device now?'))return;
   busy=true;button.disabled=true;
   try{await request(approve?'approveAttendanceDevice':'revokeAttendanceDevice',{deviceId:button.dataset.deviceApprove||button.dataset.deviceRevoke});}
   catch(e){SSS.toast(e.message,'error');}
   finally{busy=false;await load();}
  });
  const enable=box.querySelector('[data-device-enable]');if(enable)enable.onclick=async()=>{
   if(busy)return;busy=true;enable.disabled=true;
   try{await request('enableAttendanceDeviceProtection',{confirm:box.querySelector('#deviceEnableText').value});SSS.toast('เปิดการป้องกันอุปกรณ์แล้ว / Device protection enabled','success');}
   catch(e){SSS.toast(e.message,'error');}
   finally{busy=false;await load();}
  };
 }
 function mount(){
  const content=document.querySelector('.dash-content');if(!content||document.getElementById('attendanceDevices'))return;
  const box=document.createElement('section');box.id='attendanceDevices';box.className='card';box.style.marginTop='20px';box.innerHTML='<h2>อุปกรณ์ลงเวลา / Attendance devices</h2><p data-device-status>กำลังตรวจสอบ / Loading…</p>';content.appendChild(box);if(loaded)render();
 }
 const root=document.getElementById('dashboardRoot');new MutationObserver(mount).observe(root,{childList:true,subtree:true});mount();await load();setInterval(()=>{if(!document.hidden)load();},60000);
})();
