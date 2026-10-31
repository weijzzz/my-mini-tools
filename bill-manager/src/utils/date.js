// Dates are stored as local "YYYY-MM-DD" strings.
// `toISOString()` would give the UTC date, which is yesterday's date for the
// first hour after midnight in the Canaries during summer time.

function pad(n) {
  return String(n).padStart(2, '0');
}

export function todayString(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function currentMonthString(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Today when browsing the current month, otherwise the 1st of that month. */
export function defaultDateForMonth(monthStr) {
  return monthStr === currentMonthString() ? todayString() : `${monthStr}-01`;
}
