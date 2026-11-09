(() => {
  "use strict";
  // The Management shell already owns navigation for embedded pages.
  if (window !== window.top) return;

  const pages = [
    { id: "clock", href: "index.html", icon: "clock", label: ["Clock In / Out", "ลงเวลาเข้า–ออก"] },
    { id: "leave", href: "pto.html", icon: "calendar", label: ["Leave & PTO", "การลาและวันลาพักร้อน"] },
    { id: "hr", href: "hr.html", icon: "records", label: ["HR Records", "ข้อมูลฝ่ายบุคคล"], roles: ["hr", "admin", "super_admin"] },
    { id: "executive", href: "executive.html", icon: "overview", label: ["Executive Overview", "ภาพรวมผู้บริหาร"], roles: ["executive", "admin", "super_admin"] },
    { id: "admin", href: "admin.html", icon: "shield", label: ["System Admin", "ผู้ดูแลระบบ"], roles: ["admin", "super_admin"] },
    { id: "leave-staff", href: "pto.html?view=management", icon: "records", label: ["PTO Requests & Allowances", "คำขอลาและสิทธิ์วันลา"], roles: ["hr", "executive", "super_admin"] },
    { id: "shifts", href: "shifts.html", icon: "clock", label: ["Branch Shifts", "กะงานตามสาขา"], roles: ["hr", "admin", "super_admin"] },
    { id: "login", href: "management-login.html", icon: "shield", label: ["Staff Sign-In", "เข้าสู่ระบบสำหรับเจ้าหน้าที่"] }
  ];
  const icons = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    back: '<path d="m14 6-6 6 6 6M8 12h12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4m8-4v4M4 10h16"/>',
    records: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2m-6 6h6m-6 4h6m-6 4h4"/>',
    overview: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 16v-4m5 4V7m5 9v-6"/>',
    shield: '<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3z"/><path d="m9 12 2 2 4-4"/>',
    appearance: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2"/>'
  };
  const svg = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + '</svg>';
  const text = (en, th) => document.documentElement.lang === "th" ? th : en;
  const path = location.pathname.split("/").pop() || "index.html";
  const current = pages.find(page => page.href === (path === "pto.html" && new URLSearchParams(location.search).get("view") === "management" ? "pto.html?view=management" : path)) || pages[0];
  const mobile = matchMedia("(max-width: 800px)");
  const root = document.createElement("div");
  root.className = "attendance-chrome";
  root.setAttribute("data-no-translate", "");
  root.innerHTML = `
    <header class="attendance-header">
      <button type="button" class="attendance-icon" data-nav-toggle aria-controls="attendanceSidebar" aria-expanded="true">${svg("menu")}</button>
      <a class="attendance-logo" href="index.html" aria-label="Speedship Attendance"><img src="/assets/speedship-icon.png" width="34" height="34" alt=""></a>
      <nav class="attendance-crumb"></nav>
      <a class="attendance-icon attendance-back" href="index.html">${svg("back")}</a>
      <button type="button" class="attendance-icon" data-nav-appearance aria-haspopup="dialog">${svg("appearance")}</button>
    </header>
    <aside class="attendance-sidebar" id="attendanceSidebar"></aside>
    <dialog class="attendance-drawer" id="attendanceDrawer" aria-labelledby="attendanceDrawerTitle">
      <div class="attendance-drawer-head"><strong id="attendanceDrawerTitle"></strong>
        <button type="button" class="attendance-icon" data-nav-close autofocus>${svg("close")}</button>
      </div>
    </dialog>`;
  const select = selector => root.querySelector(selector);
  const sidebar = select(".attendance-sidebar"), dialog = select("dialog");
  const toggle = select("[data-nav-toggle]"), close = select("[data-nav-close]");
  const appearance = select("[data-nav-appearance]"), back = select(".attendance-back"), crumb = select(".attendance-crumb");
  const content = document.createElement("div");
  content.className = "attendance-nav-content";
  content.innerHTML = '<nav></nav><label class="attendance-language"><span></span><select data-language><option value="th">ไทย</option><option value="en">English</option></select></label>';
  const nav = content.querySelector("nav"), language = content.querySelector("select");
  sidebar.append(content);
  let role = "", collapsed = false;
  try { collapsed = localStorage.getItem("sss-attendance-nav-collapsed") === "true"; } catch {}

  function render() {
    const name = text("Attendance", "ระบบลงเวลา");
    const currentLabel = text(...current.label);
    nav.setAttribute("aria-label", name);
    nav.innerHTML = pages.filter(page => page.roles ? page.roles.includes(role) : page.id !== "login" || !role)
      .map(page => `<a href="${page.href}" aria-label="${text(...page.label)}" title="${text(...page.label)}" ${page.id === current.id ? 'aria-current="page"' : ""}>${svg(page.icon)}<span>${text(...page.label)}</span></a>`).join("");
    crumb.setAttribute("aria-label", text("Breadcrumb", "เส้นทางหน้า"));
    crumb.innerHTML = current.id === "clock" ? `<span aria-current="page">${currentLabel}</span>`
      : `<a href="index.html">${name}</a><span aria-hidden="true">›</span><span aria-current="page">${currentLabel}</span>`;
    select("#attendanceDrawerTitle").textContent = name;
    close.setAttribute("aria-label", text("Close navigation", "ปิดเมนู"));
    appearance.setAttribute("aria-label", text("Appearance", "การแสดงผล"));
    back.setAttribute("aria-label", text("Back", "ย้อนกลับ"));
    back.hidden = current.id === "clock";
    const dashboard = pages.find(page => page.href === window.SSS?.routeForRole(role) && page.roles?.includes(role));
    back.href = dashboard && dashboard.id !== current.id ? dashboard.href : "index.html";
    content.querySelector("label span").textContent = text("Language", "ภาษา");
    language.value = document.documentElement.lang === "th" ? "th" : "en";
    sync();
  }

  function sync() {
    document.body.classList.toggle("attendance-sidebar-collapsed", collapsed && !mobile.matches);
    toggle.setAttribute("aria-controls", mobile.matches ? "attendanceDrawer" : "attendanceSidebar");
    toggle.setAttribute("aria-expanded", String(mobile.matches ? dialog.open : !collapsed));
    const label = mobile.matches ? text("Open navigation", "เปิดเมนู") :
      collapsed ? text("Expand sidebar", "ขยายเมนูด้านข้าง") : text("Collapse sidebar", "ย่อเมนูด้านข้าง");
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
  }

  toggle.addEventListener("click", () => {
    if (!mobile.matches) {
      collapsed = !collapsed;
      try { localStorage.setItem("sss-attendance-nav-collapsed", String(collapsed)); } catch {}
    } else {
      dialog.append(content);
      dialog.showModal();
      document.body.classList.add("attendance-menu-open");
      close.focus();
    }
    sync();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = dialog.querySelectorAll("button:not(:disabled), a[href], select:not(:disabled)");
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  dialog.addEventListener("close", () => {
    sidebar.append(content);
    document.body.classList.remove("attendance-menu-open");
    sync();
    toggle.focus({ preventScroll: true });
  });
  nav.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    if (link.hasAttribute("aria-current") && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
    if (dialog.open) dialog.close();
  });
  appearance.addEventListener("click", () => window.SSSAppearance?.open());
  mobile.addEventListener("change", () => {
    if (!mobile.matches && dialog.open) dialog.close();
    sync();
  });
  let renderedLanguage = document.documentElement.lang;
  new MutationObserver(() => {
    const next = document.documentElement.lang;
    if (next === renderedLanguage) return;
    renderedLanguage = next;
    render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  window.SSSAttendanceNavigation = { setViewer(viewer) { role = viewer?.role || ""; render(); } };
  document.body.classList.add("attendance-standalone");
  document.body.prepend(root);
  const clock = document.querySelector(".topbar.ssp-app-toolbar .clock-box");
  if (clock) back.before(clock);
  render();
})();
