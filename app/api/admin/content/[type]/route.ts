import { requireActor } from "../../../../../lib/server/auth";
import { createSchema, isContentType } from "../../../../../lib/server/content-schemas";
import { createContent, listContent } from "../../../../../lib/server/content-service";
import { parseListQuery } from "../../../../../lib/core/content-query";
import { handle, HttpError, json, rateLimit, readBody } from "../../../../../lib/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ type: string }> };

async function typeOf(ctx: Ctx) {
  const { type } = await ctx.params;
  if (!isContentType(type)) throw new HttpError(404, "Jenis konten tidak dikenal.");
  return type;
}

export const GET = handle(async (req: Request, ctx: Ctx) => {
  await requireActor(req, { permission: "dashboard.view" });
  const params = new URL(req.url).searchParams;
  return json(await listContent(await typeOf(ctx), parseListQuery(params)));
});

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const actor = await requireActor(req, { permission: "content.edit" });
  rateLimit(`content:${actor.uid}`, 60, 60_000);
  const type = await typeOf(ctx);
  const input = await readBody(req, createSchema(type));
  return json(await createContent(actor, type, input as Record<string, unknown>), 201);
});
