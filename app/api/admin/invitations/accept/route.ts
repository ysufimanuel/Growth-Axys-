import { adminAuth, adminDb } from "../../../../../lib/server/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { writeAudit } from "../../../../../lib/server/audit";
import { loadActor } from "../../../../../lib/server/auth";
import { clientIp, handle, HttpError, json, rateLimit } from "../../../../../lib/server/http";

export const runtime = "nodejs";

/**
 * Dipanggil setelah pengguna menyetel password dan login pertama kali.
 * Mengaktifkan akun hanya jika: token valid, email terverifikasi, dan undangan belum kedaluwarsa.
 */
export const POST = handle(async (req: Request) => {
  rateLimit(`accept:${clientIp(req)}`, 10, 60_000);
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "Token autentikasi tidak ditemukan.");

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(match[1]!, true);
  } catch {
    throw new HttpError(401, "Sesi tidak valid atau sudah kedaluwarsa.");
  }
  const actor = await loadActor(decoded.uid, { allowInvited: true });
  if (actor.status === "active") throw new HttpError(404, "Tidak ada undangan tertunda.", "NO_INVITATION");
  if (decoded.email_verified !== true) throw new HttpError(403, "Email belum terverifikasi. Gunakan tautan undangan yang dikirim ke email Anda.");

  const db = adminDb();
  const snap = await db.collection("invitations").where("email", "==", actor.email.toLowerCase()).where("status", "==", "pending").get();
  const invite = snap.docs.sort((a, b) => b.get("expiresAt").toMillis() - a.get("expiresAt").toMillis())[0];
  if (!invite) throw new HttpError(404, "Tidak ada undangan tertunda.", "NO_INVITATION");

  if (invite.get("expiresAt").toMillis() < Date.now()) {
    await invite.ref.update({ status: "expired" });
    throw new HttpError(410, "Undangan sudah kedaluwarsa. Minta Superadmin mengirim ulang.", "INVITATION_EXPIRED");
  }

  await db.collection("profiles").doc(actor.uid).set({ status: "active", activatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await invite.ref.update({ status: "accepted", acceptedAt: FieldValue.serverTimestamp() });
  await writeAudit(actor, "invitation.accepted", "invitation", invite.id);
  return json({ ok: true });
});
