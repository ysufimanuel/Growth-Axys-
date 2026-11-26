import { requireActor } from "../../../../../../../lib/server/auth";
import { isContentType } from "../../../../../../../lib/server/content-schemas";
import { listRevisions } from "../../../../../../../lib/server/content-service";
import { handle, HttpError, json } from "../../../../../../../lib/server/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ type: string; id: string }> };

export const GET = handle(async (req: Request, ctx: Ctx) => {
  const actor = await requireActor(req, { permission: "content.edit" });
  const { type: rawType, id } = await ctx.params;
  if (!isContentType(rawType)) throw new HttpError(404, "Jenis konten tidak dikenal.");
  if (!id) throw new HttpError(400, "ID konten tidak valid.");
  return json({ revisions: await listRevisions(rawType, id), canRestore: actor.role === "superadmin" });
});
