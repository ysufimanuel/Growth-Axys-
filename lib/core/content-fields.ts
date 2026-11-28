// Definisi field editor CMS + konversi form <-> payload API (murni, diuji).
// Aturan ini MENCERMINKAN lib/server/content-schemas.ts untuk umpan balik cepat; server tetap otoritas.
export type ContentType = "projects" | "services" | "articles" | "certifications";

export type FieldKind = "text" | "textarea" | "url" | "number" | "select" | "checkbox" | "lines" | "sources" | "date";

export interface FieldDef {
  name: string; // nama field; "seo.title" = field bersarang
  label: string;
  kind: FieldKind;
  max?: number;
  required?: boolean;
  hint?: string;
  options?: readonly string[];
  group: "main" | "detail" | "media" | "geo" | "seo";
  /** Hanya Superadmin yang boleh mengubah (canonical/noindex). */
  superOnly?: boolean;
  span?: boolean;
}

const seoFields: FieldDef[] = [
  { name: "seo.title", label: "Judul SEO", kind: "text", max: 120, group: "seo", hint: "Maks. 120 karakter. Kosong = memakai judul konten." },
  { name: "seo.description", label: "Deskripsi SEO", kind: "textarea", max: 300, group: "seo", span: true, hint: "Sekitar 140–160 karakter paling baik." },
  { name: "seo.ogImage", label: "Gambar Open Graph (URL HTTPS)", kind: "url", group: "seo" },
  { name: "seo.canonical", label: "Canonical (URL HTTPS)", kind: "url", group: "seo", superOnly: true, hint: "Hanya Superadmin." },
  { name: "seo.noindex", label: "Jangan diindeks mesin pencari (noindex)", kind: "checkbox", group: "seo", superOnly: true, hint: "Hanya Superadmin." },
];

export const FIELDS: Record<ContentType, FieldDef[]> = {
  projects: [
    { name: "title", label: "Judul proyek", kind: "text", max: 160, required: true, group: "main", span: true },
    { name: "slug", label: "Slug URL", kind: "text", max: 80, group: "main", hint: "Huruf kecil, angka, tanda hubung. Kosong = dibuat dari judul." },
    { name: "location", label: "Lokasi", kind: "text", max: 160, group: "detail" },
    { name: "year", label: "Tahun", kind: "number", group: "detail" },
    { name: "category", label: "Kategori", kind: "select", options: ["Gedung", "Infrastruktur", "Renovasi", "MEP"], group: "detail" },
    { name: "progress", label: "Progres", kind: "select", options: ["Selesai", "Berjalan"], group: "detail" },
    { name: "owner", label: "Pemberi kerja", kind: "text", max: 160, group: "detail", hint: "Tampilkan hanya jika ada persetujuan publikasi (NDA)." },
    { name: "value", label: "Nilai proyek", kind: "text", max: 80, group: "detail" },
    { name: "scope", label: "Lingkup pekerjaan", kind: "textarea", max: 50000, group: "main", span: true, hint: "Teks polos. Pisahkan paragraf dengan baris kosong. HTML tidak dirender." },
    { name: "cover", label: "Gambar sampul (URL HTTPS)", kind: "url", group: "media" },
    { name: "instagramUrl", label: "URL postingan Instagram", kind: "url", group: "media", hint: "Diisi otomatis saat mengimpor postingan." },
    { name: "mediaRatio", label: "Rasio tampilan media", kind: "select", options: ["1 / 1", "4 / 5", "3 / 4", "2 / 3", "3 / 2", "9 / 16", "16 / 9", "1.91 / 1", "1 / 2.1", "3 / 1"], group: "media" },
    { name: "gallery", label: "Galeri (satu URL HTTPS per baris)", kind: "lines", group: "media", span: true },
    { name: "mediaSettings.autoplay", label: "Autoplay media", kind: "checkbox", group: "media", hint: "Putar media otomatis saat detail proyek dibuka. Browser dapat membatasi autoplay." },
    { name: "mediaSettings.muted", label: "Mute media", kind: "checkbox", group: "media", hint: "Matikan suara agar autoplay lebih kompatibel di HP." },
    ...seoFields,
  ],
  services: [
    { name: "title", label: "Nama layanan", kind: "text", max: 160, required: true, group: "main", span: true },
    { name: "slug", label: "Slug URL", kind: "text", max: 80, group: "main" },
    { name: "summary", label: "Ringkasan", kind: "textarea", max: 400, group: "main", span: true },
    { name: "content", label: "Uraian layanan", kind: "textarea", max: 50000, group: "main", span: true, hint: "Teks polos; paragraf dipisah baris kosong." },
    { name: "bullets", label: "Poin layanan (satu per baris)", kind: "lines", max: 200, group: "detail", span: true },
    { name: "image", label: "Gambar (URL HTTPS)", kind: "url", group: "media" },
    { name: "instagramUrl", label: "URL postingan Instagram", kind: "url", group: "media", hint: "Diisi otomatis saat mengimpor postingan." },
    { name: "mediaRatio", label: "Rasio tampilan media", kind: "select", options: ["1 / 1", "4 / 5", "3 / 4", "2 / 3", "3 / 2", "9 / 16", "16 / 9", "1.91 / 1", "1 / 2.1", "3 / 1"], group: "media" },
    { name: "imageAlt", label: "Teks alternatif gambar", kind: "text", max: 200, group: "media", hint: "Wajib agar gambar dapat diakses pembaca layar." },
    ...seoFields,
  ],
  articles: [
    { name: "title", label: "Judul artikel", kind: "text", max: 200, required: true, group: "main", span: true },
    { name: "slug", label: "Slug URL", kind: "text", max: 80, group: "main" },
    { name: "excerpt", label: "Ringkasan", kind: "textarea", max: 400, group: "main", span: true },
    { name: "content", label: "Isi artikel", kind: "textarea", max: 50000, group: "main", span: true, hint: "Teks polos; paragraf dipisah baris kosong." },
    { name: "image", label: "Gambar (URL HTTPS)", kind: "url", group: "media" },
    { name: "instagramUrl", label: "URL postingan Instagram", kind: "url", group: "media", hint: "Diisi otomatis saat mengimpor postingan." },
    { name: "mediaRatio", label: "Rasio tampilan media", kind: "select", options: ["1 / 1", "4 / 5", "3 / 4", "2 / 3", "3 / 2", "9 / 16", "16 / 9", "1.91 / 1", "1 / 2.1", "3 / 1"], group: "media" },
    { name: "imageAlt", label: "Teks alternatif gambar", kind: "text", max: 200, group: "media" },
    { name: "authorName", label: "Penulis", kind: "text", max: 120, group: "geo" },
    { name: "reviewerName", label: "Peninjau", kind: "text", max: 120, group: "geo" },
    { name: "reviewedAt", label: "Tanggal tinjau", kind: "date", group: "geo" },
    { name: "factChecked", label: "Fakta sudah diperiksa", kind: "checkbox", group: "geo" },
    { name: "sources", label: "Sumber (satu per baris: Judul | https://url)", kind: "sources", group: "geo", span: true },
    ...seoFields,
  ],
  certifications: [
    { name: "name", label: "Nama sertifikat", kind: "text", max: 200, required: true, group: "main", span: true },
    { name: "number", label: "Nomor", kind: "text", max: 120, group: "detail" },
    { name: "issuer", label: "Penerbit", kind: "text", max: 160, group: "detail" },
    { name: "validUntil", label: "Berlaku sampai", kind: "text", max: 40, group: "detail" },
    { name: "publicDocument", label: "Dokumen publik (URL HTTPS)", kind: "url", group: "media", hint: "Isi hanya jika sudah ada persetujuan untuk dipublikasikan." },
  ],
};

