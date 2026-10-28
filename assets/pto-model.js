// Date-only values are evaluated in UTC so a device timezone cannot shift leave days.
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function expandDateRange(start, end, {year, today, nonWorkingDates = []} = {}) {
  if (!validDate(start) || !validDate(end)) throw new Error('กรุณาเลือกวันเริ่มต้นและวันที่สิ้นสุดการลา / Select a leave start and end date');
  if (end < start) throw new Error('วันที่สิ้นสุดต้องไม่ก่อนวันเริ่มต้น / End date must be on or after start date');
  if (year && (Number(start.slice(0, 4)) !== year || Number(end.slice(0, 4)) !== year)) throw new Error('กรุณาเลือกวันลาในปีที่ระบุ / Select dates within the selected year');
  if (today && start < today) throw new Error('กรุณาเลือกวันลาตั้งแต่วันนี้เป็นต้นไป / Leave must start today or later');
  // A request is confined to one allowance year, including for callers without a year option.
  if (start.slice(0, 4) !== end.slice(0, 4)) throw new Error('กรุณาแยกคำขอตามปี / Submit separate requests for each year');
  const excluded = new Set(nonWorkingDates), dates = [], excludedDates = [];
  for (let time = Date.parse(start + 'T00:00:00Z'); time <= Date.parse(end + 'T00:00:00Z'); time += 86400000) {
    const day = new Date(time).toISOString().slice(0, 10);
    (excluded.has(day) ? excludedDates : dates).push(day);
  }
  if (!dates.length) throw new Error('ช่วงวันที่เลือกไม่มีวันทำงานที่ต้องใช้สิทธิ์ลา / This range contains no chargeable leave days');
  if (dates.length > 31) throw new Error('ยื่นลาได้สูงสุด 31 วันต่อคำขอ / Maximum 31 chargeable days per request');
  return {dates, excludedDates, days: dates.length};
}

export const requestStage = request => request.status === 'approved' && request.hrRecordedAt ? 'hr_recorded' : request.status;

export function workflowSteps(request) {
  const approved = !!request.ceoApprovedAt || request.status === 'approved' || request.status === 'hr_recorded' || !!request.hrRecordedAt;
  const recorded = !!request.hrRecordedAt || request.status === 'hr_recorded';
  const terminal = ['rejected', 'cancelled'].includes(request.status);
  return [
    {key:'requested', label:'ยื่นคำขอแล้ว / Requested', complete:true, current:!approved && !terminal, at:request.requestedAt || request.createdAt, by:request.requestedByName || request.employeeName},
    {key:'approved', label:'CEO อนุมัติแล้ว / CEO Approved', complete:approved, current:approved && !recorded && !terminal, at:request.ceoApprovedAt, by:request.ceoApprovedByName},
    {key:'recorded', label:'HR บันทึกแล้ว / HR Recorded', complete:recorded, current:recorded && !terminal, at:request.hrRecordedAt, by:request.hrRecordedByName}
  ];
}

export function requestRange(request) {
  const dates = [...new Set(request.dates || [])].filter(validDate).sort();
  const start = validDate(request.startDate) ? request.startDate : dates[0];
  const end = validDate(request.endDate) ? request.endDate : dates.at(-1);
  // Preserve the exact selected dates on legacy requests with gaps.
  const continuous = !!request.startDate || dates.every((date, index) => !index || Date.parse(date) - Date.parse(dates[index - 1]) === 86400000);
  return {start, end, dates, continuous};
}
