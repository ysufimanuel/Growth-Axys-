import { auth, db, firebaseConfigured } from "./firebase.js";
import { onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = id => document.getElementById(id);
if (!firebaseConfigured) { $("adminProjectList").textContent = "Konfigurasi Firebase belum diisi. Isi assets/js/firebase.js terlebih dahulu."; }
let currentUser = null;

onAuthStateChanged(auth, async user => {
  if (!user) { location.href = "login.html"; return; }
  const token = await user.getIdTokenResult(true);
  if (token.claims.admin !== true) { await signOut(auth); location.href = "login.html"; return; }
  currentUser = user;
  $("adminEmail").textContent = user.email || "";
  loadProjects();
  loadAdminAccounts();
});

$("logoutButton")?.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "login.html";
});

function parseGalleryUrls(value) {
  return value.split(/[\n,]+/).map(url => url.trim()).filter(Boolean);
}

function validateMediaUrl(value, fieldName) {
  if (!value) throw new Error(fieldName + " wajib diisi.");
  let url;
  try { url = new URL(value); } catch { throw new Error("URL " + fieldName + " tidak valid."); }
  if (url.protocol !== "https:") throw new Error("Gunakan URL HTTPS untuk " + fieldName + ".");
  return url.href;
}

function formData() {
  const cover = validateMediaUrl($("projectCover").value.trim(), "media utama");
  const gallery = parseGalleryUrls($("projectGallery").value).map((url, i) => validateMediaUrl(url, "galeri baris " + (i + 1)));
  return {
    name: $("projectName").value.trim(),
    location: $("projectLocation").value.trim(),
    year: Number($("projectYear").value),
    type: $("projectType").value,
    status: $("projectStatus").value,
    owner: $("projectOwner").value.trim(),
    value: $("projectValue").value.trim(),
    cover,
    description: $("projectDescription").value.trim(),
    gallery,
    mediaSettings: {
      autoplay: $("mediaAutoplay").checked,
      muted: $("mediaMuted").checked
    },
    updatedAt: serverTimestamp(),
    updatedBy: currentUser?.uid || null
  };
}

$("projectForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  $("projectMessage").textContent = "Menyimpan...";
  try {
    const data = formData();
    const id = $("projectId").value;
    if (id) await updateDoc(doc(db, "projects", id), data);
    else await addDoc(collection(db, "projects"), { ...data, createdAt: serverTimestamp() });
    $("projectMessage").textContent = "Proyek berhasil disimpan.";
    resetForm();
    await loadProjects();
  } catch (error) {
    $("projectMessage").textContent = "Gagal menyimpan: " + error.message;
  }
});

function resetForm() {
  $("projectForm").reset();
  $("projectId").value = "";
  $("projectFormTitle").textContent = "Tambah proyek baru";
  $("mediaAutoplay").checked = false;
  $("mediaMuted").checked = true;
}
$("cancelEdit")?.addEventListener("click", resetForm);
$("refreshProjects")?.addEventListener("click", loadProjects);

