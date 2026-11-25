# Pillarians Group — Admin Dashboard Specification
## Liquid Glass / iOS-inspired interface

**Status:** Product & UI implementation brief  
**Target branch:** `feature/nextjs-rebuild`  
**Application:** Next.js App Router  
**Primary route:** `/admin`  
**Login:** `/admin/login`  
**Audience:** Admin and Superadmin

Dokumen ini menjadi acuan implementasi dashboard admin Pillarians Group. Fokusnya adalah antarmuka bergaya iOS Liquid Glass yang terasa modern, ringan, responsif, dan tetap nyaman digunakan untuk pekerjaan CMS sehari-hari.

> Prinsip utama: Liquid Glass adalah bahasa visual, bukan alasan untuk mengorbankan keterbacaan, performa, aksesibilitas, atau keamanan. Kontrol akses tetap ditegakkan di server.

---

## 1. Tujuan dan prinsip produk

1. Dashboard menjadi pusat pengelolaan konten website Pillarians Group.
2. Admin dapat mengelola konten rutin tanpa membuka Firebase Console.
3. Superadmin memiliki kontrol administrasi, keamanan, audit, dan pemulihan.
4. UI menampilkan hanya menu dan tindakan yang diizinkan role aktif.
5. Setiap tindakan penting memiliki validasi, konfirmasi, loading state, dan feedback hasil.
6. Layout konsisten pada mobile, tablet, dan desktop.

### Prinsip UX

- **Clarity first:** label menu dan tindakan harus jelas; hindari ikon tanpa label untuk fungsi penting.
- **Progressive disclosure:** tampilkan tindakan lanjutan hanya saat relevan.
- **Safe by default:** hapus permanen, restore, dan perubahan role memerlukan konfirmasi.
- **Responsive:** mobile bukan versi desktop yang diperkecil.
- **Honest state:** jangan menampilkan angka statistik, aktivitas, atau status palsu. Gunakan empty state saat data belum tersedia.

---

## 2. Design direction — iOS Liquid Glass

### 2.1 Visual language

Gunakan gaya iOS modern dengan panel transparan, blur halus, highlight tipis, radius besar, dan lapisan visual yang jelas.

- Background utama: warm neutral / off-white, dengan ambient gradient lembut.
- Surface: translucent glass dengan blur dan transparansi secukupnya.
- Border: putih/transparan tipis untuk memisahkan layer.
- Shadow: lembut dan menyebar; hindari shadow hitam tebal.
- Radius: 16–24px untuk card, 12–16px untuk input dan tombol.
- Motion: transisi singkat dan natural, bukan animasi dekoratif berlebihan.
- Icon: konsisten, sederhana, dan mudah dikenali.
- Typography: system font stack bergaya SF; gunakan font sistem agar cepat dan tetap konsisten.

### 2.2 Brand palette

Pertahankan identitas warna Pillarians Group:

| Token | Warna | Penggunaan |
|---|---|---|
| Warm Limestone | `#F8F7F4` | Canvas / background terang |
| Deep Pine | `#0F2119` | Teks utama, sidebar gelap, footer |
| Muted Brass | `#C5A059` | Accent, highlight, statistik penting |
| Glass White | `rgba(255,255,255,.58)` | Glass surface terang |
| Glass Border | `rgba(255,255,255,.72)` | Garis tepi glass |
| Text Secondary | `#66716B` | Teks sekunder |
| Success | `#23845B` | Status berhasil |
| Warning | `#B7791F` | Status perlu perhatian |
| Danger | `#B54747` | Tindakan destruktif / error |

Warna status harus tetap memiliki label teks atau ikon; jangan mengandalkan warna saja.

### 2.3 Glass surface rules

- Gunakan `backdrop-filter: blur(16px–24px)` hanya pada topbar, sidebar/drawer, floating toolbar, dan panel prioritas.
- Konten panjang seperti tabel, editor, dan formulir harus memakai surface solid atau hampir solid agar mudah dibaca.
- Sediakan fallback solid untuk browser yang tidak mendukung `backdrop-filter`.
- Jangan menaruh teks kecil di atas background foto atau gradient yang ramai.
- Batasi layer glass bertumpuk agar performa mobile tetap baik.
- Hormati `prefers-reduced-motion`; nonaktifkan parallax dan animasi non-esensial.

