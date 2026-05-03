/** Trim; empty → null; first character uppercased. Matches server `normalizeCategoryLabel`. */
export function normalizeCategoryLabel(raw) {
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
