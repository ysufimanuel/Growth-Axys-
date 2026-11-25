import { cookies } from "next/headers";
import { z } from "zod";
import { adminAuth } from "../../../../lib/server/firebase-admin";
import { loadActor, SESSION_COOKIE } from "../../../../lib/server/auth";
import { writeAudit } from "../../../../lib/server/audit";
import { clientIp, handle, HttpError, json, rateLimit, readBody } from "../../../../lib/server/http";

export const runtime = "nodejs";

const SESSION_MS = 5 * 24 * 60 * 60 * 1000;
const RECENT_SIGNIN_S = 5 * 60;

/** Tukar Firebase ID token menjadi session cookie HttpOnly untuk gerbang halaman /admin. */
export const POST = handle(async (req: Request) => {
  rateLimit(`session:${clientIp(req)}`, 10, 60_000);
  const { idToken } = await readBody(req, z.strictObject({ idToken: z.string().min(20).max(4096) }));

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken, true);
  } catch {
    throw new HttpError(401, "Token tidak valid.");
  }
  // Hanya terima sign-in baru (cegah pencurian token lama dijadikan sesi).
  if (Date.now() / 1000 - decoded.auth_time > RECENT_SIGNIN_S) throw new HttpError(401, "Silakan login ulang.");

  const actor = await loadActor(decoded.uid); // memastikan role admin/superadmin + akun aktif
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MS });

  (await cookies()).set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
  await writeAudit(actor, "auth.login", "account", actor.uid);
  return json({ ok: true, role: actor.role });
});

export const DELETE = handle(async () => {
  (await cookies()).delete(SESSION_COOKIE);
  return json({ ok: true });
});
