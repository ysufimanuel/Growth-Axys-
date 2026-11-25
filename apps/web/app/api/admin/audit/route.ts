import { requireActor } from "../../../../lib/server/auth";
import { adminDb } from "../../../../lib/server/firebase-admin";
import { handle, json } from "../../../../lib/server/http";

export const runtime = "nodejs";

/** Superadmin saja. Audit log tidak punya endpoint tulis/ubah/hapus. */
export const GET = handle(async (req: Request) => {
  await requireActor(req, { permission: "audit.view" });
  const snap = await adminDb().collection("auditLogs").orderBy("timestamp", "desc").limit(100).get();
  return json({
    items: snap.docs.map((d) => ({ id: d.id, ...d.data(), timestamp: d.get("timestamp")?.toMillis?.() ?? null })),
  });
});
