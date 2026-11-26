import type { Metadata } from "next";
import Link from "next/link";
import { ContentList } from "../../../../../components/admin/ContentList";
import { contentTypeOr404, labelOf, requirePageActor } from "../../../../../lib/server/admin-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  return { title: labelOf(contentTypeOr404(type)).plural };
}

export default async function ContentListPage({ params }: { params: Promise<{ type: string }> }) {
  await requirePageActor("content.edit");
  const type = contentTypeOr404((await params).type);
  const l = labelOf(type);
  return (
    <>
      <div className="adm-pagehead">
        <div>
          <h1>{l.plural}</h1>
          <p>Kelola {l.singular}. Konten baru selalu berstatus draft sampai diterbitkan.</p>
        </div>
        <Link className="adm-btn adm-btn-primary" href={`/admin/content/${type}/new`}>+ Baru</Link>
      </div>
      <ContentList type={type} singular={l.singular} />
    </>
  );
}
