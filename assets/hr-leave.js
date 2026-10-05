export const leaveTypes = [
  { value: "paid_time_off", label: "Paid Time Off", short: "PTO", cls: "leave" },
  { value: "sick_leave", label: "Sick Leave", short: "Sick", cls: "sick" },
  { value: "personal_leave", label: "Personal Leave", short: "Personal", cls: "leave" },
  { value: "unpaid_leave", label: "Unpaid Leave", short: "Unpaid", cls: "unpaid" },
  { value: "day_off", label: "Day Off", short: "Off", cls: "off" },
  { value: "public_holiday", label: "Public Holiday", short: "Holiday", cls: "off" },
  { value: "absence", label: "Absent", short: "Absent", cls: "absent" },
  { value: "other", label: "Other Leave", short: "Other", cls: "leave" }
];

export function createHRLeaveCalendar({ viewer, request, esc, toast, timeOnly, onChange }) {
  const records = new Map(), loaded = new Set(), failures = new Map(), pending = new Map();
  let canEdit = false, dialog = null;
  const recordKey = (employeeId, dateKey) => JSON.stringify([employeeId, dateKey]);
  const rangeKey = dates => dates.length ? dates[0] + ":" + dates[dates.length - 1] : "";
  const get = (employeeId, dateKey) => records.get(recordKey(employeeId, dateKey));
  const typeFor = record => leaveTypes.find(type => type.value === record?.type);
  const ready = dates => loaded.has(rangeKey(dates));

  async function read(from, to) {
    const result = await request("getAttendanceClassifications", { dashboard: true, query: { from, to } });
    if (!Array.isArray(result.records)) throw new Error("Leave status is temporarily unavailable. Please contact your system administrator.");
    canEdit = result.canEdit === true && ["hr", "super_admin"].includes(viewer.role);
    result.records.forEach(record => {
      const key = recordKey(record.employeeId, record.dateKey), current = records.get(key);
      if (!current || record.version >= current.version) records.set(key, record);
    });
    return result;
  }

  function ensure(dates, force = false) {
    const key = rangeKey(dates);
    if (!key || pending.has(key) || (!force && (loaded.has(key) || failures.has(key)))) return;
    loaded.delete(key); failures.delete(key);
    const promise = read(dates[0], dates[dates.length - 1])
      .then(() => { loaded.add(key); })
      .catch(error => { failures.set(key, error); })
      .finally(() => { pending.delete(key); onChange(); });
    pending.set(key, promise);
  }

  function notice(dates) {
    const key = rangeKey(dates);
    if (!key) return "";
    if (failures.has(key)) return '<div class="leave-notice warning"><span>Leave status is temporarily unavailable. Please contact your system administrator.</span><button type="button" class="btn btn-soft" id="leaveRetry">Retry</button></div>';
    if (!loaded.has(key)) return '<div class="leave-notice">Loading leave statuses…</div>';
    return '<div class="leave-notice">' + (canEdit ? 'Click a calendar day to assign or clear its HR status.' : 'Click a calendar day to view its HR status. HR manages changes.') + '</div>';
  }

  async function open(employee, dateKey, day, dates) {
    if (!ready(dates)) { toast("Leave status is temporarily unavailable. Please contact your system administrator.", "error"); return; }
    if (dialog?.open) return;
    const previousFocus = document.activeElement;
    dialog = document.createElement("dialog");
    dialog.className = "leave-dialog";
    dialog.setAttribute("aria-labelledby", "leaveDialogTitle");
    dialog.innerHTML = '<h2 id="leaveDialogTitle">Day status</h2><p class="leave-person"><strong data-no-translate>' + esc(employee.name) + '</strong><span data-no-translate>' + esc(employee.id) + ' · ' + esc(dateKey) + '</span></p><div id="leaveEditor"><p>Loading leave statuses…</p><button type="button" class="btn btn-ghost" id="leaveCancel">Close</button></div>';
    dialog.querySelector("#leaveCancel").onclick = () => dialog.close();
    document.body.appendChild(dialog);
    let saving = false;
    dialog.addEventListener("cancel", event => { if (saving) event.preventDefault(); });
    dialog.addEventListener("close", () => { dialog.remove(); dialog = null; if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); else document.querySelector('.payroll-day[data-employee="' + CSS.escape(employee.id) + '"][data-date="' + CSS.escape(dateKey) + '"]')?.focus({ preventScroll: true }); });
    dialog.showModal();
    const activeDialog = dialog;
    try {
      await read(dateKey, dateKey);
      if (dialog !== activeDialog || !activeDialog.open) return;
      onChange();
      const record = get(employee.id, dateKey);
      const selectedType = record?.type || "";
      const options = [{ value: "", label: "No HR classification" }, ...leaveTypes];
      activeDialog.querySelector("#leaveEditor").innerHTML =
        '<div class="leave-times"><div><span>Clock in</span><strong>' + esc(day?.firstIn ? timeOnly(day.firstIn) : "—") + '</strong></div><div><span>Clock out</span><strong>' + esc(day?.lastOut ? timeOnly(day.lastOut) : "—") + '</strong></div></div>' +
        '<p class="leave-help">HR status does not replace clock-in/out records or automatically calculate pay.</p>' +
        '<div class="field"><label class="field-label" for="leaveType">HR day status</label><select id="leaveType"' + (canEdit ? "" : " disabled") + '>' + options.map(type => '<option value="' + type.value + '"' + (type.value === selectedType ? " selected" : "") + '>' + type.label + '</option>').join("") + '</select></div>' +
        '<div class="field"><label class="field-label" for="leaveNote">HR note (optional)</label><textarea id="leaveNote" maxlength="500"' + (canEdit ? "" : " readonly") + '></textarea></div>' +
        '<p id="leaveError" role="alert" class="leave-error" hidden></p>' +
        '<div class="leave-actions"><button type="button" class="btn btn-ghost" id="leaveCancel">Close</button>' + (canEdit ? '<button type="button" class="btn btn-primary" id="leaveSave">Save HR status</button>' : "") + '</div>';
      activeDialog.querySelector("#leaveNote").value = record?.note || "";
      activeDialog.querySelector("#leaveCancel").onclick = () => activeDialog.close();
      const select = activeDialog.querySelector("#leaveType"), note = activeDialog.querySelector("#leaveNote");
      const updateNote = () => { note.disabled = !select.value; };
      select.onchange = updateNote; updateNote();
      const save = activeDialog.querySelector("#leaveSave");
      if (save) save.onclick = async () => {
        if (saving) return;
        saving = true; save.disabled = true; select.disabled = true; note.disabled = true;
        activeDialog.querySelector("#leaveCancel").disabled = true;
        save.textContent = "Saving…";
        const errorBox = activeDialog.querySelector("#leaveError"); errorBox.hidden = true;
        try {
          const result = await request("setAttendanceClassification", { method: "POST", dashboard: true, body: { employeeId: employee.id, dateKey, type: select.value || null, note: select.value ? note.value : "", expectedVersion: record?.version || 0 } });
          if (!result.record || result.record.employeeId !== employee.id || result.record.dateKey !== dateKey || !Number.isSafeInteger(result.record.version)) throw new Error("Unable to save HR status. Please try again.");
          records.set(recordKey(employee.id, dateKey), result.record);
          saving = false; activeDialog.close(); onChange(); toast("HR day status saved", "success");
        } catch (error) {
          errorBox.textContent = error.message || "Unable to save HR status. Please try again."; errorBox.hidden = false;
          saving = false; save.disabled = false; select.disabled = false; updateNote();
          activeDialog.querySelector("#leaveCancel").disabled = false; save.textContent = "Save HR status";
        }
      };
    } catch (error) {
      if (dialog !== activeDialog || !activeDialog.open) return;
      activeDialog.querySelector("#leaveEditor").innerHTML = '<p class="leave-error" role="alert">Unable to load HR status. Please close and try again.</p><button type="button" class="btn btn-ghost" id="leaveCancel">Close</button>';
      activeDialog.querySelector("#leaveCancel").onclick = () => activeDialog.close();
    }
  }

  return { get, typeFor, ready, ensure, notice, open };
}
