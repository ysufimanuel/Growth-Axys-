# PT Pillarians Group - Company Profile Website

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

## 2. Deploy ke Vercel dan konfigurasi backend admin

Repository ini dapat di-deploy sebagai satu project: file HTML/CSS/JS disajikan sebagai frontend statis, sedangkan file di folder \`api/\` dijalankan sebagai Vercel Functions.

1. Import repository GitHub ini ke Vercel dan pilih branch \`main\`.
2. Biarkan Root Directory di root repository. Tidak perlu framework preset.
3. Tambahkan environment variables pada Vercel (Production; Preview hanya jika memang diperlukan):
   - \`FIREBASE_PROJECT_ID\`: \`growth-axys\`
   - \`FIREBASE_CLIENT_EMAIL\`: nilai \`client_email\` dari Firebase Service Account JSON.
   - \`FIREBASE_PRIVATE_KEY\`: nilai \`private_key\` dari Service Account JSON. Simpan hanya di environment variables Vercel.
   - \`SUPER_ADMIN_UID\`: UID akun utama yang menjadi satu-satunya Super Admin.
4. Buat/unduh Service Account key dari Firebase Console > Project settings > Service accounts. Pastikan service account memiliki izin mengelola Firebase Authentication.
5. Deploy ulang setelah environment variables disimpan.
6. Pastikan akun Super Admin sudah memiliki custom claim \`admin: true\`. UID-nya harus sama persis dengan \`SUPER_ADMIN_UID\`.

**Penting:** jangan pernah commit Service Account JSON, private key, atau password sementara ke repository. Jika private key pernah terekspos, segera revoke dan buat key baru. Vercel Functions hanya memakai key tersebut di sisi server.

### Endpoint admin

- \`POST /api/admin/create\` - membuat akun admin baru.
- \`GET /api/admin/list\` - menampilkan akun dengan custom claim \`admin: true\`.
- \`POST /api/admin/delete\` - menghapus akun admin.
- Hanya UID yang cocok dengan \`SUPER_ADMIN_UID\` dan memiliki claim admin yang boleh memakai endpoint manajemen admin.

Di dashboard, Super Admin dapat membuat admin dan menghapus akun admin. Setiap admin juga dapat mengganti email (melalui verifikasi email) dan password sendiri dari bagian Pengaturan Akun Saya. Pembuatan admin memakai password sementara minimal 12 karakter; sampaikan kredensial kepada penerima melalui kanal aman dan minta mereka menggantinya setelah login.

Untuk menjalankan lokal, isi environment variables yang sama di file \`.env.local\` (jangan commit file tersebut), lalu gunakan Vercel CLI untuk menjalankan project secara lokal.

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