export type FormValue = string | boolean;
export type FormValues = Record<string, FormValue>;

const get = (obj: unknown, path: string): unknown => path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);

const WIB = 7 * 3600_000;
const toDate = (ms: unknown) => (typeof ms === "number" ? new Date(ms + WIB).toISOString().slice(0, 10) : "");

/** Dokumen dari API -> nilai awal form (semua string/boolean). */
export function toFormValues(type: ContentType, doc: Record<string, unknown> | null): FormValues {
  const out: FormValues = {};
  for (const f of FIELDS[type]) {
    let v = doc ? get(doc, f.name) : undefined;
    // Adapter baca untuk dokumen proyek dari dashboard HTML lama. Field sumber tetap dipertahankan.
    if (type === "projects" && doc && (v === undefined || v === null || v === "")) {
      const legacy: Record<string, string> = { title: "name", category: "type", progress: "status", scope: "description" };
      const alias = legacy[f.name];
      if (alias) v = doc[alias];
    }
    switch (f.kind) {
      case "checkbox": out[f.name] = v === true; break;
      case "lines": out[f.name] = Array.isArray(v) ? v.map(String).join("\n") : ""; break;
      case "sources": out[f.name] = Array.isArray(v) ? v.map((s: { title?: string; url?: string }) => `${s.title ?? ""} | ${s.url ?? ""}`).join("\n") : ""; break;
      case "date": out[f.name] = toDate(v); break;
      case "number": out[f.name] = typeof v === "number" || (typeof v === "string" && /^\d{4}$/.test(v)) ? String(v) : ""; break;
      default: out[f.name] = typeof v === "string" ? v : "";
    }
  }
  return out;
}

const splitLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function parseSources(s: string): { title: string; url: string }[] {
  return splitLines(s).map((line) => {
    const i = line.lastIndexOf("|");
    return i === -1 ? { title: line, url: "" } : { title: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
  });
}

const isHttps = (u: string) => {
  try { return new URL(u).protocol === "https:"; } catch { return false; }
};

/** Pesan galat per field (kosong = valid). Mencerminkan skema server. */
export function validateForm(type: ContentType, values: FormValues, opts: { isSuper: boolean }): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of FIELDS[type]) {
    if (f.superOnly && !opts.isSuper) continue;
    const v = values[f.name];
    if (f.kind === "checkbox") continue;
    const s = typeof v === "string" ? v.trim() : "";
    if (f.required && s.length < 2) errors[f.name] = `${f.label} wajib diisi (min. 2 karakter).`;
    if (f.max && f.kind !== "lines" && s.length > f.max) errors[f.name] = `Maksimal ${f.max} karakter.`;
    if (f.kind === "url" && s && !isHttps(s)) errors[f.name] = "Harus berupa URL HTTPS yang valid.";
    if (f.kind === "number" && s && (!/^\d{4}$/.test(s) || +s < 1950 || +s > 2100)) errors[f.name] = "Isi tahun 4 digit (1950–2100).";
    if (f.kind === "lines") {
      const lines = splitLines(s);
      if (f.name === "gallery") {
        if (lines.length > 40) errors[f.name] = "Maksimal 40 gambar.";
        else if (lines.some((l) => !isHttps(l))) errors[f.name] = "Setiap baris harus URL HTTPS yang valid.";
      } else {
        if (lines.length > 20) errors[f.name] = "Maksimal 20 poin.";
        else if (f.max && lines.some((l) => l.length > f.max!)) errors[f.name] = `Maksimal ${f.max} karakter per poin.`;
      }
    }
    if (f.kind === "sources") {
      const src = parseSources(s);
      if (src.length > 30) errors[f.name] = "Maksimal 30 sumber.";
      else if (src.some((x) => !x.title || x.title.length > 200 || !isHttps(x.url))) errors[f.name] = "Format tiap baris: Judul | https://alamat-sumber";
    }
  }
  return errors;
}

function fieldValue(f: FieldDef, raw: FormValue): unknown {
  const s = typeof raw === "string" ? raw.trim() : raw;
  switch (f.kind) {
    case "checkbox": return raw === true;
    case "lines": return splitLines(String(raw));
    case "sources": return parseSources(String(raw));
    case "number": return s === "" ? null : Number(s);
    case "date": return s ? `${s}T00:00:00+07:00` : undefined;
    default: return s;
  }
}

const isEmpty = (f: FieldDef, v: unknown) => v === "" || v === undefined || (f.kind === "number" && v === null);

/**
 * Form -> payload API.
 *  - create: kirim field yang terisi saja (server mengisi default).
 *  - edit: kirim hanya field yang BERUBAH dari nilai awal (update parsial).
 * Catatan: field URL opsional yang dikosongkan tidak dikirim (skema tidak menerima string kosong),
 * sehingga mengosongkan gambar belum didukung.
 */
export function buildPayload(type: ContentType, values: FormValues, initial: FormValues | null, opts: { isSuper: boolean }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of FIELDS[type]) {
    if (f.superOnly && !opts.isSuper) continue;
    const cur = values[f.name];
    if (initial && cur === initial[f.name]) continue;
    const v = fieldValue(f, cur ?? "");
    if (initial === null && f.kind !== "checkbox" && isEmpty(f, v)) continue;
    if (initial !== null && (f.kind === "url" || f.kind === "date") && isEmpty(f, v)) continue;
    if (initial !== null && f.name === "slug" && isEmpty(f, v)) continue;
    if (f.name === "category" || f.name === "progress") { if (v === "") continue; }
    if (Array.isArray(v) && f.kind === "lines" && initial === null && v.length === 0) continue;
    if (f.kind === "sources" && initial === null && (v as unknown[]).length === 0) continue;
    // field bersarang "seo.x" -> { seo: { x } }
    const parts = f.name.split(".");
    if (parts.length === 2) {
      const [a, b] = parts as [string, string];
      const bucket = (out[a] ??= {}) as Record<string, unknown>;
      if (v === "" && initial !== null) continue;
      bucket[b] = v;
    } else out[f.name] = v;
  }
  // mediaSettings adalah objek strict: saat salah satu toggle berubah, kirim keduanya.
  if (out.mediaSettings) {
    out.mediaSettings = {
      autoplay: values["mediaSettings.autoplay"] === true,
      muted: values["mediaSettings.muted"] === true,
    };
  }
  // seo.noindex=false pada create tidak perlu dikirim
  const seo = out.seo as Record<string, unknown> | undefined;
  if (seo && initial === null && seo.noindex === false) delete seo.noindex;
  if (seo && Object.keys(seo).length === 0) delete out.seo;
  return out;
}
