import { db, firebaseConfigured } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { createMediaElement } from "./media.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");
const demo = {
  "project-gedung": {name:"Pengembangan Gedung Perkantoran",location:"Jakarta",year:"2025",type:"Gedung",status:"Selesai",owner:"[Nama Owner]",value:"Tidak dipublikasikan",description:"Contoh deskripsi pekerjaan konstruksi gedung. Ganti dengan lingkup pekerjaan aktual, metode pelaksanaan, dan hasil pekerjaan yang dapat diverifikasi.",cover:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85"},
  "project-jalan": {name:"Peningkatan Jalan Kawasan",location:"Bogor",year:"2024",type:"Infrastruktur",status:"Selesai",owner:"[Nama Owner]",value:"Tidak dipublikasikan",description:"Contoh deskripsi pekerjaan infrastruktur. Ganti dengan data proyek aktual.",cover:"https://images.unsplash.com/photo-1545459720-aac8509eb02d?auto=format&fit=crop&w=1400&q=85"},
  "project-interior": {name:"Renovasi Ruang Kerja",location:"Depok",year:"2025",type:"Renovasi",status:"Berjalan",owner:"[Nama Owner]",value:"Tidak dipublikasikan",description:"Contoh deskripsi pekerjaan renovasi. Ganti dengan data proyek aktual.",cover:"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85"}
};

let project = demo[id] || demo["project-gedung"];
if (firebaseConfigured && id) {
  try {
    const snap = await getDoc(doc(db, "projects", id));
    if (snap.exists()) project = snap.data();
  } catch (error) {
    console.warn("Menggunakan konten contoh:", error.message);
  }
}

const set = (elementId, value) => {
  const el = document.getElementById(elementId);
  if (el) el.textContent = value || "-";
};
set("detailTitle", project.name);
set("detailSubtitle", `${project.type || "Konstruksi"} · ${project.location || ""}`);
set("detailOwner", project.owner);
set("detailLocation", project.location);
set("detailYear", project.year);
set("detailType", project.type);
set("detailStatus", project.status);
set("detailValue", project.value || "Tidak dipublikasikan");
set("detailDescription", project.description);

const cover = document.getElementById("detailCover");
if (cover && project.cover) {
  cover.replaceChildren(createMediaElement(project.cover, { alt: project.name || "Media utama proyek", className: "detail-media-element" }));
}

const gallery = document.getElementById("detailGallery");
if (gallery && Array.isArray(project.gallery) && project.gallery.length) {
  gallery.innerHTML = "";
  project.gallery.forEach((url, i) => {
    gallery.append(createMediaElement(url, { alt: `Dokumentasi proyek ${i + 1}`, className: "gallery-media-element" }));
  });
}

document.getElementById("shareProject")?.addEventListener("click", async () => {
  const shareData = { title: project.name, text: `Lihat proyek ${project.name} oleh PT Growth Axys`, url: location.href };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch {}
  } else {
    await navigator.clipboard?.writeText(location.href);
    alert("Link proyek disalin.");
  }
});
