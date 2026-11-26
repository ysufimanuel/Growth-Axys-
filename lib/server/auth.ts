import "server-only";
import { adminAuth, adminDb } from "./firebase-admin";
import { can, resolveRole, type AccountStatus, type Permission, type Role } from "../core/permissions";
import { HttpError } from "./http";
import { CSRF_HEADER, isCookieRequestAllowed, readCookie } from "../core/csrf";

export interface Actor {
  uid: string;
  email: string;
  role: Role;
  status: AccountStatus;
}

export const SESSION_COOKIE = "pg_session";

interface LoadOptions {
  permission?: Permission;
  /** Hanya untuk endpoint penerimaan undangan. */
  allowInvited?: boolean;
}

/**
 * Sumber kebenaran role = custom claims di record akun Firebase (diset hanya oleh Admin SDK),
 * BUKAN payload client. Akun dinonaktifkan di Firebase atau profil bukan "active" ditolak.
 */
export async function loadActor(uid: string, options: LoadOptions = {}): Promise<Actor> {
  const user = await adminAuth().getUser(uid).catch(() => null);
  if (!user) throw new HttpError(401, "Akun tidak ditemukan.");
  if (user.disabled) throw new HttpError(403, "Akun dinonaktifkan.");

  const role = resolveRole(uid, user.customClaims, process.env.SUPER_ADMIN_UID);
  if (!role) throw new HttpError(403, "Akses admin diperlukan.");

  const profile = await adminDb().collection("profiles").doc(uid).get();
  const stored = profile.exists ? (profile.get("status") as string | undefined) : undefined;
  // Akun legacy (admin:true dari versi vanilla) belum punya profil: dianggap aktif.
  const status: AccountStatus = stored === "invited" || stored === "disabled" ? stored : "active";

  if (status === "disabled") throw new HttpError(403, "Akun dinonaktifkan.");
  if (status === "invited" && !options.allowInvited) throw new HttpError(403, "Undangan belum diterima.");
  if (options.permission && !can(role, options.permission)) throw new HttpError(403, "Anda tidak memiliki izin untuk tindakan ini.");

  return { uid, email: user.email ?? "", role, status };
}

/**
 * Untuk Route Handler. Dua cara autentikasi:
 *  1) Authorization: Bearer <Firebase ID token> (tidak rentan CSRF karena tidak dikirim otomatis);
 *  2) session cookie HttpOnly `pg_session` (dipakai dashboard). Untuk metode yang mengubah data,
 *     wajib lolos pemeriksaan same-origin + header X-Admin-Request (lihat lib/core/csrf.ts).
 */
export async function requireActor(req: Request, options: LoadOptions = {}): Promise<Actor> {
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!match) return requireActorFromCookie(req, options);
  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(match[1]!, true); // true = cek token yang dicabut
    uid = decoded.uid;
  } catch {
    throw new HttpError(401, "Sesi tidak valid atau sudah kedaluwarsa.");
  }
  return loadActor(uid, options);
}

async function requireActorFromCookie(req: Request, options: LoadOptions): Promise<Actor> {
  const cookie = readCookie(req.headers.get("cookie"), SESSION_COOKIE);
  if (!cookie) throw new HttpError(401, "Token autentikasi tidak ditemukan.");
  const allowed = isCookieRequestAllowed({
    method: req.method,
    origin: req.headers.get("origin"),
    host: req.headers.get("host"),
    secFetchSite: req.headers.get("sec-fetch-site"),
    customHeader: req.headers.get(CSRF_HEADER),
  });
  if (!allowed) throw new HttpError(403, "Permintaan lintas-situs ditolak.");
  let uid: string;
  try {
    uid = (await adminAuth().verifySessionCookie(cookie, true)).uid;
  } catch {
    throw new HttpError(401, "Sesi tidak valid atau sudah kedaluwarsa.");
  }
  return loadActor(uid, options);
}

/** Untuk Server Component/layout admin: verifikasi session cookie. Mengembalikan null jika tidak valid. */
export async function actorFromSessionCookie(cookie: string | undefined): Promise<Actor | null> {
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    return await loadActor(decoded.uid);
  } catch {
    return null;
  }
}
