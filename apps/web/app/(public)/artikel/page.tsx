import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "../../../components/PageHero";
import { getArticles } from "../../../lib/data/content";
import { buildMetadata } from "../../../lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const articles = await getArticles();
  return buildMetadata({
    title: "Artikel & Panduan Konstruksi",
    description: "Panduan dan pengetahuan konstruksi dari PT Pillarians Group: perencanaan pekerjaan, biaya renovasi, memilih kontraktor, dan lainnya.",
    path: "/artikel",
    noindex: articles.length === 0,
  });
}

const fmt = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "");

export default async function ArticlesPage() {
  const articles = await getArticles();
  return (
    <>
      <PageHero eyebrow="KNOWLEDGE" title="Artikel & panduan konstruksi." lead="Pengetahuan praktis untuk membantu Anda merencanakan pekerjaan konstruksi." crumbs={[{ name: "Artikel", href: "/artikel" }]} />
      <section className="section">
        <div className="container">
          {articles.length ? (
            <div className="article-list">
              {articles.map((a) => (
                <Link key={a.slug} className="article-card" href={`/artikel/${a.slug}`}>
                  <small>{fmt(a.publishedAt ?? a.updatedAt)}</small>
                  <h3>{a.title}</h3>
                  <p>{a.excerpt}</p>
                  <span className="text-link">BACA ARTIKEL ↗</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-block" role="status">
              Artikel akan segera hadir.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
