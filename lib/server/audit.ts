import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import type { Actor } from "./auth";

/**
 * Ditulis hanya oleh server tepercaya (rules menolak tulis dari client).
 * `summary` harus ringkas dan aman: jangan masukkan token, password, link, atau data pribadi berlebihan.
 */
export async function writeAudit(
  actor: Pick<Actor, "uid" | "role"> | { uid: string; role?: string },
  action: string,
  targetType: string,
  targetId: string,
  summary?: string,
): Promise<void> {
  try {
    await adminDb()
      .collection("auditLogs")
      .add({
        actorUid: actor.uid,
        actorRole: actor.role ?? null,
        action,
        targetType,
        targetId,
        summary: (summary ?? "").slice(0, 300),
        timestamp: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    // Kegagalan audit tidak boleh diam-diam: catat di log server agar terlihat di Vercel logs.
    console.error("[audit] gagal menulis audit log:", action, error instanceof Error ? error.message : "unknown");
  }
}
