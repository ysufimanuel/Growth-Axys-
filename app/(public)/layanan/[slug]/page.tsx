import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "../../../../components/JsonLd";
import { Media } from "../../../../components/Media";
import { PageHero } from "../../../../components/PageHero";
import { isThinContent } from "../../../../lib/core/content-checks";
import { serviceJsonLd } from "../../../../lib/core/jsonld";
import { toParagraphs } from "../../../../lib/core/normalize";
import { findRedirect, getService, getServices } from "../../../../lib/data/content";
import { buildMetadata, excerpt } from "../../../../lib/seo";
import { absoluteUrl, site, whatsappLink } from "../../../../lib/site";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return { robots: { index: false, follow: false } };
  return buildMetadata({
    title: s.title,
    description: excerpt(s.summary || s.content),
    path: `/layanan/${s.slug}`,
    image: s.image || undefined,
    seo: s.seo,
    // Halaman tipis tidak diindeks sampai kontennya diperkaya (spec: hindari konten tipis).
    noindex: isThinContent(s.content),
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) {
    const rule = await findRedirect(`/layanan/${slug}`);
    if (rule) permanentRedirect(rule.to);
    notFound();
  }
  const url = absoluteUrl(`/layanan/${s.slug}`);
  const paragraphs = toParagraphs(s.content);

  return (
    <>
      <JsonLd data={serviceJsonLd({ name: s.title, description: excerpt(s.summary || s.content, 300), url, provider: site.name, image: s.image || undefined })} />
      <PageHero
        eyebrow="LAYANAN"
        title={s.title}
        lead={s.summary || undefined}
        crumbs={[
          { name: "Layanan", href: "/layanan" },
          { name: s.title, href: `/layanan/${s.slug}` },
        ]}
      />
      <section className="section">
        <div className="container detail-layout">
          <div className="prose">
            {s.instagramUrl ? <div style={{ maxWidth: 560, marginBottom: "1.5rem", aspectRatio: s.mediaRatio || "4 / 5", overflow: "hidden" }}><Media url={s.instagramUrl} alt={s.title} ratio={s.mediaRatio || "4 / 5"} /></div> : s.image ? (
              <div style={{ position: "relative", aspectRatio: s.mediaRatio || "16 / 9", marginBottom: "1.5rem", overflow: "hidden" }}>
                <Image src={s.image} alt={s.imageAlt || s.title} fill sizes="(max-width: 900px) 100vw, 60vw" style={{ objectFit: "cover" }} priority />
              </div>
            ) : null}
            <h2>Ruang lingkup</h2>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {s.bullets.length ? (
              <ul>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <aside className="project-facts">
            <span className="eyebrow">KONSULTASI</span>
            <p>Diskusikan lingkup dan kebutuhan proyek Anda dengan tim kami.</p>
            <a className="btn btn-orange" href={whatsappLink(`Halo ${site.name}, saya ingin konsultasi layanan ${s.title}.`)} target="_blank" rel="noopener noreferrer">
              KONSULTASI VIA WHATSAPP ↗
            </a>
            <p>
              <Link href="/proyek">Lihat portofolio proyek</Link> · <Link href="/layanan">Semua layanan</Link>
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
