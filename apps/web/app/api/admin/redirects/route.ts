import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { validateRedirect, type RedirectRule } from "../../../../lib/core/redirects";
import { writeAudit } from "../../../../lib/server/audit";
import { requireActor } from "../../../../lib/server/auth";
import { adminDb } from "../../../../lib/server/firebase-admin";
import { handle, HttpError, json, readBody } from "../../../../lib/server/http";

export const runtime = "nodejs";

export const GET = handle(async (req: Request) => {
  await requireActor(req, { permission: "redirects.manage" });
  const snap = await adminDb().collection("redirects").get();
  return json({ items: snap.docs.map((d) => ({ id: d.id, ...(d.data() as RedirectRule) })) });
});

const schema = z.strictObject({
  from: z.string().min(2).max(300),
  to: z.string().min(2).max(500),
  statusCode: z.union([z.literal(301), z.literal(308)]).default(308),
});

export const POST = handle(async (req: Request) => {
  const actor = await requireActor(req, { permission: "redirects.manage" });
  const input = await readBody(req, schema);
  const existing = (await adminDb().collection("redirects").get()).docs.map((d) => d.data() as RedirectRule);
  const check = validateRedirect(input, existing);
  if (!check.ok) throw new HttpError(409, check.reason ?? "Redirect ditolak.", "REDIRECT_INVALID");
  const ref = await adminDb().collection("redirects").add({ ...input, active: true, createdAt: FieldValue.serverTimestamp(), createdBy: actor.uid });
  await writeAudit(actor, "redirect.created", "redirects", ref.id, `${input.from} -> ${input.to}`);
  return json({ id: ref.id }, 201);
});
