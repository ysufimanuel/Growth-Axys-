// Validasi redirect manager: cegah loop dan redirect chain. Modul murni.

export interface RedirectRule {
  from: string;
  to: string;
  statusCode: 301 | 308;
  active: boolean;
}

export function normalizePath(path: string): string {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  const clean = withSlash.split(/[?#]/)[0] ?? "/";
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

export function validateRedirect(
  candidate: Pick<RedirectRule, "from" | "to">,
  existing: readonly RedirectRule[],
): { ok: boolean; reason?: string } {
  const from = normalizePath(candidate.from);
  const to = /^https?:\/\//i.test(candidate.to) ? candidate.to : normalizePath(candidate.to);

  if (!candidate.from.startsWith("/")) return { ok: false, reason: "Path asal harus diawali '/'." };
  if (from === "/") return { ok: false, reason: "Beranda tidak boleh dijadikan sumber redirect." };
  if (to === "/") return { ok: false, reason: "Hindari redirect massal ke beranda; arahkan ke halaman yang relevan." };
  if (from === to) return { ok: false, reason: "Asal dan tujuan sama (loop)." };

  const active = existing.filter((r) => r.active);
  if (active.some((r) => normalizePath(r.from) === from)) {
    return { ok: false, reason: "Sudah ada redirect aktif dari path ini." };
  }

  // Loop / chain: ikuti tujuan melalui aturan yang ada.
  const seen = new Set<string>([from]);
  let cursor = to;
  for (let i = 0; i < 10; i++) {
    const next = active.find((r) => normalizePath(r.from) === cursor);
    if (!next) {
      return i === 0 ? { ok: true } : { ok: false, reason: "Membentuk redirect chain; arahkan langsung ke tujuan akhir." };
    }
    if (seen.has(cursor)) return { ok: false, reason: "Membentuk loop redirect." };
    seen.add(cursor);
    cursor = /^https?:\/\//i.test(next.to) ? next.to : normalizePath(next.to);
    if (seen.has(cursor)) return { ok: false, reason: "Membentuk loop redirect." };
  }
  return { ok: false, reason: "Rantai redirect terlalu panjang." };
}
