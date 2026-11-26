// Definisi menu admin (spec dashboard §3). Modul murni agar bisa diuji.
// UI hanya cermin izin; server SELALU memeriksa ulang di layout/halaman/endpoint.
import { can, type Permission, type Role } from "./permissions.ts";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  permission: Permission;
  group: "main" | "content" | "site" | "system";
  /** false = halaman belum dibangun: ditampilkan nonaktif dengan label "Segera", bukan tautan mati. */
  available: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "overview", label: "Ringkasan", href: "/admin/dashboard", permission: "dashboard.view", group: "main", available: true },
  { id: "profile", label: "Akun saya", href: "/admin/profile", permission: "dashboard.view", group: "system", available: true },
  { id: "projects", label: "Proyek", href: "/admin/content/projects", permission: "content.edit", group: "content", available: true },
  { id: "services", label: "Layanan", href: "/admin/content/services", permission: "content.edit", group: "content", available: true },
  { id: "articles", label: "Artikel", href: "/admin/content/articles", permission: "content.edit", group: "content", available: true },
  { id: "certifications", label: "Sertifikasi", href: "/admin/content/certifications", permission: "content.edit", group: "content", available: true },
  { id: "media", label: "Media", href: "/admin/media", permission: "media.manage", group: "site", available: true },
  { id: "seo", label: "SEO halaman", href: "/admin/seo", permission: "seo.page", group: "site", available: true },
  { id: "seo-global", label: "SEO global", href: "/admin/settings/seo", permission: "seo.global", group: "site", available: true },
  { id: "redirects", label: "Redirect", href: "/admin/redirects", permission: "redirects.manage", group: "site", available: true },
  { id: "users", label: "Akun", href: "/admin/users", permission: "users.manage", group: "system", available: true },
  { id: "audit", label: "Audit log", href: "/admin/audit", permission: "audit.view", group: "system", available: true },
  { id: "backup", label: "Backup & Restore", href: "/admin/backup", permission: "backup.restore", group: "system", available: true },
] as const;

export const NAV_GROUP_LABEL: Record<NavItem["group"], string> = {
  main: "Utama",
  content: "Konten",
  site: "Situs",
  system: "Sistem",
};

/** Hanya menu yang diizinkan untuk role. Menu tanpa izin tidak ditampilkan sama sekali. */
export function navFor(role: Role | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((i) => can(role, i.permission));
}

/** Item aktif = href terpanjang yang menjadi awalan path (agar /admin/content/projects/new tetap menandai Proyek). */
export function activeNavId(pathname: string, items: readonly NavItem[]): string | null {
  let best: NavItem | null = null;
  for (const i of items) {
    if (pathname === i.href || pathname.startsWith(i.href + "/")) {
      if (!best || i.href.length > best.href.length) best = i;
    }
  }
  return best?.id ?? null;
}

export const CONTENT_LABEL = {
  projects: { plural: "Proyek", singular: "proyek", titleField: "title" },
  services: { plural: "Layanan", singular: "layanan", titleField: "title" },
  articles: { plural: "Artikel", singular: "artikel", titleField: "title" },
  certifications: { plural: "Sertifikasi", singular: "sertifikasi", titleField: "name" },
} as const;
