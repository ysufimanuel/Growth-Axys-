"use client";

import { useState, type FormEvent } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { clientAuth } from "../../lib/firebase-client";

interface Props { email: string }

function messageOf(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") return "Password saat ini salah.";
  if (code === "auth/email-already-in-use") return "Email tersebut sudah digunakan akun lain.";
  if (code === "auth/invalid-email") return "Format email tidak valid.";
  if (code === "auth/weak-password") return "Password baru terlalu lemah. Gunakan minimal 6 karakter.";
  if (code === "auth/requires-recent-login") return "Sesi perlu diperbarui. Coba masuk kembali.";
  return error instanceof Error ? error.message : "Permintaan gagal diproses.";
}

export function AccountSettings({ email }: Props) {
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function withRecentLogin(currentPassword: string) {
    const auth = clientAuth();
    const credential = await signInWithEmailAndPassword(auth, email, currentPassword);
    const user = credential.user;
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, currentPassword));
    return { auth, user };
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newEmail = String(data.get("newEmail") ?? "").trim();
    if (!currentPassword || !newEmail || newEmail.toLowerCase() === email.toLowerCase()) {
      setEmailError("Masukkan password saat ini dan email baru yang berbeda.");
      return;
    }
    setEmailBusy(true); setEmailError(""); setEmailNotice("");
    try {
      const { auth, user } = await withRecentLogin(currentPassword);
      await verifyBeforeUpdateEmail(user, newEmail);
      await signOut(auth);
      setEmailNotice("Link verifikasi telah dikirim ke email baru. Email akun berubah setelah tautan tersebut dikonfirmasi.");
      form.reset();
    } catch (error) {
      setEmailError(messageOf(error));
    } finally { setEmailBusy(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    if (!currentPassword || newPassword.length < 6) {
      setPasswordError("Password baru wajib minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak sama.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("Password baru harus berbeda dari password saat ini.");
      return;
    }
    setPasswordBusy(true); setPasswordError(""); setPasswordNotice("");
    try {
      const { auth, user } = await withRecentLogin(currentPassword);
      await updatePassword(user, newPassword);
      await signOut(auth);
      await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
      window.location.assign("/admin/login?passwordChanged=1");
    } catch (error) {
      setPasswordError(messageOf(error));
    } finally { setPasswordBusy(false); }
  }

  return (
    <div className="adm-grid adm-grid-2">
      <form className="adm-card" onSubmit={changeEmail}>
        <h2>Ganti email</h2>
        <p>Email saat ini: <b>{email}</b></p>
        <label>Password saat ini<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
        <label>Email baru<input name="newEmail" type="email" autoComplete="email" required /></label>
        {emailError ? <p className="adm-alert adm-alert-error" role="alert">{emailError}</p> : null}
        {emailNotice ? <p className="adm-alert" role="status">{emailNotice}</p> : null}
        <button className="adm-btn adm-btn-primary" type="submit" disabled={emailBusy}>{emailBusy ? "Mengirim…" : "Kirim verifikasi email"}</button>
      </form>
      <form className="adm-card" onSubmit={changePassword}>
        <h2>Ganti password</h2>
        <p>Masukkan password saat ini untuk mengonfirmasi perubahan.</p>
        <label>Password saat ini<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
        <label>Password baru<input name="newPassword" type="password" autoComplete="new-password" minLength={6} required /></label>
        <label>Ulangi password baru<input name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required /></label>
        {passwordError ? <p className="adm-alert adm-alert-error" role="alert">{passwordError}</p> : null}
        {passwordNotice ? <p className="adm-alert" role="status">{passwordNotice}</p> : null}
        <button className="adm-btn adm-btn-primary" type="submit" disabled={passwordBusy}>{passwordBusy ? "Menyimpan…" : "Simpan password baru"}</button>
      </form>
    </div>
  );
}
