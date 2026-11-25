import Link from "next/link";
import { site } from "../lib/site";

export function SiteFooter() {
  const { address, legal } = site;
  const legalLines = [
    legal.nib ? `NIB: ${legal.nib}` : null,
    legal.sbu ? `SBU: ${legal.sbu}` : null,
    legal.npwp ? `NPWP: ${legal.npwp}` : null,
  ].filter((l): l is string => Boolean(l));

  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="brand brand-light" href="/">
            <span className="brand-mark">
              PG<span></span>
            </span>
            <span className="brand-copy">
              <b>PILLARIANS GROUP</b>
              <small>CONSTRUCTION</small>
            </span>
          </Link>
          <p>Membangun dengan tujuan, bekerja dengan integritas.</p>
        </div>
        <div>
          <h4>NAVIGASI</h4>
          <Link href="/tentang-kami">Tentang Kami</Link>
          <Link href="/layanan">Layanan</Link>
          <Link href="/proyek">Portofolio</Link>
          <Link href="/artikel">Artikel</Link>
          <Link href="/sertifikasi">Sertifikasi</Link>
        </div>
        <div>
          <h4>HUBUNGI</h4>
          {address ? (
            <p>
              {address.street}, {address.city}, {address.country}
            </p>
          ) : null}
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phoneE164}`}>{site.phoneDisplay}</a>
        </div>
        <div>
          <h4>INFORMASI</h4>
          {legalLines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <Link href="/kontak">Kontak &amp; konsultasi ↗</Link>
          <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} PT Pillarians Group. Hak cipta dilindungi.</span>
        <span>QUALITY · SAFETY · INTEGRITY</span>
      </div>
    </footer>
  );
}
