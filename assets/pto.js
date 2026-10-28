import { matchesEmployeeQuery } from './employee-filter.js?v=20261027';
import './auth.js';
const root = document.getElementById('ptoRoot'), errorBox = document.getElementById('ptoError');
const esc = SSS.esc, management = new URLSearchParams(location.search).get('view') === 'management';
const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let year = Number(today.slice(0,4)), state, actor, selected = [], requestId = crypto.randomUUID(), busy = false;
const managementFilters = {employee:'', status:'pending'};
const statuses = {pending:'รออนุมัติ / Pending',approved:'CEO อนุมัติแล้ว / CEO Approved',hr_recorded:'HR บันทึกแล้ว / HR Recorded',rejected:'ไม่อนุมัติ / Rejected',cancelled:'ยกเลิก / Cancelled'};
document.getElementById('ptoTheme').onclick = () => SSS.cycleTheme();
const showError = e => { errorBox.textContent = e.message || String(e); errorBox.hidden = false; };
const call = (action, body) => SSS.request(action,{dashboard:true,method:body ? 'POST':'GET',body,query:body ? {} : {year}});
function metrics(b) {
  return '<div class="pto-grid">'+[['สิทธิ์ประจำปี / Allowance',b.allowance],['ใช้แล้ว / Used',b.used],['รออนุมัติ / Pending',b.pending],['ยื่นลาได้ / Available',b.available]].map(([label,value])=>'<div class="pto-stat"><span>'+label+'</span><strong>'+ (value===null?'ยังไม่กำหนด':esc(value))+'</strong><span>วัน / days</span></div>').join('')+'</div>';
}
const requestStage = r => r.status==='approved'&&r.hrRecordedAt?'hr_recorded':r.status;
const yearControl = () => '<label class="pto-year">ปี / Year<input id="ptoYear" type="number" min="2020" max="2099" value="'+year+'"></label>';
function requestMarkup(r, canReview) {
  return '<article class="pto-request"><div class="pto-row"><h3>'+esc(r.employeeName || state.employee?.name || r.employeeId)+'</h3><span class="pto-status '+esc(r.status)+'">'+esc(statuses[requestStage(r)] || r.status)+'</span></div><p><span data-no-translate>'+r.dates.map(esc).join(', ')+'</span> · <span>'+r.days+' วัน / days</span></p><p class="pto-reason" data-no-translate>'+esc(r.reason)+'</p>'+(r.decisionNote?'<p class="pto-help"><span>เหตุผลผู้อนุมัติ / Decision:</span> <span data-no-translate>'+esc(r.decisionNote)+'</span></p>':'')+(r.status==='approved'?'<p class="pto-help">CEO อนุมัติแล้ว / CEO Approved'+(r.ceoApprovedAt?' · <span data-no-translate>'+esc(r.ceoApprovedAt)+'</span>':'')+'</p><p class="pto-help">'+(r.hrRecordedAt?'HR บันทึกแล้ว / HR Recorded':'รอ HR บันทึก / Awaiting HR record')+(r.hrRecordedByName?' · <span data-no-translate>'+esc(r.hrRecordedByName)+'</span>':'')+(r.hrRecordedAt?' · <span data-no-translate>'+esc(r.hrRecordedAt)+'</span>':'')+'</p>':'')+'<div class="pto-actions">'+(management&&state.canRecord&&r.status==='approved'&&!r.hrRecordedAt?'<button class="btn btn-primary" data-record="'+r.id+'">ยืนยัน HR บันทึกแล้ว / Mark HR Recorded</button>':'')+(canReview&&r.status==='pending'?'<button class="btn btn-primary" data-decision="approved" data-id="'+r.id+'">อนุมัติ / Approve</button><button class="btn btn-soft" data-decision="rejected" data-id="'+r.id+'">ไม่อนุมัติ / Reject</button>':'')+((!management&&r.status==='pending') || (canReview&&r.status==='approved')?'<button class="btn btn-ghost" data-decision="cancelled" data-id="'+r.id+'">ยกเลิก / Cancel</button>':'')+'</div></article>';
}
function employeeMarkup() {
  return '<section class="card"><div class="pto-row"><div><h2>'+esc(state.employee.name)+'</h2><p data-no-translate>'+esc(state.employee.id)+'</p></div>'+yearControl()+'<button class="btn btn-soft" id="ptoRefresh">Refresh</button><button class="btn btn-ghost" id="ptoLogout">Sign out</button></div>'+metrics(state.balance)+'</section><section class="card"><h2>ยื่นคำขอลาพักร้อน / Request PTO</h2><p class="pto-help">Select scheduled working days only. Each date uses one full day. Pending requests reserve your available balance.</p><form id="ptoRequestForm" class="pto-form"><div class="pto-row"><div class="field"><label for="ptoDate">วันที่ลา / Leave date</label><input id="ptoDate" type="date" min="'+esc(today>year+'-01-01'?today:year+'-01-01')+'" max="'+year+'-12-31"></div><button type="button" class="btn btn-soft" id="ptoAddDay">เพิ่มวัน / Add date</button></div><div class="pto-days" id="ptoSelected"></div><div class="field"><label for="ptoReason">เหตุผล / Reason</label><textarea id="ptoReason" required maxlength="500" rows="3"></textarea></div><button class="btn btn-primary" id="ptoSubmit" '+(state.balance.available===null||state.balance.available<1?'disabled':'')+'>ส่งคำขอ / Submit request</button><p class="pto-help">สิทธิ์รายปียังไม่รวมการยกยอด ระบบแยกคำขอตามปี / Allowances are set per year, with no automatic carryover.</p></form></section><section class="card"><h2>คำขอของฉัน / My requests</h2>'+ (state.requests.map(r=>requestMarkup(r,false)).join('') || '<p>ยังไม่มีคำขอ / No requests</p>')+'</section>';
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
  try { await call(action,body); selected=[]; requestId=crypto.randomUUID(); await load(); SSS.toast('บันทึกสำเร็จ / Saved','success'); }
  catch(e){showError(e);root.querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=false);if(!management&&(state.balance.available===null||state.balance.available<1))document.getElementById('ptoSubmit').disabled=true;}
  finally{busy=false;}
}
function showSelected() {
  const el=document.getElementById('ptoSelected'); el.innerHTML=selected.map(d=>'<button type="button" class="pto-day" data-remove-date="'+d+'" aria-label="Remove '+d+'">'+d+' ×</button>').join('');
  el.querySelectorAll('[data-remove-date]').forEach(b=>b.onclick=()=>{selected=selected.filter(d=>d!==b.dataset.removeDate);requestId=crypto.randomUUID();showSelected();});
}
async function decisionDialog(r,decision) {
  const dialog=document.createElement('dialog');dialog.className='card';dialog.setAttribute('aria-labelledby','ptoDecisionTitle');
  dialog.innerHTML='<form method="dialog"><h2 id="ptoDecisionTitle">'+esc(statuses[decision])+'</h2><p><span data-no-translate>'+esc(r.employeeName)+'</span> · <span>'+r.days+' วัน / days</span></p><p data-no-translate>'+r.dates.map(esc).join(', ')+'</p><div class="field"><label for="ptoDecisionNote">เหตุผล / Reason'+(decision==='approved'||!management?' (optional)':'')+'</label><textarea id="ptoDecisionNote" maxlength="500" '+((decision!=='approved'&&management)?'required':'')+'></textarea></div><div class="pto-actions"><button class="btn btn-ghost" value="back" formnovalidate>กลับ / Back</button><button class="btn btn-primary" value="confirm">ยืนยัน / Confirm</button></div></form>';
  document.body.append(dialog);dialog.showModal();const previousFocus=document.activeElement;
  dialog.addEventListener('close',()=>{const note=dialog.querySelector('textarea').value,confirmed=dialog.returnValue==='confirm';dialog.remove();previousFocus?.isConnected&&previousFocus.focus();if(confirmed)mutate(management?'reviewPtoRequest':'cancelMyPto',{id:r.id,decision,note,expectedVersion:r.version});},{once:true});
}
function bindRecordActions(){root.querySelectorAll('[data-record]').forEach(button=>button.onclick=()=>{const request=state.requests.find(r=>r.id===button.dataset.record);if(request)mutate('recordPtoRequest',{id:request.id,expectedVersion:request.version});});}
function bind() {
  document.getElementById('ptoYear').onchange=e=>{const y=Number(e.target.value);if(!Number.isInteger(y)||y<2020||y>2099){showError(new Error('Invalid year'));return;}year=y;selected=[];load().catch(showError);};
  document.getElementById('ptoRefresh').onclick=()=>load().catch(showError);
  root.querySelectorAll('[data-decision]').forEach(b=>b.onclick=()=>decisionDialog(state.requests.find(r=>r.id===b.dataset.id),b.dataset.decision));
  if(!management) {
    document.getElementById('ptoLogout').onclick=async()=>{await SSSAuth.logout();location.reload();};
    document.getElementById('ptoAddDay').onclick=()=>{const input=document.getElementById('ptoDate'),d=input.value;if(!d||!input.reportValidity())return;if(!d.startsWith(year+'-')||d<today)return showError(new Error('Select a future date in this year'));if(selected.length>=31)return showError(new Error('Maximum 31 days per request'));if(!selected.includes(d)){selected.push(d);selected.sort();requestId=crypto.randomUUID();}showSelected();};
    document.getElementById('ptoReason').oninput=()=>{requestId=crypto.randomUUID();};
    document.getElementById('ptoRequestForm').onsubmit=e=>{e.preventDefault();if(!selected.length)return showError(new Error('เพิ่มวันที่ต้องการลาก่อน / Add at least one date'));mutate('submitPtoRequest',{year,dates:selected,reason:document.getElementById('ptoReason').value,requestId});};
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
    root.querySelectorAll('[data-decision]').forEach(b=>b.onclick=()=>decisionDialog(state.requests.find(r=>r.id===b.dataset.id),b.dataset.decision));
    bindRecordActions();
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
    managementFilters.employee='';managementFilters.status='pending';
    search.value='';status.value='pending';applyEmployeeFilter();search.focus();
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


