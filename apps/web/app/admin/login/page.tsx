"use client";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { clientAuth } from "../../../lib/firebase-client";

function LoginForm() {
  const router = useRouter();
  const invited = useSearchParams().get("invited") === "1";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const auth = clientAuth();
    try {
      const cred = await signInWithEmailAndPassword(auth, String(data.get("email")).trim(), String(data.get("password")));
      const idToken = await cred.user.getIdToken(true);

      // Terima undangan bila ada (404 = tidak ada undangan tertunda -> abaikan).
      const accept = await fetch("/api/admin/invitations/accept", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
      if (accept.status === 410) throw new Error("Undangan sudah kedaluwarsa. Minta Superadmin mengirim ulang.");

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Login gagal.");
      }
      await signOut(auth); // sesi server memakai cookie HttpOnly; state client tidak diperlukan
      router.replace("/admin/dashboard");
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(code?.startsWith("auth/") ? "Email atau password salah." : err instanceof Error ? err.message : "Login gagal.");
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Admin Pillarians</h1>
        {invited ? <p>Password sudah disetel? Masuk di bawah untuk mengaktifkan akun Anda.</p> : <p>Masuk untuk mengelola konten website.</p>}
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn btn-orange" type="submit" disabled={busy}>
          {busy ? "Memproses…" : "Masuk"}
        </button>
        <p role="alert" aria-live="assertive" style={{ color: "#b3261e", minHeight: "1.5em" }}>
          {error}
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
