import type { Metadata } from "next";
import { MediaLibrary } from "../../../../components/admin/MediaLibrary";
import { requirePageActor } from "../../../../lib/server/admin-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage() {
  await requirePageActor("media.manage");
  return <>
    <div className="adm-pagehead"><div><h1>Media Library</h1><p>Unggah dan kelola aset gambar untuk konten Pillarians Group.</p></div></div>
    <MediaLibrary />
  </>;
}
