import type { Metadata } from "next";
import { ContactForm } from "../../../components/ContactForm";
import { PageHero } from "../../../components/PageHero";
import { buildMetadata } from "../../../lib/seo";
import { site } from "../../../lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Kontak & Konsultasi Proyek",
  description: "Hubungi PT Pillarians Group untuk konsultasi proyek konstruksi, kerja sama, atau pertanyaan umum melalui telepon, WhatsApp, atau email.",
  path: "/kontak",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="GET IN TOUCH"
        title={
          <>
            Mari mulai
            <br />
            percakapan.
          </>
        }
        lead="Ceritakan kebutuhan proyek Anda. Tim kami akan menghubungi untuk tindak lanjut."
        crumbs={[{ name: "Kontak", href: "/kontak" }]}
      />
      <section className="section">
        <div className="container contact-layout">
          <div className="contact-info">
            <span className="eyebrow">CONTACT INFORMATION</span>
            <h2>
              Terhubung dengan
              <br />
              <em>tim Pillarians Group.</em>
            </h2>
            <p>Untuk konsultasi proyek, kerja sama, atau pertanyaan umum, silakan gunakan kontak berikut.</p>
            {site.address ? (
              <div className="contact-item">
                <small>ALAMAT KANTOR</small>
                <b>
                  {site.address.street}, {site.address.city}, {site.address.country}
                </b>
              </div>
            ) : null}
            <div className="contact-item">
              <small>EMAIL</small>
              <b>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </b>
            </div>
            <div className="contact-item">
              <small>TELEPON / WHATSAPP</small>
              <b>
                <a href={`tel:${site.phoneE164}`}>{site.phoneDisplay}</a>
              </b>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