### 2.4 Motion

- Hover/press feedback: 120–180ms.
- Drawer/modal: 180–240ms.
- Page transition: 160–220ms, opacity/transform ringan.
- Hindari animasi terus-menerus, spring berlebihan, dan blur animasi berat.
- Semua interaksi tetap dapat digunakan tanpa animasi.

---

## 3. App shell dan navigasi

### Desktop

- Sidebar glass di kiri, dapat diciutkan.
- Topbar berisi breadcrumb, pencarian (bila sudah terhubung), notifikasi (bila tersedia), dan profil akun.
- Konten berada pada canvas utama dengan lebar yang nyaman.
- Tombol utama berada di lokasi konsisten, biasanya kanan atas area konten.

### Mobile

- Topbar ringkas dengan logo/nama halaman dan tombol menu.
- Navigasi menggunakan drawer/sheet dari sisi kiri.
- Aksi utama dapat menggunakan floating action button hanya bila konteksnya jelas.
- Tabel berubah menjadi list/card; jangan memaksa tabel desktop menyusut.
- Form memakai satu kolom dan tombol submit mudah dijangkau.

### Menu navigasi

Menu hanya ditampilkan bila role memiliki permission terkait.

| Menu | Route yang disarankan | Permission |
|---|---|---|
| Overview | `/admin/dashboard` | `dashboard.view` |
| Proyek | `/admin/content/projects` | `content.edit` |
| Layanan | `/admin/content/services` | `content.edit` |
| Artikel | `/admin/content/articles` | `content.edit` |
| Sertifikasi | `/admin/content/certifications` | `content.edit` |
| Media Library | `/admin/media` | `media.manage` |
| SEO Halaman | `/admin/seo` | `seo.page` |
| SEO Global | `/admin/settings/seo` | `seo.global` |
| Redirects | `/admin/redirects` | `redirects.manage` |
| User Management | `/admin/users` | `users.manage` |
| Audit Log | `/admin/audit` | `audit.view` |
| Backup & Restore | `/admin/backup` | `backup.restore` |

Menu yang belum diimplementasikan harus ditandai sebagai belum tersedia atau tidak ditampilkan. Jangan membuat tombol palsu yang tidak melakukan apa pun.

---

## 4. Role dan access-control matrix

Role diambil dari custom claims tepercaya di server. Client tidak boleh menentukan role sendiri. UI boleh menyembunyikan menu, tetapi setiap page, Server Action, dan API wajib memeriksa permission di server.

### 4.1 Admin

Admin adalah operator CMS harian.

**Diizinkan:**
- Melihat dashboard.
- Membuat dan mengedit proyek, layanan, artikel, dan sertifikasi.
- Melihat preview konten.
- Menerbitkan konten.
- Mengarsipkan konten.
- Mengelola media.
- Mengelola SEO tingkat halaman yang tidak berisiko.

**Tidak diizinkan:**
- Menghapus konten secara permanen.
- Mengubah canonical/noindex atau pengaturan SEO global yang berisiko.
- Mengelola redirect.
- Melihat/mengelola akun pengguna dan role.
- Melihat audit log.
- Menjalankan backup atau restore.

### 4.2 Superadmin

Superadmin memiliki seluruh izin Admin ditambah kontrol penuh.

**Tambahan izin:**
- Menghapus permanen konten (sesuai aturan lifecycle: konten harus archived terlebih dahulu).
- Mengatur SEO global, canonical, dan noindex.
- Mengelola redirect.
- Mengundang/mengelola akun.
- Mengubah role.
- Melihat audit log.
- Menjalankan backup dan restore.

### 4.3 Matriks izin resmi

Matriks berikut mengikuti implementasi `lib/core/permissions.ts` pada branch target.

| Permission | Admin | Superadmin |
|---|:---:|:---:|
| `dashboard.view` | ✓ | ✓ |
| `content.edit` | ✓ | ✓ |
| `content.preview` | ✓ | ✓ |
| `content.publish` | ✓ | ✓ |
| `content.archive` | ✓ | ✓ |
| `content.delete` | — | ✓ |
| `media.manage` | ✓ | ✓ |
| `seo.page` | ✓ | ✓ |
| `seo.global` | — | ✓ |
| `redirects.manage` | — | ✓ |
| `users.manage` | — | ✓ |
| `roles.change` | — | ✓ |
| `audit.view` | — | ✓ |
| `backup.restore` | — | ✓ |

