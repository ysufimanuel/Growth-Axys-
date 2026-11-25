import { requireActor } from "../../../../../../lib/server/auth";
import { isContentType, updateSchema } from "../../../../../../lib/server/content-schemas";
import { deleteContent, getContent, updateContent } from "../../../../../../lib/server/content-service";
import { handle, HttpError, json, rateLimit, readBody } from "../../../../../../lib/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ type: string; id: string }> };

async function parse(ctx: Ctx) {
  const { type, id } = await ctx.params;
  if (!isContentType(type)) throw new HttpError(404, "Jenis konten tidak dikenal.");
  return { type, id };
}

export const GET = handle(async (req: Request, ctx: Ctx) => {
  await requireActor(req, { permission: "content.preview" });
  const { type, id } = await parse(ctx);
  return json(await getContent(type, id));
});

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const actor = await requireActor(req, { permission: "content.edit" });
  rateLimit(`content:${actor.uid}`, 60, 60_000);
  const { type, id } = await parse(ctx);
  const input = await readBody(req, updateSchema(type));
  return json(await updateContent(actor, type, id, input as Record<string, unknown>));
});

/** Hapus permanen: Superadmin saja, dan hanya untuk konten yang sudah diarsipkan. */
export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  const actor = await requireActor(req, { permission: "content.delete" });
  const { type, id } = await parse(ctx);
  return json(await deleteContent(actor, type, id));
});
