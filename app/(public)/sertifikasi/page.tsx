import type { Metadata } from "next";
import { PageHero } from "../../../components/PageHero";
import { getCertifications } from "../../../lib/data/content";
import { buildMetadata } from "../../../lib/seo";
import { site } from "../../../lib/site";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const certs = await getCertifications();
  return buildMetadata({
    title: "Legalitas & Sertifikasi",
    description: "Legalitas dan sertifikasi PT Pillarians Group yang telah diverifikasi dan dapat dipublikasikan.",
    path: "/sertifikasi",
    noindex: certs.length === 0, // spec: indexable hanya jika sah & boleh dipublikasikan
  });
}

export default async function CertificationsPage() {
  const certs = await getCertifications();
  const legal = [
    site.legal.nib ? { name: "Nomor Induk Berusaha (NIB)", number: site.legal.nib } : null,
    site.legal.sbu ? { name: "Sertifikat Badan Usaha (SBU)", number: site.legal.sbu } : null,
  ].filter((l): l is { name: string; number: string } => Boolean(l));

  return (
    <>
      <PageHero
        eyebrow="COMPLIANCE & RESOURCES"
        title={
          <>
            Standar kerja.
            <br />
            Kompetensi nyata.
          </>
        }
        lead="Dokumen legalitas dan sertifikasi yang mendukung pelaksanaan pekerjaan secara profesional."
        crumbs={[{ name: "Sertifikasi", href: "/sertifikasi" }]}
      />
      <section className="section">
        <div className="container">
          {certs.length + legal.length > 0 ? (
            <div className="cert-grid">
              {legal.map((l) => (
                <article key={l.name}>
                  <h3>{l.name}</h3>
                  <p>Nomor: {l.number}</p>
                </article>
              ))}
              {certs.map((c) => (
                <article key={c.id}>
                  <h3>{c.name}</h3>
                  {c.number ? <p>Nomor: {c.number}</p> : null}
                  {c.issuer ? <p>Penerbit: {c.issuer}</p> : null}
                  {c.validUntil ? <p>Berlaku hingga: {c.validUntil}</p> : null}
                  {c.publicDocument ? (
                    <a className="text-link" href={c.publicDocument} target="_blank" rel="noopener noreferrer">
                      LIHAT DOKUMEN ↗
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-block" role="status">
              Dokumen legalitas dan sertifikasi tersedia atas permintaan. Silakan hubungi kami melalui halaman Kontak.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
