import "./auth.js";
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
  let employeePage = 0;
  let syncPage = 0;
  const employeePageSize = 20;
  const syncPageSize = 5;

  const root = document.getElementById("dashboardRoot");
  root.innerHTML = shellMarkup();
  SSS.applyTheme();
  const $ = id => document.getElementById(id);

  $("themeBtn").onclick = () => SSS.cycleTheme();
  $("logoutBtn").onclick = async () => { await SSS.logoutDashboard(); location.href = "login.html"; };
  $("refreshBtn").onclick = () => load();
  $("periodSelect").onchange = e => { days = Number(e.target.value); load(); };
  $("mobileMoreBtn").onclick = () => toggleMobileMenu();
  $("mobileMenuClose").onclick = () => toggleMobileMenu(false);
  $("mobileMenuBackdrop").onclick = () => toggleMobileMenu(false);
  $("mobileThemeBtn").onclick = () => SSS.cycleTheme();
  $("mobileLogoutBtn").onclick = $("logoutBtn").onclick;
  matchMedia("(max-width:980px)").addEventListener("change",e=>{if(!e.matches)toggleMobileMenu(false);});
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { toggleMobileMenu(false); closeDrawer(); }
    if (e.key === "Tab" && !$("mobileMenu").hidden) {
      const controls=Array.from($("mobileMenu").querySelectorAll("button:not(:disabled),a[href]"));
      const first=controls[0],last=controls[controls.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });

  function shellMarkup() {
    const pages = [
      { href:"hr.html", label:"HR Records", short:"HR", icon:"records", show: role === "hr" || role === "admin" || role === "super_admin" },
      { href:"admin.html", label: role === "super_admin" ? "Super Admin" : "System Admin", short:"Admin", icon:"admin", show: role === "admin" || role === "super_admin" },
      { href:"executive.html", label:"C-Level Overview", short:"Overview", icon:"overview", show: role === "executive" || role === "admin" || role === "super_admin" },
      { href:"index.html", label:"Attendance App", short:"Clock in", icon:"clock", show:true }
    ].filter(x=>x.show);
    const nav = pages.map(x=>`<a href="${x.href}" ${page === x.href.replace('.html','') ? 'class="active" aria-current="page"' : ''}>${SSS.esc(x.label)}</a>`).join("");
    const mobileNav = pages.map(x=>`<a href="${x.href}" aria-label="${SSS.esc(x.label)}" ${page === x.href.replace('.html','') ? 'class="active" aria-current="page"' : ''}>${navIcon(x.icon)}<span>${x.short}</span></a>`).join("");
    return `<div class="dash-layout">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">SSS</div><div><div class="brand-title">Speedship</div><div class="brand-sub">Attendance Operations</div></div></div>
        <nav class="nav" aria-label="Dashboard">${nav}</nav>
        <div class="sidebar-footer"><div class="small muted">${SSS.esc(viewer.email || "")}<br>Role · <strong>${SSS.esc(role === "super_admin" ? "SUPER ADMIN" : role.toUpperCase())}</strong></div><button class="btn btn-ghost" id="logoutBtn">Sign out</button></div>
      </aside>
      <main class="dash-main">
        <header class="dash-topbar"><div class="dash-topbar-title"><strong>${titleForPage()}</strong><div class="small muted">Attendance records · Asia/Bangkok</div></div><div class="toolbar-group"><select id="periodSelect" aria-label="Attendance period"><option value="7">7 days</option><option value="30" selected>30 days</option><option value="60">60 days</option><option value="90">90 days</option></select><button class="btn btn-soft" id="refreshBtn">Refresh</button><button class="btn btn-soft" id="themeBtn">Theme · <span data-theme-label>Auto</span></button></div></header>
        <div class="dash-content"><div id="content"><div class="card">Loading dashboard…</div></div></div>
      </main>
      <nav class="mobile-nav" aria-label="Dashboard">${mobileNav}<button type="button" id="mobileMoreBtn" aria-expanded="false" aria-controls="mobileMenu">${navIcon("more")}<span>More</span></button></nav>
      <div class="mobile-menu-backdrop" id="mobileMenuBackdrop" hidden></div>
      <section class="mobile-menu" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Dashboard menu" hidden><div class="mobile-menu-head"><strong>Dashboard menu</strong><button type="button" class="icon-btn" id="mobileMenuClose" aria-label="Close menu">×</button></div><div class="mobile-account"><strong>${SSS.esc(viewer.displayName || viewer.email || "Management")}</strong><span>${SSS.esc(viewer.email || "")}</span><span>${SSS.esc(role === "super_admin" ? "Super Admin" : role === "executive" ? "C-Level" : role.toUpperCase())}</span></div><button type="button" class="btn btn-soft" id="mobileThemeBtn">Theme · <span data-theme-label>Auto</span></button><button type="button" class="btn btn-ghost" id="mobileLogoutBtn">Sign out</button></section>
      <div class="drawer-backdrop" id="drawerBackdrop"></div><aside class="drawer" id="drawer"><div class="drawer-head"><div><div class="eyebrow">EMPLOYEE RECORD</div><strong id="drawerTitle">Employee</strong></div><button class="icon-btn" id="drawerClose">×</button></div><div class="drawer-body" id="drawerBody"></div></aside>
      <div class="modal-backdrop" id="actionModal"><div class="modal" id="actionModalContent"></div></div>
    </div>`;
  }

  function navIcon(name) {
    const shapes = {
      records:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/>',
      admin:'<path d="M12 3l8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
      overview:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 16v-4M12 16V7M17 16v-6"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]}</svg>`;
  }

  function toggleMobileMenu(open = $("mobileMenu").hidden) {
    if ($("mobileMenu").hidden === !open) return;
    $("mobileMenu").hidden = !open;
    $("mobileMenuBackdrop").hidden = !open;
    $("mobileMoreBtn").setAttribute("aria-expanded", String(open));
    document.querySelectorAll(".dash-main,.sidebar,.mobile-nav").forEach(el=>{el.inert=open;});
    document.body.classList.toggle("mobile-menu-open", open);
    (open ? $("mobileMenuClose") : $("mobileMoreBtn")).focus({preventScroll:true});
  }

  function titleForPage(){ return page === "hr" ? "HR Attendance Records" : page === "admin" ? "Attendance System Admin" : "C-Level Attendance Overview"; }

  async function protectedRequest(action, options = {}) {
    try {
      return await SSS.request(action, { ...options, dashboard:true });
    } catch (error) {
      if (error.status !== 401) throw error;
      await window.SSSAuth.idToken(true);
      return SSS.request(action, { ...options, dashboard:true });
    }
  }

  async function load(){
    employeePage = 0;
    syncPage = 0;
    $("content").innerHTML = `<div class="card">Loading dashboard…</div>`;
    try {
      data = await protectedRequest("dashboardData", { query:{days, includeRecentEvents:false} });
      if (role === "super_admin") accessData = await protectedRequest("listDashboardUsers", { method:"POST", body:{} });
      render();
    } catch(e) {
      if(e.status===401){
        $("content").innerHTML=`<div class="card"><strong>Session expired</strong><div class="card-sub">Your Firebase session could not be refreshed.</div><div style="margin-top:12px"><a class="btn btn-primary" href="login.html?reason=session">Sign in again</a></div></div>`;
        return;
      }
      if(e.status===403){
        $("content").innerHTML=`<div class="card"><strong>Dashboard access denied</strong><div class="card-sub">${SSS.esc(e.message)}</div><div style="margin-top:12px"><a class="btn btn-soft" href="login.html">Back to management login</a></div></div>`;
        return;
      }
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
    const copy = page === "executive"
      ? ["Executive attendance overview", "Workforce attendance, punctuality and record completeness at a glance."]
      : page === "hr"
        ? ["Attendance operations", "Daily attendance follow-up, employee history and attendance exceptions."]
        : ["Attendance system control", "Employee records, dashboard access and Firebase → Google Sheets sync."];
    return `<section class="page-head dashboard-page-head"><div><div class="eyebrow">${SSS.esc(data.period.from)} → ${SSS.esc(data.period.to)}</div><h1>${copy[0]}</h1><p>${copy[1]}</p></div><div class="status-chip online"><span class="status-dot"></span><span>Updated ${SSS.esc(SSS.fmtDateTime(data.generatedAt))}</span></div></section>`;
  }

  function renderKpis(){
    const k=data.kpis;
    const cards=[
      ["Active employees", k.activeEmployees, `${k.pendingEmployees} pending`, "blue"],
      ["Checked in today", k.presentToday, `${Math.max(0,(k.activeEmployees||0)-(k.presentToday||0))} without a check-in yet`, "green"],
      ["On-time rate", SSS.pct(k.punctualityRate), `Shift start + ${data.thresholds.lateGraceMinutes} min grace`, "amber"],
      ["Complete IN / OUT", SSS.pct(k.completionRate), `${k.attendanceLogs} attendance logs`, "purple"]
    ];
    return `<section class="kpi-grid">${cards.map(c=>`<div class="kpi kpi-${c[3]}"><div class="kpi-accent"></div><div class="kpi-label">${c[0]}</div><div class="kpi-value">${c[1] ?? "—"}</div><div class="kpi-sub">${c[2]}</div></div>`).join("")}</section>`;
  }

  function renderHR(){
    return `<section class="dashboard-grid equal">
      <div class="card attendance-card"><div class="card-head"><div><div class="eyebrow">TODAY</div><div class="card-title">Attendance coverage</div><div class="card-sub">Employees with at least one check-in today. “No check-in yet” is not treated as absence.</div></div></div>${renderTodayCoverage()}</div>
      <div class="card attendance-card"><div class="card-head"><div><div class="eyebrow">TREND</div><div class="card-title">Daily attendance activity</div><div class="card-sub">Unique employees with attendance activity per day.</div></div></div>${renderTrend()}</div>
    </section>
    <section class="dashboard-grid equal">
      <div class="card attendance-card"><div class="card-head"><div><div class="eyebrow">FOLLOW-UP</div><div class="card-title">Attendance exceptions</div><div class="card-sub">Late records, missing check-outs and attendance notes in the selected period.</div></div></div>${renderExceptions(true)}</div>
      <div class="card attendance-card"><div class="card-head"><div><div class="eyebrow">LOCATIONS</div><div class="card-title">Attendance activity by branch</div><div class="card-sub">Recorded activity by work location.</div></div></div>${renderBranches()}</div>
    </section>
    <section class="card attendance-card" style="margin-top:14px"><div class="toolbar"><div><div class="eyebrow">EMPLOYEE ATTENDANCE MASTER</div><div class="card-title">Attendance records by employee</div><div class="card-sub">Click a row to review recent IN/OUT history and HR-only details.</div></div><div class="toolbar-group"><button class="btn btn-primary" id="addEmployeeBtn">Add employee</button><input id="employeeSearch" placeholder="Search employee"><select id="statusFilter"><option value="all">All status</option><option>Active</option><option>Inactive</option><option>Pending</option><option>Rejected</option></select><button class="btn btn-soft" id="exportBtn">Export CSV</button></div></div><div style="height:12px"></div><div id="employeeTable">${renderEmployeeTable(true)}</div></section>`;
  }

  function renderAdmin(){
    return `${role === "super_admin" ? renderAccessControl() : ""}<section class="dashboard-grid equal">
      <div class="card"><div class="card-head"><div><div class="eyebrow">EMPLOYEE MANAGEMENT</div><div class="card-title">Create employee record</div><div class="card-sub">Attendance stays V2-style with no employee login or self-registration.</div></div><button class="btn btn-primary" id="addEmployeeBtn">Add employee</button></div><div class="card-sub">HR/Admin owns employee onboarding. Dashboard accounts are a separate management-only access system.</div></div>
      <div class="card sync-card"><div class="card-head"><div><div class="eyebrow">SYSTEM HEALTH</div><div class="card-title">Firebase → Google Sheets sync</div></div><span class="badge ${data.kpis.syncErrors?"red":"green"}">${data.kpis.syncErrors||0} errors</span></div><div id="syncRecords">${renderSyncErrors()}</div></div>
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
    const cards=users.map(u=>`<article class="account-record"><div class="record-heading"><div class="record-person"><strong>${SSS.esc(u.displayName||"—")}</strong><span>${SSS.esc(u.email)}</span></div>${dashboardRoleBadge(u.role)}</div><div class="record-footer">${statusBadge(u.status)}<button class="btn btn-soft accessEdit" data-uid="${SSS.esc(u.uid)}">Manage</button></div><details class="record-details"><summary>Account details</summary><div>${info("Job title",u.jobTitle||"—")}${info("Last sign-in",SSS.fmtDateTime(u.lastLoginAt))}</div></details></article>`).join("");
    return `<section class="card" style="margin-bottom:14px"><div class="card-head"><div><div class="eyebrow">SUPER ADMIN · ACCESS CONTROL</div><div class="card-title">Dashboard accounts</div><div class="card-sub">Super Admin approves accounts and assigns access.</div></div><span class="badge ${pending?"amber":"green"}">${pending} pending</span></div><div class="table-wrap desktop-records" style="margin-top:14px" tabindex="0" aria-label="Dashboard accounts"><table class="table" style="min-width:760px"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Job title</th><th>Last sign-in</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="muted">No dashboard accounts yet.</td></tr>`}</tbody></table></div><div class="mobile-records">${cards||'<div class="muted">No dashboard accounts yet.</div>'}</div></section>`;
  }

  function renderExecutive(){
    const totals = attendanceTotals();
    return `<section class="dashboard-grid">
      <div class="card attendance-card attendance-hero-card"><div class="card-head"><div><div class="eyebrow">ATTENDANCE TREND</div><div class="card-title">Daily workforce attendance</div><div class="card-sub">Unique employees with recorded attendance activity each day.</div></div></div>${renderTrend()}</div>
      <div class="stack">
        <div class="card attendance-card"><div class="card-head"><div><div class="eyebrow">TODAY</div><div class="card-title">Attendance coverage</div></div></div>${renderTodayCoverage()}</div>
        <div class="card attendance-card"><div class="card-head"><div><div class="eyebrow">LOCATIONS</div><div class="card-title">Branch activity</div></div></div>${renderBranches()}</div>
      </div>
    </section>
    <section class="attendance-summary-grid">
      ${summaryTile("Recorded employee-days", totals.observedDays, "Days with at least one IN or OUT")}
      ${summaryTile("Complete employee-days", totals.completeDays, "Days with both IN and OUT")}
      ${summaryTile("Late records", totals.lateDays, "Based on mapped shift start")}
      ${summaryTile("Missing check-outs", totals.missingOutDays, "IN recorded without OUT")}
    </section>
    <section class="dashboard-grid equal">
      <div class="card attendance-card"><div class="card-head"><div><div class="eyebrow">FOLLOW-UP</div><div class="card-title">Attendance exception summary</div><div class="card-sub">Operational attendance exceptions only. This is not an employee performance score.</div></div></div>${renderExceptions(false)}</div>
      <div class="card attendance-card"><div class="card-head"><div><div class="eyebrow">PERIOD SUMMARY</div><div class="card-title">Attendance reliability</div></div></div>${renderReliability()}</div>
    </section>
    <section class="card attendance-card" style="margin-top:14px"><div class="card-head"><div><div class="eyebrow">EMPLOYEE ATTENDANCE RECORDS</div><div class="card-title">Attendance summary by employee</div><div class="card-sub">Read-only attendance metrics. Salary and incentive are available to C-Level; phone, bank and private profile data remain excluded.</div></div></div><div id="employeeTable">${renderEmployeeTable(false)}</div></section>`;
  }

  function renderPending(){
    const pending=data.employees.filter(x=>String(x.status).toLowerCase()==="pending");
    if(!pending.length) return `<div class="muted small">No pending registrations.</div>`;
    return `<div class="table-wrap"><table class="table" style="min-width:560px"><thead><tr><th>Employee</th><th>Location</th><th>Registered</th><th>Action</th></tr></thead><tbody>${pending.map(e=>`<tr><td><strong>${SSS.esc(e.name)}</strong><br><span class="muted">${SSS.esc(e.nick)} · ${SSS.esc(e.id)}</span></td><td>${SSS.esc((e.assignedLocs||[]).join(", ")||"—")}</td><td>${SSS.esc(SSS.fmtDateTime(e.registerTimestamp))}</td><td><button class="btn btn-primary approveBtn" data-id="${SSS.esc(e.id)}" style="min-height:32px">Review</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderTrend(){
    if(!data.trend.length) return `<div class="muted small">No attendance data in this period.</div>`;
    const series = data.trend.slice(-31);
    const max=Math.max(...series.map(x=>x.employees),1);
    return `<div class="chart-bars attendance-chart">${series.map(x=>`<div class="bar-item" style="height:${Math.max(5,(x.employees/max)*100)}%"><span class="bar-tooltip"><strong>${x.employees}</strong> employees<br>${SSS.esc(x.dateKey)}</span></div>`).join("")}</div><div class="chart-foot"><span>${SSS.esc(series[0]?.dateKey||"")}</span><span>Daily attendance activity</span><span>${SSS.esc(series[series.length-1]?.dateKey||"")}</span></div>`;
  }

  function renderBranches(){
    if(!data.branches.length) return `<div class="muted small">No activity.</div>`;
    const max=Math.max(...data.branches.map(x=>x.logs),1);
    return `<div class="branch-list">${data.branches.map(b=>`<div class="branch-row"><div class="branch-row-top"><div><strong>${SSS.esc(b.name)}</strong><div class="small muted">${b.employees} employees with activity</div></div><span class="badge blue">${b.logs} logs</span></div><div class="mini-progress"><span style="width:${Math.max(4,(b.logs/max)*100)}%"></span></div></div>`).join("")}</div>`;
  }

  function attendanceTotals(){
    return data.employees.reduce((a,e)=>{
      a.observedDays += Number(e.metrics?.observedDays||0);
      a.completeDays += Number(e.metrics?.completeDays||0);
      a.lateDays += Number(e.metrics?.lateDays||0);
      a.missingOutDays += Number(e.metrics?.missingOutDays||0);
      a.notes += Number(e.metrics?.notes||0);
      return a;
    },{observedDays:0,completeDays:0,lateDays:0,missingOutDays:0,notes:0});
  }

  function summaryTile(label,value,sub){
    return `<div class="attendance-summary-tile"><div class="summary-value">${Number(value||0).toLocaleString("en-US")}</div><div class="summary-label">${SSS.esc(label)}</div><div class="summary-sub">${SSS.esc(sub)}</div></div>`;
  }

  function renderTodayCoverage(){
    const active=Number(data.kpis.activeEmployees||0), present=Number(data.kpis.presentToday||0);
    const pending=Math.max(0,active-present), pct=active?present/active:0;
    return `<div class="coverage-number"><strong>${present}</strong><span>/ ${active} active employees</span></div><div class="coverage-progress"><span style="width:${Math.max(0,Math.min(100,pct*100))}%"></span></div><div class="coverage-foot"><span>${SSS.pct(pct)} with a check-in</span><span>${pending} no check-in recorded yet</span></div>`;
  }

  function exceptionEmployees(){
    return data.employees
      .filter(e=>String(e.status).toLowerCase()==="active")
      .map(e=>({...e,_issues:Number(e.metrics?.lateDays||0)+Number(e.metrics?.missingOutDays||0)+Number(e.metrics?.notes||0)}))
      .filter(e=>e._issues>0)
      .sort((a,b)=>b._issues-a._issues || String(a.name).localeCompare(String(b.name),"th"));
  }

  function renderExceptions(sensitive){
    const rows=exceptionEmployees().slice(0,8);
    if(!rows.length) return `<div class="empty-state"><strong>No attendance exceptions</strong><span>No late, missing check-out or noted attendance records in this period.</span></div>`;
    return `<div class="exception-list">${rows.map(e=>`<button class="exception-row employeeRow" data-id="${SSS.esc(e.id)}"><div class="exception-person"><strong>${SSS.esc(e.name)}</strong><span>${SSS.esc(e.nick||e.id)} · ${SSS.esc((e.assignedLocs||[]).join(", ")||"No location")}</span></div><div class="exception-metrics"><span class="${e.metrics.lateDays?"warn":""}">${e.metrics.lateDays||0} late</span><span class="${e.metrics.missingOutDays?"danger":""}">${e.metrics.missingOutDays||0} missing OUT</span>${sensitive?`<span>${e.metrics.notes||0} notes</span>`:""}</div></button>`).join("")}</div>`;
  }

  function renderReliability(){
    const t=attendanceTotals();
    const complete=t.observedDays?t.completeDays/t.observedDays:0;
    const eligible=data.employees.reduce((n,e)=>n+Number(e.metrics?.eligibleDays||0),0);
    const onTime=data.employees.reduce((n,e)=>n+Number(e.metrics?.onTimeDays||0),0);
    const punctual=eligible?onTime/eligible:0;
    return `<div class="reliability-list">
      <div class="reliability-row"><div><strong>Complete IN / OUT records</strong><span>${t.completeDays} of ${t.observedDays} recorded employee-days</span></div><b>${SSS.pct(complete)}</b></div>
      <div class="reliability-row"><div><strong>On-time records</strong><span>${onTime} of ${eligible} shift-mapped check-ins</span></div><b>${SSS.pct(punctual)}</b></div>
      <div class="reliability-row"><div><strong>Missing check-outs</strong><span>Employee-days with IN but no OUT</span></div><b>${t.missingOutDays}</b></div>
      <div class="reliability-row"><div><strong>Attendance notes</strong><span>Records with an employee note</span></div><b>${t.notes}</b></div>
    </div>`;
  }

  function filteredEmployees(){
    return data.employees.filter(e=>{
      const q=employeeSearch.trim().toLowerCase();
      const text=`${e.id} ${e.name} ${e.nick} ${e.type} ${(e.assignedLocs||[]).join(" ")}`.toLowerCase();
      const statusOk=statusFilter==="all"||String(e.status).toLowerCase()===statusFilter.toLowerCase();
      return statusOk&&(!q||text.includes(q));
    });
  }

  function renderEmployeeTable(sensitive){
    const all=filteredEmployees();
    employeePage=Math.min(employeePage,Math.max(0,Math.ceil(all.length/employeePageSize)-1));
    const list=all.slice(employeePage*employeePageSize,(employeePage+1)*employeePageSize);
    const cards=list.map(e=>`<button type="button" class="employeeRow employee-record" data-id="${SSS.esc(e.id)}"><span class="record-heading"><span class="record-person"><strong>${SSS.esc(e.name)}</strong><span>${SSS.esc(e.nick)} · ${SSS.esc(e.id)}</span></span>${statusBadge(e.status)}</span><span class="record-location">${SSS.esc((e.assignedLocs||[]).join(", ")||"—")}</span><span class="record-metrics"><span><strong>${e.metrics.observedDays}</strong><small>Recorded days</small></span><span><strong>${SSS.pct(e.metrics.punctualityRate)}</strong><small>On time</small></span><span><strong>${SSS.pct(e.metrics.completionRate)}</strong><small>IN / OUT</small></span></span><span class="record-footer"><span>${e.metrics.lateDays||0} late · ${e.metrics.missingOutDays||0} missing OUT</span><span class="record-open">View record</span></span></button>`).join("");
    return `<div class="table-wrap desktop-records" tabindex="0" aria-label="Employee attendance records"><table class="table attendance-table"><thead><tr><th>Employee</th><th>Status</th><th>Type</th><th>Location</th><th>Recorded days</th><th>On-time</th><th>Complete IN/OUT</th><th>Late</th><th>Missing OUT</th><th>Last activity</th></tr></thead><tbody>${list.map(e=>`<tr class="employeeRow" data-id="${SSS.esc(e.id)}" tabindex="0" role="button" aria-label="View record for ${SSS.esc(e.name)}"><td><strong>${SSS.esc(e.name)}</strong><br><span class="muted">${SSS.esc(e.nick)} · ${SSS.esc(e.id)}</span></td><td>${statusBadge(e.status)}</td><td>${SSS.esc(e.type||"—")}</td><td>${SSS.esc((e.assignedLocs||[]).join(", ")||"—")}</td><td>${e.metrics.observedDays}</td><td>${SSS.pct(e.metrics.punctualityRate)}</td><td>${SSS.pct(e.metrics.completionRate)}</td><td>${e.metrics.lateDays||0}</td><td>${e.metrics.missingOutDays||0}</td><td>${SSS.esc(SSS.fmtDateTime(e.metrics.lastActivity))}</td></tr>`).join("")||'<tr><td colspan="10" class="muted">No matching employees.</td></tr>'}</tbody></table></div><div class="mobile-records">${cards||'<div class="muted">No matching employees.</div>'}</div>${renderPager("employee",employeePage,employeePageSize,all.length)}`;
  }

  function renderPager(kind,index,size,total){
    const first=total?index*size+1:0,last=Math.min((index+1)*size,total);
    return `<div class="record-pager" aria-label="${kind === "sync" ? "Sync errors" : "Employee records"} pagination"><span aria-live="polite">${first}–${last} of ${total}</span><div><button type="button" class="btn btn-soft" data-page-kind="${kind}" data-page-delta="-1" ${index===0?'disabled':''}>Previous</button><button type="button" class="btn btn-soft" data-page-kind="${kind}" data-page-delta="1" ${last>=total?'disabled':''}>Next</button></div></div>`;
  }

  function statusBadge(status){ const s=String(status||""); const cls=s.toLowerCase()==="active"?"green":s.toLowerCase()==="pending"?"amber":s.toLowerCase()==="rejected"?"red":""; return `<span class="badge ${cls}">${SSS.esc(s||"—")}</span>`; }

  function renderSyncErrors(){
    const errs=data.syncErrors||[];
    const health=data.syncHealth;
    const summary=health?`<div class="sync-summary"><span>${health.synced||0} synced</span><span>${health.pending||0} pending</span></div>`:"";
    const checks=data.dataChecks;
    const checksMarkup=checks?`<details class="record-details"><summary>Record data checks</summary><div class="sync-data-checks">${[["Unmatched employee IDs",checks.orphanEmployees],["Unmatched locations",checks.unknownLocations],["Invalid IN/OUT types",checks.invalidLogTypes],["Missing timestamps",checks.missingTimestamps],["Date/timestamp mismatches",checks.dateMismatches]].map(([label,count])=>`<div><span>${label}</span><strong class="${count?'sync-check-warning':''}">${count||0}</strong></div>`).join("")}</div></details>`:"";
    if(!errs.length) return `${summary}<div class="badge green">No sync errors in this period</div>${checksMarkup}`;
    syncPage=Math.min(syncPage,Math.max(0,Math.ceil(errs.length/syncPageSize)-1));
    const visible=errs.slice(syncPage*syncPageSize,(syncPage+1)*syncPageSize);
    const records=visible.map(x=>{
      const employee=data.employees.find(e=>e.id===x.employeeId);
      return `<details class="sync-record"><summary><span class="sync-record-main"><strong>${SSS.esc(x.employeeName||employee?.name||x.employeeId)}</strong><span>${SSS.esc(SSS.fmtDateTime(x.recordedAt))}</span></span><span class="badge red">${SSS.esc(x.logType||"Error")}</span></summary><div class="sync-record-detail"><div><span class="info-label">Log ID</span><span class="mono">${SSS.esc(x.logId)}</span></div><div><span class="info-label">Employee ID</span><span>${SSS.esc(x.employeeId)}</span></div><div><span class="info-label">Error reason</span><span>${SSS.esc(x.syncError||"No error message was returned. Review this record in Firebase.")}</span></div></div></details>`;
    }).join("");
    const limitNotice=(data.kpis.syncErrors||0)>errs.length?`<div class="card-sub">Showing the latest ${errs.length} errors in this period.</div>`:"";
    return `${summary}<div class="sync-record-list">${records}</div>${renderPager("sync",syncPage,syncPageSize,errs.length)}${limitNotice}${checksMarkup}`;
  }

  function bindCommon(){
    document.querySelectorAll(".employeeRow").forEach(el=>{
      el.onclick=()=>openEmployee(el.dataset.id);
      if(el.tagName==="TR")el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openEmployee(el.dataset.id);}};
    });
    document.querySelectorAll("[data-page-kind]").forEach(el=>el.onclick=()=>{
      const delta=Number(el.dataset.pageDelta);
      if(el.dataset.pageKind==="sync"){
        syncPage+=delta;$("syncRecords").innerHTML=renderSyncErrors();
      }else{
        employeePage+=delta;$("employeeTable").innerHTML=renderEmployeeTable(page!=="executive");
      }
      bindCommon();
    });
    $("drawerClose").onclick=closeDrawer; $("drawerBackdrop").onclick=closeDrawer;
  }

  function bindHR(){
    $("employeeSearch").value=employeeSearch;$("statusFilter").value=statusFilter;
    $("employeeSearch").oninput=e=>{employeeSearch=e.target.value;employeePage=0;$("employeeTable").innerHTML=renderEmployeeTable(true);bindCommon();};
    $("statusFilter").onchange=e=>{statusFilter=e.target.value;employeePage=0;$("employeeTable").innerHTML=renderEmployeeTable(true);bindCommon();};
    $("exportBtn").onclick=exportCSV;
    $("addEmployeeBtn").onclick=openAddEmployee;
  }

  function bindAdmin(){
    $("employeeSearch").value=employeeSearch;$("statusFilter").value=statusFilter;
    $("employeeSearch").oninput=e=>{employeeSearch=e.target.value;employeePage=0;$("employeeTable").innerHTML=renderEmployeeTable(true);bindCommon();};
    $("statusFilter").onchange=e=>{statusFilter=e.target.value;employeePage=0;$("employeeTable").innerHTML=renderEmployeeTable(true);bindCommon();};
    $("exportBtn").onclick=exportCSV;
    $("addEmployeeBtn").onclick=openAddEmployee;
    if(role==="super_admin") document.querySelectorAll(".accessEdit").forEach(b=>b.onclick=()=>openAccessManager(b.dataset.uid));
  }
  function bindExecutive(){}

  function openEmployee(id){
    const e=data.employees.find(x=>x.id===id); if(!e)return;
    $("drawerTitle").textContent=`${e.name} (${e.nick||"—"})`;
    const canViewPrivate=role==="hr"||role==="admin"||role==="super_admin";
    const canViewCompensation=role==="hr"||role==="executive";
    const daily=canViewPrivate?(e.daily||[]).slice().reverse().slice(0,20):[];
    const legacyProfileUrl=canViewPrivate?SSS.safeExternalUrl(e.profilePhotoUrl):"";
    $("drawerBody").innerHTML=`<div class="info-grid">
      ${info("Employee ID",e.id)}${info("Status",e.status)}${info("Type",e.type)}${info("Location",(e.assignedLocs||[]).join(", ")||"—")}
      ${info("Observed days",e.metrics.observedDays)}${info("On-time rate",SSS.pct(e.metrics.punctualityRate))}${info("Complete IN/OUT",SSS.pct(e.metrics.completionRate))}${info("Last activity",SSS.fmtDateTime(e.metrics.lastActivity))}
      ${canViewPrivate?info("Phone",e.phone||"—")+info("Bank",e.bank||"—"):""}
      ${canViewCompensation?info("Salary",e.salary==null?"—":Number(e.salary).toLocaleString("th-TH"))+info("Incentive",e.incentive==null?"—":Number(e.incentive).toLocaleString("th-TH")):""}
    </div>
    ${canViewPrivate&&e.profileStoragePath?`<button class="btn btn-soft" id="loadProfilePhoto" style="margin-top:12px">View private profile photo</button><div id="photoPreview" style="margin-top:10px"></div>`:legacyProfileUrl?`<a class="btn btn-soft" href="${SSS.esc(legacyProfileUrl)}" target="_blank" rel="noreferrer noopener" style="margin-top:12px">Open legacy profile photo</a>`:""}
    ${canViewPrivate?`<div class="card-title" style="margin-top:18px;margin-bottom:8px">Recent attendance days</div>${dailyTable(daily)}`:"<div class='card-sub' style='margin-top:14px'>C-Level access excludes phone, bank account, private profile photo and detailed attendance-day records.</div>"}`;
    $("drawerBackdrop").classList.add("open"); $("drawer").classList.add("open");
    const photoBtn=$("loadProfilePhoto"); if(photoBtn) photoBtn.onclick=()=>loadPhoto(e.profileStoragePath,"photoPreview");
  }

  function info(label,value){return `<div class="info-box"><div class="info-label">${SSS.esc(label)}</div><div class="info-value">${SSS.esc(value)}</div></div>`;}
  function dailyTable(rows){if(!rows.length)return`<div class="muted small">No records in selected period.</div>`;return`<div class="table-wrap"><table class="table" style="min-width:560px"><thead><tr><th>Date</th><th>IN</th><th>OUT</th><th>On time</th><th>Complete</th></tr></thead><tbody>${rows.map(d=>`<tr><td>${SSS.esc(d.dateKey)}</td><td>${timeOnly(d.firstIn)}</td><td>${timeOnly(d.lastOut)}</td><td>${d.onTime==null?"—":d.onTime?'<span class="badge green">Yes</span>':`<span class="badge amber">+${d.minutesLate}m</span>`}</td><td>${d.complete?'<span class="badge green">Yes</span>':'<span class="badge red">Missing</span>'}</td></tr>`).join("")}</tbody></table></div>`;}
  function timeOnly(v){if(!v)return"—";return new Date(v).toLocaleTimeString("th-TH",{timeZone:"Asia/Bangkok",hour:"2-digit",minute:"2-digit"});}
  function closeDrawer(){ $("drawerBackdrop").classList.remove("open"); $("drawer").classList.remove("open"); }

  async function loadPhoto(storagePath,target){
    try{const el=$(target);el.innerHTML=`<div class="muted small">Loading private photo…</div>`;const r=await SSS.request("getPrivatePhoto",{method:"POST",dashboard:true,body:{storagePath}});const mime=["image/jpeg","image/png","image/webp"].includes(r.mime)?r.mime:"image/jpeg";el.innerHTML=`<img alt="Private employee photo" src="data:${mime};base64,${r.base64}" style="max-width:220px;width:100%;border-radius:14px;border:1px solid var(--border)">`;}
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
    const canEditCompensation=role==="hr";
    const compensationFields=canEditCompensation?`<div class="field"><label class="field-label">Salary</label><input id="newEmpSalary" inputmode="decimal"></div><div class="field"><label class="field-label">Incentive</label><input id="newEmpIncentive" inputmode="decimal"></div>`:"";
    $("actionModalContent").innerHTML=`<div class="eyebrow">HR / ADMIN</div><h2>Add employee</h2><p>Normal employees do not create accounts. This creates the employee master record used by the V2 attendance page.</p><div class="grid-2"><div class="field"><label class="field-label">Full name</label><input id="newEmpName"></div><div class="field"><label class="field-label">Nickname</label><input id="newEmpNick"></div><div class="field"><label class="field-label">Employee ID <span class="muted">(optional)</span></label><input id="newEmpId" placeholder="Auto-generate if blank"></div><div class="field"><label class="field-label">Employee type</label><select id="newEmpType"><option value="01.Full-Time_OF">01.Full-Time_OF</option><option value="02.Full-Time_WH">02.Full-Time_WH</option><option value="03.Daily" selected>03.Daily</option><option value="04.Weekly">04.Weekly</option><option value="05.Job">05.Job</option><option value="06.Intern">06.Intern</option></select></div><div class="field"><label class="field-label">Assigned location</label><select id="newEmpLoc">${locOpts}</select></div><div class="field"><label class="field-label">Status</label><select id="newEmpStatus"><option>Active</option><option>Inactive</option></select></div><div class="field"><label class="field-label">Phone</label><input id="newEmpPhone" inputmode="tel"></div><div class="field"><label class="field-label">Bank account</label><input id="newEmpBank"></div>${compensationFields}</div><div class="modal-actions"><button class="btn btn-ghost" id="newEmpCancel">Cancel</button><button class="btn btn-primary" id="newEmpCreate">Create employee</button></div>`;
    $("actionModal").classList.add("open");
    $("newEmpCancel").onclick=()=>$("actionModal").classList.remove("open");
    $("newEmpCreate").onclick=async()=>{
      const btn=$("newEmpCreate"); btn.disabled=true; btn.textContent="Creating…";
      try{
        const body={
          empId:$("newEmpId").value.trim(), fullname:$("newEmpName").value.trim(), nick:$("newEmpNick").value.trim(),
          type:$("newEmpType").value, assignedLocs:[$("newEmpLoc").value], status:$("newEmpStatus").value,
          phone:$("newEmpPhone").value.trim(), bank:$("newEmpBank").value.trim()
        };
        if(canEditCompensation){
          body.salary=$("newEmpSalary").value.trim();
          body.incentive=$("newEmpIncentive").value.trim();
        }
        const r=await SSS.request("createEmployee",{method:"POST",dashboard:true,body});
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

  function exportCSV(){
    const rows=[["Employee_ID","Status","Type","Name","Nick","Assigned_Locations","Observed_Days","On_Time_Rate","Complete_Rate","Last_Activity"],...filteredEmployees().map(e=>[e.id,e.status,e.type,e.name,e.nick,(e.assignedLocs||[]).join(" | "),e.metrics.observedDays,e.metrics.punctualityRate??"",e.metrics.completionRate??"",e.metrics.lastActivity||""])];
    const safeCell=v=>{const raw=String(v??"");const guarded=/^[=+\-@]/.test(raw)?"\'"+raw:raw;return `"${guarded.replace(/"/g,'""')}"`;};const csv=rows.map(r=>r.map(safeCell).join(",")).join("\n"); const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`speedship-attendance-${data.period.from}-${data.period.to}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  load();
})();
