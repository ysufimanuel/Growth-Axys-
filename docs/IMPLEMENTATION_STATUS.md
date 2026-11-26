# Status Implementasi: Next.js Rebuild (`feature/nextjs-rebuild`)

Dokumen ini adalah hasil audit repo + status pekerjaan terhadap
`Pillarians_Group_Technical_Spec_SEO_GEO`. Aplikasi baru berada di root branch ini.
**File situs vanilla yang sedang production (root repo) tidak diubah.**

> Penting: kode di root branch **belum pernah di-build atau dijalankan** karena instalasi paket
> (`npm install`) tidak tersedia di sesi pengerjaan. Yang sudah diverifikasi dijelaskan di bagian
> "Verifikasi" di bawah. Jalankan `npm install && npm run typecheck && npm run build` di root branch
> sebelum menganggap branch ini siap.

## 1. Hasil audit (Phase 0)

| Temuan | Dampak |
|---|---|
| Situs = HTML statis + `assets/js/*.js`; data proyek dibaca **langsung dari browser** ke Firestore | Konten proyek tidak ada di HTML awal; pindah ke render server |
| `firestore.rules` di repo **kosong (0 byte)**; rules yang aktif di Firebase tidak diketahui | Harus dicek di Firebase Console. Rules target ada di `firebase/firestore.rules` |
| Database Firestore bernama `default` (bukan `(default)`) | Admin SDK memakai `FIREBASE_DATABASE_ID=default` |
| Role: hanya claim `admin: true` + satu `SUPER_ADMIN_UID` (env) | Dipetakan ke `admin`/`superadmin`; claim lama tetap dihormati |
| `package.json` root: `engines.node = 26.x`, API di `/api/admin/*` (create/list/delete) | Tidak disentuh; endpoint baru ada di `app/api` |
| Halaman memakai placeholder: `[Nomor NIB]`, `[Alamat kantor]`, "Sejak [tahun]", logo klien `[Nama Klien]`, kotak peta, proyek demo | **Tidak dimigrasikan** (dilarang spec). Data hanya tampil bila diisi |
| Angka statistik bawaan (8+ tahun, 45+ proyek, 30+ klien) tanpa sumber | **Tidak dimigrasikan.** Tampil hanya bila `siteContent/stats` diisi admin |
| Merek tidak konsisten: "Growth Axys" (repo, email `@growthaxys.co.id`) vs "Pillarians Group" | Email dipertahankan, ditandai `TODO` di `lib/site.ts` |
| Three.js dimuat dari CDN untuk hero | Dihapus (JS berat, merugikan LCP/INP); hero memakai CSS |
| Google Fonts via `@import` CSS (render-blocking) | Diganti `next/font` (self-hosted) |
| Gambar semua stok Unsplash | Dipertahankan sementara; **ganti dengan dokumentasi asli** |
| `.well-known/axflor-verification/*.txt` | Disalin ke `public` |

## 2. Status checklist spec

Legenda: ✅ ada dan diuji logikanya · 🟡 ditulis, belum bisa dibuild/dijalankan di sini · ⬜ belum dikerjakan

### SEO / GEO
- 🟡 Title & description unik per halaman, canonical, Open Graph (`lib/seo.ts`)
- 🟡 Sitemap otomatis (hanya published + indexable) dan `robots.ts`; admin/API `noindex`
- 🟡 Structured data (Organization, Service, Article, BreadcrumbList); ✅ builder murni diuji
- 🟡 HTML awal berisi konten (server render + ISR 5 menit), breadcrumb HTML crawlable
- ✅ Redirect permanen URL lama (`/about.html`, `/project-detail.html?id=…`, dst.) diuji
- ✅ Deteksi konten tipis → `noindex` + keluar dari sitemap; ✅ peringatan editorial (alt text, sumber, reviewer, meta)
- 🟡 Field GEO artikel: sumber, penulis, reviewer, tanggal review, `factChecked`; ditampilkan di halaman
- ⬜ Search Console, GA4, uptime monitoring (butuh akses akun)
- ⬜ Google Business Profile / local SEO (butuh data alamat resmi)
- ⬜ Open Graph image default, favicon/logo (aset belum ada)
- ⬜ Audit Lighthouse/CWV di perangkat nyata

### Keamanan & role
- ✅ Matriks izin Admin/Superadmin, guard "Superadmin terakhir", role hanya dari claims server (diuji)
- 🟡 Verifikasi ID token + cek token dicabut + akun aktif + role di **setiap** endpoint
- 🟡 Undangan Admin dengan masa berlaku 72 jam, status `invited` ditolak semua endpoint; nonaktifkan akun + cabut token
- 🟡 Audit log ditulis server; tidak ada endpoint tulis/ubah/hapus audit log
- 🟡 Firestore Rules target (`firebase/firestore.rules`) — **belum diuji di Emulator, jangan deploy sebelum cutover**
- 🟡 Header keamanan; CSP dalam mode **Report-Only** (ubah ke enforce setelah uji preview)
- 🟡 Rate limit **in-memory per instance** (pengaman dasar; produksi: Vercel Firewall/Upstash)
- ⬜ MFA Superadmin (perlu Identity Platform), re-auth untuk tindakan destruktif
- ⬜ Pengiriman email undangan otomatis (belum ada penyedia email; tautan ditampilkan ke Superadmin)

