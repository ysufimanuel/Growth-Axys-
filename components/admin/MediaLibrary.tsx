"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./api";
import { LiquidGlass } from "../../components/admin/liquid-glass";

type Asset = { id: string; name: string; url: string; contentType: string; size: number; createdAt?: { _seconds?: number } | null };

function formatBytes(value: number) {
  return value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary() {
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await adminFetch<{ items: Asset[] }>("/api/admin/media");
    setLoading(false);
    if (!result.ok || !result.data) { setError(result.error ?? "Media gagal dimuat."); return; }
    setItems(result.data.items ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setNotice("");
    if (file.size > 10 * 1024 * 1024) { setError("Ukuran maksimal 10 MB."); return; }
    setUploading(true);
    try {
      const signed = await adminFetch<{ uploadUrl: string; objectPath: string }>("/api/admin/media", {
        method: "POST",
        body: JSON.stringify({ action: "sign", fileName: file.name, contentType: file.type, size: file.size }),
      });
      if (!signed.ok || !signed.data) throw new Error(signed.error ?? "Gagal menyiapkan upload.");
      const uploaded = await fetch(signed.data.uploadUrl, {
        method: "PUT", headers: { "Content-Type": file.type }, body: file,
      });
      if (!uploaded.ok) throw new Error("Upload ke Firebase Storage gagal.");
      const saved = await adminFetch<{ id: string }>("/api/admin/media", {
        method: "POST",
        body: JSON.stringify({ action: "complete", objectPath: signed.data.objectPath, fileName: file.name, contentType: file.type, size: file.size }),
      });
      if (!saved.ok) throw new Error(saved.error ?? "File terunggah, tetapi pencatatan media gagal.");
      setNotice("Media berhasil diunggah.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setUploading(false);
    }
  }

  return <section className="adm-media">
    <LiquidGlass className="adm-card adm-media-upload">
      <div><h2>Unggah media</h2><p>JPG, PNG, WebP, AVIF, atau GIF. Maksimal 10 MB per file.</p></div>
      <label className="adm-btn adm-btn-primary">{uploading ? "Mengunggah…" : "Pilih file"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" disabled={uploading} onChange={upload} hidden /></label>
    </LiquidGlass>
    {error ? <div className="adm-alert adm-alert-error" role="alert">{error}</div> : null}
    {notice ? <div className="adm-alert" role="status">{notice}</div> : null}
    <div className="adm-media-grid">
      {loading ? <p role="status">Memuat media…</p> : items.length === 0 ? <LiquidGlass className="adm-card"><h2>Belum ada media</h2><p>File yang diunggah akan muncul di sini.</p></LiquidGlass> : items.map((item) => <LiquidGlass as="article" className="adm-card adm-media-item" key={item.id}>
        <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${item.name}`}><img src={item.url} alt={item.name} loading="lazy" /></a>
        <div><b title={item.name}>{item.name}</b><small>{item.contentType} · {formatBytes(item.size)}</small><button type="button" className="adm-btn adm-btn-sm" onClick={() => void navigator.clipboard.writeText(item.url)}>Salin URL</button></div>
      </LiquidGlass>)}
    </div>
    <p className="adm-hint">Daftar menampilkan 100 unggahan terbaru. Penghapusan media belum disediakan agar file yang mungkin masih dipakai konten tidak terhapus tanpa pemeriksaan referensi.</p>
  </section>;
}