### 4.4 Aturan keamanan akun

- Status akun: `invited`, `active`, atau `disabled`.
- Akun invited dan disabled ditolak oleh seluruh endpoint terlindungi.
- Admin tidak dapat mengubah role atau status akun.
- Superadmin tidak dapat mengubah role/status akunnya sendiri melalui UI.
- Superadmin terakhir tidak boleh diturunkan atau dinonaktifkan.
- Role berasal dari Firebase custom claims / pemetaan legacy yang sudah ada; jangan menerima role dari request body client.
- Perubahan role/status harus memperbarui claims dan mencabut sesi/token lama sesuai mekanisme server.
- Setiap operasi penting dicatat di audit log.

---

## 5. Dashboard overview

Route: `/admin/dashboard`

### Ringkasan

Tampilkan kartu ringkasan berbasis data Firestore aktual:

- Total proyek.
- Total layanan.
- Total artikel.
- Total sertifikasi.
- Draft.
- Published.
- Archived.

Angka harus dihitung dari sumber data aktual. Jika query gagal, tampilkan error state; jangan menampilkan angka contoh seolah data nyata.

### Area dashboard

1. **Welcome panel:** nama/email akun dan role aktif.
2. **KPI cards:** jumlah konten per jenis dan status.
3. **Recent content:** konten terakhir dibuat/diubah.
4. **Recent activity:** aktivitas terbaru jika audit log tersedia.
5. **Quick actions:** tambah proyek/artikel/layanan/sertifikasi sesuai permission.
6. **System status:** status integrasi hanya jika dapat diperiksa secara nyata.

### Empty/error/loading states

- Skeleton loading untuk kartu dan daftar.
- Empty state dengan CTA yang sesuai permission.
- Error state dengan tombol coba lagi.
- Jangan menganggap kegagalan fetch sebagai nilai nol.

---

## 6. CMS modules

Semua tipe konten memakai pola UI konsisten: list → create/edit → preview → publish/archive. Gunakan validasi schema server yang sudah tersedia dan jangan mengirim HTML mentah untuk body konten.

### 6.1 Proyek

Route:
- `/admin/content/projects`
- `/admin/content/projects/new`
- `/admin/content/projects/[id]`

Field berdasarkan schema saat ini:
- Judul, slug, lokasi, tahun.
- Kategori: Gedung, Infrastruktur, Renovasi, MEP.
- Progres proyek: Selesai/Berjalan.
- Owner, nilai proyek, ruang lingkup.
- Cover dan galeri gambar.
- Pengaturan media (autoplay/muted) bila relevan.
- SEO halaman.

Fitur:
- Search, filter kategori/status/tahun, sort, pagination.
- Form create/edit.
- Preview sebelum publish.
- Konfirmasi publish/archive.
- Perubahan slug pada konten published wajib mengonfirmasi pembuatan redirect.

### 6.2 Layanan

Route:
- `/admin/content/services`
- `/admin/content/services/new`
- `/admin/content/services/[id]`

Field:
- Judul, slug, ringkasan, konten, daftar poin layanan.
- Gambar dan alt text.
- SEO halaman.

### 6.3 Artikel

Route:
- `/admin/content/articles`
- `/admin/content/articles/new`
- `/admin/content/articles/[id]`

Field:
- Judul, slug, excerpt, isi artikel.
- Gambar dan alt text.
- Penulis, reviewer, tanggal review.
- Status fact-check.
- Daftar sumber (judul + URL HTTPS).
- SEO halaman.

### 6.4 Sertifikasi

Route:
- `/admin/content/certifications`
- `/admin/content/certifications/new`
- `/admin/content/certifications/[id]`

Field:
- Nama, nomor, penerbit, masa berlaku.
- Dokumen publik opsional.
- Dokumen legalitas tidak boleh dipublikasikan tanpa persetujuan eksplisit.

### 6.5 Lifecycle konten

- Status publikasi: `draft`, `published`, `archived`.
- Admin boleh create/edit/preview/publish/archive.
- Hanya Superadmin boleh menghapus permanen.
- Penghapusan permanen hanya setelah konten berstatus archived.
- Perubahan slug published harus membuat redirect setelah konfirmasi.
- Simpan revision history; UI restore hanya untuk Superadmin bila endpoint restore tersedia.
- Konten berupa teks polos; paragraf dipisahkan dengan baris kosong. Jangan render sebagai HTML.

