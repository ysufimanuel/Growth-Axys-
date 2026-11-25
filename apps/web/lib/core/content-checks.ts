// Pemeriksaan editorial SEO/GEO. Hasilnya PERINGATAN untuk review manusia,
// bukan aturan ranking dan bukan keputusan otomatis (spec bagian 10-11).

export interface CheckInput {
  title: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
  imageAlt?: string;
  hasImage?: boolean;
  sources?: number;
  reviewed?: boolean;
  isArticle?: boolean;
}

export const THIN_CONTENT_CHARS = 600;
/** Deskripsi proyek cukup pendek secara wajar, tetapi tetap harus berisi lingkup pekerjaan nyata. */
export const PROJECT_MIN_CHARS = 150;

export function isThinContent(body: string, min: number = THIN_CONTENT_CHARS): boolean {
  return body.replace(/\s+/g, " ").trim().length < min;
}

export function checkContent(input: CheckInput): string[] {
  const w: string[] = [];
  const title = (input.seoTitle || input.title).trim();
  const desc = (input.seoDescription ?? "").trim();

  if (!title) w.push("Judul kosong.");
  else if (title.length > 65) w.push("SEO title panjang (>65 karakter) dan berpotensi terpotong di hasil pencarian.");
  if (!desc) w.push("Meta description kosong.");
  else if (desc.length > 160) w.push("Meta description panjang (>160 karakter).");
  else if (desc.length < 70) w.push("Meta description sangat pendek (<70 karakter).");
  if (isThinContent(input.body)) w.push("Konten tergolong tipis; halaman akan diberi noindex sampai diperkaya.");
  if (input.hasImage && !(input.imageAlt ?? "").trim()) w.push("Gambar utama belum punya alt text.");
  if (input.isArticle) {
    if (!input.sources) w.push("Artikel belum mencantumkan sumber/referensi untuk klaim teknis.");
    if (!input.reviewed) w.push("Artikel belum ditinjau penanggung jawab konten (reviewer/tanggal review).");
  }
  return w;
}
