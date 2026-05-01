/**
 * DB DATE values often arrive as full ISO strings (e.g. via node-pg + JSON),
 * e.g. "2026-05-02T07:00:00.000Z". Show the calendar day as YYYY-MM-DD.
 */
export function formatDisplayDate(value) {
  if (value == null || value === "") {
    return "—";
  }
  const s = String(value);
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  return s;
}