### CMS
- 🟡 API konten (projects/services/articles/certifications): draft/published/archived, update parsial, slug unik, redirect saat slug berubah (perlu `redirectConfirmed`), revisi disimpan, hapus permanen hanya Superadmin & hanya jika sudah archived
- 🟡 **Dashboard admin Liquid Glass (Fase 1 `docs/ADMIN_DASHBOARD_SPEC.md`)**: AdminShell (sidebar desktop, drawer mobile, breadcrumb, logout), menu difilter izin, menu belum jadi tampil "Segera" (bukan tautan mati); ringkasan dari Firestore (error ≠ angka 0; aktivitas hanya untuk `audit.view`); daftar konten dengan cari/filter/paginasi di server; editor (create/edit parsial), pratinjau, terbitkan/tarik/arsip/pulihkan/hapus permanen dengan dialog konfirmasi; peringatan editorial
- 🟡 Dashboard memakai session cookie + proteksi CSRF (same-origin + header `X-Admin-Request`) di `requireActor`; Bearer token tetap didukung. ✅ logika diuji (`tests/admin.test.ts`)
- 🟡 Daftar akun (hanya baca, server-gated)
- 🟡 User Management UI (undang Admin, tampilkan tautan setup sekali, cari/filter akun, ubah role, aktif/nonaktifkan dengan konfirmasi) dan Audit Log UI (read-only, filter/cari) sudah ditambahkan; perlu build + uji end-to-end di Preview sebelum dianggap terverifikasi
- ⬜ UI redirect, UI revisi/restore, halaman SEO/Media/Backup
- ⬜ Editor belum bisa **mengosongkan** field URL opsional (gambar/sampul): skema server menolak string kosong
- ⬜ Media library (upload, validasi MIME, referensi). Saat ini media = URL HTTPS
- ⬜ Pengaturan global/siteSettings di dashboard; jadwal publikasi
- ⬜ Backup/restore terjadwal (tidak ada di kode; perlu Firebase scheduled export + Storage backup)

## 3. Keputusan yang menyimpang dari spec (dan alasannya)
1. **Tailwind & React Hook Form belum dipakai.** CSS lama dipakai ulang (tampilan sama, migrasi cepat); RHF baru relevan saat editor dibuat.
2. **`middleware.ts` tidak dipakai.** Next 16 mengganti namanya menjadi `proxy`; gerbang sesungguhnya adalah layout server + `requireActor`, sesuai catatan spec.
3. **`status` konten dipisah dari progres proyek.** Dokumen lama memakai `status` = "Selesai/Berjalan". Model baru: `publishStatus` (draft/published/archived) + `progress`. Dokumen lama tanpa `publishStatus` dianggap *published* (sudah publik).
4. **Slug proyek lama = ID dokumen**, sehingga `/project-detail.html?id=X` → `/proyek/X` tetap valid.
5. **Konten = teks polos** (paragraf dipisah baris kosong), tidak dirender sebagai HTML → tidak ada risiko XSS dari editor.
6. **Layanan seed** (4 layanan dari `services.html`) tetap tampil; detailnya tipis sehingga `noindex` sampai diperkaya. Layanan dengan slug sama di Firestore menggantikan seed.
7. **H1 beranda diubah** menjadi deskriptif ("Kontraktor konstruksi gedung, infrastruktur & MEP…") agar topik halaman jelas; tinjau copywriting.
8. **Kebijakan privasi adalah draf** berdasarkan perilaku saat ini; wajib ditinjau pihak hukum.

## 4. Yang harus dilengkapi pemilik (tidak boleh dikarang)
Alamat kantor · NIB/SBU/NPWP · tahun berdiri · statistik · email resmi · logo & favicon · dokumentasi proyek asli ·
daftar layanan sesuai KBLI/SBU · persetujuan publikasi proyek (NDA) · domain canonical resmi.
Isi di `lib/site.ts` (kontak/legalitas) dan Firestore (`siteContent/stats`, `projects`, `certifications`, dll.).

## 5. Langkah menuju preview & cutover
1. `npm install && npm run typecheck && npm test && npm run build`.
2. Buat **project Vercel terpisah** dengan *Root Directory* `.` (project produksi saat ini men-deploy root vanilla; jangan diubah). Isi env sesuai `.env.example`.
3. Jalankan `npm run bootstrap:superadmin -- email@…` secara lokal untuk Superadmin pertama.
4. Uji Rules di Emulator; bandingkan konten/URL/metadata dengan situs lama; jalankan Lighthouse.
5. Backup Firestore (+ Storage bila dipakai) → deploy Rules → pindahkan domain → submit sitemap di Search Console.
6. Rencana rollback: domain dikembalikan ke deployment vanilla; Rules lama disimpan sebelum diganti.

## 6. Verifikasi yang sudah dilakukan
- `npm test` (Node `--test`): **31/31 lulus** — izin, guard Superadmin terakhir, slug, validasi redirect, redirect legacy, normalisasi dokumen legacy, cek konten, klasifikasi media, JSON-LD.
- Typecheck (tsc) pada kode non-React dengan zod v4 dan tipe Node asli: tidak ada error logika.
  Error tersisa hanya karena paket `next`, `react`, `firebase*` tidak terpasang.
- Perilaku skema zod (partial update tidak menambah field, field asing & URL non-HTTPS ditolak) diuji langsung.
- **Belum**: `next build`, render halaman, Emulator Rules, uji role end-to-end dengan akun nyata.