---

## 7. Media Library

Route: `/admin/media`  
Permission: `media.manage`

Fitur target:
- Upload gambar dengan validasi MIME, ukuran, dan ekstensi.
- Grid/list view, preview, pencarian, filter.
- Metadata: nama file, ukuran, dimensi, alt text, tanggal upload, uploader.
- Copy URL, pilih media untuk field cover/image.
- Deteksi referensi sebelum menghapus media.
- Hapus media harus memiliki konfirmasi dan pemeriksaan permission.

Catatan implementasi:
- Model konten saat ini memakai URL HTTPS. Integrasi Storage harus dirancang sebelum membuat UI upload.
- Jangan mengklaim media tersimpan bila upload belum selesai.
- Batasi tipe file; jangan menerima file executable.

---

## 8. SEO dan website settings

### SEO halaman

Permission: `seo.page`

- Meta title dan description.
- Open Graph image.
- Preview snippet.
- Indikator field belum lengkap.
- Validasi URL HTTPS.

### SEO global

Permission: `seo.global` (Superadmin only)

- Canonical domain.
- Default metadata.
- Default Open Graph image.
- Robots/indexing policy.
- Pengaturan sitemap terkait.

Perubahan canonical/noindex harus diberi peringatan karena dapat memengaruhi pengindeksan website.

### Redirect manager

Permission: `redirects.manage` (Superadmin only)

- Daftar source → destination.
- Validasi URL dan loop redirect.
- Status aktif/nonaktif.
- Riwayat perubahan.

### Global website settings

Superadmin only untuk perubahan berisiko:
- Nama/identitas perusahaan.
- Logo dan favicon.
- Kontak resmi.
- Tautan sosial.
- Informasi alamat/legalitas yang sudah diverifikasi.

Jangan mengisi data perusahaan, angka pencapaian, atau legalitas dengan data rekaan.

---

## 9. User management

Route: `/admin/users`  
Permission: `users.manage` (Superadmin only)

Fitur:
- Daftar akun, pencarian, filter role/status.
- Undang Admin.
- Tampilkan/copy invitation link bila layanan email belum terintegrasi.
- Masa berlaku undangan mengikuti backend (saat ini 72 jam).
- Kirim ulang undangan bila endpoint mendukung.
- Ubah role Admin ↔ Superadmin sesuai kebijakan.
- Aktifkan/nonaktifkan akun.
- Tampilkan waktu login terakhir jika tersedia.
- Konfirmasi untuk perubahan akses.
- Proteksi Superadmin terakhir dan larangan mengubah akun sendiri.

Jangan menampilkan tombol aksi sebelum endpoint terkait tersedia dan diuji.

---

## 10. Audit log

Route: `/admin/audit`  
Permission: `audit.view` (Superadmin only)

Kolom:
- Waktu.
- Aktor (email/UID).
- Aksi.
- Resource/ID.
- Ringkasan perubahan.
- Hasil (success/failure) jika dicatat.

Filter:
- Rentang tanggal.
- Aktor.
- Jenis aksi.
- Resource.

Audit log bersifat append-only dari server. Tidak ada UI edit atau delete log.

---

## 11. Backup & Restore

Route: `/admin/backup`  
Permission: `backup.restore` (Superadmin only)

Fitur target:
- Status backup terakhir.
- Buat backup manual bila backend mendukung.
- Daftar backup dan waktu pembuatan.
- Restore dengan konfirmasi berlapis.
- Catat pelaksana dan hasil restore pada audit log.
- Tampilkan peringatan dampak restore.

Backup/restore belum dianggap tersedia hanya karena menu atau desain UI dibuat. Integrasi scheduled export Firestore dan backup Storage harus disiapkan dan diuji terlebih dahulu.

---

## 12. Authentication dan session UX

- Login menggunakan Firebase Email/Password.
- Sediakan loading state saat submit.
- Tampilkan error autentikasi yang aman dan dapat dipahami.
- Jangan membocorkan detail private key atau konfigurasi server.
- Setelah login, server memverifikasi ID token, status akun, dan role sebelum membuat session.
- Logout menghapus session cookie melalui endpoint server.
- Redirect ke halaman login jika session tidak valid.
- Jangan menyimpan session admin sebagai token sensitif di localStorage.
- Halaman login tetap berada di luar protected route group.

