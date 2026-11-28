"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminFetch } from "./api";
import { LiquidGlass } from "../../components/admin/liquid-glass";

type Settings = { title: string; description: string; ogImage: string; index: boolean; follow: boolean };
const empty: Settings = { title: "", description: "", ogImage: "", index: true, follow: true };

export function GlobalSeoSettings() {
  const [value, setValue] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let live = true;
    void adminFetch<{ settings: Settings }>("/api/admin/settings/seo").then((r) => {
      if (!live) return;
      setLoading(false);
      if (!r.ok || !r.data) { setError(r.error ?? "Pengaturan gagal dimuat."); return; }
      setValue({ ...empty, ...r.data.settings });
    });
    return () => { live = false; };
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    const r = await adminFetch<{ settings: Settings }>("/api/admin/settings/seo", { method: "PUT", body: value });
    setSaving(false);
    if (!r.ok) { setError(r.error ?? "Pengaturan gagal disimpan."); return; }
    setNotice("Pengaturan SEO global tersimpan. Metadata publik diperbarui pada request berikutnya.");
  }

  if (loading) return <p role="status">Memuat pengaturan SEO…</p>;
  return <LiquidGlass as="form" className="adm-card adm-global-seo" onSubmit={save}>
    <div><h2>Metadata situs</h2><p>Nilai kosong memakai default dari konfigurasi situs. Pengaturan ini berlaku sebagai metadata dasar, bukan pengganti SEO tiap halaman.</p></div>
    <label>Judul situs<input maxLength={120} value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} placeholder="PT Pillarians Group" /></label>
    <label>Deskripsi situs<textarea rows={4} maxLength={300} value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} placeholder="Deskripsi singkat perusahaan" /></label>
    <label>Gambar Open Graph (URL HTTPS)<input type="url" value={value.ogImage} onChange={(e) => setValue({ ...value, ogImage: e.target.value })} placeholder="https://…" /></label>
    <fieldset><legend>Pengindeksan mesin pencari</legend>
      <label className="adm-check"><input type="checkbox" checked={value.index} onChange={(e) => setValue({ ...value, index: e.target.checked })} /> Izinkan mesin pencari mengindeks situs (index)</label>
      <label className="adm-check"><input type="checkbox" checked={value.follow} onChange={(e) => setValue({ ...value, follow: e.target.checked })} /> Izinkan mesin pencari mengikuti tautan (follow)</label>
      <p className="adm-hint">Mematikan index menambahkan noindex ke metadata global. Jangan matikan untuk situs publik kecuali memang disengaja.</p>
    </fieldset>
    {error ? <p className="adm-alert adm-alert-error" role="alert">{error}</p> : null}
    {notice ? <p className="adm-alert" role="status">{notice}</p> : null}
    <button className="adm-btn adm-btn-primary" disabled={saving} type="submit">{saving ? "Menyimpan…" : "Simpan pengaturan"}</button>
  </LiquidGlass>;
}
