# PT Growth Axys - Company Profile Website

Website company profile statis berbasis **HTML, CSS, Vanilla JavaScript** dengan Firebase Authentication dan Firestore. Media proyek memakai URL eksternal sehingga tidak membutuhkan Firebase Storage dan cocok untuk paket Spark. Tidak memakai framework frontend.

## Isi project

- `index.html` - homepage
- `about.html` - profil, visi misi, legalitas
- `services.html` - bidang layanan
- `projects.html` - daftar portofolio + filter
- `project-detail.html` - detail proyek + galeri + share
- `certifications.html` - sertifikasi dan peralatan
- `contact.html` - kontak dan form inquiry via WhatsApp
- `admin/` - login dan dashboard CMS
- `assets/js/firebase.js` - konfigurasi Firebase
- `firestore.rules` - aturan akses Firestore

## 1. Persiapan Firebase

1. Buat project di https://console.firebase.google.com/
2. Tambahkan Web App pada project.
3. Aktifkan **Authentication > Sign-in method > Email/Password**.
4. Buat Firestore Database.
5. Salin konfigurasi Web App ke `assets/js/firebase.js`.
6. Deploy `firestore.rules` ke Firestore Rules. Firebase Storage tidak digunakan oleh CMS media eksternal.

Isi konfigurasi yang masih berupa `GANTI_...`. Jalankan melalui server lokal, jangan membuka file dengan `file://`.

Contoh server lokal:
```bash
python -m http.server 8000
```
Buka `http://localhost:8000`.

## 2. Mengatur akun admin (wajib)

Dashboard menggunakan **Firebase custom claim `admin: true`**. Tidak cukup hanya membuat akun email/password biasa.

Cara aman:
1. Buat akun admin melalui Firebase Authentication.
2. Jalankan script admin claim dari lingkungan tepercaya (misalnya komputer admin/server lokal yang memiliki Firebase Admin SDK dan service account).
3. Jangan pernah menaruh service account JSON atau private key di folder website publik.

Contoh script Node.js terpisah, dijalankan hanya di lingkungan tepercaya setelah memasang `firebase-admin` dan mengatur `GOOGLE_APPLICATION_CREDENTIALS`:

```js
const admin = require("firebase-admin");
admin.initializeApp();
async function grantAdmin(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`Admin claim diberikan ke ${email}. Login ulang untuk refresh token.`);
}
grantAdmin("admin@perusahaan.co.id");
```

Setelah claim diberikan, logout lalu login kembali. Custom claim harus diberikan hanya kepada personel berwenang.

## 3. Struktur data Firestore

Collection `projects`, dokumen otomatis:
```js
{
  name: "Pembangunan Gedung ...",
  location: "Bogor, Jawa Barat",
  year: 2025,
  type: "Gedung", // Gedung | Infrastruktur | Renovasi | MEP
  status: "Selesai", // Selesai | Berjalan
  owner: "Nama pemilik proyek",
  value: "Tidak dipublikasikan",
  cover: "https://...",
  gallery: ["https://...", "https://..."],
  description: "Lingkup pekerjaan...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Collection `siteContent`, dokumen `stats` (opsional):
```js
{ years: 8, projects: 45, clients: 30 }
```

## 4. Konfigurasi kontak

Ganti nomor WhatsApp contoh `6281234567890` di:
- `assets/js/main.js`
- `assets/js/contact.js`
- tautan WhatsApp di file HTML.

Ganti email, alamat, NIB, SBU, tahun berdiri, dan seluruh placeholder lain dengan data resmi perusahaan. Ganti logo GA sementara dengan logo resmi perusahaan.

## 5. Media proyek melalui URL (Firebase Spark)

CMS menyimpan URL media ke Firestore, bukan mengunggah file. Kolom media utama dan galeri menerima:

- URL gambar langsung, termasuk `images.unsplash.com` dan `i.pinimg.com`.
- YouTube (`youtube.com/watch`, `youtu.be`, `/shorts/`) melalui embed privasi `youtube-nocookie.com`.
- Google Drive melalui `/file/d/FILE_ID/view` atau `open?id=FILE_ID`; ubah akses file menjadi **Anyone with the link**.
- Pinterest Pin melalui URL `pinterest.com/pin/ID/` menggunakan embed Pinterest.
- Vimeo, serta URL file video langsung `.mp4`, `.webm`, atau `.ogg`.

Masukkan satu URL media utama dan satu URL per baris di galeri. Untuk Unsplash, gunakan alamat gambar langsung dari `images.unsplash.com`, bukan halaman foto `unsplash.com/photos/...`. Pinterest short link `pin.it` yang belum berupa URL Pin penuh akan ditampilkan sebagai tautan keluar. Pastikan pemilik media mengizinkan penyematan dan publikasi.

## 6. Form kontak

Form kontak saat ini menyusun pesan dan membuka WhatsApp admin. Ini sengaja tidak menulis data pengunjung ke Firestore publik. Untuk email otomatis dan pencatatan inquiry, implementasikan Cloud Function / backend tepercaya dengan validasi dan proteksi spam.

## 7. Keamanan dan go-live checklist

- [ ] Isi Firebase config asli.
- [ ] Deploy Firestore Rules.
- [ ] Buat admin dan set custom claim `admin: true` dari lingkungan tepercaya.
- [ ] Ganti nomor WA, email, alamat, Google Maps, dan seluruh data placeholder.
- [ ] Ganti foto stok/placeholder dengan dokumentasi proyek asli yang boleh dipublikasikan.
- [ ] Verifikasi NIB, SBU, KBLI, sertifikasi, nilai proyek, dan klaim pengalaman.
- [ ] Uji URL gambar, video, YouTube, Google Drive, dan Pinterest dari perangkat publik.
- [ ] Uji akses publik dan admin, termasuk percobaan akses tanpa login.
- [ ] Deploy ke hosting dengan HTTPS dan domain perusahaan.
- [ ] Uji Lighthouse / PageSpeed pada domain produksi.

## Catatan

Website ini adalah starter project fungsional untuk dikembangkan dan diuji. Bukan berarti sudah terkoneksi dengan Firebase perusahaan atau siap go-live: konfigurasi, data resmi, foto, custom claim, dan pengujian produksi tetap diperlukan. Gambar eksternal pada demo hanyalah placeholder visual.
