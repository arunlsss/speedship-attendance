import "./auth.js";

(async () => {
  const viewer = await SSS.requireDashboard(["hr", "admin", "super_admin"]);
  if (!viewer) return;

  let payrollData = null;
  let selectedMonth = "";
  let selectedDatePreset = "month";
  let customDateFrom = "";
  let customDateTo = "";
  let selectedBranch = "all";
  let selectedEmployeeStatus = "active";
  let selectedEmployeeType = "all";
  let employeeQuery = "";
  let observer = null;

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

  function selectedDates() {
    const today = bangkokDateKey();
    if (selectedDatePreset === "today") return [today];
    if (selectedDatePreset === "yesterday") return [shiftDateKey(today, -1)];
    if (selectedDatePreset === "7") return dateRange(shiftDateKey(today, -6), today);
    if (selectedDatePreset === "30") return dateRange(shiftDateKey(today, -29), today);
    if (selectedDatePreset === "60") return dateRange(shiftDateKey(today, -59), today);
    if (selectedDatePreset === "custom") return dateRange(customDateFrom, customDateTo);
    return monthDates(selectedMonth);
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
    const set = new Set([bangkokMonthKey()]);
    (payrollData && payrollData.employees || []).forEach(emp => {
      (emp.daily || []).forEach(day => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(day.dateKey || ""))) {
          set.add(day.dateKey.slice(0, 7));
        }
      });
    });
    return Array.from(set).sort().reverse();
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
      const typeOK = selectedEmployeeType === "all" || type === selectedEmployeeType;
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
    head += '<th class="payroll-summary-head">Recorded</th>' +
      '<th class="payroll-summary-head">Complete</th>' +
      '<th class="payroll-summary-head">Late</th>' +
      '<th class="payroll-summary-head">Incomplete</th>' +
      '<th class="payroll-summary-head">Span h</th>';

    let body = "";
    filteredEmployees().forEach(emp => {
      const map = new Map(
        (emp.daily || []).map(day => [day.dateKey, day])
      );

      let recorded = 0;
      let complete = 0;
      let late = 0;
      let incomplete = 0;
      let totalSpan = 0;
      let cells = "";

      dates.forEach(dateKey => {
        const day = map.get(dateKey);
        const state = dayState(day);
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
          '" title="' + esc(title) + '"><span class="payroll-in">' +
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
        '<td class="payroll-summary"><strong>' + recorded + '</strong><span>days</span></td>' +
        '<td class="payroll-summary"><strong>' + complete + '</strong><span>complete</span></td>' +
        '<td class="payroll-summary' + (late ? ' warn' : '') + '"><strong>' + late + '</strong><span>late</span></td>' +
        '<td class="payroll-summary' + (incomplete ? ' danger' : '') + '"><strong>' + incomplete + '</strong><span>incomplete</span></td>' +
        '<td class="payroll-summary"><strong>' + totalSpan.toFixed(1) + '</strong><span>recorded h</span></td></tr>';
    });

    if (!body) {
      body = '<tr><td colspan="' + (dates.length + 6) + '" class="payroll-empty">No employees match this status, type, branch or search.</td></tr>';
    }

    return '<div class="payroll-calendar-wrap"><table class="payroll-calendar"><thead><tr>' +
      head + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="payroll-footnote">Recorded span hours = first IN to last OUT. It is not automatically payable hours, overtime, leave or a salary deduction.</div>';
  }

  function buildSection() {
    const months = availableMonths();
    if (!months.includes(selectedMonth)) selectedMonth = months[0] || bangkokMonthKey();

    const options = months.map(key =>
      '<option value="' + esc(key) + '"' + (key === selectedMonth ? ' selected' : '') + '>' +
      esc(monthLabel(key)) + '</option>'
    ).join("");

    const branchOptions = ['<option value="all">All branches</option>']
      .concat(availableBranches().map(name =>
        '<option value="' + esc(name) + '"' + (name === selectedBranch ? ' selected' : '') + '>' +
        esc(name) + '</option>'
      )).join("");

    const typeOptions = ['<option value="all">All employee types</option>']
      .concat(availableEmployeeTypes().map(type =>
        '<option value="' + esc(type) + '"' + (type === selectedEmployeeType ? ' selected' : '') + '>' +
        esc(type) + '</option>'
      )).join("");

    const minDate = payrollData && payrollData.period && payrollData.period.from || shiftDateKey(bangkokDateKey(), -89);
    const maxDate = payrollData && payrollData.period && payrollData.period.to || bangkokDateKey();
    if (!customDateTo) customDateTo = maxDate;
    if (!customDateFrom) customDateFrom = shiftDateKey(maxDate, -6);
    if (customDateFrom < minDate) customDateFrom = minDate;
    if (customDateTo > maxDate) customDateTo = maxDate;

    const section = document.createElement("section");
    section.id = "hrPayrollSection";
    section.className = "card attendance-card payroll-card";
    section.innerHTML =
      '<div class="payroll-head">' +
        '<div><div class="eyebrow">PAYROLL PREPARATION</div>' +
        '<div class="card-title">Monthly IN / OUT Calendar</div>' +
        '<div class="card-sub">Daily first IN and last OUT by employee status. No record is not automatically treated as absence.</div></div>' +
        '<div class="payroll-actions">' +
          '<select id="payrollDatePreset" aria-label="Date range">' +
            '<option value="month"' + (selectedDatePreset === "month" ? " selected" : "") + '>Monthly</option>' +
            '<option value="custom"' + (selectedDatePreset === "custom" ? " selected" : "") + '>Date to Date</option>' +
            '<option value="yesterday"' + (selectedDatePreset === "yesterday" ? " selected" : "") + '>Yesterday</option>' +
            '<option value="today"' + (selectedDatePreset === "today" ? " selected" : "") + '>Today</option>' +
            '<option value="7"' + (selectedDatePreset === "7" ? " selected" : "") + '>7 Days</option>' +
            '<option value="30"' + (selectedDatePreset === "30" ? " selected" : "") + '>30 Days</option>' +
            '<option value="60"' + (selectedDatePreset === "60" ? " selected" : "") + '>60 Days</option>' +
          '</select>' +
          '<span id="payrollMonthControl"' + (selectedDatePreset === "month" ? "" : " hidden") + '><select id="payrollMonthSelect" aria-label="Payroll month">' + options + '</select></span>' +
          '<span id="payrollCustomDates" class="payroll-date-pair"' + (selectedDatePreset === "custom" ? "" : " hidden") + '>' +
            '<input id="payrollDateFrom" type="date" aria-label="From date" min="' + esc(minDate) + '" max="' + esc(maxDate) + '" value="' + esc(customDateFrom) + '">' +
            '<span>to</span>' +
            '<input id="payrollDateTo" type="date" aria-label="To date" min="' + esc(minDate) + '" max="' + esc(maxDate) + '" value="' + esc(customDateTo) + '">' +
          '</span>' +
          '<select id="payrollBranchSelect" aria-label="Branch">' + branchOptions + '</select>' +
          '<select id="payrollStatusSelect" aria-label="Employee status">' +
            '<option value="active"' + (selectedEmployeeStatus === "active" ? " selected" : "") + '>Active employees</option>' +
            '<option value="inactive"' + (selectedEmployeeStatus === "inactive" ? " selected" : "") + '>Inactive employees</option>' +
            '<option value="all"' + (selectedEmployeeStatus === "all" ? " selected" : "") + '>All employees</option>' +
          '</select>' +
          '<select id="payrollTypeSelect" aria-label="Employee type">' + typeOptions + '</select>' +
          '<input id="payrollEmployeeSearch" type="search" placeholder="Search employee" aria-label="Search employee" value="' + esc(employeeQuery) + '">' +
          '<button class="btn btn-soft" id="payrollExportBtn" type="button">Export payroll CSV</button>' +
        '</div>' +
      '</div>' +
      '<div class="payroll-legend">' +
        '<span><i class="payroll-dot complete"></i>Complete</span>' +
        '<span><i class="payroll-dot late"></i>Late</span>' +
        '<span><i class="payroll-dot missing"></i>Incomplete</span>' +
        '<span><i class="payroll-dot empty"></i>No record</span>' +
      '</div>' +
      '<div id="payrollCalendarHost">' + buildCalendar() + '</div>';

    const refreshCalendar = () => {
      section.querySelector("#payrollCalendarHost").innerHTML = buildCalendar();
      bindEmployeeClicks(section);
    };

    const updateDateControls = () => {
      section.querySelector("#payrollMonthControl").hidden = selectedDatePreset !== "month";
      section.querySelector("#payrollCustomDates").hidden = selectedDatePreset !== "custom";
    };

    section.querySelector("#payrollDatePreset").addEventListener("change", event => {
      selectedDatePreset = event.target.value;
      updateDateControls();
      refreshCalendar();
    });

    section.querySelector("#payrollMonthSelect").addEventListener("change", event => {
      selectedMonth = event.target.value;
      refreshCalendar();
    });

    section.querySelector("#payrollDateFrom").addEventListener("change", event => {
      customDateFrom = event.target.value;
      if (customDateTo && customDateFrom > customDateTo) {
        customDateTo = customDateFrom;
        section.querySelector("#payrollDateTo").value = customDateTo;
      }
      refreshCalendar();
    });

    section.querySelector("#payrollDateTo").addEventListener("change", event => {
      customDateTo = event.target.value;
      if (customDateFrom && customDateTo < customDateFrom) {
        customDateFrom = customDateTo;
        section.querySelector("#payrollDateFrom").value = customDateFrom;
      }
      refreshCalendar();
    });

    section.querySelector("#payrollBranchSelect").addEventListener("change", event => {
      selectedBranch = event.target.value;
      refreshCalendar();
    });

    section.querySelector("#payrollStatusSelect").addEventListener("change", event => {
      selectedEmployeeStatus = event.target.value;
      refreshCalendar();
    });

    section.querySelector("#payrollTypeSelect").addEventListener("change", event => {
      selectedEmployeeType = event.target.value;
      refreshCalendar();
    });

    section.querySelector("#payrollEmployeeSearch").addEventListener("input", event => {
      employeeQuery = event.target.value;
      refreshCalendar();
    });

    section.querySelector("#payrollExportBtn").addEventListener("click", exportCSV);
    bindEmployeeClicks(section);
    return section;
  }

  function bindEmployeeClicks(section) {
    section.querySelectorAll("[data-employee]").forEach(el => {
      el.addEventListener("click", () => {
        const employeeId = el.getAttribute("data-employee");
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
    return Array.from(content.querySelectorAll("section.card")).find(section =>
      section.textContent.includes("EMPLOYEE ATTENDANCE MASTER")
    ) || null;
  }

  function mount() {
    if (document.getElementById("hrPayrollSection")) return;
    const master = findEmployeeMaster();
    if (!master || !payrollData) return;
    master.parentNode.insertBefore(buildSection(), master);
  }

  function safeCSV(value) {
    const raw = String(value == null ? "" : value);
    const guarded = /^[=+\-@]/.test(raw) ? "'" + raw : raw;
    return '"' + guarded.replace(/"/g, '""') + '"';
  }

  function exportCSV() {
    const dates = selectedDates();
    const rows = [[
      "Employee_ID", "Employee_Status", "Name", "Nickname", "Type", "Location", "Date",
      "First_IN", "Last_OUT", "Attendance_Status", "Minutes_Late", "Recorded_Span_Hours"
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
          hours == null ? "" : hours.toFixed(2)
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