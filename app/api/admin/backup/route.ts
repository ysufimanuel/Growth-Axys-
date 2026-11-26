import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { writeAudit } from "../../../../lib/server/audit";
import { requireActor } from "../../../../lib/server/auth";
import { adminDb } from "../../../../lib/server/firebase-admin";
import { handle, HttpError, json, rateLimit } from "../../../../lib/server/http";

export const runtime = "nodejs";

const FORMAT = "pillarians-firestore-backup";
const VERSION = 1;
const COLLECTIONS = ["projects", "services", "articles", "certifications", "redirects", "siteSettings", "mediaAssets", "revisions"] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_DOCS = 10_000;
const MAX_COLLECTION_DOCS = 3_000;

function encode(value: unknown): unknown {
  if (value instanceof Timestamp) return { $firestore: "timestamp", value: value.toDate().toISOString() };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, encode(child)]));
  }
  return value;
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (object.$firestore === "timestamp" && typeof object.value === "string" && Object.keys(object).length === 2) {
      const date = new Date(object.value);
      if (Number.isNaN(date.getTime())) throw new HttpError(400, "Timestamp backup tidak valid.");
      return Timestamp.fromDate(date);
    }
    return Object.fromEntries(Object.entries(object).map(([key, child]) => [key, decode(child)]));
  }
  return value;
}

const backupSchema = z.strictObject({
  format: z.literal(FORMAT),
  version: z.literal(VERSION),
  projectId: z.string().min(1).max(128),
  exportedAt: z.iso.datetime({ offset: true }),
  documentCount: z.number().int().min(0).max(MAX_TOTAL_DOCS),
  storageIncluded: z.literal(false),
  collections: z.record(z.string(), z.array(z.strictObject({
    id: z.string().min(1).max(1500).refine((id) => !id.includes("/"), "ID dokumen tidak boleh mengandung garis miring."),
    data: z.record(z.string(), z.unknown()),
  }))),
});

export const GET = handle(async (req: Request) => {
  const actor = await requireActor(req, { permission: "backup.restore" });
  rateLimit(`backup-export:${actor.uid}`, 2, 60_000);
  const collections: Record<string, { id: string; data: unknown }[]> = {};
  let total = 0;
  for (const name of COLLECTIONS) {
    const snap = await adminDb().collection(name).get();
    if (snap.size > MAX_COLLECTION_DOCS || total + snap.size > MAX_TOTAL_DOCS) {
      throw new HttpError(413, "Backup melebihi batas dokumen. Gunakan Firebase managed export untuk database besar.");
    }
    total += snap.size;
    collections[name] = snap.docs.map((doc) => ({ id: doc.id, data: encode(doc.data()) }));
  }
  await writeAudit(actor, "backup.exported", "firestore", "admin-backup", `${total} dokumen diekspor.`);
  return json({
    format: FORMAT,
    version: VERSION,
    projectId: process.env.FIREBASE_PROJECT_ID ?? "",
    exportedAt: new Date().toISOString(),
    documentCount: total,
    storageIncluded: false,
    collections,
  });
});

export const POST = handle(async (req: Request) => {
  const actor = await requireActor(req, { permission: "backup.restore" });
  rateLimit(`backup-restore:${actor.uid}`, 1, 60_000);
  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) throw new HttpError(413, "File backup maksimal 5 MB.");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new HttpError(400, "File backup bukan JSON yang valid."); }
  const result = backupSchema.safeParse(parsed);
  if (!result.success) throw new HttpError(400, `Format backup tidak valid: ${result.error.issues[0]?.message ?? "struktur tidak sesuai"}`);
  const backup = result.data;
  const projectId = process.env.FIREBASE_PROJECT_ID ?? "";
  if (!projectId || backup.projectId !== projectId) throw new HttpError(400, "Backup berasal dari Firebase project yang berbeda.");

  const names = Object.keys(backup.collections);
  if (names.some((name) => !(COLLECTIONS as readonly string[]).includes(name))) {
    throw new HttpError(400, "Backup memuat koleksi yang tidak diizinkan.");
  }
  let total = 0;
  for (const [name, docs] of Object.entries(backup.collections)) {
    if (docs.length > MAX_COLLECTION_DOCS) throw new HttpError(413, `Koleksi ${name} melebihi batas dokumen.`);
    total += docs.length;
  }
  if (total > MAX_TOTAL_DOCS) throw new HttpError(413, "Backup melebihi batas total dokumen.");

  const db = adminDb();
  let restored = 0;
  // Upsert dalam batch. Dokumen yang tidak ada di file backup TIDAK dihapus.
  for (const [name, docs] of Object.entries(backup.collections)) {
    for (let offset = 0; offset < docs.length; offset += 400) {
      const batch = db.batch();
      for (const item of docs.slice(offset, offset + 400)) {
        batch.set(db.collection(name).doc(item.id), decode(item.data) as Record<string, unknown>, { merge: false });
        restored++;
      }
      await batch.commit();
    }
  }
  await writeAudit(actor, "backup.restored", "firestore", "admin-backup", `${restored} dokumen dipulihkan dari backup ${backup.exportedAt}.`);
  return json({ restored, storageIncluded: false, mode: "upsert" });
});
