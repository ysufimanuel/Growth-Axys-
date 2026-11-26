import "server-only";
import { toMillis } from "../core/normalize";
import { adminDb } from "./firebase-admin";
import { CONTENT_TYPES, type ContentType } from "./content-schemas";

type Status = "draft" | "published" | "archived";
const statusOf = (v: unknown): Status => (v === "draft" || v === "archived" ? v : "published"); // legacy tanpa field = published

export interface TypeCounts { type: ContentType; draft: number; published: number; archived: number; total: number }
export interface RecentItem { type: ContentType; id: string; title: string; status: Status; updatedAt: number | null }
export interface ActivityItem { id: string; action: string; targetType: string; summary: string; actorRole: string | null; timestamp: number | null }

/** Hasil per bagian: jika gagal, kembalikan error (UI menampilkan error, BUKAN angka 0 palsu). */
export type Part<T> = { ok: true; data: T } | { ok: false };

export async function loadCounts(): Promise<Part<TypeCounts[]>> {
  try {
    const db = adminDb();
    const data = await Promise.all(
      CONTENT_TYPES.map(async (type) => {
        const snap = await db.collection(type).select("publishStatus").get();
        const c = { draft: 0, published: 0, archived: 0 };
        for (const d of snap.docs) c[statusOf(d.get("publishStatus"))]++;
        return { type, ...c, total: snap.size };
      }),
    );
    return { ok: true, data };
  } catch (e) {
    console.error("[dashboard] gagal memuat hitungan:", e instanceof Error ? e.message : "unknown");
    return { ok: false };
  }
}

export async function loadRecent(limit = 6): Promise<Part<RecentItem[]>> {
  try {
    const db = adminDb();
    const lists = await Promise.all(
      CONTENT_TYPES.map(async (type) => {
        const snap = await db.collection(type).orderBy("updatedAt", "desc").limit(limit).get();
        return snap.docs.map((d) => ({
          type,
          id: d.id,
          title: String(d.get("title") ?? d.get("name") ?? "(tanpa judul)"),
          status: statusOf(d.get("publishStatus")),
          updatedAt: toMillis(d.get("updatedAt")),
        }));
      }),
    );
    return { ok: true, data: lists.flat().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)).slice(0, limit) };
  } catch (e) {
    console.error("[dashboard] gagal memuat konten terbaru:", e instanceof Error ? e.message : "unknown");
    return { ok: false };
  }
}

export async function loadActivity(limit = 8): Promise<Part<ActivityItem[]>> {
  try {
    const snap = await adminDb().collection("auditLogs").orderBy("timestamp", "desc").limit(limit).get();
    return {
      ok: true,
      data: snap.docs.map((d) => ({
        id: d.id,
        action: String(d.get("action") ?? ""),
        targetType: String(d.get("targetType") ?? ""),
        summary: String(d.get("summary") ?? ""),
        actorRole: (d.get("actorRole") as string | null) ?? null,
        timestamp: toMillis(d.get("timestamp")),
      })),
    };
  } catch (e) {
    console.error("[dashboard] gagal memuat aktivitas:", e instanceof Error ? e.message : "unknown");
    return { ok: false };
  }
}
