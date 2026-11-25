// Normalisasi dokumen Firestore (termasuk dokumen "legacy" dari situs vanilla)
// ke model baru. Modul murni: menerima objek polos, tidak mengimpor Firebase.
import type { Article, Certification, Project, PublishStatus, Service, SeoFields } from "./types.ts";

type Raw = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean) : [];

/** Mendukung Firestore Timestamp (toMillis), Date, angka epoch, dan string ISO. */
export function toMillis(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  if (typeof v === "object") {
    const o = v as { toMillis?: () => number; seconds?: number; _seconds?: number };
    if (typeof o.toMillis === "function") return o.toMillis();
    const s = o.seconds ?? o._seconds;
    if (typeof s === "number") return s * 1000;
  }
  return null;
}

/**
 * Dokumen lama tidak punya `publishStatus` dan sudah tampil publik di situs vanilla,
 * sehingga dianggap "published". Dokumen baru wajib menuliskan statusnya.
 */
export function readPublishStatus(raw: Raw): PublishStatus {
  const v = raw.publishStatus;
  return v === "draft" || v === "archived" || v === "published" ? v : "published";
}

function readSeo(raw: Raw): SeoFields {
  const s = (raw.seo ?? {}) as Raw;
  return {
    title: str(s.title) || undefined,
    description: str(s.description) || undefined,
    canonical: str(s.canonical) || undefined,
    noindex: s.noindex === true ? true : undefined,
    ogImage: str(s.ogImage) || undefined,
  };
}

export function normalizeProject(id: string, raw: Raw): Project {
  const year = Number(raw.year);
  const media = (raw.mediaSettings ?? {}) as Raw;
  return {
    id,
    // Legacy: ID dokumen dipakai sebagai slug agar link ?id=<docId> tetap valid.
    slug: str(raw.slug) || id,
    title: str(raw.title) || str(raw.name) || "Proyek Pillarians Group",
    location: str(raw.location),
    year: Number.isFinite(year) && year > 0 ? year : null,
    category: str(raw.category) || str(raw.type),
    // Legacy: `status` berisi progres pekerjaan (Selesai/Berjalan), bukan status publikasi.
    progress: str(raw.progress) || (raw.status === "Selesai" || raw.status === "Berjalan" ? (raw.status as string) : ""),
    owner: str(raw.owner),
    value: str(raw.value),
    scope: str(raw.scope) || str(raw.description),
    cover: str(raw.cover),
    gallery: strArray(raw.gallery),
    mediaSettings: { autoplay: media.autoplay === true, muted: media.muted !== false },
    publishStatus: readPublishStatus(raw),
    seo: readSeo(raw),
    createdAt: toMillis(raw.createdAt),
    updatedAt: toMillis(raw.updatedAt),
  };
}

export function normalizeService(id: string, raw: Raw): Service {
  return {
    id,
    slug: str(raw.slug) || id,
    title: str(raw.title),
    summary: str(raw.summary),
    content: str(raw.content),
    bullets: strArray(raw.bullets),
    image: str(raw.image),
    imageAlt: str(raw.imageAlt),
    publishStatus: readPublishStatus(raw),
    seo: readSeo(raw),
    updatedAt: toMillis(raw.updatedAt),
  };
}

export function normalizeArticle(id: string, raw: Raw): Article {
  const sources = Array.isArray(raw.sources)
    ? (raw.sources as Raw[])
        .map((s) => ({ title: str(s?.title), url: str(s?.url) }))
        .filter((s) => s.title && /^https?:\/\//i.test(s.url))
    : [];
  return {
    id,
    slug: str(raw.slug) || id,
    title: str(raw.title),
    excerpt: str(raw.excerpt),
    content: str(raw.content),
    image: str(raw.image),
    imageAlt: str(raw.imageAlt),
    authorName: str(raw.authorName),
    reviewerName: str(raw.reviewerName),
    reviewedAt: toMillis(raw.reviewedAt),
    factChecked: raw.factChecked === true,
    sources,
    publishStatus: readPublishStatus(raw),
    seo: readSeo(raw),
    publishedAt: toMillis(raw.publishedAt),
    updatedAt: toMillis(raw.updatedAt),
  };
}

export function normalizeCertification(id: string, raw: Raw): Certification {
  return {
    id,
    name: str(raw.name),
    number: str(raw.number),
    issuer: str(raw.issuer),
    validUntil: str(raw.validUntil),
    publicDocument: str(raw.publicDocument),
    publishStatus: readPublishStatus(raw),
    updatedAt: toMillis(raw.updatedAt),
  };
}

/** Teks polos -> paragraf. Konten tidak pernah dirender sebagai HTML (anti-XSS). */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}
