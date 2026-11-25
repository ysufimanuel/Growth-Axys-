export type PublishStatus = "draft" | "published" | "archived";

export interface SeoFields {
  title?: string;
  description?: string;
  canonical?: string; // hanya Superadmin
  noindex?: boolean; // hanya Superadmin
  ogImage?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  location: string;
  year: number | null;
  category: string; // Gedung | Infrastruktur | Renovasi | MEP
  progress: string; // Selesai | Berjalan
  owner: string;
  value: string;
  scope: string; // deskripsi lingkup pekerjaan (teks polos, paragraf dipisah baris kosong)
  cover: string;
  gallery: string[];
  mediaSettings: { autoplay: boolean; muted: boolean };
  publishStatus: PublishStatus;
  seo: SeoFields;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  publishStatus: PublishStatus;
  seo: SeoFields;
  updatedAt: number | null;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  imageAlt: string;
  authorName: string;
  reviewerName: string;
  reviewedAt: number | null;
  factChecked: boolean;
  sources: { title: string; url: string }[];
  publishStatus: PublishStatus;
  seo: SeoFields;
  publishedAt: number | null;
  updatedAt: number | null;
}

export interface Certification {
  id: string;
  name: string;
  number: string;
  issuer: string;
  validUntil: string;
  publicDocument: string;
  publishStatus: PublishStatus;
  updatedAt: number | null;
}

export interface SiteStats {
  years?: number;
  projects?: number;
  clients?: number;
}
