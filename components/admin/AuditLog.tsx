"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "./api";
import { LiquidGlass } from "../../components/admin/liquid-glass";

interface AuditItem {
  id: string;
  actorUid?: string;
  actorRole?: string | null;
  action?: string;
  targetType?: string;
  targetId?: string;
  summary?: string;
  timestamp: number | null;
}

function stamp(value: number | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AuditLog() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await adminFetch<{ items: AuditItem[] }>("/api/admin/audit");
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.error ?? "Audit log gagal dimuat.");
      return;
    }
    setItems(result.data.items ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const actions = useMemo(() => Array.from(new Set(items.map((item) => item.action).filter((v): v is string => Boolean(v)))).sort(), [items]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const text = [item.actorUid, item.actorRole, item.action, item.targetType, item.targetId, item.summary].filter(Boolean).join(" ").toLowerCase();
      return (!q || text.includes(q)) && (actionFilter === "all" || item.action === actionFilter);
    });
  }, [items, query, actionFilter]);

  return (
    <section className="adm-audit">
      <div className="adm-audit-toolbar">
        <label>Cari aktivitas
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Aktor, aksi, resource, ringkasan" />
        </label>
        <label>Jenis aksi
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">Semua aksi</option>
            {actions.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
        </label>
        <button type="button" className="adm-btn" onClick={() => void load()} disabled={loading}>{loading ? "Memuat…" : "Muat ulang"}</button>
      </div>

      {error ? <div className="adm-alert adm-alert-error" role="alert">{error} <button type="button" className="adm-btn adm-btn-sm" onClick={() => void load()}>Coba lagi</button></div> : null}
      {loading ? <LiquidGlass className="adm-card" role="status">Memuat audit log…</LiquidGlass> : !error && visible.length === 0 ? (
        <LiquidGlass className="adm-card adm-empty"><h2>Belum ada aktivitas</h2><p>Aktivitas yang dicatat server akan muncul di sini.</p></LiquidGlass>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <LiquidGlass className="adm-card"><div className="adm-tablewrap">
          <table className="adm-table">
            <caption className="adm-sr">Riwayat audit, maksimal 100 aktivitas terbaru</caption>
            <thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Resource</th><th>Ringkasan</th></tr></thead>
            <tbody>
              {visible.map((item) => <tr key={item.id}>
                <td>{stamp(item.timestamp)}</td>
                <td><strong>{item.actorRole ?? "Sistem"}</strong><small className="adm-users-name">{item.actorUid ?? "—"}</small></td>
                <td>{item.action ?? "—"}</td>
                <td>{item.targetType ?? "—"}<small className="adm-users-name">{item.targetId ?? ""}</small></td>
                <td>{item.summary || "—"}</td>
              </tr>)}
            </tbody>
          </table>
        </div></LiquidGlass>
      ) : null}
      <p className="adm-hint">Menampilkan maksimal 100 aktivitas terbaru. Log bersifat hanya-baca; perubahan dan penghapusan tidak tersedia.</p>
    </section>
  );
}
