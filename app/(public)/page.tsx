import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "../../components/JsonLd";
import { Media } from "../../components/Media";
import { organizationJsonLd } from "../../lib/core/jsonld";
import { getProjects, getStats } from "../../lib/data/content";
import { buildMetadata } from "../../lib/seo";
import { SITE_URL, site, whatsappLink } from "../../lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  ...buildMetadata({
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    path: "/",
  }),
  // Halaman beranda memakai judul penuh tanpa template.
  title: { absolute: `${site.name} | ${site.tagline}` },
};

const icon = {
  className: "line-icon",
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export default async function HomePage() {
  const [projects, stats] = await Promise.all([getProjects(), getStats()]);
  const featured = projects.slice(0, 3);
  const statItems = [
    { key: "years", label: "Tahun pengalaman", tag: "01 / EXPERIENCE", value: stats?.years },
    { key: "projects", label: "Proyek terselesaikan", tag: "02 / DELIVERY", value: stats?.projects },
    { key: "clients", label: "Klien & mitra", tag: "03 / PARTNERSHIP", value: stats?.clients },
  ].filter((s) => s.value);

  return (
    <>
      <JsonLd
        data={organizationJsonLd({
          name: site.name,
          url: SITE_URL,
          description: site.description,
          telephone: site.phoneE164,
          email: site.email,
          logo: site.logoUrl ?? undefined,
          address: site.address
            ? { streetAddress: site.address.street, addressLocality: site.address.city, addressCountry: site.address.country }
            : null,
          sameAs: site.socials,
        })}
      />

      <section className="hero editorial-hero">
        <div className="hero-bg" role="img" aria-label="Area proyek konstruksi"></div>
        <div className="container hero-content">
          <div className="eyebrow light">
            <i></i> ENGINEERING · CONSTRUCTION · DEVELOPMENT
          </div>
          <h1>
            Kontraktor konstruksi gedung, infrastruktur &amp; MEP.
            <br />
            <em>Membangun ruang, menggerakkan masa depan.</em>
          </h1>
          <p>Partner konstruksi untuk pekerjaan sipil, sistem MEP, dan renovasi. Direncanakan dengan cermat, dikerjakan dengan tanggung jawab.</p>
          <div className="hero-actions">
            <Link className="btn btn-orange" href="/proyek">
              JELAJAHI PROYEK <span aria-hidden="true">↗</span>
            </Link>
            <Link className="btn btn-outline-light" href="/kontak">
              KONSULTASIKAN PROYEK
            </Link>
          </div>
        </div>
        <div className="hero-meta">
          <div className="container hero-meta-inner">
            <span className="hero-index">
              <b>01</b>COMPANY PROFILE
            </span>
            <span className="hero-note">DESIGNED WITH INTENT. BUILT TO LAST.</span>
            <span className="hero-photo-credit">PROJECTS · PEOPLE · PROGRESS</span>
          </div>
        </div>
      </section>

      <section className="section about-preview">
        <div className="container split">
          <div className="about-visual">
            <div className="image-frame" style={{ position: "relative", aspectRatio: "11 / 10" }}>
              <Image
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1100&q=80"
                alt="Aktivitas konstruksi di area proyek"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="visual-stamp">
              <b>PG</b>
              <span>
                BUILDING
                <br />
                THE FUTURE
              </span>
            </div>
            <div className="visual-caption">01 / OUR APPROACH</div>
          </div>
          <div className="about-copy">
            <span className="eyebrow">TENTANG PILLARIANS GROUP</span>
            <h2>
              Fondasi kuat untuk
              <br />
              <em>setiap kemungkinan.</em>
            </h2>
            <p className="lead">
              Kami percaya setiap pembangunan yang baik dimulai dari perencanaan yang matang dan diwujudkan melalui eksekusi yang bertanggung jawab.
            </p>
            <p>
              PT Pillarians Group hadir sebagai mitra konstruksi untuk kebutuhan pembangunan, pengembangan, dan pemeliharaan infrastruktur. Kami mengedepankan kolaborasi, transparansi,
              serta standar kerja yang konsisten.
            </p>
            <Link className="text-link" href="/tentang-kami">
              KENALI PERUSAHAAN KAMI <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section bento-section" id="capabilities">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OUR CAPABILITIES / 03 DISCIPLINES</span>
              <h2>
                Keahlian yang saling
                <br />
                <em>terhubung.</em>
              </h2>
            </div>
            <Link className="text-link" href="/layanan">
              SEMUA LAYANAN <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="bento">
            <article className="bento-card service-card bento-civil">
              <div className="bento-head">
                <svg {...icon}>
                  <path d="M4 28h24" />
                  <path d="M8 28V5h11v23" />
                  <path d="M19 12h5v16" />
                  <path d="M12 10h3M12 15h3M12 20h3" />
                </svg>
                <span className="service-number">01 / CIVIL</span>
              </div>
              <div className="bento-body">
                <h3>Pekerjaan Sipil</h3>
                <p>Pembangunan gedung, pekerjaan struktur, jalan, dan infrastruktur kawasan dengan perencanaan yang terukur.</p>
              </div>
              <Link className="bento-link" href="/layanan/konstruksi-gedung">
                Jelajahi kapabilitas <b aria-hidden="true">↗</b>
              </Link>
            </article>
            <article className="bento-card service-card bento-mep">
              <div className="bento-head">
                <svg {...icon}>
                  <path d="M18 3L7 18h8l-2 11 12-16h-8l1-10z" />
                </svg>
                <span className="service-number">02 / MEP</span>
              </div>
              <div className="bento-body">
                <h3>Mekanikal, Elektrikal &amp; Plumbing</h3>
                <p>Integrasi sistem bangunan yang aman, efisien, dan sesuai kebutuhan operasional.</p>
              </div>
              <Link className="bento-link" href="/layanan/mep">
                Jelajahi kapabilitas <b aria-hidden="true">↗</b>
              </Link>
            </article>
            <article className="bento-card service-card bento-renovation">
              <div className="bento-head">
                <svg {...icon}>
                  <path d="M4 15L16 5l12 10" />
                  <path d="M7 13v15h18V13" />
                  <path d="M13 28v-8h6v8" />
                </svg>
                <span className="service-number">03 / RENOVATION</span>
              </div>
              <div className="bento-body">
                <h3>Renovasi &amp; Interior</h3>
                <p>Pembaruan ruang dan bangunan untuk meningkatkan fungsi, kenyamanan, serta kualitas lingkungan.</p>
              </div>
              <Link className="bento-link" href="/layanan/renovasi-interior">
                Jelajahi kapabilitas <b aria-hidden="true">↗</b>
              </Link>
            </article>

            <figure className="bento-card bento-photo" style={{ position: "relative" }}>
              <Image
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80"
                alt="Proses konstruksi di area proyek"
                fill
                sizes="(max-width: 900px) 100vw, 40vw"
                style={{ objectFit: "cover" }}
              />
              <figcaption>
                <span className="bento-label">ON SITE / PROSES KONSTRUKSI</span>
              </figcaption>
            </figure>

            {/* Statistik hanya tampil bila admin mengisi siteContent/stats. Tidak ada angka bawaan. */}
            {statItems.map((s) => (
              <div key={s.key} className={`bento-card stat bento-${s.key}`}>
                <span className="bento-label">{s.tag}</span>
                <div>
                  <strong>
                    {String(s.value).padStart(2, "0")}
                    <span>+</span>
                  </strong>
                  <small>{s.label}</small>
                </div>
              </div>
            ))}

            <article className="bento-card bento-cta">
              <div>
                <span className="bento-label">MINTA PENAWARAN</span>
                <h3>
                  Satu mitra.
                  <br />
                  Beragam kebutuhan.
                </h3>
                <p>Dari perencanaan hingga penyelesaian, setiap detail bergerak menuju hasil yang bertanggung jawab.</p>
              </div>
              <Link className="btn btn-orange" href="/kontak">
                MINTA PENAWARAN <span aria-hidden="true">↗</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="section projects-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">SELECTED WORKS</span>
                <h2>
                  Hasil kerja yang
                  <br />
                  <em>bisa dibuktikan.</em>
                </h2>
              </div>
              <Link className="text-link" href="/proyek">
                LIHAT PORTOFOLIO <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="project-grid">
              {featured.map((p, i) => (
                <Link key={p.slug} className={i === 0 ? "project-card project-large" : "project-card"} href={`/proyek/${p.slug}`}>
                  <Media url={p.cover} alt={p.title} preview className="project-card-media" ratio={i === 0 ? "16 / 10" : "4 / 3"} />
                  <span className="project-overlay">
                    <small>{[p.category, p.location].filter(Boolean).join(" · ").toUpperCase()}</small>
                    <b>{p.title}</b>
                    <i>LIHAT DETAIL ↗</i>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="cta-band">
        <div className="container cta-inner">
          <div>
            <span className="eyebrow light">LET&apos;S BUILD SOMETHING MEANINGFUL</span>
            <h2>
              Punya rencana proyek
              <br />
              yang ingin diwujudkan?
            </h2>
            <p>Diskusikan kebutuhan proyek Anda bersama tim Pillarians Group.</p>
          </div>
          <a className="btn btn-orange" href={whatsappLink("Halo PT Pillarians Group, saya ingin konsultasi proyek.")} target="_blank" rel="noopener noreferrer">
            MULAI KONSULTASI <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </>
  );
}
