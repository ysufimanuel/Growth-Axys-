import { z } from "zod";
import { requireActor } from "../../../../../lib/server/auth";
import { handle, HttpError, json, rateLimit, readBody } from "../../../../../lib/server/http";

export const runtime = "nodejs";

const inputSchema = z.strictObject({ url: z.string().url().max(2048) });

function normalizeInstagramUrl(raw: string) {
  const url = new URL(raw);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "instagram.com" && host !== "instagr.am") throw new HttpError(400, "Gunakan link instagram.com yang valid.");
  const match = url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?$/);
  if (!match) throw new HttpError(400, "Link harus berupa postingan, Reel, atau video Instagram.");
  return `https://www.instagram.com/${match[1]}/${match[2]}/`;
}

export const POST = handle(async (req: Request) => {
  const actor = await requireActor(req, { permission: "content.edit" });
  rateLimit(`instagram-import:${actor.uid}`, 15, 60_000);
  const input = await readBody(req, inputSchema);
  const url = normalizeInstagramUrl(input.url);
  const token = process.env.INSTAGRAM_OEMBED_TOKEN;
  if (!token) throw new HttpError(503, "Integrasi Instagram belum dikonfigurasi. Tambahkan INSTAGRAM_OEMBED_TOKEN di environment Vercel.", "INSTAGRAM_NOT_CONFIGURED");

  const endpoint = new URL("https://graph.facebook.com/v22.0/instagram_oembed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("access_token", token);
  endpoint.searchParams.set("omitscript", "true");
  const response = await fetch(endpoint, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(10_000) });
  const payload = await response.json().catch(() => null) as null | { title?: string; thumbnail_url?: string; author_name?: string; error?: { message?: string } };
  if (!response.ok || !payload) {
    throw new HttpError(422, payload?.error?.message || "Meta tidak dapat mengambil postingan. Pastikan akun/postingan dapat diakses dan token oEmbed masih berlaku.", "INSTAGRAM_OEMBED_FAILED");
  }
  return json({
    url,
    caption: typeof payload.title === "string" ? payload.title.trim() : "",
    thumbnailUrl: typeof payload.thumbnail_url === "string" && payload.thumbnail_url.startsWith("https://") ? payload.thumbnail_url : "",
    authorName: typeof payload.author_name === "string" ? payload.author_name : "",
  });
});
