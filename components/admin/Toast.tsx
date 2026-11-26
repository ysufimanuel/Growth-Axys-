"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Kind = "ok" | "error";
interface ToastItem { id: number; kind: Kind; text: string }
const Ctx = createContext<(kind: Kind, text: string) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((kind: Kind, text: string) => {
    const id = ++seq.current;
    setItems((l) => [...l.slice(-3), { id, kind, text }]);
    // Pesan error tidak hilang sendiri (WCAG 2.2.1); sukses hilang setelah 6 detik.
    if (kind === "ok") setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);
  const value = useMemo(() => push, [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="adm-toasts" role="region" aria-label="Notifikasi">
        <div aria-live="polite" aria-atomic="false" style={{ display: "contents" }}>
          {items.map((t) => (
            <div key={t.id} className={`adm-toast${t.kind === "error" ? " adm-toast-error" : ""}`} role={t.kind === "error" ? "alert" : "status"}>
              <span>{t.text}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi">Tutup</button>
            </div>
          ))}
        </div>
      </div>
    </Ctx.Provider>
  );
}
