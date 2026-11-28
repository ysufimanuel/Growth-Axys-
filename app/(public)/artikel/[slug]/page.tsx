import Image from "next/image";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "../../../../components/JsonLd";
import { Media } from "../../../../components/Media";
import { PageHero } from "../../../../components/PageHero";
import { isThinContent } from "../../../../lib/core/content-checks";
import { articleJsonLd } from "../../../../lib/core/jsonld";
import { toParagraphs } from "../../../../lib/core/normalize";
import { findRedirect, getArticle, getArticles } from "../../../../lib/data/content";
import { buildMetadata, excerpt } from "../../../../lib/seo";
import { absoluteUrl, site } from "../../../../lib/site";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { robots: { index: false, follow: false } };
  return buildMetadata({
    title: a.title,
    description: a.excerpt || excerpt(a.content),
    path: `/artikel/${a.slug}`,
    image: a.image || undefined,
    seo: a.seo,
    type: "article",
    publishedTime: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
    modifiedTime: a.updatedAt ? new Date(a.updatedAt).toISOString() : undefined,
    noindex: isThinContent(a.content, 300),
  });
}

const fmt = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "");
const iso = (ms: number | null) => (ms ? new Date(ms).toISOString() : undefined);

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) {
    const rule = await findRedirect(`/artikel/${slug}`);
    if (rule) permanentRedirect(rule.to);
    notFound();
  }

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          headline: a.title,
          description: a.excerpt || undefined,
          url: absoluteUrl(`/artikel/${a.slug}`),
          image: a.image || undefined,
          author: a.authorName || undefined,
          publisher: site.name,
          datePublished: iso(a.publishedAt),
          dateModified: iso(a.updatedAt),
        })}
      />
      <PageHero
        eyebrow="ARTIKEL"
        title={a.title}
        lead={a.excerpt || undefined}
        crumbs={[
          { name: "Artikel", href: "/artikel" },
          { name: a.title, href: `/artikel/${a.slug}` },
        ]}
      />
      <article className="section">
        <div className="container prose" style={{ maxWidth: 780 }}>
          <p className="meta-line">
            {a.authorName ? `Ditulis oleh ${a.authorName}` : site.name}
            {a.publishedAt ? ` · Dipublikasikan ${fmt(a.publishedAt)}` : ""}
            {a.updatedAt && a.updatedAt !== a.publishedAt ? ` · Diperbarui ${fmt(a.updatedAt)}` : ""}
            {a.reviewerName ? ` · Ditinjau oleh ${a.reviewerName}${a.reviewedAt ? ` (${fmt(a.reviewedAt)})` : ""}` : ""}
          </p>
          {a.instagramUrl ? <div style={{ maxWidth: 560, margin: "0 auto 1.5rem", aspectRatio: a.mediaRatio || "4 / 5", overflow: "hidden" }}><Media url={a.instagramUrl} alt={a.title} ratio={a.mediaRatio || "4 / 5"} /></div> : a.image ? (
            <div style={{ position: "relative", aspectRatio: a.mediaRatio || "16 / 9", marginBottom: "1.5rem", overflow: "hidden" }}>
              <Image src={a.image} alt={a.imageAlt || a.title} fill sizes="(max-width: 900px) 100vw, 780px" style={{ objectFit: "cover" }} priority />
            </div>
          ) : null}
          {toParagraphs(a.content).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {a.sources.length ? (
            <>
              <h2>Sumber &amp; referensi</h2>
              <ul className="sources">
                {a.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </article>
    </>
  );
}
