"use client";

import { useState, type ChangeEvent } from "react";
import { adminFetch } from "./api";

interface BackupFile {
  format: string;
  version: number;
  projectId: string;
  exportedAt: string;
  documentCount: number;
  storageIncluded: false;
  collections: Record<string, unknown[]>;
}

export function BackupManager({ projectId }: { projectId: string }) {
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function exportBackup() {
    setExporting(true); setError(""); setNotice("");
    const result = await adminFetch<BackupFile>("/api/admin/backup");
    setExporting(false);
    if (!result.ok || !result.data) { setError(result.error ?? "Backup gagal dibuat."); return; }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pillarians-firestore-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice(`Backup berhasil dibuat: ${result.data.documentCount} dokumen.`);
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setNotice("");
    if (file.size > 5 * 1024 * 1024) { setError("Ukuran file maksimal 5 MB."); return; }

    let backup: unknown;
    try { backup = JSON.parse(await file.text()); }
    catch { setError("File bukan JSON backup yang valid."); return; }

    if (!backup || typeof backup !== "object" || (backup as { format?: string }).format !== "pillarians-firestore-backup") {
      setError("Format file tidak dikenali sebagai backup Pillarians.");
      return;
    }
    const project = (backup as { projectId?: string }).projectId;
    if (project !== projectId) { setError("Backup berasal dari Firebase project yang berbeda."); return; }

    const confirmed = window.confirm(
      "Pulihkan data dari file ini? Dokumen dengan ID sama akan ditimpa. Dokumen yang tidak ada di backup tidak dihapus. File media asli di Firebase Storage tidak termasuk."
    );
    if (!confirmed) return;

    setRestoring(true);
    const result = await adminFetch<{ restored: number; storageIncluded: false; mode: string }>("/api/admin/backup", { method: "POST", body: backup });
    setRestoring(false);
    if (!result.ok || !result.data) { setError(result.error ?? "Pemulihan backup gagal."); return; }
    setNotice(`Pemulihan selesai: ${result.data.restored} dokumen diproses. Muat ulang halaman konten untuk melihat perubahan.`);
  }

  return (
    <div className="adm-grid" style={{ gap: 16 }}>
      <section className="adm-card">
        <h2>Ekspor backup Firestore</h2>
        <p>Ekspor proyek, layanan, artikel, sertifikasi, redirect, pengaturan situs, metadata media, dan riwayat revisi ke file JSON.</p>
        <p className="adm-hint">Project: <b>{projectId}</b></p>
        <button className="adm-btn adm-btn-primary" type="button" disabled={exporting || restoring} onClick={() => void exportBackup()}>
          {exporting ? "Membuat backup…" : "Unduh backup"}
        </button>
      </section>

      <section className="adm-card">
        <h2>Pulihkan dari file backup</h2>
        <p>Dokumen dengan ID yang sama akan ditimpa. Dokumen yang dibuat setelah backup dan tidak ada di file tidak akan dihapus.</p>
        <label className="adm-btn" htmlFor="backup-file">Pilih file JSON</label>
        <input id="backup-file" type="file" accept="application/json,.json" onChange={(event) => void importBackup(event)} disabled={restoring || exporting} />
        {restoring ? <p role="status">Memvalidasi dan memulihkan data…</p> : null}
      </section>

      <div className="adm-alert adm-alert-warn">
        <b>Batasan backup saat ini</b>
        <ul>
          <li>File hanya mencakup data Firestore, bukan file gambar/video asli di Firebase Storage.</li>
          <li>Restore menggunakan mode upsert, bukan penggantian seluruh database.</li>
          <li>Backup dibatasi maksimal 5 MB, 3.000 dokumen per koleksi, dan 10.000 dokumen total.</li>
          <li>Sebelum cutover produksi, siapkan juga Firebase managed export dan backup Storage terpisah.</li>
        </ul>
      </div>

      {error ? <p className="adm-alert adm-alert-error" role="alert">{error}</p> : null}
      {notice ? <p className="adm-alert" role="status">{notice}</p> : null}
    </div>
  );
}
