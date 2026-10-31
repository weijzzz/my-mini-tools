// Amount input helpers shared by every form that takes money.
//
// Phones with a Spanish keyboard type "12,50" instead of "12.50", and the
// quick-entry boxes accept small sums like "12,5+8-1". Everything here works
// on plain strings so the result never depends on `eval`/`new Function`.

const ALLOWED_CHARS = /^[0-9\s.,+-]*$/;
const TERM = String.raw`(?:\d+\.?\d*|\.\d+)`;
const EXPRESSION = new RegExp(`^[+-]?${TERM}(?:[+-]${TERM})*$`);

/** Whether a keystroke result may stay in the input box. */
export function isAllowedAmountInput(value) {
  return ALLOWED_CHARS.test(value);
}

function normalize(input) {
  return String(input ?? '').replace(/\s+/g, '').replace(/,/g, '.');
}

/** True when the text is a sum such as "10+5", not just a single number. */
export function isAmountExpression(input) {
  return /\d[+-]/.test(normalize(input));
}

/**
 * Turn "12,50", "12.5" or "10+5,20-3" into a number rounded to cents.
 * Returns NaN for anything that is not a valid amount or sum.
 */
export function evaluateAmount(input) {
  const s = normalize(input);
  if (!s || !EXPRESSION.test(s)) return NaN;
  const terms = s.match(/[+-]?(?:\d+\.?\d*|\.\d+)/g) || [];
  const total = terms.reduce((sum, term) => sum + parseFloat(term), 0);
  return Math.round(total * 100) / 100;
}

/** Euro display used across lists and cards. */
export function formatEuro(value) {
  const n = Number(value) || 0;
  return `€${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
