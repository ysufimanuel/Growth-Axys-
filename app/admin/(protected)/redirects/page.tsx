import type { Metadata } from "next";
import { RedirectManager } from "../../../../components/admin/RedirectManager";
import { requirePageActor } from "../../../../lib/server/admin-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Redirect" };

export default async function RedirectsPage() {
  await requirePageActor("redirects.manage");
  return <>
    <div className="adm-pagehead"><div><h1>Redirect</h1><p>Kelola pemetaan URL lama ke tujuan baru. Redirect permanen dapat memengaruhi indeks mesin pencari.</p></div></div>
    <RedirectManager />
  </>;
}
