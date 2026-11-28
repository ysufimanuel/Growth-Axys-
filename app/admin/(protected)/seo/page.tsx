import Link from "next/link";
import { requirePageActor } from "../../../../lib/server/admin-page";
import { adminDb } from "../../../../lib/server/firebase-admin";
import { CONTENT_TYPES, type ContentType } from "../../../../lib/server/content-schemas";
import { LiquidGlass } from "../../../../components/admin/liquid-glass";

export const dynamic = "force-dynamic";

const labels: Record<ContentType, string> = { projects: "Proyek", services: "Layanan", articles: "Artikel", certifications: "Sertifikasi" };

export default async function PageSeoPage() {
  await requirePageActor("seo.page");
  const groups = await Promise.all(CONTENT_TYPES.map(async (type) => {
    const snap = await adminDb().collection(type).get();
    return { type, rows: snap.docs.map((doc) => {
      const data = doc.data();
      const seo = (data.seo ?? {}) as Record<string, unknown>;
      return { id: doc.id, title: String(data.title ?? data.name ?? doc.id), slug: String(data.slug ?? doc.id), seoTitle: String(seo.title ?? ""), description: String(seo.description ?? ""), ogImage: String(seo.ogImage ?? "") };
    }) };
  }));
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const complete = groups.reduce((n, g) => n + g.rows.filter((r) => r.seoTitle.trim() && r.description.trim()).length, 0);
  return <>
    <div className="adm-pagehead"><div><h1>SEO halaman</h1><p>Tinjau metadata konten dan buka editor untuk mengubah judul, deskripsi, serta gambar Open Graph. Canonical/noindex hanya untuk Superadmin.</p></div></div>
    <div className="adm-grid adm-grid-kpi">
      <LiquidGlass as="article" className="adm-card adm-stat"><span className="adm-stat-label">Total konten</span><strong className="adm-stat-value">{total}</strong></LiquidGlass>
      <LiquidGlass as="article" className="adm-card adm-stat"><span className="adm-stat-label">Metadata lengkap</span><strong className="adm-stat-value">{complete}</strong></LiquidGlass>
      <LiquidGlass as="article" className="adm-card adm-stat"><span className="adm-stat-label">Perlu dilengkapi</span><strong className="adm-stat-value">{total - complete}</strong></LiquidGlass>
    </div>
    {groups.map(({ type, rows }) => <LiquidGlass as="section" className="adm-card adm-seo-group" key={type}>
      <h2>{labels[type]}</h2>
      {rows.length === 0 ? <p className="adm-hint">Belum ada konten.</p> : <div className="adm-tablewrap"><table className="adm-table">
        <thead><tr><th>Konten</th><th>Judul SEO</th><th>Deskripsi</th><th>Open Graph</th><th>Aksi</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>
          <td><strong>{row.title}</strong><small className="adm-users-name">/{type === "projects" ? "proyek" : type === "services" ? "layanan" : type === "articles" ? "artikel" : "sertifikasi"}/{row.slug}</small></td>
          <td>{row.seoTitle || <span className="adm-seo-missing">Belum diisi</span>}</td>
          <td>{row.description || <span className="adm-seo-missing">Belum diisi</span>}</td>
          <td>{row.ogImage ? "Tersedia" : "Belum diisi"}</td>
          <td><Link className="adm-btn adm-btn-sm" href={type === "certifications" ? `/admin/content/certifications/${row.id}` : `/admin/content/${type}/${row.id}`}>Edit SEO</Link></td>
        </tr>)}</tbody>
      </table></div>}
    </LiquidGlass>)}
    <p className="adm-hint">Angka dihitung dari dokumen Firestore saat halaman dimuat. Ini adalah audit metadata tersimpan, bukan laporan peringkat atau indeks Google.</p>
  </>;
}
