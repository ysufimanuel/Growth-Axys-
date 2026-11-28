"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./api";
import { LiquidGlass } from "../../components/admin/liquid-glass";

type RedirectItem = { id: string; from: string; to: string; statusCode: 301 | 308; active: boolean };

export function RedirectManager() {
  const [items, setItems] = useState<RedirectItem[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusCode, setStatusCode] = useState<"301" | "308">("308");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const result = await adminFetch<{ items: RedirectItem[] }>("/api/admin/redirects");
    setLoading(false);
    if (!result.ok || !result.data) { setError(result.error ?? "Redirect gagal dimuat."); return; }
    setItems(result.data.items ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const result = await adminFetch<{ id: string }>("/api/admin/redirects", {
      method: "POST",
      body: JSON.stringify({ from: from.trim(), to: to.trim(), statusCode: Number(statusCode) }),
    });
    setSaving(false);
    if (!result.ok) { setError(result.error ?? "Redirect tidak berhasil dibuat."); return; }
    setFrom(""); setTo(""); setNotice("Redirect berhasil dibuat.");
    await load();
  }

  return <section className="adm-audit">
    <LiquidGlass as="form" className="adm-card adm-redirect-form" onSubmit={create}>
      <h2>Tambah redirect</h2>
      <p>Gunakan path relatif seperti <code>/layanan-lama</code> atau tujuan HTTPS. Server akan menolak sumber duplikat dan loop.</p>
      <label>Path asal
        <input required maxLength={300} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/halaman-lama" />
      </label>
      <label>Tujuan
        <input required maxLength={500} value={to} onChange={(e) => setTo(e.target.value)} placeholder="/halaman-baru atau https://…" />
      </label>
      <label>Kode redirect
        <select value={statusCode} onChange={(e) => setStatusCode(e.target.value as "301" | "308")}>
          <option value="308">308 — permanen</option>
          <option value="301">301 — permanen</option>
        </select>
      </label>
      <button className="adm-btn adm-btn-primary" type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Tambah redirect"}</button>
    </LiquidGlass>
    {error ? <div className="adm-alert adm-alert-error" role="alert">{error}</div> : null}
    {notice ? <div className="adm-alert" role="status">{notice}</div> : null}
    <LiquidGlass className="adm-card"><div className="adm-tablewrap">
      <h2>Daftar redirect</h2>
      {loading ? <p role="status">Memuat redirect…</p> : items.length === 0 ? <p>Belum ada redirect tersimpan.</p> : <table className="adm-table">
        <thead><tr><th>Path asal</th><th>Tujuan</th><th>Kode</th><th>Status</th></tr></thead>
        <tbody>{items.map((item) => <tr key={item.id}><td><code>{item.from}</code></td><td><code>{item.to}</code></td><td>{item.statusCode}</td><td>{item.active ? "Aktif" : "Nonaktif"}</td></tr>)}</tbody>
      </table>}
    </div></LiquidGlass>
    <p className="adm-hint">Saat ini tersedia tambah dan lihat. Pengubahan status/penghapusan belum disediakan karena endpoint server belum ada.</p>
  </section>;
}
