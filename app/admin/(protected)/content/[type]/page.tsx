import type { Metadata } from "next";
import Link from "next/link";
import { ContentList } from "../../../../../components/admin/ContentList";
import { contentTypeOr404, labelOf, requirePageActor } from "../../../../../lib/server/admin-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  return { title: labelOf(contentTypeOr404(type)).plural };
}

const STATUSES = ["all", "draft", "published", "archived"] as const;

export default async function ContentListPage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<{ status?: string | string[] }> }) {
  await requirePageActor("content.edit");
  const type = contentTypeOr404((await params).type);
  // Tautan dari dashboard (?status=draft): hanya nilai yang dikenal yang dipakai.
  const raw = (await searchParams).status;
  const initialStatus = STATUSES.find((x) => x === raw) ?? "all";
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
      <ContentList type={type} singular={l.singular} initialStatus={initialStatus} />
    </>
  );
}
