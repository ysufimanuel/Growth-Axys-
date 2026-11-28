// Seed layanan dimigrasikan dari services.html (versi vanilla).
// Teks asli hanya ringkasan generik; BELUM diverifikasi terhadap KBLI/SBU perusahaan.
// Layanan di Firestore (koleksi `services`) dengan slug sama akan menggantikan seed ini.
// Halaman detail dengan konten tipis otomatis noindex sampai diperkaya (lihat content-checks.ts).
import type { Service } from "../lib/core/types";

const base = { publishStatus: "published" as const, seo: {}, updatedAt: null, instagramUrl: "", mediaRatio: "4 / 5" };

export const seedServices: Service[] = [
  {
    ...base,
    id: "seed-konstruksi-gedung",
    slug: "konstruksi-gedung",
    title: "Konstruksi Gedung",
    summary:
      "Pembangunan gedung komersial, perkantoran, fasilitas pendidikan, fasilitas publik, dan bangunan pendukung.",
    content:
      "Pekerjaan pembangunan gedung komersial, perkantoran, fasilitas pendidikan, fasilitas publik, dan bangunan pendukung. Pelaksanaan dimulai dari koordinasi teknis, persiapan lokasi, pekerjaan struktur, arsitektur, hingga penyelesaian.",
    bullets: ["Pembangunan gedung baru", "Pekerjaan struktur dan arsitektur", "Bangunan komersial dan fasilitas publik"],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Konstruksi gedung",
  },
  {
    ...base,
    id: "seed-jalan-infrastruktur",
    slug: "jalan-infrastruktur",
    title: "Jalan & Infrastruktur",
    summary: "Pekerjaan infrastruktur kawasan yang mendukung aksesibilitas, konektivitas, dan fungsi lingkungan.",
    content:
      "Pekerjaan infrastruktur kawasan yang mendukung aksesibilitas, konektivitas, dan fungsi lingkungan. Lingkup pekerjaan mengikuti spesifikasi teknis dan ketentuan proyek.",
    bullets: ["Pekerjaan jalan dan perkerasan", "Drainase dan saluran", "Penataan infrastruktur kawasan"],
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02d?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Pekerjaan infrastruktur",
  },
  {
    ...base,
    id: "seed-renovasi-interior",
    slug: "renovasi-interior",
    title: "Renovasi & Interior",
    summary: "Peningkatan kualitas ruang dan bangunan melalui pembaruan fungsi, tata ruang, material, dan interior.",
    content:
      "Peningkatan kualitas ruang dan bangunan melalui pembaruan fungsi, tata ruang, material, serta penyelesaian interior.",
    bullets: ["Renovasi bangunan", "Fit-out ruang kantor dan komersial", "Pekerjaan finishing"],
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Renovasi dan interior",
  },
  {
    ...base,
    id: "seed-mep",
    slug: "mep",
    title: "Mekanikal, Elektrikal & Plumbing (MEP)",
    summary: "Integrasi sistem pendukung bangunan untuk memastikan fungsi, kenyamanan, dan keselamatan operasional.",
    content:
      "Integrasi sistem pendukung bangunan untuk memastikan fungsi, kenyamanan, dan keselamatan operasional.",
    bullets: ["Instalasi elektrikal", "Sistem plumbing dan sanitasi", "Pekerjaan mekanikal sesuai lingkup"],
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Instalasi elektrikal",
  },
];
