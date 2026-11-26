import { requireActor } from "../../../../../../../../lib/server/auth";
import { isContentType } from "../../../../../../../../lib/server/content-schemas";
import { restoreRevision } from "../../../../../../../../lib/server/content-service";
import { handle, HttpError, json } from "../../../../../../../../lib/server/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ type: string; id: string; revisionId: string }> };

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const actor = await requireActor(req, { permission: "backup.restore" });
  const { type: rawType, id, revisionId } = await ctx.params;
  if (!isContentType(rawType)) throw new HttpError(404, "Jenis konten tidak dikenal.");
  if (!id || !revisionId) throw new HttpError(400, "ID revisi tidak valid.");
  return json(await restoreRevision(actor, rawType, id, revisionId));
});
