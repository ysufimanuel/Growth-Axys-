import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "../../../components/PageHero";
import { buildMetadata } from "../../../lib/seo";
import { site } from "../../../lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Kebijakan Privasi",
  description: "Penjelasan data pribadi yang diproses PT Pillarians Group melalui website, tujuan penggunaannya, dan cara menghubungi kami.",
  path: "/kebijakan-privasi",
});

// DRAFT: ditulis berdasarkan perilaku website saat ini. Wajib ditinjau pihak hukum/pimpinan
// perusahaan sebelum go-live, dan diperbarui bila analitik atau backend inquiry ditambahkan.
export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="LEGAL" title="Kebijakan Privasi." lead="Cara kami memperlakukan data yang Anda berikan melalui website ini." crumbs={[{ name: "Kebijakan Privasi", href: "/kebijakan-privasi" }]} />
      <section className="section">
        <div className="container prose" style={{ maxWidth: 780 }}>
          <h2>Data yang kami proses</h2>
          <p>
            Saat Anda mengisi formulir di halaman <Link href="/kontak">Kontak</Link>, nama, perusahaan, email, nomor WhatsApp, kebutuhan proyek, dan pesan Anda digunakan untuk menyusun pesan WhatsApp
            kepada tim kami. Formulir tidak menyimpan data tersebut di server website ini; pesan baru terkirim setelah Anda mengirimnya sendiri melalui WhatsApp.
          </p>
          <h2>Tujuan penggunaan</h2>
          <p>Data digunakan untuk menanggapi pertanyaan, menyiapkan penawaran, dan menindaklanjuti kerja sama yang Anda minta. Kami tidak menjual data pribadi Anda.</p>
          <h2>Layanan pihak ketiga</h2>
          <p>
            Pesan yang Anda kirim melalui WhatsApp diproses oleh WhatsApp sesuai kebijakan privasi mereka. Hosting website dapat mencatat data teknis standar (misalnya alamat IP dan jenis perangkat)
            untuk keamanan dan pemeliharaan. Konten video dari YouTube, Vimeo, Google Drive, atau Pinterest pada halaman proyek dapat memuat cookie pihak ketiga ketika Anda memutarnya.
          </p>
          <h2>Retensi</h2>
          <p>Percakapan WhatsApp disimpan selama diperlukan untuk menindaklanjuti permintaan Anda dan kewajiban administrasi perusahaan.</p>
          <h2>Hak Anda dan kontak</h2>
          <p>
            Untuk meminta akses, koreksi, atau penghapusan data Anda, hubungi kami di <a href={`mailto:${site.email}`}>{site.email}</a> atau {site.phoneDisplay}.
          </p>
        </div>
      </section>
    </>
  );
}
