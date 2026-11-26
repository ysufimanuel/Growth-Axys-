import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentEditor } from "../../../../../../components/admin/ContentEditor";
import { capsFor, contentTypeOr404, labelOf, requirePageActor } from "../../../../../../lib/server/admin-page";
import { getContent } from "../../../../../../lib/server/content-service";
import { HttpError } from "../../../../../../lib/server/http";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit konten" };

export default async function EditContentPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const actor = await requirePageActor("content.edit");
  const { type: rawType, id } = await params;
  const type = contentTypeOr404(rawType);
  let doc;
  try {
    doc = await getContent(type, id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const l = labelOf(type);
  // Content fields vary by type: projects/services/articles use title; certifications use name.
  const record = doc as Record<string, unknown>;
  const title = String(record.title ?? record.name ?? id);
  return (
    <>
      <div className="adm-pagehead"><div><h1>{title}</h1><p>Edit {l.singular}</p></div></div>
      <ContentEditor type={type} singular={l.singular} doc={doc as never} caps={capsFor(actor.role)} />
    </>
  );
}
