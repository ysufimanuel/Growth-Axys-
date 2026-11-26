import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { writeAudit } from "../../../../lib/server/audit";
import { requireActor } from "../../../../lib/server/auth";
import { adminDb, adminAuth } from "../../../../lib/server/firebase-admin";
import { handle, HttpError, json, readBody, rateLimit } from "../../../../lib/server/http";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const bucket = () => {
  const name = process.env.FIREBASE_STORAGE_BUCKET;
  if (!name) throw new HttpError(503, "FIREBASE_STORAGE_BUCKET belum dikonfigurasi.", "STORAGE_NOT_CONFIGURED");
  return getStorage().bucket(name);
};

export const GET = handle(async (req: Request) => {
  await requireActor(req, { permission: "media.manage" });
  const snap = await adminDb().collection("mediaAssets").orderBy("createdAt", "desc").limit(100).get();
  return json({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

const signSchema = z.strictObject({
  action: z.literal("sign"),
  fileName: z.string().min(1).max(160),
  contentType: z.string().refine((v) => MIME.has(v), "Format file tidak didukung."),
  size: z.number().int().positive().max(MAX_BYTES),
});
const completeSchema = z.strictObject({
  action: z.literal("complete"),
  objectPath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(160),
  contentType: z.string().refine((v) => MIME.has(v), "Format file tidak didukung."),
  size: z.number().int().positive().max(MAX_BYTES),
});

export const POST = handle(async (req: Request) => {
  const actor = await requireActor(req, { permission: "media.manage" });
  rateLimit(`media:${actor.uid}`, 30, 60_000);
  const raw = await req.clone().json().catch(() => null) as { action?: unknown } | null;
  if (raw?.action === "sign") {
    const input = await readBody(req, signSchema);
    const ext = input.fileName.split(".").pop()?.toLowerCase() ?? "";
    const allowedExt = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
    if (!allowedExt.has(ext)) throw new HttpError(400, "Ekstensi file tidak sesuai format yang diizinkan.");
    const objectPath = `media/${actor.uid}/${randomUUID()}.${ext}`;
    const file = bucket().file(objectPath);
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4", action: "write", expires: Date.now() + 10 * 60 * 1000,
      contentType: input.contentType,
    });
    return json({ uploadUrl, objectPath });
  }
  if (raw?.action === "complete") {
    const input = await readBody(req, completeSchema);
    if (!input.objectPath.startsWith(`media/${actor.uid}/`)) throw new HttpError(403, "Lokasi file tidak valid.");
    const file = bucket().file(input.objectPath);
    const [exists] = await file.exists();
    if (!exists) throw new HttpError(400, "File belum ditemukan di Storage.");
    const [metadata] = await file.getMetadata();
    if (Number(metadata.size) !== input.size || metadata.contentType !== input.contentType || Number(metadata.size) > MAX_BYTES) {
      await file.delete({ ignoreNotFound: true });
      throw new HttpError(400, "Metadata file tidak cocok. Upload dibatalkan.");
    }
    const token = randomUUID();
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket().name}/o/${encodeURIComponent(input.objectPath)}?alt=media&token=${token}`;
    const ref = await adminDb().collection("mediaAssets").add({
      name: input.fileName, contentType: input.contentType, size: input.size,
      objectPath: input.objectPath, url, createdBy: actor.uid, createdAt: FieldValue.serverTimestamp(),
    });
    await writeAudit(actor, "media.uploaded", "mediaAssets", ref.id, input.fileName);
    return json({ id: ref.id, url }, 201);
  }
  throw new HttpError(400, "Aksi media tidak dikenal.");
});
