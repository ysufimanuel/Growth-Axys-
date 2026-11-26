import { z } from "zod";
import { writeAudit } from "../../../../../lib/server/audit";
import { requireActor } from "../../../../../lib/server/auth";
import { adminDb } from "../../../../../lib/server/firebase-admin";
import { handle, json, readBody } from "../../../../../lib/server/http";

export const runtime = "nodejs";
const ref = () => adminDb().collection("siteSettings").doc("seoGlobal");
const schema = z.strictObject({
  title: z.string().trim().max(120),
  description: z.string().trim().max(300),
  ogImage: z.union([z.literal(""), z.url().refine((u) => u.startsWith("https://"))]),
  index: z.boolean(),
  follow: z.boolean(),
});
const defaults = { title: "", description: "", ogImage: "", index: true, follow: true };

export const GET = handle(async (req: Request) => {
  await requireActor(req, { permission: "seo.global" });
  const snap = await ref().get();
  return json({ settings: snap.exists ? { ...defaults, ...snap.data() } : defaults });
});

export const PUT = handle(async (req: Request) => {
  const actor = await requireActor(req, { permission: "seo.global" });
  const input = await readBody(req, schema);
  await ref().set({ ...input, updatedAt: new Date(), updatedBy: actor.uid }, { merge: false });
  await writeAudit(actor, "seo.global.updated", "siteSettings", "seoGlobal", "Pengaturan SEO global diperbarui.");
  return json({ settings: input });
});
