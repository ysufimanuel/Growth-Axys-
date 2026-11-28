"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentType } from "../../lib/core/content-fields";
import { adminFetch } from "./api";
import { LiquidGlass } from "../../components/admin/liquid-glass";

interface Revision {
  id: string;
  timestamp: number | null;
  editorUid: string;
  deleted: boolean;
  title: string;
  publishStatus: "draft" | "published" | "archived";
}

export function RevisionHistory({ type, contentId }: { type: ContentType; contentId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Revision[]>([]);
  const [canRestore, setCanRestore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const result = await adminFetch<{ revisions: Revision[]; canRestore: boolean }>(`/api/admin/content/${type}/${contentId}/revisions`);
    setLoading(false);
    if (!result.ok || !result.data) { setError(result.error ?? "Riwayat gagal dimuat."); return; }
    setItems(result.data.revisions);
    setCanRestore(result.data.canRestore);
  }, [type, contentId]);

  useEffect(() => { void load(); }, [load]);

  async function restore(revision: Revision) {
    if (!window.confirm(`Pulihkan versi "${revision.title}"? Kondisi konten saat ini akan disimpan sebagai checkpoint.`)) return;
    setBusyId(revision.id); setError(""); setNotice("");
    const result = await adminFetch(`/api/admin/content/${type}/${contentId}/revisions/${revision.id}`, { method: "POST", body: {} });
    setBusyId("");
    if (!result.ok) { setError(result.error ?? "Revisi gagal dipulihkan."); return; }
    setNotice("Versi berhasil dipulihkan. Kondisi sebelumnya tersimpan sebagai checkpoint.");
    await load();
    router.refresh();
  }

  return (
    <LiquidGlass as="section" className="adm-card" style={{ marginTop: 16 }}>
      <div className="adm-pagehead">
        <div><h2>Riwayat revisi</h2><p>Snapshot otomatis dibuat sebelum konten diperbarui atau dihapus.</p></div>
        <button className="adm-btn" type="button" onClick={() => void load()} disabled={loading}>Muat ulang</button>
      </div>
      {error ? <p className="adm-alert adm-alert-error" role="alert">{error}</p> : null}
      {notice ? <p className="adm-alert" role="status">{notice}</p> : null}
      {loading ? <p role="status">Memuat riwayat…</p> : items.length === 0 ? <p className="adm-hint">Belum ada snapshot. Revisi pertama akan dibuat saat konten diperbarui.</p> : (
        <ol className="adm-timeline">
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <b>{item.title}</b>
                <small>{item.timestamp ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.timestamp)) : "Waktu tidak tersedia"} · {item.deleted ? "Snapshot sebelum penghapusan" : item.publishStatus} · {item.editorUid || "Sistem"}</small>
              </div>
              {canRestore ? <button className="adm-btn adm-btn-sm" type="button" disabled={Boolean(busyId)} onClick={() => void restore(item)}>{busyId === item.id ? "Memulihkan…" : "Pulihkan"}</button> : null}
            </li>
          ))}
        </ol>
      )}
      {!canRestore ? <p className="adm-hint">Pemulihan revisi hanya tersedia untuk Superadmin.</p> : null}
    </LiquidGlass>
  );
}
