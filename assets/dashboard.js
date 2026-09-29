(async () => {
  const page = document.body.dataset.dashboardPage;
  const allowed = page === "admin" ? ["admin","super_admin"] : page === "hr" ? ["hr","admin","super_admin"] : ["executive","admin","super_admin"];
  const viewer = await SSS.requireDashboard(allowed);
  if (!viewer) return;
  const role = viewer.role;

  let data = null;
  let days = 30;
  let employeeSearch = "";
  let statusFilter = "all";
  let accessData = null;

  const root = document.getElementById("dashboardRoot");
  root.innerHTML = shellMarkup();
  const $ = id => document.getElementById(id);

  $("themeBtn").onclick = () => SSS.cycleTheme();
  $("logoutBtn").onclick = async () => { await SSS.logoutDashboard(); location.href = "login.html"; };
  $("refreshBtn").onclick = () => load();
  $("periodSelect").onchange = e => { days = Number(e.target.value); load(); };

  function shellMarkup() {
    const nav = [
      { href:"hr.html", label:"HR Records", show: role === "hr" || role === "admin" || role === "super_admin" },
      { href:"admin.html", label: role === "super_admin" ? "Super Admin" : "System Admin", show: role === "admin" || role === "super_admin" },
      { href:"executive.html", label:"C-Level Overview", show: role === "executive" || role === "admin" || role === "super_admin" }
    ].filter(x=>x.show).map(x=>`<a href="${x.href}" class="${page === x.href.replace('.html','') ? 'active' : ''}">${x.label}</a>`).join("");
    return `<div class="dash-layout">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">SSS</div><div><div class="brand-title">Speedship</div><div class="brand-sub">Attendance Intelligence</div></div></div>
        <nav class="nav">${nav}<a href="index.html">Attendance App</a></nav>
        <div class="sidebar-footer"><div class="small muted">${SSS.esc(viewer.email || "")}<br>Role · <strong>${SSS.esc(role === "super_admin" ? "SUPER ADMIN" : role.toUpperCase())}</strong></div><button class="btn btn-ghost" id="logoutBtn">Sign out</button></div>
      </aside>
      <main class="dash-main">
        <header class="dash-topbar"><div><strong>${titleForPage()}</strong><div class="small muted">Attendance records · Asia/Bangkok</div></div><div class="toolbar-group"><select id="periodSelect"><option value="7">7 days</option><option value="30" selected>30 days</option><option value="60">60 days</option><option value="90">90 days</option></select><button class="btn btn-soft" id="refreshBtn">Refresh</button><button class="btn btn-soft" id="themeBtn">Theme · <span data-theme-label>Auto</span></button></div></header>
        <div class="dash-content"><div id="content"><div class="card">Loading dashboard…</div></div></div>
      </main>
      <div class="drawer-backdrop" id="drawerBackdrop"></div><aside class="drawer" id="drawer"><div class="drawer-head"><div><div class="eyebrow">EMPLOYEE RECORD</div><strong id="drawerTitle">Employee</strong></div><button class="icon-btn" id="drawerClose">×</button></div><div class="drawer-body" id="drawerBody"></div></aside>
      <div class="modal-backdrop" id="actionModal"><div class="modal" id="actionModalContent"></div></div>
    </div>`;
  }

  function titleForPage(){ return page === "hr" ? "HR Attendance Records" : page === "admin" ? "Attendance System Admin" : "C-Level Attendance Overview"; }

  async function load(){
    $("content").innerHTML = `<div class="card">Loading dashboard…</div>`;
    try {
      data = await SSS.request("dashboardData", { dashboard:true, query:{days} });
      if (role === "super_admin") accessData = await SSS.request("listDashboardUsers", { method:"POST", dashboard:true, body:{} });
      render();
    } catch(e) {
      if(e.status===401 || e.status===403){ await SSS.logoutDashboard(); location.href="login.html"; return; }
      $("content").innerHTML=`<div class="card"><strong>Unable to load dashboard</strong><div class="card-sub">${SSS.esc(e.message)}</div></div>`;
    }
  }

  function render(){
    $("content").innerHTML = `${renderHead()}${renderKpis()}${page === "hr" ? renderHR() : page === "admin" ? renderAdmin() : renderExecutive()}`;
    bindCommon();
    if(page==="hr") bindHR();
    if(page==="admin") bindAdmin();
    if(page==="executive") bindExecutive();
  }

  function renderHead(){
    return `<section class="page-head" style="margin-bottom:14px"><div><div class="eyebrow">${SSS.esc(data.period.from)} → ${SSS.esc(data.period.to)}</div><h1>${page === "executive" ? "Attendance intelligence" : page === "hr" ? "People & attendance" : "System control"}</h1><p>${page === "executive" ? "Executive view of attendance patterns and record quality." : page === "hr" ? "Employee master, attendance history and people records." : "Dashboard access control, employee records and Firebase → Google Sheets sync."}</p></div><div class="status-chip online"><span class="status-dot"></span><span>Updated ${SSS.esc(SSS.fmtDateTime(data.generatedAt))}</span></div></section>`;
  }

  function renderKpis(){
    const k=data.kpis;
    const cards=[
      ["Active employees", k.activeEmployees, `${k.pendingEmployees} pending`],
      ["Present today", k.presentToday, `As of ${data.dateKey}`],
      ["On-time rate", SSS.pct(k.punctualityRate), `+${data.thresholds.lateGraceMinutes} min grace`],
      ["Complete IN/OUT", SSS.pct(k.completionRate), `${k.attendanceLogs} logs in period`]
    ];
    return `<section class="kpi-grid">${cards.map(c=>`<div class="kpi"><div class="kpi-label">${c[0]}</div><div class="kpi-value">${c[1] ?? "—"}</div><div class="kpi-sub">${c[2]}</div></div>`).join("")}</section>`;
  }

  function renderHR(){
    return `<section class="dashboard-grid equal">
      <div class="card"><div class="card-head"><div><div class="eyebrow">EMPLOYEE MANAGEMENT</div><div class="card-title">HR-managed onboarding</div><div class="card-sub">Normal employees do not register themselves. HR/Admin creates employee records here.</div></div><button class="btn btn-primary" id="addEmployeeBtn">Add employee</button></div><div class="card-sub">New active employees appear in the V2 attendance page immediately after creation and sync to the System Employee sheet in the background.</div></div>
      <div class="card"><div class="card-head"><div><div class="eyebrow">30-DAY PATTERN</div><div class="card-title">Daily active employees</div></div></div>${renderTrend()}</div>
    </section>
    <section class="card" style="margin-top:14px"><div class="toolbar"><div><div class="eyebrow">EMPLOYEE MASTER</div><div class="card-title">Employee records</div></div><div class="toolbar-group"><input id="employeeSearch" placeholder="Search employee"><select id="statusFilter"><option value="all">All status</option><option>Active</option><option>Inactive</option><option>Pending</option><option>Rejected</option></select><button class="btn btn-soft" id="exportBtn">Export CSV</button></div></div><div style="height:12px"></div><div id="employeeTable">${renderEmployeeTable(true)}</div></section>`;
  }

  function renderAdmin(){
    return `${role === "super_admin" ? renderAccessControl() : ""}<section class="dashboard-grid equal">
      <div class="card"><div class="card-head"><div><div class="eyebrow">EMPLOYEE MANAGEMENT</div><div class="card-title">Create employee record</div><div class="card-sub">Attendance stays V2-style with no employee login or self-registration.</div></div><button class="btn btn-primary" id="addEmployeeBtn">Add employee</button></div><div class="card-sub">HR/Admin owns employee onboarding. Dashboard accounts are a separate management-only access system.</div></div>
      <div class="card"><div class="card-head"><div><div class="eyebrow">SYSTEM HEALTH</div><div class="card-title">Firebase → Google Sheets sync</div></div><span class="badge ${data.kpis.syncErrors?"red":"green"}">${data.kpis.syncErrors||0} errors</span></div>${renderSyncErrors()}</div>
    </section>
    <section class="dashboard-grid equal"><div class="card"><div class="card-head"><div><div class="eyebrow">ACTIVITY</div><div class="card-title">Daily active employees</div></div></div>${renderTrend()}</div><div class="card"><div class="card-head"><div><div class="eyebrow">EMPLOYEE COUNT</div><div class="card-title">Current workforce</div></div></div><div class="kpi-value">${data.kpis.activeEmployees}</div><div class="card-sub">Active employees available on the attendance page.</div></div></section>
    <section class="card" style="margin-top:14px"><div class="toolbar"><div><div class="eyebrow">EMPLOYEE MASTER</div><div class="card-title">Employee records</div></div><div class="toolbar-group"><input id="employeeSearch" placeholder="Search employee"><select id="statusFilter"><option value="all">All status</option><option>Active</option><option>Inactive</option><option>Pending</option><option>Rejected</option></select><button class="btn btn-soft" id="exportBtn">Export CSV</button></div></div><div style="height:12px"></div><div id="employeeTable">${renderEmployeeTable(true)}</div></section>`;
  }

  function dashboardRoleBadge(roleName){
    const label={hr:"HR",admin:"Admin",executive:"C-Level",super_admin:"Super Admin"}[roleName]||"Unassigned";
    const cls=roleName==="super_admin"?"blue":roleName==="admin"?"amber":roleName==="hr"?"green":"";
    return `<span class="badge ${cls}">${SSS.esc(label)}</span>`;
  }

  function renderAccessControl(){
    const users=accessData?.users||[];
    const pending=users.filter(u=>u.status==="pending").length;
    const rows=users.map(u=>`<tr><td><strong>${SSS.esc(u.displayName||"—")}</strong><br><span class="muted">${SSS.esc(u.email)}</span></td><td>${dashboardRoleBadge(u.role)}</td><td>${statusBadge(u.status)}</td><td>${SSS.esc(u.jobTitle||"—")}</td><td>${SSS.esc(SSS.fmtDateTime(u.lastLoginAt))}</td><td><button class="btn btn-soft accessEdit" data-uid="${SSS.esc(u.uid)}" style="min-height:32px">Manage</button></td></tr>`).join("");
    return `<section class="card" style="margin-bottom:14px"><div class="card-head"><div><div class="eyebrow">SUPER ADMIN · ACCESS CONTROL</div><div class="card-title">Dashboard accounts</div><div class="card-sub">Registration never grants access. Only Super Admin can activate an account and assign its role.</div></div><span class="badge ${pending?"amber":"green"}">${pending} pending</span></div><div class="table-wrap" style="margin-top:14px"><table class="table" style="min-width:760px"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Job title</th><th>Last sign-in</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="muted">No dashboard accounts yet.</td></tr>`}</tbody></table></div></section>`;
  }

  function renderExecutive(){
    return `<section class="dashboard-grid">
      <div class="card"><div class="card-head"><div><div class="eyebrow">ATTENDANCE 2×2 MATRIX</div><div class="card-title">Punctuality × complete IN/OUT records</div><div class="card-sub">BCG-style view for attendance records only, not an overall employee performance score.</div></div></div>${renderMatrix()}</div>
      <div class="stack"><div class="card"><div class="card-head"><div><div class="eyebrow">BRANCH MIX</div><div class="card-title">Activity by location</div></div></div>${renderBranches()}</div><div class="card"><div class="card-head"><div><div class="eyebrow">TREND</div><div class="card-title">Daily active employees</div></div></div>${renderTrend()}</div></div>
    </section>
    <section class="card" style="margin-top:14px"><div class="card-head"><div><div class="eyebrow">EMPLOYEE ATTENDANCE RECORDS</div><div class="card-title">Attendance metrics by employee</div><div class="card-sub">Click a row for detail. Financial/contact fields are intentionally hidden on C-Level access.</div></div></div><div id="employeeTable">${renderEmployeeTable(false)}</div></section>
    <section class="card" style="margin-top:14px"><div class="eyebrow">METHODOLOGY</div><div class="card-sub" style="margin-top:6px">X-axis: ${SSS.esc(data.methodology.matrixX)}. Y-axis: ${SSS.esc(data.methodology.matrixY)}. ${SSS.esc(data.methodology.note)}</div></section>`;
  }

  function renderPending(){
    const pending=data.employees.filter(x=>String(x.status).toLowerCase()==="pending");
    if(!pending.length) return `<div class="muted small">No pending registrations.</div>`;
    return `<div class="table-wrap"><table class="table" style="min-width:560px"><thead><tr><th>Employee</th><th>Location</th><th>Registered</th><th>Action</th></tr></thead><tbody>${pending.map(e=>`<tr><td><strong>${SSS.esc(e.name)}</strong><br><span class="muted">${SSS.esc(e.nick)} · ${SSS.esc(e.id)}</span></td><td>${SSS.esc((e.assignedLocs||[]).join(", ")||"—")}</td><td>${SSS.esc(SSS.fmtDateTime(e.registerTimestamp))}</td><td><button class="btn btn-primary approveBtn" data-id="${SSS.esc(e.id)}" style="min-height:32px">Review</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderTrend(){
    if(!data.trend.length) return `<div class="muted small">No attendance data in this period.</div>`;
    const max=Math.max(...data.trend.map(x=>x.employees),1);
    return `<div class="chart-bars">${data.trend.map(x=>`<div class="bar-item" title="${SSS.esc(x.dateKey)} · ${x.employees} employees" style="height:${Math.max(4,(x.employees/max)*100)}%"></div>`).join("")}</div><div class="small muted" style="margin-top:7px">Each bar = unique employees with at least one attendance record that day.</div>`;
  }

  function renderBranches(){
    if(!data.branches.length) return `<div class="muted small">No activity.</div>`;
    return data.branches.map(b=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)"><div><strong style="font-size:12px">${SSS.esc(b.name)}</strong><div class="small muted">${b.employees} employees</div></div><span class="badge blue">${b.logs} logs</span></div>`).join("");
  }

  function renderMatrix(){
    const pts=data.matrix;
    const pointHtml=pts.map(p=>`<button class="matrix-point ${p.quadrant}" data-emp="${SSS.esc(p.id)}" title="${SSS.esc(`${p.name} (${p.nick}) · On-time ${SSS.pct(p.x)} · Complete ${SSS.pct(p.y)}`)}" style="left:${Math.min(98,Math.max(2,p.x*100))}%;bottom:${Math.min(98,Math.max(2,p.y*100))}%"></button>`).join("");
    return `<div class="matrix"><div class="matrix-q q1">Strong record</div><div class="matrix-q q2">Timing attention</div><div class="matrix-q q3">Record review</div><div class="matrix-q q4">Check-out consistency</div><div class="matrix-axis-x">On-time rate →</div><div class="matrix-axis-y">Complete IN/OUT →</div>${pointHtml}</div><div class="small muted" style="margin-top:8px">Thresholds shown conceptually at 90% / 90%. Employees need at least 2 observed days and a known shift start to appear.</div>`;
  }

  function filteredEmployees(){
    return data.employees.filter(e=>{
      const q=employeeSearch.trim().toLowerCase();
      const text=`${e.id} ${e.name} ${e.nick} ${e.type} ${(e.assignedLocs||[]).join(" ")}`.toLowerCase();
      const statusOk=statusFilter==="all"||String(e.status).toLowerCase()===statusFilter.toLowerCase();
      return statusOk&&(!q||text.includes(q));
    });
  }

  function quadrantBadge(q){ const map={strong:["Strong record","green"],completion:["Check-out consistency","blue"],timing:["Timing attention","amber"],review:["Record review","red"],insufficient:["Insufficient data",""]};const x=map[q]||map.insufficient;return `<span class="badge ${x[1]}">${x[0]}</span>`; }

  function renderEmployeeTable(sensitive){
    const list=filteredEmployees();
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Employee</th><th>Status</th><th>Type</th><th>Location</th><th>Observed days</th><th>On-time</th><th>Complete</th><th>Matrix</th>${sensitive?"<th>Last activity</th>":""}</tr></thead><tbody>${list.map(e=>`<tr class="employeeRow" data-id="${SSS.esc(e.id)}"><td><strong>${SSS.esc(e.name)}</strong><br><span class="muted">${SSS.esc(e.nick)} · ${SSS.esc(e.id)}</span></td><td>${statusBadge(e.status)}</td><td>${SSS.esc(e.type||"—")}</td><td>${SSS.esc((e.assignedLocs||[]).join(", ")||"—")}</td><td>${e.metrics.observedDays}</td><td>${SSS.pct(e.metrics.punctualityRate)}</td><td>${SSS.pct(e.metrics.completionRate)}</td><td>${quadrantBadge(e.metrics.quadrant)}</td>${sensitive?`<td>${SSS.esc(SSS.fmtDateTime(e.metrics.lastActivity))}</td>`:""}</tr>`).join("")}</tbody></table></div>`;
  }

  function statusBadge(status){ const s=String(status||""); const cls=s.toLowerCase()==="active"?"green":s.toLowerCase()==="pending"?"amber":s.toLowerCase()==="rejected"?"red":""; return `<span class="badge ${cls}">${SSS.esc(s||"—")}</span>`; }

  function renderDevices(){
    const devices=data.devices||[]; if(!devices.length) return `<div class="muted small">No paired devices yet.</div>`;
    return `<div class="table-wrap"><table class="table" style="min-width:620px"><thead><tr><th>Device</th><th>Status</th><th>Last seen</th><th>Expires</th><th></th></tr></thead><tbody>${devices.map(d=>`<tr><td><strong>${SSS.esc(d.label)}</strong><br><span class="mono muted">${SSS.esc(d.id)}</span></td><td>${d.active?'<span class="badge green">Active</span>':'<span class="badge red">Revoked</span>'}</td><td>${SSS.esc(SSS.fmtDateTime(d.lastSeenAt))}</td><td>${SSS.esc(SSS.fmtDateTime(d.expiresAt))}</td><td><button class="btn btn-soft deviceToggle" data-id="${SSS.esc(d.fullId)}" data-active="${d.active}" style="min-height:32px">${d.active?"Revoke":"Enable"}</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderSyncErrors(){
    const errs=data.syncErrors||[]; if(!errs.length) return `<div class="badge green">No recent sync errors</div><div class="card-sub" style="margin-top:8px">Firestore event triggers are syncing attendance rows to the System Google Sheet.</div>`;
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Log</th><th>Employee</th><th>Date</th></tr></thead><tbody>${errs.map(x=>`<tr><td class="mono">${SSS.esc(x.logId)}</td><td>${SSS.esc(x.employeeId)}</td><td>${SSS.esc(SSS.fmtDateTime(x.recordedAt))}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function bindCommon(){
    document.querySelectorAll(".employeeRow,.matrix-point").forEach(el=>el.onclick=()=>openEmployee(el.dataset.id));
    $("drawerClose").onclick=closeDrawer; $("drawerBackdrop").onclick=closeDrawer;
  }

  function bindHR(){
    $("employeeSearch").oninput=e=>{employeeSearch=e.target.value;$("employeeTable").innerHTML=renderEmployeeTable(true);bindCommon();};
    $("statusFilter").onchange=e=>{statusFilter=e.target.value;$("employeeTable").innerHTML=renderEmployeeTable(true);bindCommon();};
    $("exportBtn").onclick=exportCSV;
    $("addEmployeeBtn").onclick=openAddEmployee;
  }

  function bindAdmin(){
    $("employeeSearch").oninput=e=>{employeeSearch=e.target.value;$("employeeTable").innerHTML=renderEmployeeTable(true);bindCommon();};
    $("statusFilter").onchange=e=>{statusFilter=e.target.value;$("employeeTable").innerHTML=renderEmployeeTable(true);bindCommon();};
    $("exportBtn").onclick=exportCSV;
    $("addEmployeeBtn").onclick=openAddEmployee;
    if(role==="super_admin") document.querySelectorAll(".accessEdit").forEach(b=>b.onclick=()=>openAccessManager(b.dataset.uid));
  }
  function bindExecutive(){}

  function openEmployee(id){
    const e=data.employees.find(x=>x.id===id); if(!e)return;
    $("drawerTitle").textContent=`${e.name} (${e.nick||"—"})`;
    const sensitive=role==="hr"||role==="admin"||role==="super_admin";
    const daily=sensitive?(e.daily||[]).slice().reverse().slice(0,20):[];
    $("drawerBody").innerHTML=`<div class="info-grid">
      ${info("Employee ID",e.id)}${info("Status",e.status)}${info("Type",e.type)}${info("Location",(e.assignedLocs||[]).join(", ")||"—")}
      ${info("Observed days",e.metrics.observedDays)}${info("On-time rate",SSS.pct(e.metrics.punctualityRate))}${info("Complete IN/OUT",SSS.pct(e.metrics.completionRate))}${info("Last activity",SSS.fmtDateTime(e.metrics.lastActivity))}
      ${sensitive?info("Phone",e.phone||"—")+info("Bank",e.bank||"—")+info("Salary",e.salary==null?"—":Number(e.salary).toLocaleString("th-TH"))+info("Incentive",e.incentive==null?"—":Number(e.incentive).toLocaleString("th-TH")):""}
    </div>
    <div style="margin-top:14px">${quadrantBadge(e.metrics.quadrant)}</div>
    ${sensitive&&e.profileStoragePath?`<button class="btn btn-soft" id="loadProfilePhoto" style="margin-top:12px">View private profile photo</button><div id="photoPreview" style="margin-top:10px"></div>`:sensitive&&e.profilePhotoUrl?`<a class="btn btn-soft" href="${SSS.esc(e.profilePhotoUrl)}" target="_blank" rel="noreferrer" style="margin-top:12px">Open legacy profile photo</a>`:""}
    ${sensitive?`<div class="card-title" style="margin-top:18px;margin-bottom:8px">Recent attendance days</div>${dailyTable(daily)}`:"<div class='card-sub' style='margin-top:14px'>C-Level access intentionally excludes personal contact, bank and salary fields.</div>"}`;
    $("drawerBackdrop").classList.add("open"); $("drawer").classList.add("open");
    const photoBtn=$("loadProfilePhoto"); if(photoBtn) photoBtn.onclick=()=>loadPhoto(e.profileStoragePath,"photoPreview");
  }

  function info(label,value){return `<div class="info-box"><div class="info-label">${SSS.esc(label)}</div><div class="info-value">${SSS.esc(value)}</div></div>`;}
  function dailyTable(rows){if(!rows.length)return`<div class="muted small">No records in selected period.</div>`;return`<div class="table-wrap"><table class="table" style="min-width:560px"><thead><tr><th>Date</th><th>IN</th><th>OUT</th><th>On time</th><th>Complete</th></tr></thead><tbody>${rows.map(d=>`<tr><td>${SSS.esc(d.dateKey)}</td><td>${timeOnly(d.firstIn)}</td><td>${timeOnly(d.lastOut)}</td><td>${d.onTime==null?"—":d.onTime?'<span class="badge green">Yes</span>':`<span class="badge amber">+${d.minutesLate}m</span>`}</td><td>${d.complete?'<span class="badge green">Yes</span>':'<span class="badge red">Missing</span>'}</td></tr>`).join("")}</tbody></table></div>`;}
  function timeOnly(v){if(!v)return"—";return new Date(v).toLocaleTimeString("th-TH",{timeZone:"Asia/Bangkok",hour:"2-digit",minute:"2-digit"});}
  function closeDrawer(){ $("drawerBackdrop").classList.remove("open"); $("drawer").classList.remove("open"); }

  async function loadPhoto(storagePath,target){
    try{const el=$(target);el.innerHTML=`<div class="muted small">Loading private photo…</div>`;const r=await SSS.request("getPrivatePhoto",{method:"POST",dashboard:true,body:{storagePath}});el.innerHTML=`<img alt="Private employee photo" src="data:${SSS.esc(r.mime)};base64,${r.base64}" style="max-width:220px;width:100%;border-radius:14px;border:1px solid var(--border)">`;}
    catch(e){SSS.toast(e.message,"error");}
  }

  function openApproval(id){
    const e=data.employees.find(x=>x.id===id); if(!e)return;
    const locOpts=data.locations.map(l=>`<option value="${SSS.esc(l.name)}" ${(e.assignedLocs||[]).includes(l.name)?"selected":""}>${SSS.esc(l.name)}</option>`).join("");
    $("actionModalContent").innerHTML=`<div class="eyebrow">EMPLOYEE APPROVAL</div><h2>${SSS.esc(e.name)}</h2><p>${SSS.esc(e.nick)} · ${SSS.esc(e.id)}</p><div class="field"><label class="field-label">Employee type</label><select id="approveType"><option value="01.Full-Time_OF">01.Full-Time_OF</option><option value="02.Full-Time_WH">02.Full-Time_WH</option><option value="03.Daily" selected>03.Daily</option><option value="04.Weekly">04.Weekly</option><option value="05.Job">05.Job</option><option value="06.Intern">06.Intern</option></select></div><div class="field"><label class="field-label">Assigned location</label><select id="approveLoc">${locOpts}</select></div><div class="modal-actions"><button class="btn btn-danger" id="rejectBtn">Reject</button><button class="btn btn-ghost" id="approvalCancel">Cancel</button><button class="btn btn-primary" id="approveConfirm">Approve</button></div>`;
    $("actionModal").classList.add("open"); $("approvalCancel").onclick=()=>$("actionModal").classList.remove("open");
    $("approveConfirm").onclick=async()=>{try{await SSS.request("approveEmployee",{method:"POST",dashboard:true,body:{empId:id,type:$("approveType").value,assignedLocs:[$("approveLoc").value]}});SSS.toast("Employee approved","success");$("actionModal").classList.remove("open");load();}catch(err){SSS.toast(err.message,"error");}};
    $("rejectBtn").onclick=async()=>{try{await SSS.request("rejectEmployee",{method:"POST",dashboard:true,body:{empId:id}});SSS.toast("Registration rejected","success");$("actionModal").classList.remove("open");load();}catch(err){SSS.toast(err.message,"error");}};
  }

  function openAddEmployee(){
    const locOpts=(data.locations||[]).map(l=>`<option value="${SSS.esc(l.name)}">${SSS.esc(l.name)}</option>`).join("");
    $("actionModalContent").innerHTML=`<div class="eyebrow">HR / ADMIN</div><h2>Add employee</h2><p>Normal employees do not create accounts. This creates the employee master record used by the V2 attendance page.</p><div class="grid-2"><div class="field"><label class="field-label">Full name</label><input id="newEmpName"></div><div class="field"><label class="field-label">Nickname</label><input id="newEmpNick"></div><div class="field"><label class="field-label">Employee ID <span class="muted">(optional)</span></label><input id="newEmpId" placeholder="Auto-generate if blank"></div><div class="field"><label class="field-label">Employee type</label><select id="newEmpType"><option value="01.Full-Time_OF">01.Full-Time_OF</option><option value="02.Full-Time_WH">02.Full-Time_WH</option><option value="03.Daily" selected>03.Daily</option><option value="04.Weekly">04.Weekly</option><option value="05.Job">05.Job</option><option value="06.Intern">06.Intern</option></select></div><div class="field"><label class="field-label">Assigned location</label><select id="newEmpLoc">${locOpts}</select></div><div class="field"><label class="field-label">Status</label><select id="newEmpStatus"><option>Active</option><option>Inactive</option></select></div><div class="field"><label class="field-label">Phone</label><input id="newEmpPhone" inputmode="tel"></div><div class="field"><label class="field-label">Bank account</label><input id="newEmpBank"></div><div class="field"><label class="field-label">Salary</label><input id="newEmpSalary" inputmode="decimal"></div><div class="field"><label class="field-label">Incentive</label><input id="newEmpIncentive" inputmode="decimal"></div></div><div class="modal-actions"><button class="btn btn-ghost" id="newEmpCancel">Cancel</button><button class="btn btn-primary" id="newEmpCreate">Create employee</button></div>`;
    $("actionModal").classList.add("open");
    $("newEmpCancel").onclick=()=>$("actionModal").classList.remove("open");
    $("newEmpCreate").onclick=async()=>{
      const btn=$("newEmpCreate"); btn.disabled=true; btn.textContent="Creating…";
      try{
        const r=await SSS.request("createEmployee",{method:"POST",dashboard:true,body:{
          empId:$("newEmpId").value.trim(), fullname:$("newEmpName").value.trim(), nick:$("newEmpNick").value.trim(),
          type:$("newEmpType").value, assignedLocs:[$("newEmpLoc").value], status:$("newEmpStatus").value,
          phone:$("newEmpPhone").value.trim(), bank:$("newEmpBank").value.trim(), salary:$("newEmpSalary").value.trim(), incentive:$("newEmpIncentive").value.trim()
        }});
        SSS.toast(`Employee ${r.empId} created`,"success"); $("actionModal").classList.remove("open"); await load();
      }catch(e){SSS.toast(e.message,"error");}
      finally{btn.disabled=false;btn.textContent="Create employee";}
    };
  }

  function openAccessManager(uid){
    const u=(accessData?.users||[]).find(x=>x.uid===uid); if(!u)return;
    const roleOptions=[["hr","HR"],["admin","Admin"],["executive","C-Level"],["super_admin","Super Admin"]].map(([value,label])=>`<option value="${value}" ${u.role===value?"selected":""}>${label}</option>`).join("");
    const statusOptions=[["active","Active"],["pending","Pending"],["disabled","Disabled"],["rejected","Rejected"]].map(([value,label])=>`<option value="${value}" ${u.status===value?"selected":""}>${label}</option>`).join("");
    $("actionModalContent").innerHTML=`<div class="eyebrow">DASHBOARD ACCESS</div><h2>${SSS.esc(u.displayName||u.email)}</h2><p>${SSS.esc(u.email)}</p><div class="grid-2"><div class="field"><label class="field-label">Assigned role</label><select id="accessRole">${roleOptions}</select></div><div class="field"><label class="field-label">Access status</label><select id="accessStatus">${statusOptions}</select></div></div><div class="notice-box"><strong>Server enforced</strong><span>Changing the page URL or browser storage cannot bypass this role. The backend re-checks the signed-in account on every protected request.</span></div><div class="modal-actions"><button class="btn btn-ghost" id="accessCancel">Cancel</button><button class="btn btn-primary" id="accessSave">Save access</button></div>`;
    $("actionModal").classList.add("open");
    $("accessCancel").onclick=()=>$("actionModal").classList.remove("open");
    $("accessSave").onclick=async()=>{try{await SSS.request("setDashboardUserAccess",{method:"POST",dashboard:true,body:{uid,role:$("accessRole").value,status:$("accessStatus").value}});SSS.toast("Dashboard access updated","success");$("actionModal").classList.remove("open");await load();}catch(e){SSS.toast(e.message,"error");}};
  }

  async function createPairingCode(){
    $("actionModalContent").innerHTML=`<div class="eyebrow">PAIR NEW DEVICE</div><h2>Create pairing code</h2><p>The code can be used once and expires in 10 minutes.</p><div class="field"><label class="field-label">Device label</label><input id="pairingLabel" placeholder="e.g. iPad · Bang Bo Warehouse"></div><div class="modal-actions"><button class="btn btn-ghost" id="pairingCancel">Cancel</button><button class="btn btn-primary" id="pairingCreate">Generate code</button></div>`;
    $("actionModal").classList.add("open"); $("pairingCancel").onclick=()=>$("actionModal").classList.remove("open");
    $("pairingCreate").onclick=async()=>{try{const r=await SSS.request("createDevicePairingCode",{method:"POST",dashboard:true,body:{label:$("pairingLabel").value.trim()}});$("actionModalContent").innerHTML=`<div class="eyebrow">PAIRING CODE</div><h2 style="font-size:42px;letter-spacing:.15em;font-variant-numeric:tabular-nums">${SSS.esc(r.code)}</h2><p>Enter this code on the attendance device. Expires ${SSS.esc(SSS.fmtDateTime(r.expiresAt))}. It can only be used once.</p><div class="modal-actions"><button class="btn btn-primary" id="pairingDone">Done</button></div>`;$("pairingDone").onclick=()=>$("actionModal").classList.remove("open");}catch(e){SSS.toast(e.message,"error");}};
  }

  function exportCSV(){
    const rows=[["Employee_ID","Status","Type","Name","Nick","Assigned_Locations","Observed_Days","On_Time_Rate","Complete_Rate","Last_Activity"],...filteredEmployees().map(e=>[e.id,e.status,e.type,e.name,e.nick,(e.assignedLocs||[]).join(" | "),e.metrics.observedDays,e.metrics.punctualityRate??"",e.metrics.completionRate??"",e.metrics.lastActivity||""])];
    const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n"); const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`speedship-attendance-${data.period.from}-${data.period.to}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  load();
})();
