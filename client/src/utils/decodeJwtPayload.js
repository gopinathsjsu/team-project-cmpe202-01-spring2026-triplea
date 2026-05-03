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

/** True if JWT is missing, invalid, or past `exp` (client hint only; API still verifies). */
export function isJwtExpired(token) {
  if (token == null || typeof token !== "string" || !token) {
    return true;
  }
  const p = decodeJwtPayload(token);
  if (!p) {
    return true;
  }
  if (typeof p.exp !== "number") {
    return false;
  }
  return Date.now() >= p.exp * 1000;
}

/**
 * Returns the stored access token, or null. Removes token from storage if missing, invalid, or expired.
 */
export function getValidStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
  if (isJwtExpired(token)) {
    localStorage.removeItem("token");
    sessionStorage.removeItem("eventhubUserName");
    return null;
  }
  return token;
}
