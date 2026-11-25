# Pillarians Group — Next.js (App Router)

Versi baru website company profile + dashboard admin. Situs vanilla di root repo tetap menjadi
production sampai versi ini lolos pengujian. Status, audit, dan keputusan: [`../../docs/IMPLEMENTATION_STATUS.md`](../../docs/IMPLEMENTATION_STATUS.md).

## Menjalankan
```bash
cd apps/web
cp .env.example .env.local   # isi kredensial (jangan di-commit)
npm install
npm run dev                  # http://localhost:3000
npm run typecheck
npm test                     # tes logika murni (Node >= 22.18, tanpa dependensi)
npm run build
```
Tanpa kredensial Firebase Admin, situs tetap berjalan: daftar proyek/artikel kosong (empty state + `noindex`).

## Struktur singkat
- `app/(public)` halaman publik · `app/admin` login + area terproteksi · `app/api` endpoint server
- `lib/core` logika murni yang diuji (izin, slug, redirect, normalisasi, JSON-LD, cek konten)
- `lib/server` Admin SDK, verifikasi token/role, audit, layanan konten · `lib/data` pembacaan data publik
- `firebase/firestore.rules` rules target (jangan deploy sebelum cutover)

## Superadmin pertama
```bash
FIREBASE_PROJECT_ID=… FIREBASE_CLIENT_EMAIL=… FIREBASE_PRIVATE_KEY="…" npm run bootstrap:superadmin -- email@perusahaan.id
```