async function loadProjects() {
  if (!firebaseConfigured || !currentUser) return;
  const root = $("adminProjectList");
  root.textContent = "Memuat...";
  try {
    const snap = await getDocs(query(collection(db, "projects"), orderBy("year", "desc")));
    root.innerHTML = "";
    if (snap.empty) {
      root.textContent = "Belum ada proyek. Tambahkan proyek pertama melalui formulir.";
      return;
    }
    snap.forEach(s => {
      const p = s.data();
      const row = document.createElement("article");
      row.className = "admin-project-row";
      const title = document.createElement("div");
      const h = document.createElement("b");
      h.textContent = p.name || "Tanpa nama";
      const meta = document.createElement("small");
      meta.textContent = `${p.year || "-"} · ${p.location || "-"} · ${p.type || "-"}`;
      title.append(h, meta);
      const actions = document.createElement("div");
      actions.className = "admin-row-actions";
      const edit = document.createElement("button");
      edit.textContent = "Edit";
      edit.addEventListener("click", () => {
        $("projectId").value = s.id;
        $("projectName").value = p.name || "";
        $("projectLocation").value = p.location || "";
        $("projectYear").value = p.year || "";
        $("projectType").value = p.type || "Gedung";
        $("projectStatus").value = p.status || "Selesai";
        $("projectOwner").value = p.owner || "";
        $("projectValue").value = p.value || "";
        $("projectCover").value = p.cover || "";
        $("projectDescription").value = p.description || "";
        $("projectGallery").value = (p.gallery || []).join("\n");
        $("mediaAutoplay").checked = Boolean(p.mediaSettings?.autoplay);
        $("mediaMuted").checked = p.mediaSettings?.muted !== false;
        $("projectFormTitle").textContent = "Edit proyek";
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      const del = document.createElement("button");
      del.textContent = "Hapus";
      del.className = "danger";
      del.addEventListener("click", async () => {
        if (!confirm(`Hapus proyek "${p.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        try { await deleteDoc(doc(db, "projects", s.id)); await loadProjects(); }
        catch (error) { alert("Gagal menghapus: " + error.message); }
      });
      actions.append(edit, del);
      row.append(title, actions);
      root.append(row);
    });
  } catch (error) {
    root.textContent = "Gagal memuat proyek: " + error.message;
  }
}


async function adminApi(path, options = {}) {
  const token = await currentUser.getIdToken();
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Permintaan gagal.");
  return payload;
}
function showAccountMessage(id, message, isError = false) {
  const target = $(id);
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("is-error", isError);
  target.classList.toggle("is-success", !isError);
}
async function loadAdminAccounts() {
  const root = $("adminAccountList");
  if (!root || !currentUser) return;
  root.textContent = "Memuat daftar admin...";
  try {
    const data = await adminApi("/api/admin/list");
    root.innerHTML = "";
    if (!data.admins.length) { root.textContent = "Belum ada akun admin."; return; }
    data.admins.forEach(account => {
      const row = document.createElement("article");
      row.className = "admin-account-row";
      const info = document.createElement("div");
      const name = document.createElement("b");
      name.textContent = account.displayName || account.email || "Admin";
      const meta = document.createElement("small");
      meta.textContent = account.email + " · " + (account.disabled ? "Nonaktif" : "Aktif") + (account.emailVerified ? " · Email terverifikasi" : " · Email belum terverifikasi");
      info.append(name, meta);
      const actions = document.createElement("div");
      actions.className = "admin-row-actions";
      if (account.isSuperAdmin) {
        const tag = document.createElement("span");
        tag.className = "admin-role-tag";
        tag.textContent = "SUPER ADMIN";
        actions.append(tag);
      } else {
        const remove = document.createElement("button");
        remove.className = "danger";
        remove.type = "button";
        remove.textContent = "Hapus akses";
        remove.addEventListener("click", async () => {
          if (!confirm("Hapus akun admin " + account.email + "? Akun Firebase ini akan dihapus permanen.")) return;
          try {
            await adminApi("/api/admin/delete", { method: "POST", body: JSON.stringify({ uid: account.uid }) });
            showAccountMessage("adminAccountMessage", "Akun admin berhasil dihapus.");
            await loadAdminAccounts();
          } catch (error) { showAccountMessage("adminAccountMessage", error.message, true); }
        });
        actions.append(remove);
      }
      row.append(info, actions);
      root.append(row);
    });
    if (data.truncated) {
      const note = document.createElement("p");
      note.className = "form-note";
      note.textContent = "Daftar menampilkan maksimal 1.000 akun pertama.";
      root.append(note);
    }
  } catch (error) {
    root.textContent = error.message;
    showAccountMessage("adminAccountMessage", error.message, true);
  }
}
$("refreshAdminAccounts")?.addEventListener("click", loadAdminAccounts);
$("createAdminForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("createAdminButton");
  button.disabled = true;
  showAccountMessage("createAdminMessage", "Membuat akun admin...");
  try {
    const result = await adminApi("/api/admin/create", {
      method: "POST",
      body: JSON.stringify({
        displayName: $("newAdminName").value.trim(),
        email: $("newAdminEmail").value.trim(),
        password: $("newAdminPassword").value
      })
    });
    $("createAdminForm").reset();
    showAccountMessage("createAdminMessage", result.message);
    await loadAdminAccounts();
  } catch (error) { showAccountMessage("createAdminMessage", error.message, true); }
  finally { button.disabled = false; }
});
$("accountEmailForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  showAccountMessage("accountEmailMessage", "Memproses perubahan email...");
  try {
    const credential = EmailAuthProvider.credential(currentUser.email, $("emailCurrentPassword").value);
    await reauthenticateWithCredential(currentUser, credential);
    await verifyBeforeUpdateEmail(currentUser, $("newAccountEmail").value.trim());
    $("accountEmailForm").reset();
    showAccountMessage("accountEmailMessage", "Tautan verifikasi dikirim ke email baru. Email berubah setelah tautan dikonfirmasi.");
  } catch (error) { showAccountMessage("accountEmailMessage", error.message, true); }
});
$("accountPasswordForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  showAccountMessage("accountPasswordMessage", "Memperbarui password...");
  try {
    const credential = EmailAuthProvider.credential(currentUser.email, $("passwordCurrentPassword").value);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, $("newAccountPassword").value);
    $("accountPasswordForm").reset();
    showAccountMessage("accountPasswordMessage", "Password berhasil diperbarui.");
  } catch (error) {
    showAccountMessage("accountPasswordMessage", error.code === "auth/weak-password" ? "Password terlalu lemah. Gunakan minimal 8 karakter." : error.message, true);
  }
});
