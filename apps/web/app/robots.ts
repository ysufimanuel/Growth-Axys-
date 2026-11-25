import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/site";

// Aset dan halaman publik tidak diblokir. Area internal ditutup (dan tetap dilindungi autentikasi).
// Crawler AI tidak diblokir secara khusus: keputusan itu kebijakan bisnis, bukan teknis.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
