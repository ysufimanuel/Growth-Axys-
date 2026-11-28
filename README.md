# Pillarians Group — Next.js (App Router)

Versi baru website company profile + dashboard admin. Situs vanilla di branch `main` tetap menjadi production sampai versi ini lolos pengujian. Status, audit, dan keputusan: [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).

## Menjalankan
```bash
cp .env.example .env.local   # isi kredensial (jangan di-commit)
npm install
npm run dev                  # http://localhost:3000
npm run typecheck
npm test                     # tes logika murni (Node >= 22.18, tanpa dependensi)
npm run build
```
Tanpa kredensial Firebase Admin, situs tetap berjalan: daftar proyek/artikel kosong (empty state + `noindex`).

## Impor Instagram di CMS
- Admin dapat menempel URL postingan, Reel, atau video (`/p/`, `/reel/`, `/tv/`) pada editor proyek, layanan, atau artikel.
- Endpoint server memakai Meta Instagram oEmbed. Isi `INSTAGRAM_OEMBED_TOKEN` di Vercel Project Settings → Environment Variables (Production/Preview sesuai kebutuhan). Token hanya dibaca server dan tidak boleh memakai prefix `NEXT_PUBLIC_`.
- Caption diisi dari field `title` yang dikembalikan Meta oEmbed jika tersedia; Meta tidak selalu mengembalikan caption. Dalam kondisi itu, URL dan embed tetap disimpan dan deskripsi dapat diisi manual.
- Thumbnail disimpan sebagai URL gambar untuk kartu/metadata; halaman detail menampilkan embed Instagram. Rasio media dapat dipilih di editor, tetapi rasio asli konten di dalam embed tetap dikendalikan Instagram.

## Struktur singkat
- `app/(public)` halaman publik · `app/admin` login + area terproteksi · `app/api` endpoint server
- `lib/core` logika murni yang diuji (izin, slug, redirect, normalisasi, JSON-LD, cek konten)
- `lib/server` Admin SDK, verifikasi token/role, audit, layanan konten · `lib/data` pembacaan data publik
- `firebase/firestore.rules` rules target (jangan deploy sebelum cutover)

## Superadmin pertama
```bash
FIREBASE_PROJECT_ID=… FIREBASE_CLIENT_EMAIL=… FIREBASE_PRIVATE_KEY="…" npm run bootstrap:superadmin -- email@perusahaan.id
```
