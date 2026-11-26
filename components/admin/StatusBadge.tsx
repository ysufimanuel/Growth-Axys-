const LABEL = { published: "Terbit", draft: "Draft", archived: "Arsip" } as const;

export function StatusBadge({ status }: { status: "draft" | "published" | "archived" }) {
  // Status disampaikan lewat teks + titik, bukan warna saja (WCAG 1.4.1).
  return <span className={`adm-badge adm-badge-${status}`}>{LABEL[status]}</span>;
}
