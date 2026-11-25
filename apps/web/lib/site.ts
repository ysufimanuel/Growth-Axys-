// Konfigurasi identitas situs. Hanya data yang sudah ada di situs live yang dimasukkan.
// Nilai `null` = belum diverifikasi/belum boleh dipublikasikan -> TIDAK ditampilkan
// dan tidak masuk structured data. Isi setelah perusahaan memverifikasi datanya.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pillarians-group.vercel.app").replace(/\/+$/, "");

export const site = {
  name: "PT Pillarians Group",
  shortName: "Pillarians Group",
  tagline: "Solusi Konstruksi & Infrastruktur",
  description:
    "PT Pillarians Group menyediakan layanan konstruksi gedung, infrastruktur, renovasi, dan MEP dengan standar mutu, keselamatan, dan ketepatan waktu.",
  locale: "id_ID",
  // Dari situs vanilla yang sudah live (assets/js/main.js & contact.html).
  whatsapp: "628138744366",
  phoneDisplay: "+62 813-8744-366",
  phoneE164: "+628138744366",
  email: "info@growthaxys.co.id", // TODO: konfirmasi domain email resmi (situs lama memakai growthaxys.co.id)
  // Belum ada data resmi di repo: jangan diisi dengan placeholder.
  address: null as { street: string; city: string; country: string } | null,
  legal: { nib: null as string | null, sbu: null as string | null, npwp: null as string | null },
  foundedYear: null as number | null,
  logoUrl: null as string | null,
  socials: [] as string[],
};

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const nav = [
  { href: "/", label: "Beranda" },
  { href: "/tentang-kami", label: "Tentang Kami" },
  { href: "/layanan", label: "Layanan" },
  { href: "/proyek", label: "Proyek" },
  { href: "/artikel", label: "Artikel" },
  { href: "/sertifikasi", label: "Sertifikasi" },
  { href: "/kontak", label: "Kontak" },
] as const;
