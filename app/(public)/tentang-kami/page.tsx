import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "../../../components/PageHero";
import { buildMetadata } from "../../../lib/seo";
import { site } from "../../../lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Tentang Kami",
  description: "Kenali profil, visi, misi, dan nilai kerja PT Pillarians Group, mitra konstruksi gedung, infrastruktur, renovasi, dan MEP.",
  path: "/tentang-kami",
});

export default function AboutPage() {
  // Data legalitas hanya tampil jika sudah diverifikasi dan diisi di lib/site.ts.
  const legal = [
    { label: "NOMOR INDUK BERUSAHA", value: site.legal.nib, note: "Dokumen legalitas usaha" },
    { label: "SERTIFIKAT BADAN USAHA", value: site.legal.sbu, note: "Kualifikasi dan klasifikasi usaha" },
    { label: "NPWP PERUSAHAAN", value: site.legal.npwp, note: "Identitas perpajakan" },
  ].filter((l) => l.value);

  return (
    <>
      <PageHero
        eyebrow="WHO WE ARE"
        title="Mengenal Pillarians Group."
        lead="Fondasi yang kuat, kolaborasi yang terbuka, dan hasil kerja yang bertanggung jawab."
        crumbs={[{ name: "Tentang Kami", href: "/tentang-kami" }]}
      />
      <section className="section">
        <div className="container split">
          <div className="about-visual">
            <div className="image-frame" style={{ position: "relative", aspectRatio: "11 / 10" }}>
              <Image
                src="https://images.unsplash.com/photo-1503387762-592dec58ef4e?auto=format&fit=crop&w=1100&q=80"
                alt="Bangunan modern"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="visual-stamp">
              <b>PG</b>
              <span>
                BUILT ON
                <br />
                TRUST
              </span>
            </div>
          </div>
          <div className="about-copy">
            <span className="eyebrow">OUR STORY</span>
            <h2>
              Berangkat dari visi,
              <br />
              <em>bertumbuh lewat karya.</em>
            </h2>
            <p className="lead">PT Pillarians Group adalah perusahaan yang bergerak di bidang jasa konstruksi dan pengembangan infrastruktur.</p>
            <p>
              Kami berkomitmen menghadirkan solusi konstruksi yang mengutamakan kualitas, keselamatan kerja, efisiensi, dan keberlanjutan. Kami membangun hubungan jangka panjang melalui
              komunikasi yang jelas dan pelaksanaan pekerjaan yang disiplin.
            </p>
            <p>
              Lihat <Link href="/layanan">bidang layanan kami</Link> atau <Link href="/kontak">hubungi tim kami</Link> untuk mendiskusikan kebutuhan proyek Anda.
            </p>
          </div>
        </div>
      </section>
      <section className="section values-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OUR DIRECTION</span>
              <h2>
                Prinsip yang menjadi
                <br />
                <em>arah setiap pekerjaan.</em>
              </h2>
            </div>
          </div>
          <div className="value-grid">
            <article>
              <span>01</span>
              <h3>Visi</h3>
              <p>Menjadi perusahaan konstruksi yang terpercaya, kompetitif, dan memberikan nilai tambah melalui karya berkualitas.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Misi</h3>
              <p>Menghadirkan pekerjaan yang memenuhi standar mutu dan keselamatan, mengembangkan kompetensi tim, serta membangun kemitraan profesional.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Nilai Kerja</h3>
              <p>Integritas, tanggung jawab, kolaborasi, disiplin, dan perbaikan berkelanjutan menjadi dasar pelaksanaan proyek.</p>
            </article>
          </div>
        </div>
      </section>
      {legal.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">CORPORATE INFORMATION</span>
                <h2>
                  Legalitas &amp;
                  <br />
                  <em>kepatuhan perusahaan.</em>
                </h2>
              </div>
            </div>
            <div className="legal-grid">
              {legal.map((l) => (
                <div key={l.label}>
                  <small>{l.label}</small>
                  <b>{l.value}</b>
                  <span>{l.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
