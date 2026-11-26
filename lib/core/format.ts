// Format tampilan (murni). Zona waktu eksplisit agar server & klien konsisten (tanpa hydration mismatch).
const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

const fmtLong = new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" });

/** Tanggal panjang (mis. "Kamis, 26 November 2026") dalam zona waktu Jakarta. */
export const formatDateLong = (ms: number) => fmtLong.format(new Date(ms));

export function formatDateTime(ms: number | null | undefined): string {
  return ms ? fmt.format(new Date(ms)) : "—";
}

const ACTION_LABEL: Record<string, string> = {
  "content.created": "membuat konten",
  "content.updated": "memperbarui konten",
  "content.published": "menerbitkan konten",
  "content.unpublished": "menarik konten ke draft",
  "content.archived": "mengarsipkan konten",
  "content.deleted": "menghapus permanen konten",
  "redirect.created": "membuat redirect",
  "auth.login": "login",
  "user.invited": "mengundang admin",
};

export const actionLabel = (a: string) => ACTION_LABEL[a] ?? a;
