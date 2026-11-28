"use client";

import { useState } from "react";
import { adminFetch } from "./api";
import { useToast } from "./Toast";

type ContentType = "projects" | "services" | "articles";
type Props = {
  type: ContentType;
  id: string;
  instagramUrl: string;
  mediaRatio: string;
};

const ratios = ["1 / 1", "4 / 5", "3 / 4", "2 / 3", "3 / 2", "9 / 16", "16 / 9", "1.91 / 1", "1 / 2.1", "3 / 1"];

export function PageSeoMediaEditor({ type, id, instagramUrl: initialUrl, mediaRatio: initialRatio }: Props) {
  const toast = useToast();
  const [url, setUrl] = useState(initialUrl);
  const [ratio, setRatio] = useState(ratios.includes(initialRatio) ? initialRatio : "4 / 5");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function importAndSave() {
    setBusy(true);
    setError("");
    const imported = await adminFetch<{ url: string; caption: string; thumbnailUrl?: string }>("/api/admin/instagram/import", {
      method: "POST", body: { url: url.trim() },
    });
    if (!imported.ok || !imported.data) {
      setError(imported.error || "Impor Instagram gagal.");
      setBusy(false);
      return;
    }

    const data = imported.data;
    const patch: Record<string, unknown> = {
      instagramUrl: data.url,
      mediaRatio: ratio,
    };
    if (type === "projects") {
      if (data.thumbnailUrl) patch.cover = data.thumbnailUrl;
      if (data.caption) patch.scope = data.caption;
    } else {
      if (data.thumbnailUrl) patch.image = data.thumbnailUrl;
      if (data.caption) patch.content = data.caption;
      if (type === "articles" && data.caption) patch.excerpt = data.caption.slice(0, 400);
    }

    const saved = await adminFetch(`/api/admin/content/${type}/${id}`, { method: "PATCH", body: patch });
    setBusy(false);
    if (!saved.ok) {
      setError(saved.error || "Media gagal disimpan.");
      return;
    }
    setUrl(data.url);
    toast("ok", data.caption ? "Instagram diimpor dan media/deskripsi disimpan." : "Link dan media disimpan. Caption tidak tersedia dari Meta.");
  }

  async function saveRatio() {
    setBusy(true);
    setError("");
    const saved = await adminFetch(`/api/admin/content/${type}/${id}`, {
      method: "PATCH", body: { mediaRatio: ratio },
    });
    setBusy(false);
    if (!saved.ok) setError(saved.error || "Rasio gagal disimpan.");
    else toast("ok", "Rasio media disimpan.");
  }

  return (
    <div className="adm-card" style={{ padding: "1rem", margin: ".5rem 0 1rem" }}>
      <strong>Media Instagram & rasio</strong>
      <p className="adm-hint">Atur media dari halaman SEO ini. Impor akan menyimpan link dan thumbnail, serta mengganti deskripsi dengan caption jika Meta menyediakannya.</p>
      <div className="adm-formgrid">
        <div className="adm-field adm-span">
          <label htmlFor={`ig-${id}`}>URL postingan Instagram</label>
          <input id={`ig-${id}`} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/p/..." />
        </div>
        <div className="adm-field">
          <label htmlFor={`ratio-${id}`}>Rasio tampilan</label>
          <select id={`ratio-${id}`} value={ratio} onChange={(e) => setRatio(e.target.value)}>
            {ratios.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="adm-actions" style={{ alignItems: "end" }}>
          <button type="button" className="adm-btn" disabled={busy} onClick={() => void saveRatio()}>Simpan rasio</button>
          <button type="button" className="adm-btn adm-btn-primary" disabled={busy || !url.trim()} onClick={() => void importAndSave()}>{busy ? "Menyimpan…" : "Impor & simpan"}</button>
        </div>
      </div>
      {error ? <p className="adm-field-error" role="alert">{error}</p> : null}
    </div>
  );
}
