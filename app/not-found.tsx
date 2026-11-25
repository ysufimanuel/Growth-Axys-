import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

// Next.js mengembalikan status HTTP 404 yang benar untuk halaman ini.
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="konten">
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow light">404</span>
            <h1>Halaman tidak ditemukan.</h1>
            <p>Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan.</p>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <p>Silakan lanjutkan ke halaman berikut:</p>
            <p>
              <Link className="text-link" href="/">
                Beranda
              </Link>{" "}
              ·{" "}
              <Link className="text-link" href="/layanan">
                Layanan
              </Link>{" "}
              ·{" "}
              <Link className="text-link" href="/proyek">
                Proyek
              </Link>{" "}
              ·{" "}
              <Link className="text-link" href="/kontak">
                Kontak
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
