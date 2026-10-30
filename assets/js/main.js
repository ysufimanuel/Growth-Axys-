const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("mainNav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false");
  }));
}
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const header = document.getElementById("siteHeader");
if (header) window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 20), { passive: true });

const waNumber = "6281234567890"; // Ganti nomor WhatsApp admin, format internasional tanpa tanda +.
document.querySelectorAll(".wa-float").forEach(a => a.href = `https://wa.me/${waNumber}?text=${encodeURIComponent("Halo PT Growth Axys, saya ingin bertanya mengenai layanan konstruksi.")}`);

// Load angka statistik dari Firestore bila Firebase sudah dikonfigurasi.
import("./firebase.js").then(async ({ db, firebaseConfigured }) => {
  if (!firebaseConfigured) return;
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
  try {
    const snap = await getDoc(doc(db, "siteContent", "stats"));
    if (snap.exists()) Object.entries(snap.data()).forEach(([key, value]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.innerHTML = `${String(value)}<span>+</span>`;
    });
  } catch (error) { console.warn("Statistik Firebase belum tersedia:", error.message); }
}).catch(() => {});
