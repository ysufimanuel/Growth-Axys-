import type { Metadata } from "next";
import { AuditLog } from "../../../../components/admin/AuditLog";
import { requirePageActor } from "../../../../lib/server/admin-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage() {
  await requirePageActor("audit.view");
  return (
    <>
      <div className="adm-pagehead">
        <div><h1>Audit log</h1><p>Riwayat tindakan administrasi yang dicatat oleh server. Log tidak dapat diedit atau dihapus dari dashboard.</p></div>
      </div>
      <AuditLog />
    </>
  );
}
