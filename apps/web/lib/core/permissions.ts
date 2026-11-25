// Matriks izin Admin / Superadmin (spec bagian 7). Modul murni tanpa dependensi
// agar bisa diuji. UI hanya cermin; server SELALU memeriksa ulang.

export type Role = "admin" | "superadmin";
export type AccountStatus = "invited" | "active" | "disabled";

export const PERMISSIONS = [
  "dashboard.view",
  "content.edit",
  "content.preview",
  "content.publish",
  "content.archive",
  "content.delete",
  "media.manage",
  "seo.page",
  "seo.global",
  "redirects.manage",
  "users.manage",
  "roles.change",
  "audit.view",
  "backup.restore",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ADMIN: ReadonlySet<Permission> = new Set<Permission>([
  "dashboard.view",
  "content.edit",
  "content.preview",
  "content.publish", // sesuai kebijakan perusahaan; ubah di sini bila publish perlu approval
  "content.archive",
  "media.manage",
  "seo.page",
]);

const SUPERADMIN: ReadonlySet<Permission> = new Set<Permission>(PERMISSIONS);

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (role === "superadmin") return SUPERADMIN.has(permission);
  if (role === "admin") return ADMIN.has(permission);
  return false;
}

export function isRole(value: unknown): value is Role {
  return value === "admin" || value === "superadmin";
}

/**
 * Menentukan role dari data akun tepercaya (custom claims dari Admin SDK).
 * - claim `role` adalah sumber utama
 * - `admin: true` (versi vanilla lama) dipetakan ke "admin"
 * - UID yang sama dengan SUPER_ADMIN_UID dipetakan ke "superadmin"
 * Role TIDAK PERNAH diambil dari payload client.
 */
export function resolveRole(
  uid: string,
  claims: Record<string, unknown> | undefined,
  superAdminUid?: string,
): Role | null {
  if (superAdminUid && uid === superAdminUid) return "superadmin";
  if (isRole(claims?.role)) return claims.role;
  if (claims?.admin === true) return "admin";
  return null;
}

export interface AccountSummary {
  uid: string;
  role: Role | null;
  status: AccountStatus;
}

export interface GuardResult {
  ok: boolean;
  reason?: string;
}

/** Superadmin terakhir tidak boleh diturunkan atau dinonaktifkan. */
export function guardAccountChange(
  accounts: readonly AccountSummary[],
  targetUid: string,
  change: { role?: Role; status?: AccountStatus },
  actorUid: string,
): GuardResult {
  const target = accounts.find((a) => a.uid === targetUid);
  if (!target) return { ok: false, reason: "Akun tidak ditemukan." };
  if (targetUid === actorUid) {
    return { ok: false, reason: "Tidak dapat mengubah role atau status akun sendiri." };
  }
  const losesSuper =
    target.role === "superadmin" &&
    target.status === "active" &&
    ((change.role !== undefined && change.role !== "superadmin") ||
      (change.status !== undefined && change.status !== "active"));
  if (losesSuper) {
    const activeSupers = accounts.filter((a) => a.role === "superadmin" && a.status === "active");
    if (activeSupers.length <= 1) {
      return { ok: false, reason: "Superadmin terakhir tidak dapat diturunkan atau dinonaktifkan." };
    }
  }
  return { ok: true };
}

/** Admin tidak boleh mengatur field SEO berisiko (canonical, noindex). */
export function canEditRiskySeo(role: Role | null | undefined): boolean {
  return can(role, "seo.global");
}
