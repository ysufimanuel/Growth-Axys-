import type { Metadata } from "next";
import { ContentEditor } from "../../../../../../components/admin/ContentEditor";
import { capsFor, contentTypeOr404, labelOf, requirePageActor } from "../../../../../../lib/server/admin-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Konten baru" };

export default async function NewContentPage({ params }: { params: Promise<{ type: string }> }) {
  const actor = await requirePageActor("content.edit");
  const type = contentTypeOr404((await params).type);
  const l = labelOf(type);
  return (
    <>
      <div className="adm-pagehead"><div><h1>{l.plural}: baru</h1></div></div>
      <ContentEditor type={type} singular={l.singular} doc={null} caps={capsFor(actor.role)} />
    </>
  );
}
