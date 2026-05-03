/** Route param `:id` for events — positive integer only. */
function isPositiveIntegerEventId(id) {
  if (id === undefined || id === null) {
    return false;
  }
  const n = Number(id);
  return Number.isInteger(n) && n > 0;
}

/** Non-empty string after trim (for required text fields). */
function isNonEmptyTrimmedString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** Numeric, finite, and >= 0 (e.g. ticket_price). */
function isNumericNonNegative(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

/** Minimal email shape check after trim. */
function isBasicEmailFormat(value) {
  if (typeof value !== "string") {
    return false;
  }
  const t = value.trim();
  if (!t) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/** Trim; empty → null; otherwise first character uppercased, rest unchanged. */
function normalizeCategoryLabel(raw) {
  if (raw == null) {
    return null;
  }
  const str = typeof raw === "string" ? raw : String(raw);
  const t = str.trim();
  if (t === "") {
    return null;
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

module.exports = {
  isPositiveIntegerEventId,
  isNonEmptyTrimmedString,
  isNumericNonNegative,
  isBasicEmailFormat,
  normalizeCategoryLabel,
};
