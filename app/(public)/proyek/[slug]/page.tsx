import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Media } from "../../../../components/Media";
import { PageHero } from "../../../../components/PageHero";
import { isThinContent, PROJECT_MIN_CHARS } from "../../../../lib/core/content-checks";
import { toParagraphs } from "../../../../lib/core/normalize";
import { findRedirect, getProject, getProjects } from "../../../../lib/data/content";
import { buildMetadata, excerpt } from "../../../../lib/seo";
import { site, whatsappLink } from "../../../../lib/site";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { robots: { index: false, follow: false } };
  const desc = p.scope || `${p.category} ${p.location}`.trim() || `Dokumentasi proyek ${p.title}`;
  return buildMetadata({
    title: p.title,
    description: excerpt(desc),
    path: `/proyek/${p.slug}`,
    image: p.cover.startsWith("https://") && /\.(jpe?g|png|webp)(\?|$)|images\.unsplash\.com/i.test(p.cover) ? p.cover : undefined,
    seo: p.seo,
    noindex: isThinContent(p.scope, PROJECT_MIN_CHARS),
  });
}

function Fact({ label, value }: { label: string; value: string }) {
  if (!value || /^tidak dipublikasikan$/i.test(value)) return null;
  return (
    <div>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) {
    const rule = await findRedirect(`/proyek/${slug}`);
    if (rule) permanentRedirect(rule.to);
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow="PROJECT DETAIL"
        title={p.title}
        lead={[p.category, p.location].filter(Boolean).join(" · ") || undefined}
        crumbs={[
          { name: "Proyek", href: "/proyek" },
          { name: p.title, href: `/proyek/${p.slug}` },
        ]}
      />
      <section className="section">
        <div className="container">
          <div className="detail-layout">
            <div>
              {p.instagramUrl || p.cover ? (
                <div className="detail-cover media-frame">
                  <Media url={p.instagramUrl || p.cover} alt={`Media proyek ${p.title}`} className="detail-media-element" priority ratio={p.mediaRatio || "16 / 10"} autoplay={p.mediaSettings.autoplay} muted={p.mediaSettings.muted} sizes="(max-width: 900px) 100vw, 65vw" />
                </div>
              ) : null}
              <div className="detail-description prose">
                <span className="eyebrow">PROJECT OVERVIEW</span>
                <h2>Lingkup pekerjaan</h2>
                {p.scope ? toParagraphs(p.scope).map((t, i) => <p key={i}>{t}</p>) : <p>Deskripsi lingkup pekerjaan belum tersedia.</p>}
                {p.gallery.length > 0 ? (
                  <>
                    <h3>Dokumentasi pekerjaan</h3>
                    <div className="gallery-grid">
                      {p.gallery.map((url, i) => (
                        <Media key={`${url}-${i}`} url={url} alt={`Dokumentasi proyek ${p.title} ${i + 1}`} className="gallery-media-element" ratio="4 / 3" sizes="(max-width: 900px) 50vw, 25vw" autoplay={p.mediaSettings.autoplay} muted={p.mediaSettings.muted} />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <aside className="project-facts">
              <span className="eyebrow">PROJECT INFORMATION</span>
              <Fact label="PEMILIK PROYEK" value={p.owner} />
              <Fact label="LOKASI" value={p.location} />
              <Fact label="TAHUN" value={p.year ? String(p.year) : ""} />
              <Fact label="KATEGORI" value={p.category} />
              <Fact label="STATUS" value={p.progress} />
              <Fact label="NILAI PROYEK" value={p.value} />
              <a className="btn btn-orange" href={whatsappLink(`Halo ${site.name}, saya tertarik dengan proyek seperti "${p.title}".`)} target="_blank" rel="noopener noreferrer">
                DISKUSIKAN PROYEK SERUPA ↗
              </a>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
