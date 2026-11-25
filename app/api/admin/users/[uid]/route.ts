import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { guardAccountChange } from "../../../../../lib/core/permissions";
import { listAccounts } from "../../../../../lib/server/accounts";
import { writeAudit } from "../../../../../lib/server/audit";
import { requireActor } from "../../../../../lib/server/auth";
import { adminAuth, adminDb } from "../../../../../lib/server/firebase-admin";
import { handle, HttpError, json, rateLimit, readBody } from "../../../../../lib/server/http";

export const runtime = "nodejs";

const schema = z
  .strictObject({
    role: z.enum(["admin", "superadmin"]).optional(),
    status: z.enum(["active", "disabled"]).optional(),
    confirm: z.literal(true, { error: "Perubahan harus dikonfirmasi (confirm: true)." }),
  })
  .refine((v) => v.role !== undefined || v.status !== undefined, { message: "Tidak ada perubahan." });

/**
 * Superadmin: ubah role atau aktif/nonaktifkan akun.
 * Aturan server: tidak boleh mengubah akun sendiri, akun SUPER_ADMIN_UID, atau Superadmin terakhir.
 */
export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ uid: string }> }) => {
  const actor = await requireActor(req, { permission: "roles.change" });
  rateLimit(`users:${actor.uid}`, 30, 60_000);
  const { uid } = await ctx.params;
  const body = await readBody(req, schema);

  if (uid === process.env.SUPER_ADMIN_UID) throw new HttpError(403, "Akun Superadmin utama dikelola melalui konfigurasi deployment.");

  const { accounts } = await listAccounts();
  const guard = guardAccountChange(accounts, uid, { role: body.role, status: body.status }, actor.uid);
  if (!guard.ok) throw new HttpError(409, guard.reason ?? "Perubahan ditolak.");

  const auth = adminAuth();
  const target = await auth.getUser(uid);
  const role = body.role ?? accounts.find((a) => a.uid === uid)?.role ?? "admin";

  // `admin: true` dipertahankan agar versi vanilla (yang membaca claim ini) tetap berfungsi sampai cutover.
  await auth.setCustomUserClaims(uid, { ...(target.customClaims ?? {}), role, admin: true });
  if (body.status) {
    await auth.updateUser(uid, { disabled: body.status === "disabled" });
    await adminDb().collection("profiles").doc(uid).set({ status: body.status, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid }, { merge: true });
  }
  // Cabut sesi/token lama agar perubahan berlaku segera.
  await auth.revokeRefreshTokens(uid);

  await writeAudit(
    actor,
    body.role ? "account.role_changed" : body.status === "disabled" ? "account.disabled" : "account.enabled",
    "account",
    uid,
    [body.role ? `role=${body.role}` : null, body.status ? `status=${body.status}` : null].filter(Boolean).join(", "),
  );
  return json({ ok: true });
});
