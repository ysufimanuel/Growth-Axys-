import "server-only";
import { z } from "zod";

export const CONTENT_TYPES = ["projects", "services", "articles", "certifications"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const isContentType = (v: string): v is ContentType => (CONTENT_TYPES as readonly string[]).includes(v);

const httpsUrl = z.url().refine((u) => u.startsWith("https://"), "URL harus HTTPS.");
const text = (max: number) => z.string().trim().max(max);
// Konten adalah TEKS POLOS (paragraf dipisah baris kosong); tidak pernah dirender sebagai HTML.
const body = z.string().max(50_000);

export const seoSchema = z.strictObject({
  title: text(120).optional(),
  description: text(300).optional(),
  canonical: httpsUrl.optional(), // hanya Superadmin (dicek di service)
  noindex: z.boolean().optional(), // hanya Superadmin
  ogImage: httpsUrl.optional(),
});

const slug = z.string().trim().max(80).optional();

export const schemas = {
  projects: z.strictObject({
    title: text(160).min(2),
    slug,
    location: text(160),
    year: z.number().int().min(1950).max(2100).nullable().optional(),
    category: z.enum(["Gedung", "Infrastruktur", "Renovasi", "MEP"]).optional(),
    progress: z.enum(["Selesai", "Berjalan"]).optional(),
    owner: text(160),
    value: text(80),
    scope: body,
    cover: httpsUrl.optional(),
    gallery: z.array(httpsUrl).max(40),
    mediaSettings: z.strictObject({ autoplay: z.boolean(), muted: z.boolean() }).optional(),
    seo: seoSchema.optional(),
  }),
  services: z.strictObject({
    title: text(160).min(2),
    slug,
    summary: text(400),
    content: body,
    bullets: z.array(text(200)).max(20),
    image: httpsUrl.optional(),
    imageAlt: text(200),
    seo: seoSchema.optional(),
  }),
  articles: z.strictObject({
    title: text(200).min(2),
    slug,
    excerpt: text(400),
    content: body,
    image: httpsUrl.optional(),
    imageAlt: text(200),
    authorName: text(120),
    reviewerName: text(120),
    reviewedAt: z.iso.datetime({ offset: true }).optional(),
    factChecked: z.boolean(),
    sources: z.array(z.strictObject({ title: text(200), url: httpsUrl })).max(30),
    seo: seoSchema.optional(),
  }),
  certifications: z.strictObject({
    name: text(200).min(2),
    number: text(120),
    issuer: text(160),
    validUntil: text(40),
    // Dokumen legalitas tidak boleh publik tanpa persetujuan: field ini baru tampil bila diisi eksplisit.
    publicDocument: httpsUrl.optional(),
  }),
} as const;

/** Nilai awal saat create (tidak dipakai saat update, supaya update parsial tidak menimpa field). */
export const createDefaults: Record<ContentType, Record<string, unknown>> = {
  projects: { location: "", owner: "", value: "", scope: "", gallery: [], category: "", progress: "" },
  services: { summary: "", content: "", bullets: [], imageAlt: "" },
  articles: { excerpt: "", content: "", imageAlt: "", authorName: "", reviewerName: "", factChecked: false, sources: [] },
  certifications: { number: "", issuer: "", validUntil: "" },
};

/** Create: semua field opsional kecuali judul/nama; sisanya diisi createDefaults. */
export function createSchema(type: ContentType) {
  const key = type === "certifications" ? "name" : "title";
  // `key` is narrowed at runtime, but Zod 4 cannot infer a valid required-mask from a computed string key.
  return (schemas[type] as z.ZodObject).partial().required({ [key]: true } as never);
}

/** Update parsial; `redirectConfirmed` wajib bila slug konten published berubah. */
export function updateSchema(type: ContentType) {
  return (schemas[type] as z.ZodObject).partial().extend({ redirectConfirmed: z.boolean().optional() });
}

export const statusSchema = z.strictObject({ to: z.enum(["draft", "published", "archived"]) });
