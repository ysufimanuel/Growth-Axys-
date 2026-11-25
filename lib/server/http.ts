import "server-only";
import type { ZodType } from "zod";
import { AdminNotConfiguredError } from "./firebase-admin";

export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Bungkus handler: ubah error menjadi JSON tanpa membocorkan stack trace/detail internal. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message, code: error.code }, error.status);
      if (error instanceof AdminNotConfiguredError) return json({ error: "Layanan belum dikonfigurasi." }, 503);
      console.error("[api] kesalahan tak terduga:", error instanceof Error ? error.message : "unknown");
      return json({ error: "Terjadi kesalahan pada server." }, 500);
    }
  };
}

const MAX_BODY_BYTES = 256 * 1024;

/** Baca body JSON dengan batas ukuran, lalu validasi dengan zod. */
export async function readBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, "Body terlalu besar.");
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, "Body terlalu besar.");
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "Body bukan JSON yang valid.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path?.length ? `${first.path.join(".")}: ` : "";
    throw new HttpError(400, `Input tidak valid. ${where}${first?.message ?? ""}`.trim(), "VALIDATION");
  }
  return parsed.data;
}

// ---- Rate limit ----
// In-memory per instance: pengaman dasar saja. Di Vercel, tiap instance serverless punya memori
// sendiri, jadi ini TIDAK menggantikan Vercel Firewall rate limiting / Upstash untuk produksi.
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
  } else if (++b.count > limit) {
    throw new HttpError(429, "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.");
  }
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
