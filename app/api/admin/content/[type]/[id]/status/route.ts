import { requireActor } from "../../../../../../../lib/server/auth";
import { isContentType, statusSchema } from "../../../../../../../lib/server/content-schemas";
import { setStatus } from "../../../../../../../lib/server/content-service";
import { handle, HttpError, json, rateLimit, readBody } from "../../../../../../../lib/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ type: string; id: string }> };

/** Draft / published / archived. Izin spesifik per transisi dicek di content-service. */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const actor = await requireActor(req, { permission: "dashboard.view" });
  rateLimit(`status:${actor.uid}`, 60, 60_000);
  const { type, id } = await ctx.params;
  if (!isContentType(type)) throw new HttpError(404, "Jenis konten tidak dikenal.");
  const { to } = await readBody(req, statusSchema);
  return json(await setStatus(actor, type, id, to));
});
