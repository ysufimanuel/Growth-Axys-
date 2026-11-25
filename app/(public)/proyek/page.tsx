import type { Metadata } from "next";
import { PageHero } from "../../../components/PageHero";
import { ProjectBrowser } from "../../../components/ProjectBrowser";
import { getProjects } from "../../../lib/data/content";
import { buildMetadata } from "../../../lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const projects = await getProjects();
  return buildMetadata({
    title: "Portofolio Proyek Konstruksi",
    description: "Dokumentasi pekerjaan konstruksi gedung, infrastruktur, renovasi, dan MEP yang dikerjakan PT Pillarians Group.",
    path: "/proyek",
    noindex: projects.length === 0, // jangan indeks halaman kosong
  });
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <>
      <PageHero
        eyebrow="OUR PORTFOLIO"
        title={
          <>
            Setiap proyek punya
            <br />
            cerita dan standar.
          </>
        }
        lead="Dokumentasi pekerjaan, proses, dan hasil yang menjadi bagian dari perjalanan kami."
        crumbs={[{ name: "Proyek", href: "/proyek" }]}
      />
      <section className="section">
        <div className="container">
          {projects.length > 0 ? (
            <ProjectBrowser
              projects={projects.map((p) => ({ slug: p.slug, title: p.title, year: p.year, location: p.location, category: p.category, progress: p.progress, cover: p.cover }))}
            />
          ) : (
            <div className="empty-block" role="status">
              Dokumentasi proyek sedang kami siapkan. Untuk referensi pekerjaan, silakan hubungi tim kami melalui halaman Kontak.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
