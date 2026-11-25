import "server-only";
import { adminDb, isAdminConfigured } from "../server/firebase-admin";
import {
  normalizeArticle,
  normalizeCertification,
  normalizeProject,
  normalizeService,
} from "../core/normalize";
import type { Article, Certification, Project, Service, SiteStats } from "../core/types";
import { seedServices } from "../../content/services";
import { normalizePath, type RedirectRule } from "../core/redirects";

// Semua pembacaan publik terjadi di server (Admin SDK) sehingga Firestore Rules dapat
// menutup tulis dari client dan HTML awal berisi konten (crawler-friendly).
// Saat env belum ada (mis. build/preview tanpa kredensial) fungsi mengembalikan daftar kosong,
// bukan error, dan halaman menampilkan empty state + noindex.

async function readCollection<T>(name: string, map: (id: string, raw: Record<string, unknown>) => T): Promise<T[]> {
  if (!isAdminConfigured()) return [];
  try {
    const snap = await adminDb().collection(name).get();
    return snap.docs.map((d) => map(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    console.error(`[data] gagal membaca koleksi ${name}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

const published = <T extends { publishStatus: string }>(items: T[]) => items.filter((i) => i.publishStatus === "published");

export async function getProjects(): Promise<Project[]> {
  const items = published(await readCollection("projects", normalizeProject));
  return items.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export async function getProject(slug: string): Promise<Project | null> {
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
}

export async function getServices(): Promise<Service[]> {
  const fromDb = published(await readCollection("services", normalizeService)).filter((s) => s.title);
  const slugs = new Set(fromDb.map((s) => s.slug));
  return [...fromDb, ...seedServices.filter((s) => !slugs.has(s.slug))];
}

export async function getService(slug: string): Promise<Service | null> {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

export async function getArticles(): Promise<Article[]> {
  const items = published(await readCollection("articles", normalizeArticle)).filter((a) => a.title);
  return items.sort((a, b) => (b.publishedAt ?? b.updatedAt ?? 0) - (a.publishedAt ?? a.updatedAt ?? 0));
}

export async function getArticle(slug: string): Promise<Article | null> {
  return (await getArticles()).find((a) => a.slug === slug) ?? null;
}

export async function getCertifications(): Promise<Certification[]> {
  return published(await readCollection("certifications", normalizeCertification)).filter((c) => c.name);
}

/** Statistik hanya tampil jika admin mengisinya di Firestore (siteContent/stats). Tidak ada default karangan. */
export async function getStats(): Promise<SiteStats | null> {
  if (!isAdminConfigured()) return null;
  try {
    const snap = await adminDb().collection("siteContent").doc("stats").get();
    if (!snap.exists) return null;
    const d = snap.data() as Record<string, unknown>;
    const n = (v: unknown) => (typeof v === "number" && v >= 0 ? v : undefined);
    const stats = { years: n(d.years), projects: n(d.projects), clients: n(d.clients) };
    return stats.years || stats.projects || stats.clients ? stats : null;
  } catch {
    return null;
  }
}

/** Redirect dinamis dari Redirect Manager (dipakai saat slug berubah). */
export async function findRedirect(path: string): Promise<RedirectRule | null> {
  if (!isAdminConfigured()) return null;
  try {
    const snap = await adminDb().collection("redirects").where("active", "==", true).get();
    const target = normalizePath(path);
    const rule = snap.docs.map((d) => d.data() as RedirectRule).find((r) => normalizePath(r.from) === target);
    return rule ?? null;
  } catch {
    return null;
  }
}
