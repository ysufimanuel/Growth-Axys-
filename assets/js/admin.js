import { auth, db, storage, firebaseConfigured } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const $ = id => document.getElementById(id);
if (!firebaseConfigured) { $("adminProjectList").textContent = "Konfigurasi Firebase belum diisi. Isi assets/js/firebase.js terlebih dahulu."; }
let currentUser = null;
onAuthStateChanged(auth, async user => {
  if (!user) { location.href = "login.html"; return; }
  const token = await user.getIdTokenResult(true);
  if (token.claims.admin !== true) { await signOut(auth); location.href = "login.html"; return; }
  currentUser = user; $("adminEmail").textContent = user.email || ""; loadProjects();
});
$("logoutButton")?.addEventListener("click", async () => { await signOut(auth); location.href = "login.html"; });

async function uploadImage(file, folder) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Ukuran setiap gambar maksimal 10 MB.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const target = storageRef(storage, path);
  await uploadBytes(target, file, { contentType: file.type });
  return await getDownloadURL(target);
}
async function formData() {
  let cover = $("projectCover").value.trim();
  const coverFile = $("coverFile").files[0];
  if (coverFile) cover = await uploadImage(coverFile, "projects");
  if (!cover) throw new Error("Isi URL cover atau upload foto cover.");
  const gallery = $("projectGallery").value.split(",").map(x => x.trim()).filter(Boolean);
  const galleryFiles = [...$("galleryFiles").files];
  for (const file of galleryFiles) gallery.push(await uploadImage(file, "projects"));
  return {
    name: $("projectName").value.trim(), location: $("projectLocation").value.trim(),
    year: Number($("projectYear").value), type: $("projectType").value, status: $("projectStatus").value,
    owner: $("projectOwner").value.trim(), value: $("projectValue").value.trim(),
    cover, description: $("projectDescription").value.trim(), gallery,
    updatedAt: serverTimestamp(), updatedBy: currentUser?.uid || null
  };
}
$("projectForm")?.addEventListener("submit", async e => {
  e.preventDefault(); $("projectMessage").textContent = "Menyimpan...";
  try {
    const data = await formData(), id = $("projectId").value;
    if (id) await updateDoc(doc(db, "projects", id), data);
    else await addDoc(collection(db, "projects"), {...data, createdAt: serverTimestamp()});
    $("projectMessage").textContent = "Proyek berhasil disimpan.";
    resetForm(); await loadProjects();
  } catch (error) { $("projectMessage").textContent = "Gagal menyimpan: " + error.message; }
});
function resetForm() { $("projectForm").reset(); $("projectId").value = ""; $("projectFormTitle").textContent = "Tambah proyek baru"; }
$("cancelEdit")?.addEventListener("click", resetForm);
$("refreshProjects")?.addEventListener("click", loadProjects);

async function loadProjects() {
  if (!firebaseConfigured || !currentUser) return;
  const root = $("adminProjectList"); root.textContent = "Memuat...";
  try {
    const snap = await getDocs(query(collection(db, "projects"), orderBy("year", "desc")));
    root.innerHTML = "";
    if (snap.empty) { root.textContent = "Belum ada proyek. Tambahkan proyek pertama melalui formulir."; return; }
    snap.forEach(s => {
      const p = s.data(), row = document.createElement("article"); row.className = "admin-project-row";
      const title = document.createElement("div"); const h = document.createElement("b"); h.textContent = p.name || "Tanpa nama";
      const meta = document.createElement("small"); meta.textContent = `${p.year || "-"} · ${p.location || "-"} · ${p.type || "-"}`; title.append(h, meta);
      const actions = document.createElement("div"); actions.className = "admin-row-actions";
      const edit = document.createElement("button"); edit.textContent = "Edit"; edit.addEventListener("click", () => {
        $("projectId").value = s.id; $("projectName").value = p.name || ""; $("projectLocation").value = p.location || "";
        $("projectYear").value = p.year || ""; $("projectType").value = p.type || "Gedung"; $("projectStatus").value = p.status || "Selesai";
        $("projectOwner").value = p.owner || ""; $("projectValue").value = p.value || ""; $("projectCover").value = p.cover || "";
        $("projectDescription").value = p.description || ""; $("projectGallery").value = (p.gallery || []).join(", ");
        $("projectFormTitle").textContent = "Edit proyek"; window.scrollTo({top:0,behavior:"smooth"});
      });
      const del = document.createElement("button"); del.textContent = "Hapus"; del.className = "danger"; del.addEventListener("click", async () => {
        if (!confirm(`Hapus proyek "${p.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        try { await deleteDoc(doc(db, "projects", s.id)); await loadProjects(); } catch (e) { alert("Gagal menghapus: " + e.message); }
      });
      actions.append(edit, del); row.append(title, actions); root.append(row);
    });
  } catch (error) { root.textContent = "Gagal memuat proyek: " + error.message; }
}