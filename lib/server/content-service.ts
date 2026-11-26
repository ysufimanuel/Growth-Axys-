import "server-only";
import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkContent } from "../core/content-checks";
import { can, canEditRiskySeo } from "../core/permissions";
import { validateRedirect, type RedirectRule } from "../core/redirects";
import { isValidSlug, slugify } from "../core/slug";
import { toMillis } from "../core/normalize";
import { queryRows, type ListQuery, type ListResult, type ListRow } from "../core/content-query";
import { writeAudit } from "./audit";
import type { Actor } from "./auth";
import { createDefaults, type ContentType } from "./content-schemas";
import { adminDb } from "./firebase-admin";
import { HttpError } from "./http";

const PUBLIC_PREFIX: Record<ContentType, string | null> = {
  projects: "/proyek",
  services: "/layanan",
  articles: "/artikel",
  certifications: null,
};

type Doc = Record<string, unknown>;
type Status = "draft" | "published" | "archived";

const col = (type: ContentType) => adminDb().collection(type);

/** Dokumen legacy tanpa publishStatus sudah tampil publik => "published". */
const statusOf = (d: Doc): Status => (d.publishStatus === "draft" || d.publishStatus === "archived" ? d.publishStatus : "published");

/** Timestamp Firestore -> epoch ms agar aman di-JSON. */
function serialize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(serialize);
  const ms = toMillis(value);
  if (ms !== null && typeof (value as { toMillis?: unknown }).toMillis === "function") return ms;
  return Object.fromEntries(Object.entries(value as Doc).map(([k, v]) => [k, serialize(v)]));
}

function revalidateFor(type: ContentType, slug?: string) {
  const prefix = PUBLIC_PREFIX[type];
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (type === "certifications") return revalidatePath("/sertifikasi");
  if (prefix) {
    revalidatePath(prefix);
    if (slug) revalidatePath(`${prefix}/${slug}`);
  }
}

async function slugTaken(type: ContentType, slug: string, excludeId?: string): Promise<boolean> {
  const bySlug = await col(type).where("slug", "==", slug).limit(2).get();
  if (bySlug.docs.some((d) => d.id !== excludeId)) return true;
  // Dokumen legacy memakai ID dokumen sebagai slug.
  const byId = await col(type).doc(slug).get();
  return byId.exists && byId.id !== excludeId;
}

function warningsFor(type: ContentType, d: Doc): string[] {
  const seo = (d.seo ?? {}) as Doc;
  const image = (d.cover ?? d.image) as string | undefined;
  return checkContent({
    title: String(d.title ?? d.name ?? ""),
    body: String(d.scope ?? d.content ?? ""),
    seoTitle: seo.title as string | undefined,
    seoDescription: (seo.description as string | undefined) ?? (d.summary as string | undefined) ?? (d.excerpt as string | undefined),
    hasImage: Boolean(image),
    imageAlt: d.imageAlt as string | undefined,
    isArticle: type === "articles",
    sources: Array.isArray(d.sources) ? d.sources.length : 0,
    reviewed: Boolean(d.reviewerName && d.reviewedAt),
  });
}

function guardRiskySeo(actor: Actor, input: Doc) {
  const seo = input.seo as Doc | undefined;
  if (seo && ("canonical" in seo || "noindex" in seo) && !canEditRiskySeo(actor.role)) {
    throw new HttpError(403, "Canonical dan noindex hanya dapat diubah oleh Superadmin.");
  }
}

