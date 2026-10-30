# PT Growth Axys - Company Profile Website

Website company profile statis berbasis **HTML, CSS, Vanilla JavaScript** dengan Firebase Authentication, Firestore, dan Storage. Tidak memakai framework frontend.

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
- `firestore.rules`, `storage.rules` - aturan akses Firebase

## 1. Persiapan Firebase

1. Buat project di https://console.firebase.google.com/
2. Tambahkan Web App pada project.
3. Aktifkan **Authentication > Sign-in method > Email/Password**.
4. Buat Firestore Database.
5. Aktifkan Firebase Storage.
6. Salin konfigurasi Web App ke `assets/js/firebase.js`.
7. Deploy `firestore.rules` ke Firestore Rules dan `storage.rules` ke Storage Rules.

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

## 5. Upload foto proyek

CMS mendukung upload foto cover dan beberapa foto galeri langsung ke Firebase Storage (maksimal 10 MB per foto), atau memakai URL gambar yang sudah di-host. URL hasil upload disimpan ke dokumen Firestore. Jangan menggunakan link Google Drive privat atau URL sementara.

## 6. Form kontak

Form kontak saat ini menyusun pesan dan membuka WhatsApp admin. Ini sengaja tidak menulis data pengunjung ke Firestore publik. Untuk email otomatis dan pencatatan inquiry, implementasikan Cloud Function / backend tepercaya dengan validasi dan proteksi spam.

## 7. Keamanan dan go-live checklist

- [ ] Isi Firebase config asli.
- [ ] Deploy Firestore dan Storage Rules.
- [ ] Buat admin dan set custom claim `admin: true` dari lingkungan tepercaya.
- [ ] Ganti nomor WA, email, alamat, Google Maps, dan seluruh data placeholder.
- [ ] Ganti foto stok/placeholder dengan dokumentasi proyek asli yang boleh dipublikasikan.
- [ ] Verifikasi NIB, SBU, KBLI, sertifikasi, nilai proyek, dan klaim pengalaman.
- [ ] Tambahkan upload file Storage di CMS sebelum menyatakan fitur upload admin selesai.
- [ ] Uji akses publik dan admin, termasuk percobaan akses tanpa login.
- [ ] Deploy ke hosting dengan HTTPS dan domain perusahaan.
- [ ] Uji Lighthouse / PageSpeed pada domain produksi.

## Catatan

Website ini adalah starter project fungsional untuk dikembangkan dan diuji. Bukan berarti sudah terkoneksi dengan Firebase perusahaan atau siap go-live: konfigurasi, data resmi, foto, custom claim, dan pengujian produksi tetap diperlukan. Gambar eksternal pada demo hanyalah placeholder visual.
