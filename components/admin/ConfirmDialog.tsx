"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** <dialog> modal native: fokus terkunci, Esc menutup, fokus kembali ke pemicu. Tombol batal jadi fokus awal (aman untuk aksi destruktif). */
export function ConfirmDialog({ open, title, children, confirmLabel, danger, busy, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="adm-dialog" aria-labelledby="adm-dlg-title" onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }} onClose={() => { if (open) onCancel(); }}>
      <h2 id="adm-dlg-title">{title}</h2>
      <div>{children}</div>
      <div className="adm-dialog-actions">
        <button type="button" className="adm-btn" autoFocus onClick={onCancel} disabled={busy}>Batal</button>
        <button type="button" className={`adm-btn ${danger ? "adm-btn-danger" : "adm-btn-primary"}`} onClick={onConfirm} disabled={busy}>
          {busy ? "Memproses…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
