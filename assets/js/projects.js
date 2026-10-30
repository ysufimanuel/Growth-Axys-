import { db, firebaseConfigured } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const list = document.getElementById("projectList");
const yearFilter = document.getElementById("filterYear");
const typeFilter = document.getElementById("filterType");
const statusFilter = document.getElementById("filterStatus");
const empty = document.getElementById("emptyState");

function wireFilters() {
  const cards = [...document.querySelectorAll("#projectList .project-card")];
  const years = [...new Set(cards.map(c => c.dataset.year).filter(Boolean))].sort().reverse();
  if (yearFilter) years.forEach(y => yearFilter.add(new Option(y, y)));
  const apply = () => {
    let visible = 0;
    cards.forEach(card => {
      const show = (!yearFilter.value || card.dataset.year === yearFilter.value) &&
        (!typeFilter.value || card.dataset.type === typeFilter.value) &&
        (!statusFilter.value || card.dataset.status === statusFilter.value);
      card.hidden = !show; if (show) visible++;
    });
    if (empty) empty.hidden = visible > 0;
  };
  [yearFilter, typeFilter, statusFilter].forEach(el => el?.addEventListener("change", apply));
}
wireFilters();

if (firebaseConfigured && list) {
  try {
    const snap = await getDocs(query(collection(db, "projects"), orderBy("year", "desc")));
    if (!snap.empty) {
      list.innerHTML = "";
      snap.forEach(docSnap => {
        const p = docSnap.data();
        const card = document.createElement("a");
        card.className = "project-card";
        card.dataset.year = p.year || "";
        card.dataset.type = p.type || "";
        card.dataset.status = p.status || "";
        card.href = `project-detail.html?id=${encodeURIComponent(docSnap.id)}`;
        const img = document.createElement("img"); img.src = p.cover || ""; img.alt = p.name || "Foto proyek"; img.loading = "lazy";
        const overlay = document.createElement("span"); overlay.className = "project-overlay";
        const small = document.createElement("small"); small.textContent = `${p.year || ""} · ${p.location || ""} · ${p.type || ""}`;
        const title = document.createElement("b"); title.textContent = p.name || "Proyek";
        const action = document.createElement("i"); action.textContent = "LIHAT DETAIL ↗";
        overlay.append(small, title, action); card.append(img, overlay); list.append(card);
      });
      yearFilter.innerHTML = '<option value="">Semua Tahun</option>';
      wireFilters();
    }
  } catch (error) { console.error("Gagal memuat proyek:", error); }
}