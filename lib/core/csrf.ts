// Perlindungan CSRF untuk permintaan berbasis session cookie (cookie dikirim otomatis oleh browser).
// Permintaan dengan Authorization: Bearer tidak memakai ini (token tidak dikirim otomatis).

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
export const CSRF_HEADER = "x-admin-request";

/**
 * Metode yang mengubah data wajib:
 *  1) Origin (atau Sec-Fetch-Site: same-origin) cocok dengan Host, dan
 *  2) header kustom X-Admin-Request (tidak bisa dikirim form lintas-situs).
 */
export function isCookieRequestAllowed(input: {
  method: string;
  origin: string | null;
  host: string | null;
  secFetchSite: string | null;
  customHeader: string | null;
}): boolean {
  if (SAFE.has(input.method.toUpperCase())) return true;
  if (input.customHeader !== "1") return false;
  if (input.secFetchSite) return input.secFetchSite === "same-origin";
  if (!input.origin || !input.host) return false;
  try {
    return new URL(input.origin).host === input.host;
  } catch {
    return false;
  }
}

/** Ambil nilai cookie dari header Cookie mentah. */
export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}
