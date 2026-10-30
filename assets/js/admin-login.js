import { auth, firebaseConfigured } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const form = document.getElementById("loginForm");
const msg = document.getElementById("loginMessage");
form?.addEventListener("submit", async e => {
  e.preventDefault();
  if (!firebaseConfigured) { msg.textContent = "Konfigurasi Firebase belum diisi."; return; }
  msg.textContent = "Memeriksa akun...";
  try {
    const credential = await signInWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value);
    const token = await credential.user.getIdTokenResult(true);
    if (token.claims.admin !== true) {
      await auth.signOut();
      msg.textContent = "Akun belum memiliki hak akses admin. Minta administrator project mengatur custom claim admin=true.";
      return;
    }
    location.href = "index.html";
  } catch (error) { msg.textContent = "Login gagal: " + error.message; }
});