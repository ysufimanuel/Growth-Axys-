import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "../../../components/PageHero";
import { getServices } from "../../../lib/data/content";
import { buildMetadata } from "../../../lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Layanan Konstruksi Gedung, Infrastruktur, Renovasi & MEP",
  description: "Layanan PT Pillarians Group: konstruksi gedung, jalan dan infrastruktur, renovasi dan interior, serta mekanikal, elektrikal, dan plumbing (MEP).",
  path: "/layanan",
});

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <PageHero
        eyebrow="OUR CAPABILITIES"
        title={
          <>
            Layanan konstruksi
            <br />
            terintegrasi.
          </>
        }
        lead="Solusi yang disesuaikan dengan kebutuhan, lingkup, dan karakter setiap proyek."
        crumbs={[{ name: "Layanan", href: "/layanan" }]}
      />
      <section className="section">
        <div className="container">
          <div className="service-detail-grid">
            {services.map((s, i) => (
              <article key={s.slug} className={`service-detail${i % 2 ? " reverse" : ""}`}>
                {s.image ? (
                  <div style={{ position: "relative", aspectRatio: "10 / 7", overflow: "hidden" }}>
                    <Image src={s.image} alt={s.imageAlt || s.title} fill sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: "cover" }} priority={i === 0} />
                  </div>
                ) : null}
                <div>
                  <span className="eyebrow">{String(i + 1).padStart(2, "0")} / LAYANAN</span>
                  <h2>
                    <Link href={`/layanan/${s.slug}`}>{s.title}</Link>
                  </h2>
                  <p>{s.summary || s.content}</p>
                  {s.bullets.length ? (
                    <ul>
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                  <Link className="text-link" href={`/layanan/${s.slug}`}>
                    DETAIL LAYANAN <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
