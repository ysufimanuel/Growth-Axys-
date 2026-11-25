// Redirect permanen dari URL versi vanilla yang sudah live ke URL baru.
// Dipakai next.config.ts (tanpa dependensi supaya aman dimuat saat build config).

export interface LegacyRedirect {
  source: string;
  destination: string;
  permanent: true;
  has?: { type: "query"; key: string; value?: string }[];
}

export const legacyRedirects: LegacyRedirect[] = [
  // Detail proyek lama memakai query ?id=<docId>. docId dipertahankan sebagai slug.
  {
    source: "/project-detail.html",
    has: [{ type: "query", key: "id", value: "(?<id>[A-Za-z0-9_-]+)" }],
    destination: "/proyek/:id",
    permanent: true,
  },
  { source: "/project-detail.html", destination: "/proyek", permanent: true },
  { source: "/index.html", destination: "/", permanent: true },
  { source: "/about.html", destination: "/tentang-kami", permanent: true },
  { source: "/about", destination: "/tentang-kami", permanent: true },
  { source: "/services.html", destination: "/layanan", permanent: true },
  { source: "/services", destination: "/layanan", permanent: true },
  { source: "/projects.html", destination: "/proyek", permanent: true },
  { source: "/projects", destination: "/proyek", permanent: true },
  { source: "/certifications.html", destination: "/sertifikasi", permanent: true },
  { source: "/certifications", destination: "/sertifikasi", permanent: true },
  { source: "/contact.html", destination: "/kontak", permanent: true },
  { source: "/contact", destination: "/kontak", permanent: true },
  { source: "/login.html", destination: "/admin/login", permanent: true },
  { source: "/login", destination: "/admin/login", permanent: true },
  { source: "/admin/login.html", destination: "/admin/login", permanent: true },
  { source: "/admin/index.html", destination: "/admin/dashboard", permanent: true },
];
