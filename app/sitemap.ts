import type { MetadataRoute } from "next";
import { getArticles, getCertifications, getProjects, getServices } from "../lib/data/content";
import { isThinContent, PROJECT_MIN_CHARS } from "../lib/core/content-checks";
import { absoluteUrl } from "../lib/site";

export const revalidate = 3600;

const date = (ms: number | null) => (ms ? new Date(ms) : undefined);

/**
 * Hanya URL canonical yang layak diindeks. Draft/archived tidak ada di sini karena data
 * dibaca dengan filter published. `lastModified` hanya diisi bila ada tanggal perubahan nyata.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, articles, certs] = await Promise.all([getServices(), getProjects(), getArticles(), getCertifications()]);

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/tentang-kami"), changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/layanan"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/kontak"), changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/kebijakan-privasi"), changeFrequency: "yearly", priority: 0.2 },
  ];

  for (const s of services) {
    if (s.seo.noindex || isThinContent(s.content)) continue; // selaras dengan robots halaman detail
    entries.push({ url: absoluteUrl(`/layanan/${s.slug}`), lastModified: date(s.updatedAt), priority: 0.8 });
  }
  if (projects.length) {
    entries.push({ url: absoluteUrl("/proyek"), changeFrequency: "monthly", priority: 0.8 });
    for (const p of projects) {
      if (p.seo.noindex || isThinContent(p.scope, PROJECT_MIN_CHARS)) continue; // selaras dengan robots halaman detail
      entries.push({ url: absoluteUrl(`/proyek/${p.slug}`), lastModified: date(p.updatedAt), priority: 0.7 });
    }
  }
  if (articles.length) {
    entries.push({ url: absoluteUrl("/artikel"), changeFrequency: "weekly", priority: 0.7 });
    for (const a of articles) {
      if (a.seo.noindex) continue;
      entries.push({ url: absoluteUrl(`/artikel/${a.slug}`), lastModified: date(a.updatedAt ?? a.publishedAt), priority: 0.6 });
    }
  }
  if (certs.length) entries.push({ url: absoluteUrl("/sertifikasi"), changeFrequency: "yearly", priority: 0.5 });

  return entries;
}
