import "./auth.js";
import { createHRLeaveCalendar } from "./hr-leave.js?v=20261005-leave";
import { bindPayrollControls } from "./hr-payroll-controls.js?v=20261005-payroll";
import { openPayrollExport } from "./hr-payroll-export.js?v=20261005-payroll";

(async () => {
  const viewer = await SSS.requireDashboard(["hr", "admin", "super_admin"]);
  if (!viewer) return;

  let payrollData = null;
  const rangeState = { month: "", preset: "month", from: "", to: "", types: null };
  let selectedBranch = "all";
  let selectedEmployeeStatus = "active";
  let employeeQuery = "";
  let observer = null;
  let layoutObserver = null;
  const leave = createHRLeaveCalendar({ viewer, request: SSS.request, esc: SSS.esc, toast: SSS.toast, timeOnly, onChange: refreshCalendar });

  function refreshCalendar() {
    const section = document.getElementById("hrPayrollSection");
    if (!section) return;
    const oldWrap = section.querySelector(".payroll-calendar-wrap");
    const position = { left: oldWrap?.scrollLeft || 0, top: oldWrap?.scrollTop || 0 };
    section.querySelector("#payrollCalendarHost").innerHTML = buildCalendar();
    const wrap = section.querySelector(".payroll-calendar-wrap");
    if (wrap) { wrap.scrollLeft = position.left; wrap.scrollTop = position.top; }
    bindEmployeeClicks(section);
    rangeSummary();
  }

  function esc(value) {
    return SSS.esc(value == null ? "" : value);
  }

  function bangkokDateKey() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const year = parts.find(p => p.type === "year").value;
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;
    return year + "-" + month + "-" + day;
  }

  function bangkokMonthKey() {
    return bangkokDateKey().slice(0, 7);
  }

  function shiftDateKey(dateKey, deltaDays) {
    const date = new Date(dateKey + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + deltaDays);
    return date.toISOString().slice(0, 10);
  }

  function dateRange(fromKey, toKey) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromKey || "") || !/^\d{4}-\d{2}-\d{2}$/.test(toKey || "")) return [];
    if (fromKey > toKey) return [];
    const dates = [];
    let cursor = fromKey;
    while (cursor <= toKey && dates.length < 92) {
      dates.push(cursor);
      cursor = shiftDateKey(cursor, 1);
    }
    return dates;
  }

  function selectedDates() { return dateRange(rangeState.from, rangeState.to); }

  function rangeSummary() {
    const section = document.getElementById("hrPayrollSection");
    if (!section) return;
    section.querySelector("#payrollRangeSummary").textContent = rangeState.from + " → " + rangeState.to;
    section.querySelector("#payrollFilterCount").textContent = filteredEmployees().length + " employees";
  }

  function monthLabel(key) {
    if (!/^\d{4}-\d{2}$/.test(key || "")) return key || "Month";
    const bits = key.split("-").map(Number);
    return new Date(Date.UTC(bits[0], bits[1] - 1, 1)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });
  }

  function availableMonths() {
    const from = payrollData?.period?.from || shiftDateKey(bangkokDateKey(), -89);
    const to = payrollData?.period?.to || bangkokDateKey();
    return Array.from(new Set(dateRange(from,to).map(date => date.slice(0,7)))).sort().reverse();
  }

  function monthDates(key) {
    if (!/^\d{4}-\d{2}$/.test(key || "")) return [];
    const bits = key.split("-").map(Number);
    const count = new Date(Date.UTC(bits[0], bits[1], 0)).getUTCDate();
    return Array.from({ length: count }, (_, i) => key + "-" + String(i + 1).padStart(2, "0"));
  }

  function weekday(dateKey) {
    return new Date(dateKey + "T00:00:00Z").toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC"
    });
  }

  function timeOnly(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function spanHours(day) {
    if (!day || !day.firstIn || !day.lastOut) return null;
    const start = new Date(day.firstIn).getTime();
    const end = new Date(day.lastOut).getTime();
    const hours = (end - start) / 3600000;
    return Number.isFinite(hours) && hours >= 0 && hours <= 36 ? hours : null;
  }

  function dayState(day) {
    if (!day) return { cls: "empty", label: "No record" };
    if (!day.firstIn || !day.lastOut || !day.complete) {
      if (day.firstIn && !day.lastOut) return { cls: "missing", label: "Missing OUT" };
      if (!day.firstIn && day.lastOut) return { cls: "missing", label: "Missing IN" };
      return { cls: "missing", label: "Incomplete" };
    }
    if (day.onTime === false) {
      return { cls: "late", label: "Late " + Number(day.minutesLate || 0) + " min" };
    }
    return { cls: "complete", label: "Complete" };
  }

  function availableBranches() {
    const branches = new Set();
    (payrollData && payrollData.locations || []).forEach(loc => {
      const name = String(loc && (loc.name || loc.locationName || loc.id) || "").trim();
      if (name) branches.add(name);
    });
    (payrollData && payrollData.employees || []).forEach(emp => {
      (emp.assignedLocs || []).forEach(name => {
        const value = String(name || "").trim();
        if (value) branches.add(value);
      });
    });
    return Array.from(branches).sort((a, b) => a.localeCompare(b, "th"));
  }

  function availableEmployeeTypes() {
    return Array.from(new Set(
      (payrollData && payrollData.employees || [])
        .map(emp => String(emp.type || "").trim())
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, "en"));
  }

  function filteredEmployees() {
    const query = employeeQuery.trim().toLowerCase();
    return (payrollData && payrollData.employees || []).filter(emp => {
      const status = String(emp.status || "").toLowerCase();
      const statusOK = selectedEmployeeStatus === "all" || status === selectedEmployeeStatus;
      if (!statusOK) return false;
      const type = String(emp.type || "").trim();
      const typeOK = rangeState.types === null || rangeState.types.has(type);
      if (!typeOK) return false;
      const locations = (emp.assignedLocs || []).map(x => String(x || ""));
      const branchOK = selectedBranch === "all" || locations.some(x => x === selectedBranch);
      const haystack = [emp.name, emp.nick, emp.id, emp.type, ...locations].join(" ").toLowerCase();
      const searchOK = !query || haystack.includes(query);
      return branchOK && searchOK;
    });
  }

  function buildCalendar() {
    const dates = selectedDates();
    if (!dates.length) {
      return '<div class="payroll-empty">Select a valid attendance date range.</div>';
    }

    let head = '<th class="payroll-sticky payroll-employee-head">Employee</th>';
    dates.forEach(dateKey => {
      const dow = weekday(dateKey);
      const weekend = dow === "Sat" || dow === "Sun";
      head += '<th class="payroll-day-head' + (weekend ? ' weekend' : '') + '"><strong>' +
        Number(dateKey.slice(-2)) + '</strong><span>' + dow + '</span></th>';
    });
    leave.ensure(dates);
    head += '<th class="payroll-summary-head">HR status days</th>' + '<th class="payroll-summary-head">Recorded</th>' +
      '<th class="payroll-summary-head">Complete</th>' +
      '<th class="payroll-summary-head">Late</th>' +
      '<th class="payroll-summary-head">Incomplete</th>' +
      '<th class="payroll-summary-head">Span h</th>';

    let body = "";
    filteredEmployees().forEach(emp => {
      const map = new Map(
        (emp.daily || []).map(day => [day.dateKey, day])
      );

      let classified = 0;
      let recorded = 0;
      let complete = 0;
      let late = 0;
      let incomplete = 0;
      let totalSpan = 0;
      let cells = "";

      dates.forEach(dateKey => {
        const day = map.get(dateKey);
        const classification = leave.get(emp.id, dateKey);
        const leaveType = leave.typeFor(classification);
        if (leaveType) classified += 1;
        const state = leaveType || dayState(day);
        if (day) {
          recorded += 1;
          if (day.complete && day.firstIn && day.lastOut) complete += 1;
          else incomplete += 1;
          if (day.onTime === false) late += 1;
          const hours = spanHours(day);
          if (hours != null) totalSpan += hours;
        }
        const title = dateKey + " · " + state.label +
          (day && day.firstIn ? " · IN " + timeOnly(day.firstIn) : "") +
          (day && day.lastOut ? " · OUT " + timeOnly(day.lastOut) : "");
        cells += '<td><button class="payroll-day ' + state.cls + '" data-employee="' + esc(emp.id) +
          '" data-date="' + esc(dateKey) + '" aria-label="' + esc(title) + '" title="' + esc(title) + '">' + (leaveType ? '<span class="payroll-leave-label">' + esc(leaveType.short) + '</span>' : '') + '<span class="payroll-in">' +
          (day && day.firstIn ? timeOnly(day.firstIn) : "—") +
          '</span><span class="payroll-out">' +
          (day && day.lastOut ? timeOnly(day.lastOut) : "—") +
          '</span></button></td>';
      });

      body += '<tr><td class="payroll-sticky payroll-employee">' +
        '<button class="payroll-person" data-employee="' + esc(emp.id) + '">' +
        '<strong>' + esc(emp.name) + '</strong>' +
        '<span>' + esc((emp.nick || emp.id) + " · " + emp.id) + '</span>' +
        '</button></td>' + cells +
        '<td class="payroll-summary"><strong>' + (leave.ready(dates) ? classified : '—') + '</strong><span>classified</span></td>' +
        '<td class="payroll-summary"><strong>' + recorded + '</strong><span>days</span></td>' +
        '<td class="payroll-summary"><strong>' + complete + '</strong><span>complete</span></td>' +
        '<td class="payroll-summary' + (late ? ' warn' : '') + '"><strong>' + late + '</strong><span>late</span></td>' +
        '<td class="payroll-summary' + (incomplete ? ' danger' : '') + '"><strong>' + incomplete + '</strong><span>incomplete</span></td>' +
        '<td class="payroll-summary"><strong>' + totalSpan.toFixed(1) + '</strong><span>recorded h</span></td></tr>';
    });

    if (!body) {
      body = '<tr><td colspan="' + (dates.length + 7) + '" class="payroll-empty">No employees match this status, type, branch or search.</td></tr>';
    }

    return leave.notice(dates) + '<div class="payroll-calendar-wrap"><table class="payroll-calendar"><thead><tr>' +
      head + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="payroll-footnote">Recorded span hours = first IN to last OUT. It is not automatically payable hours, overtime, leave or a salary deduction.</div>';
  }

  function buildSection() {
    const months = availableMonths();
    if (!months.includes(rangeState.month)) rangeState.month = months[0] || bangkokMonthKey();
    const bounds = { from: payrollData?.period?.from || shiftDateKey(bangkokDateKey(),-89), to: payrollData?.period?.to || bangkokDateKey() };
    if (!rangeState.from) rangeState.from = [bounds.from,rangeState.month + "-01"].sort().at(-1);
    if (!rangeState.to) rangeState.to = bounds.to;
    const branchOptions = ['<option value="all">All branches</option>'].concat(availableBranches().map(name => '<option value="' + esc(name) + '"' + (name === selectedBranch ? ' selected' : '') + '>' + esc(name) + '</option>')).join("");
    const types = availableEmployeeTypes();
    const section = document.createElement("section");
    section.id = "hrPayrollSection";
    section.className = "card attendance-card payroll-card";
    section.innerHTML = '<div class="payroll-head"><div><div class="eyebrow">PAYROLL PREPARATION</div><div class="card-title">Monthly IN / OUT Calendar</div><div class="card-sub">Daily first IN and last OUT by employee status. No record is not automatically treated as absence.</div></div>' +
      '<div class="payroll-export-actions"><button class="btn btn-soft" id="payrollExportBtn" type="button">Export payroll CSV</button><button class="btn btn-primary" id="payrollTemplateBtn" type="button">Full Time Emp Att · Excel</button></div></div>' +
      '<div class="payroll-filter-panel"><div class="payroll-period-bar"><div class="payroll-date-field"><span id="payrollDateLabel">Date range</span><button id="payrollRangeBtn" type="button" class="payroll-range-trigger" aria-labelledby="payrollDateLabel payrollRangeSummary" aria-haspopup="dialog"><strong id="payrollRangeSummary" data-no-translate>' + rangeState.from + ' → ' + rangeState.to + '</strong><span class="payroll-range-edit">Change dates</span></button></div><span id="payrollFilterCount"></span></div>' +
      '<div class="payroll-filter-grid"><label><span>Branch</span><select id="payrollBranchSelect">' + branchOptions + '</select></label>' +
      '<label><span>Employee status</span><select id="payrollStatusSelect"><option value="active"' + (selectedEmployeeStatus === "active" ? ' selected' : '') + '>Active employees</option><option value="inactive"' + (selectedEmployeeStatus === "inactive" ? ' selected' : '') + '>Inactive employees</option><option value="all"' + (selectedEmployeeStatus === "all" ? ' selected' : '') + '>All employees</option></select></label>' +
      '<div class="payroll-type-field"><span>Employee type</span><details id="payrollTypes" class="payroll-type-picker"><summary><span id="payrollTypeSummary">All employee types</span><span aria-hidden="true">⌄</span></summary><div class="payroll-type-options"><label><input type="checkbox" id="payrollAllTypes"><span>All employee types</span></label>' +
      types.map(type => '<label><input type="checkbox" data-type value="' + esc(type) + '"><span>' + esc(type) + '</span></label>').join('') + '<button class="btn btn-soft" id="payrollTypesDone" type="button">Done</button></div></details></div>' +
      '<label><span>Search employee</span><input id="payrollEmployeeSearch" type="search" placeholder="Name, ID or nickname" value="' + esc(employeeQuery) + '"></label></div><div id="payrollSelectedTypes" class="payroll-selected-types"></div></div>' +
      '<div class="payroll-legend"><span><i class="payroll-dot complete"></i>Complete</span><span><i class="payroll-dot late"></i>Late</span><span><i class="payroll-dot missing"></i>Incomplete</span><span><i class="payroll-dot empty"></i>No record</span><span><i class="payroll-dot leave"></i>Paid Time Off</span><span><i class="payroll-dot sick"></i>Sick Leave</span><span><i class="payroll-dot off"></i>Day Off / Public Holiday</span><span><i class="payroll-dot missing"></i>Absent</span></div><div id="payrollCalendarHost">' + buildCalendar() + '</div>';
    bindPayrollControls({section,types,months,state:rangeState,bounds,esc,onChange:refreshCalendar});
    section.querySelector("#payrollBranchSelect").addEventListener("change", event => {
      selectedBranch = event.target.value;
      refreshCalendar();
    });

    section.querySelector("#payrollStatusSelect").addEventListener("change", event => {
      selectedEmployeeStatus = event.target.value;
      refreshCalendar();
    });

    section.querySelector("#payrollEmployeeSearch").addEventListener("input", event => {
      employeeQuery = event.target.value;
      refreshCalendar();
    });

    section.querySelector("#payrollExportBtn").addEventListener("click", exportCSV);
    section.querySelector("#payrollTemplateBtn").addEventListener("click", () => openPayrollExport({employees:filteredEmployees(),dates:selectedDates(),leave,esc,toast:SSS.toast}));
    bindEmployeeClicks(section);
    return section;
  }

  function bindEmployeeClicks(section) {
    const retry = section.querySelector("#leaveRetry");
    if (retry) retry.onclick = () => { leave.ensure(selectedDates(), true); refreshCalendar(); };
    section.querySelectorAll("[data-employee]").forEach(el => {
      el.addEventListener("click", () => {
        const employeeId = el.getAttribute("data-employee");
        const dateKey = el.getAttribute("data-date");
        if (dateKey) {
          const employee = payrollData.employees.find(emp => emp.id === employeeId);
          if (employee) leave.open(employee, dateKey, (employee.daily || []).find(day => day.dateKey === dateKey), selectedDates());
          return;
        }
        const tableRow = document.querySelector('.employeeRow[data-id="' + CSS.escape(employeeId) + '"]');
        if (tableRow) {
          tableRow.click();
          return;
        }
        SSS.toast("Open the employee master row for full attendance details.", "");
      });
    });
  }

  function findEmployeeMaster() {
    const content = document.getElementById("content");
    if (!content) return null;
    return content.querySelector("#employeeTable")?.closest("section.card") || null;
  }

  function mount() {
    if (document.getElementById("hrPayrollSection")) return;
    const master = findEmployeeMaster();
    if (!master || !payrollData) return;
    const section = buildSection();
    master.parentNode.insertBefore(section, master);
    const topbar = document.querySelector(".dash-topbar");
    const sticky = section.querySelector(".payroll-employee-head");
    const measure = () => {
      document.documentElement.style.setProperty("--payroll-topbar-offset", (topbar?.getBoundingClientRect().height || 0) + 16 + "px");
      section.style.setProperty("--payroll-employee-width", (section.querySelector(".payroll-employee-head")?.getBoundingClientRect().width || 220) + "px");
    };
    layoutObserver?.disconnect();
    layoutObserver = new ResizeObserver(measure);
    if (topbar) layoutObserver.observe(topbar);
    if (sticky) layoutObserver.observe(sticky);
    measure();
    rangeSummary();
  }

  function safeCSV(value) {
    const raw = String(value == null ? "" : value);
    const guarded = /^[=+\-@]/.test(raw) ? "'" + raw : raw;
    return '"' + guarded.replace(/"/g, '""') + '"';
  }

  function exportCSV() {
    const dates = selectedDates();
    if (!dates.length || !filteredEmployees().length) { SSS.toast("No employees or dates to export.","error"); return; }
    const rows = [[
      "Employee_ID", "Employee_Status", "Name", "Nickname", "Type", "Location", "Date",
      "First_IN", "Last_OUT", "Attendance_Status", "Minutes_Late", "Recorded_Span_Hours", "HR_Status", "HR_Note"
    ]];

    filteredEmployees().forEach(emp => {
      const map = new Map(
        (emp.daily || []).map(day => [day.dateKey, day])
      );

      dates.forEach(dateKey => {
        const day = map.get(dateKey);
        const state = dayState(day);
        const hours = spanHours(day);
        rows.push([
          emp.id,
          emp.status,
          emp.name,
          emp.nick,
          emp.type,
          (emp.assignedLocs || []).join(" | "),
          dateKey,
          day && day.firstIn ? timeOnly(day.firstIn) : "",
          day && day.lastOut ? timeOnly(day.lastOut) : "",
          state.label,
          day && day.onTime === false ? Number(day.minutesLate || 0) : "",
          hours == null ? "" : hours.toFixed(2),
          leave.ready(dates) ? leave.typeFor(leave.get(emp.id, dateKey))?.label || "" : "Unavailable",
          leave.ready(dates) ? leave.get(emp.id, dateKey)?.note || "" : ""
        ]);
      });
    });

    const csv = rows.map(row => row.map(safeCSV).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const rangeStart = dates[0] || "range";
    const rangeEnd = dates[dates.length - 1] || "range";
    link.download = "speedship-payroll-attendance-" + rangeStart + "-to-" + rangeEnd + ".csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  try {
    payrollData = await SSS.request("dashboardData", {
      dashboard: true,
      query: { days: 90 }
    });
    mount();
    document.getElementById("refreshBtn")?.addEventListener("click", async () => {
      try {
        payrollData = await SSS.request("dashboardData", { dashboard: true, query: { days: 90 } });
        document.getElementById("hrPayrollSection")?.remove();
        mount();
        leave.ensure(selectedDates(), true);
        refreshCalendar();
      } catch (error) { SSS.toast("Payroll calendar could not load: " + error.message,"error"); }
    });

    const content = document.getElementById("content");
    if (content) {
      observer = new MutationObserver(() => mount());
      observer.observe(content, { childList: true, subtree: true });
    }
  } catch (error) {
    console.error("Payroll calendar failed to load", error);
    SSS.toast("Payroll calendar could not load: " + error.message, "error");
  }
})();
