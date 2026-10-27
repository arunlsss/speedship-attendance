export function normalizeEmployeeQuery(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/gu, ' ');
}
export function matchesEmployeeQuery(employee, query) {
  const terms = normalizeEmployeeQuery(query).split(' ').filter(Boolean);
  const text = normalizeEmployeeQuery([employee?.name, employee?.employeeName, employee?.nick, employee?.id, employee?.employeeId, employee?.email].filter(Boolean).join(' '));
  return terms.every(term => text.includes(term));
}
