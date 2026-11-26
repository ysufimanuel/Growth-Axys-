"use client";

import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
    } finally {
      window.location.assign("/admin/login");
    }
  }
  return (
    <button type="button" className="adm-btn adm-btn-sm" onClick={logout} disabled={busy}>
      {busy ? "Keluar…" : "Keluar"}
    </button>
  );
}
