import type { Metadata } from "next";
import { BackupManager } from "../../../../components/admin/BackupManager";
import { requirePageActor } from "../../../../lib/server/admin-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Backup & Restore" };

export default async function BackupPage() {
  await requirePageActor("backup.restore");
  return (
    <>
      <div className="adm-pagehead">
        <div><h1>Backup & Restore</h1><p>Ekspor dan pulihkan data operasional Firestore.</p></div>
      </div>
      <BackupManager projectId={process.env.FIREBASE_PROJECT_ID ?? ""} />
    </>
  );
}
