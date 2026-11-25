import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { site, whatsappLink } from "../../lib/site";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#konten">
        Lewati ke konten utama
      </a>
      <SiteHeader />
      <main id="konten">{children}</main>
      <SiteFooter />
      <a
        className="wa-float"
        href={whatsappLink(`Halo ${site.name}, saya ingin bertanya mengenai layanan konstruksi.`)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi melalui WhatsApp"
      >
        ✆
      </a>
    </>
  );
}