function prepare(input: Doc): Doc {
  const out: Doc = { ...input };
  delete out.redirectConfirmed;
  if (typeof out.reviewedAt === "string") out.reviewedAt = Timestamp.fromMillis(Date.parse(out.reviewedAt));
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

/** Ringkasan untuk daftar: tanpa isi panjang. Filter/cari/paginasi dilakukan di server. */
export async function listContent(type: ContentType, query: Required<ListQuery>): Promise<ListResult> {
  const snap = await col(type).get();
  const rows: ListRow[] = snap.docs.map((d) => {
    const data = d.data() as Doc;
    const ms = toMillis(data.updatedAt) ?? toMillis(data.createdAt);
    const extra =
      type === "projects" ? [data.location, data.category, data.progress].filter(Boolean).join(" · ")
      : type === "articles" ? String(data.authorName ?? "")
      : type === "certifications" ? [data.issuer, data.number].filter(Boolean).join(" · ")
      : String(data.summary ?? "").slice(0, 80);
    return {
      id: d.id,
      title: String(data.title ?? data.name ?? "(tanpa judul)"),
      slug: String(data.slug ?? d.id),
      publishStatus: statusOf(data),
      updatedAt: ms,
      extra,
    };
  });
  return queryRows(rows, query);
}

export async function getContent(type: ContentType, id: string) {
  const snap = await col(type).doc(id).get();
  if (!snap.exists) throw new HttpError(404, "Konten tidak ditemukan.");
  return { id: snap.id, ...(serialize(snap.data()) as Doc), publishStatus: statusOf(snap.data() as Doc) };
}

export async function createContent(actor: Actor, type: ContentType, input: Doc) {
  guardRiskySeo(actor, input);
  const data = prepare(input);

  if (type !== "certifications") {
    const slug = String(data.slug || slugify(String(data.title)));
    if (!isValidSlug(slug)) throw new HttpError(400, "Slug tidak valid (huruf kecil, angka, tanda hubung).", "BAD_SLUG");
    if (await slugTaken(type, slug)) throw new HttpError(409, "Slug sudah dipakai.", "SLUG_TAKEN");
    data.slug = slug;
  }

  const ref = col(type).doc();
  await ref.set({
    ...createDefaults[type],
    ...data,
    publishStatus: "draft", // konten baru SELALU draft; publish adalah langkah terpisah
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    updatedBy: actor.uid,
  });
  await writeAudit(actor, "content.created", type, ref.id, String(data.title ?? data.name ?? ""));
  return { id: ref.id, slug: data.slug as string | undefined, warnings: warningsFor(type, { ...createDefaults[type], ...data }) };
}

export async function updateContent(actor: Actor, type: ContentType, id: string, input: Doc) {
  if (!can(actor.role, "content.edit")) throw new HttpError(403, "Tidak memiliki izin mengedit konten.");
  guardRiskySeo(actor, input);
  const ref = col(type).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Konten tidak ditemukan.");
  const prev = snap.data() as Doc;
  if (statusOf(prev) === "archived") throw new HttpError(409, "Konten terarsip tidak dapat diubah. Pulihkan lebih dulu (Superadmin).");

  const patch = prepare(input);
  let redirectToCreate: { from: string; to: string } | null = null;
  const oldSlug = String(prev.slug || id);

  if (type !== "certifications" && typeof patch.slug === "string" && patch.slug !== oldSlug) {
    const newSlug = patch.slug;
    if (!isValidSlug(newSlug)) throw new HttpError(400, "Slug tidak valid.", "BAD_SLUG");
    if (await slugTaken(type, newSlug, id)) throw new HttpError(409, "Slug sudah dipakai.", "SLUG_TAKEN");
    if (statusOf(prev) === "published") {
      if (input.redirectConfirmed !== true) {
        throw new HttpError(409, "Mengubah slug konten yang sudah dipublikasikan akan memutus URL lama. Kirim ulang dengan redirectConfirmed: true untuk membuat redirect 308.", "SLUG_CHANGE_NEEDS_CONFIRMATION");
      }
      const prefix = PUBLIC_PREFIX[type]!;
      redirectToCreate = { from: `${prefix}/${oldSlug}`, to: `${prefix}/${newSlug}` };
      const existing = (await adminDb().collection("redirects").get()).docs.map((d) => d.data() as RedirectRule);
      const check = validateRedirect(redirectToCreate, existing);
      if (!check.ok) throw new HttpError(409, `Redirect tidak dapat dibuat: ${check.reason}`, "REDIRECT_INVALID");
    }
  } else {
    delete patch.slug;
  }
  if (patch.seo) patch.seo = { ...((prev.seo as Doc) ?? {}), ...(patch.seo as Doc) };

  // Riwayat versi: simpan snapshot sebelum perubahan.
  await adminDb().collection("revisions").add({ targetType: type, targetId: id, snapshot: prev, editorUid: actor.uid, timestamp: FieldValue.serverTimestamp() });
  await ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
  if (redirectToCreate) {
    await adminDb().collection("redirects").add({ ...redirectToCreate, statusCode: 308, active: true, createdAt: FieldValue.serverTimestamp(), createdBy: actor.uid });
    await writeAudit(actor, "redirect.created", "redirects", id, `${redirectToCreate.from} -> ${redirectToCreate.to}`);
  }
  await writeAudit(actor, "content.updated", type, id, Object.keys(patch).join(","));
  revalidateFor(type, oldSlug);
  if (typeof patch.slug === "string") revalidateFor(type, patch.slug);
  return { id, warnings: warningsFor(type, { ...prev, ...patch }) };
}

function permissionFor(from: Status, to: Status) {
  if (from === "archived") return "backup.restore" as const; // memulihkan konten terarsip = Superadmin
  if (to === "archived") return "content.archive" as const;
  return "content.publish" as const; // publish & unpublish
}

export async function setStatus(actor: Actor, type: ContentType, id: string, to: Status) {
  const ref = col(type).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Konten tidak ditemukan.");
  const prev = snap.data() as Doc;
  const from = statusOf(prev);
  if (from === to) return { id, status: to, warnings: [] as string[] };
  if (!can(actor.role, permissionFor(from, to))) throw new HttpError(403, "Anda tidak memiliki izin untuk perubahan status ini.");

  const warnings = warningsFor(type, prev);
  if (to === "published" && !String(prev.title ?? prev.name ?? "").trim()) throw new HttpError(422, "Judul wajib diisi sebelum dipublikasikan.");

  const patch: Doc = { publishStatus: to, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid };
  if (to === "published" && type === "articles" && !prev.publishedAt) patch.publishedAt = FieldValue.serverTimestamp();
  await ref.update(patch);
  await writeAudit(actor, `content.${to === "published" ? "published" : to === "archived" ? "archived" : "unpublished"}`, type, id, String(prev.title ?? prev.name ?? ""));
  revalidateFor(type, String(prev.slug || id));
  return { id, status: to, warnings };
}

export async function deleteContent(actor: Actor, type: ContentType, id: string) {
  if (!can(actor.role, "content.delete")) throw new HttpError(403, "Hanya Superadmin yang dapat menghapus permanen.");
  const ref = col(type).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Konten tidak ditemukan.");
  if (statusOf(snap.data() as Doc) !== "archived") throw new HttpError(409, "Arsipkan konten lebih dulu sebelum menghapus permanen.", "NOT_ARCHIVED");
  await adminDb().collection("revisions").add({ targetType: type, targetId: id, snapshot: snap.data(), editorUid: actor.uid, timestamp: FieldValue.serverTimestamp(), deleted: true });
  await ref.delete();
  await writeAudit(actor, "content.deleted", type, id);
  revalidateFor(type, String(snap.get("slug") || id));
  return { id };
}


export interface RevisionSummary {
  id: string;
  timestamp: number | null;
  editorUid: string;
  deleted: boolean;
  title: string;
  publishStatus: Status;
}

/** Riwayat versi untuk satu dokumen. Snapshot penuh tidak dikirim ke daftar. */
export async function listRevisions(type: ContentType, id: string): Promise<RevisionSummary[]> {
  const snap = await adminDb().collection("revisions")
    .where("targetType", "==", type)
    .where("targetId", "==", id)
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as Doc;
    const snapshot = (data.snapshot && typeof data.snapshot === "object" ? data.snapshot : {}) as Doc;
    return {
      id: d.id,
      timestamp: toMillis(data.timestamp),
      editorUid: String(data.editorUid ?? ""),
      deleted: data.deleted === true,
      title: String(snapshot.title ?? snapshot.name ?? "(tanpa judul)"),
      publishStatus: statusOf(snapshot),
    };
  }).sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, 50);
}

