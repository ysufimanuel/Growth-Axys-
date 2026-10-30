const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("mainNav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const header = document.getElementById("siteHeader");
if (header) window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 20), { passive: true });

const waNumber = "6281234567890"; // Ganti nomor WhatsApp admin, format internasional tanpa tanda +.
document.querySelectorAll(".wa-float").forEach(a => {
  a.href = `https://wa.me/${waNumber}?text=${encodeURIComponent("Halo PT Growth Axys, saya ingin bertanya mengenai layanan konstruksi.")}`;
});

// Load statistik dan tiga proyek terbaru dari Firestore.
import("./firebase.js").then(async ({ db, firebaseConfigured }) => {
  if (!firebaseConfigured) return;

  const [{ doc, getDoc, collection, getDocs, query, orderBy, limit }, { createMediaElement }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
    import("./media.js")
  ]);

  try {
    const snap = await getDoc(doc(db, "siteContent", "stats"));
    if (snap.exists()) Object.entries(snap.data()).forEach(([key, value]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = String(value) + "+";
    });
  } catch (error) {
    console.warn("Statistik Firebase belum tersedia:", error.message);
  }

  const featured = document.getElementById("featuredProjects");
  if (featured) {
    try {
      const projects = await getDocs(query(collection(db, "projects"), orderBy("year", "desc"), limit(3)));
      if (!projects.empty) {
        featured.replaceChildren();
        projects.forEach((projectDoc, index) => {
          const project = projectDoc.data();
          const card = document.createElement("a");
          card.className = index === 0 ? "project-card project-large" : "project-card";
          card.href = `project-detail.html?id=${encodeURIComponent(projectDoc.id)}`;
          const media = createMediaElement(project.cover || "", {
            preview: true,
            alt: project.name || "Dokumentasi proyek",
            className: "project-card-media"
          });
          const overlay = document.createElement("span");
          overlay.className = "project-overlay";
          const meta = document.createElement("small");
          meta.textContent = `${project.type || "PROYEK"} · ${project.location || ""}`;
          const title = document.createElement("b");
          title.textContent = project.name || "Proyek Growth Axys";
          const action = document.createElement("i");
          action.textContent = "LIHAT DETAIL ↗";
          overlay.append(meta, title, action);
          card.append(media, overlay);
          featured.append(card);
        });
      }
    } catch (error) {
      console.warn("Proyek unggulan Firebase belum tersedia:", error.message);
    }
  }
}).catch(error => console.warn("Firebase belum tersedia:", error.message));