---

## 13. Component inventory

Komponen UI yang disarankan:
- `AdminShell`
- `GlassSidebar`
- `MobileNavigationSheet`
- `GlassTopbar`
- `Breadcrumbs`
- `PageHeader`
- `GlassCard`
- `StatCard`
- `DataTable` dan `MobileDataList`
- `SearchInput`
- `FilterBar`
- `StatusBadge`
- `ContentEditorForm`
- `MediaPicker`
- `ConfirmDialog`
- `Toast`
- `EmptyState`
- `ErrorState`
- `Skeleton`
- `PermissionGate` (untuk presentasi UI saja; bukan pengganti server authorization)

Komponen boleh dibagikan antar modul. Jangan membuat salinan komponen yang sama untuk tiap tipe konten.

---

## 14. Accessibility, responsive, dan performance

- Targetkan WCAG 2.2 AA untuk kontras, fokus, label, dan navigasi keyboard.
- Semua input memiliki label eksplisit dan pesan error terhubung.
- Semua tombol icon-only memiliki accessible name.
- Focus ring harus terlihat pada glass surface.
- Dialog mengunci fokus dan mengembalikan fokus setelah ditutup.
- Hormati `prefers-reduced-motion`.
- Hindari blur berat pada perangkat mobile kelas bawah.
- Gunakan pagination/server filtering untuk daftar panjang.
- Optimalkan gambar dan gunakan ukuran thumbnail.
- Jangan mengirim seluruh koleksi Firestore ke client bila hanya butuh ringkasan.

---

## 15. Definition of Done

Sebuah modul dianggap selesai hanya jika:

1. UI responsive desktop/mobile.
2. Loading, empty, success, dan error state tersedia.
3. Form memakai schema validasi yang sama/selaras dengan server.
4. Permission diuji untuk Admin dan Superadmin.
5. API/server memeriksa authorization; bukan hanya UI.
6. Tindakan destruktif memiliki konfirmasi.
7. Perubahan penting tercatat pada audit log bila backend mendukung.
8. Tidak ada data dummy yang terlihat sebagai data produksi.
9. Tidak ada tombol/tautan mati.
10. Typecheck, test, dan production build lulus.

---

## 16. Prioritas implementasi

### Phase 1 — Dashboard & CMS inti
- [ ] Bangun AdminShell Liquid Glass dan navigasi responsive.
- [ ] Upgrade dashboard overview berbasis data aktual.
- [ ] CMS Proyek: list, create, edit, preview, publish, archive.
- [ ] CMS Layanan.
- [ ] CMS Artikel.
- [ ] CMS Sertifikasi.
- [ ] Uji permission Admin/Superadmin untuk setiap aksi.

### Phase 2 — Administrasi
- [ ] User Management UI.
- [ ] Invitation flow UI.
- [ ] Role/status management UI.
- [ ] Audit Log UI.
- [ ] Media Library setelah integrasi Storage disepakati.

### Phase 3 — Website control
- [ ] SEO page UI.
- [ ] SEO global UI.
- [ ] Redirect Manager.
- [ ] Global Website Settings.
- [ ] Revision History dan Restore UI.

### Phase 4 — Reliability
- [ ] Backup/Restore backend dan UI.
- [ ] MFA Superadmin.
- [ ] Rate limiting produksi.
- [ ] Uji keamanan dan role end-to-end.
- [ ] Audit accessibility dan performa mobile.

---

## 17. Catatan implementasi untuk developer

- Implementasi saat ini berada di branch `feature/nextjs-rebuild`; jangan mengubah branch `main` atau domain production sebagai bagian pekerjaan dashboard.
- Pertahankan API, schema, service, dan permission logic yang sudah ada kecuali audit membuktikan perlu perubahan.
- Matriks role resmi ada di `lib/core/permissions.ts`; jika dokumen dan kode berbeda, hentikan implementasi dan selesaikan perbedaannya sebelum mengubah akses.
- Status implementasi terkini dicatat di `docs/IMPLEMENTATION_STATUS.md`.
- Dokumen ini adalah spesifikasi target, bukan klaim bahwa semua fitur sudah tersedia.