/** Restore hanya Superadmin. Versi saat ini ikut disimpan agar restore bisa dibatalkan. */
export async function restoreRevision(actor: Actor, type: ContentType, id: string, revisionId: string) {
  if (!can(actor.role, "backup.restore")) throw new HttpError(403, "Hanya Superadmin yang dapat memulihkan revisi.");
  const revisionRef = adminDb().collection("revisions").doc(revisionId);
  const revisionSnap = await revisionRef.get();
  if (!revisionSnap.exists) throw new HttpError(404, "Revisi tidak ditemukan.");
  const revision = revisionSnap.data() as Doc;
  if (revision.targetType !== type || revision.targetId !== id || !revision.snapshot || typeof revision.snapshot !== "object") {
    throw new HttpError(400, "Revisi tidak cocok dengan konten yang diminta.");
  }

  const ref = col(type).doc(id);
  const current = await ref.get();
  if (current.exists) {
    await adminDb().collection("revisions").add({
      targetType: type, targetId: id, snapshot: current.data(), editorUid: actor.uid,
      timestamp: FieldValue.serverTimestamp(), restoreCheckpoint: true,
    });
  }
  const snapshot = revision.snapshot as Doc;
  const restored: Doc = { ...snapshot, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid };
  await ref.set(restored, { merge: false });
  await writeAudit(actor, "content.revision_restored", type, id, `Revisi ${revisionId} dipulihkan.`);
  revalidateFor(type, String(restored.slug || id));
  return { id, title: String(restored.title ?? restored.name ?? id), publishStatus: statusOf(restored) };
}
