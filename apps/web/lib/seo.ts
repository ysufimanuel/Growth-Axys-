import type { Metadata } from "next";
import { absoluteUrl, site } from "./site";
import type { SeoFields } from "./core/types";

interface MetaInput {
  title: string; // tanpa nama perusahaan; template layout menambahkannya
  description: string;
  path: string; // path canonical, mis. "/layanan/mep"
  image?: string;
  noindex?: boolean;
  seo?: SeoFields; // override dari CMS
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

/** Metadata per halaman: title, description, canonical, Open Graph, robots. */
export function buildMetadata(i: MetaInput): Metadata {
  const title = i.seo?.title || i.title;
  const description = i.seo?.description || i.description;
  const canonical = i.seo?.canonical || absoluteUrl(i.path);
  const noindex = i.noindex || i.seo?.noindex === true;
  const image = i.seo?.ogImage || i.image;

  return {
    title,
    description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: title.includes(site.name) ? title : `${title} | ${site.name}`,
      description,
      url: canonical,
      siteName: site.name,
      locale: site.locale,
      type: i.type ?? "website",
      ...(image ? { images: [{ url: image }] } : {}),
      ...(i.type === "article" ? { publishedTime: i.publishedTime, modifiedTime: i.modifiedTime } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

/** Potong deskripsi di batas kata untuk meta description (~155 karakter). */
export function excerpt(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[.,;:\s]+$/, "")}…`;
}
