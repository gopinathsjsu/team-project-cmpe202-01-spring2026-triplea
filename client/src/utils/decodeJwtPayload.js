/**
 * Read JWT payload without verifying the signature (UI hints only; API still enforces auth).
 */
export function decodeJwtPayload(token) {
  if (token == null || typeof token !== "string") {
    return null;
  }
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
