import { requireActor } from "../../../../lib/server/auth";
import { listAccounts } from "../../../../lib/server/accounts";
import { handle, json } from "../../../../lib/server/http";

export const runtime = "nodejs";

/** Superadmin saja: daftar akun admin. */
export const GET = handle(async (req: Request) => {
  await requireActor(req, { permission: "users.manage" });
  return json(await listAccounts());
});
