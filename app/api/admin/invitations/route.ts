import { randomBytes } from "node:crypto";
import { z } from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { writeAudit } from "../../../../lib/server/audit";
import { requireActor } from "../../../../lib/server/auth";
import { adminAuth, adminDb } from "../../../../lib/server/firebase-admin";
import { handle, HttpError, json, rateLimit, readBody } from "../../../../lib/server/http";
import { absoluteUrl } from "../../../../lib/site";

export const runtime = "nodejs";

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

const schema = z.strictObject({
  email: z.email().max(254),
  displayName: z.string().trim().min(2).max(80),
  // Spec: Superadmin mengundang Admin. Superadmin dibuat lewat skrip bootstrap/PATCH role, bukan undangan.
  role: z.literal("admin").default("admin"),
});

/**
 * Superadmin mengundang Admin. Akun dibuat dengan password acak yang tidak pernah ditampilkan;
 * undangan memberi tautan penyetelan password (Firebase) yang dikirim ke email pengundang secara manual
 * (belum ada penyedia email transaksional). Akun berstatus "invited" dan DITOLAK semua endpoint
 * sampai undangan diterima sebelum `expiresAt`.
 */
export const POST = handle(async (req: Request) => {
  const actor = await requireActor(req, { permission: "users.manage" });
  rateLimit(`invite:${actor.uid}`, 10, 60 * 60_000);
  const body = await readBody(req, schema);
  const email = body.email.toLowerCase();
  const auth = adminAuth();
  const db = adminDb();

  const existing = await auth.getUserByEmail(email).catch(() => null);
  let uid: string;
  let created = false;

  if (existing) {
    const profile = await db.collection("profiles").doc(existing.uid).get();
    if (profile.get("status") !== "invited") throw new HttpError(409, "Email sudah memiliki akun.");
    uid = existing.uid; // kirim ulang undangan yang masih tertunda
  } else {
    const user = await auth.createUser({ email, displayName: body.displayName, emailVerified: false, password: randomBytes(32).toString("hex") });
    uid = user.uid;
    created = true;
  }

  try {
    if (created) {
      await auth.setCustomUserClaims(uid, { role: "admin", admin: true });
      await db.collection("profiles").doc(uid).set({
        uid,
        email,
        displayName: body.displayName,
        role: "admin",
        status: "invited",
        createdAt: FieldValue.serverTimestamp(),
        createdBy: actor.uid,
      });
    }
    const expiresAt = Timestamp.fromMillis(Date.now() + INVITE_TTL_MS);
    const pending = await db.collection("invitations").where("email", "==", email).where("status", "==", "pending").get();
    await Promise.all(pending.docs.map((d) => d.ref.update({ status: "superseded" })));
    const inviteRef = await db.collection("invitations").add({
      email,
      role: "admin",
      status: "pending",
      invitedBy: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
    });

    const setupLink = await auth.generatePasswordResetLink(email, { url: absoluteUrl("/admin/login?invited=1") });
    await writeAudit(actor, created ? "invitation.created" : "invitation.resent", "invitation", inviteRef.id, `email=${email}`);

    // Tautan hanya ditampilkan sekali ini kepada Superadmin dan TIDAK disimpan/dicatat.
    return json(
      {
        ok: true,
        invitationId: inviteRef.id,
        expiresAt: expiresAt.toDate().toISOString(),
        setupLink,
        note: "Kirim tautan ini hanya ke alamat email undangan. Tautan penyetelan password Firebase berlaku singkat (sekitar 1 jam); kirim ulang undangan bila kedaluwarsa. Undangan sendiri berlaku 72 jam.",
      },
      201,
    );
  } catch (error) {
    if (created) {
      // Rollback agar tidak tersisa akun setengah jadi.
      await auth.deleteUser(uid).catch(() => undefined);
      await db.collection("profiles").doc(uid).delete().catch(() => undefined);
    }
    throw error;
  }
});
