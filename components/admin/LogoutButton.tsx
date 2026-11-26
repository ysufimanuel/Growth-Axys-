"use client";

import { useState } from "react";
import { Icon } from "./icons";

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
      <Icon name="logout" size={16} />
      <span>{busy ? "Keluar…" : "Keluar"}</span>
    </button>
  );
}
