import type { Metadata } from "next";
import { GlobalSeoSettings } from "../../../../../components/admin/GlobalSeoSettings";
import { requirePageActor } from "../../../../../lib/server/admin-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "SEO global" };

export default async function GlobalSeoPage() {
  await requirePageActor("seo.global");
  return <>
    <div className="adm-pagehead"><div><h1>SEO global</h1><p>Atur metadata dasar, Open Graph, dan kebijakan index/follow untuk situs.</p></div></div>
    <GlobalSeoSettings />
  </>;
}
