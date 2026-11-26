"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ListResult } from "../../lib/core/content-query";
import { formatDateTime } from "../../lib/core/format";
import { adminFetch } from "./api";
import { StatusBadge } from "./StatusBadge";

type Status = "all" | "draft" | "published" | "archived";
const TABS: { id: Status; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "published", label: "Terbit" },
  { id: "draft", label: "Draft" },
  { id: "archived", label: "Arsip" },
];

export function ContentList({ type, singular }: { type: string; singular: string }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page), pageSize: "20" });
    if (debounced) params.set("q", debounced);
    adminFetch<ListResult>(`/api/admin/content/${type}?${params}`).then((r) => {
      if (cancelled) return;
      if (r.ok) { setData(r.data); setError(null); } else setError(r.error);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [type, status, page, debounced, reload]);

  const filtered = status !== "all" || debounced !== "";

  return (
    <div className="adm-card">
      <div className="adm-filterbar">
        <div className="adm-search adm-field">
          <label htmlFor="adm-q" className="adm-sr">Cari {singular}</label>
          <input id="adm-q" type="search" placeholder={`Cari ${singular}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div role="group" aria-label="Filter status" className="adm-actions">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`adm-btn adm-btn-sm${status === t.id ? " adm-btn-primary" : ""}`} aria-pressed={status === t.id} onClick={() => { setStatus(t.id); setPage(1); }}>
              {t.label}{data ? ` (${data.counts[t.id]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {error ? (
          <div className="adm-alert adm-alert-error" role="alert">
            {error} <button type="button" className="adm-btn adm-btn-sm" onClick={() => setReload((n) => n + 1)}>Coba lagi</button>
          </div>
        ) : !data ? (
          <div style={{ display: "grid", gap: 10 }} aria-label="Memuat">{[0, 1, 2, 3].map((i) => <div key={i} className="adm-skel" style={{ height: 44 }} />)}</div>
        ) : data.total === 0 ? (
          <div className="adm-empty">
            <h2>{filtered ? "Tidak ada hasil" : `Belum ada ${singular}`}</h2>
            <p>{filtered ? "Ubah kata kunci atau filter status." : `Buat ${singular} pertama Anda. Konten baru selalu berstatus draft.`}</p>
            {!filtered ? <Link className="adm-btn adm-btn-primary" href={`/admin/content/${type}/new`}>+ Buat {singular}</Link> : null}
          </div>
        ) : (
          <>
            <div className="adm-tablewrap">
              <table className="adm-table adm-responsive">
                <caption className="adm-sr">Daftar {singular}</caption>
                <thead><tr><th scope="col">Judul</th><th scope="col">Status</th><th scope="col">Diubah</th></tr></thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.id}>
                      <th scope="row" style={{ fontWeight: 400 }}>
                        <Link className="adm-rowtitle" href={`/admin/content/${type}/${r.id}`}>{r.title}</Link>
                        <span className="adm-sub">{[r.slug, r.extra].filter(Boolean).join(" · ")}</span>
                      </th>
                      <td><StatusBadge status={r.publishStatus} /></td>
                      <td>{formatDateTime(r.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="adm-cards">
              {data.items.map((r) => (
                <li key={r.id}>
                  <Link className="adm-rowtitle" href={`/admin/content/${type}/${r.id}`}>{r.title}</Link>
                  <span className="adm-sub">{[r.slug, r.extra].filter(Boolean).join(" · ")}</span>
                  <div className="adm-meta"><StatusBadge status={r.publishStatus} /><small>{formatDateTime(r.updatedAt)}</small></div>
                </li>
              ))}
            </ul>
            <div className="adm-pager">
              <span>{data.total} item · halaman {data.page} dari {data.pageCount}</span>
              <span className="adm-actions">
                <button type="button" className="adm-btn adm-btn-sm" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>Sebelumnya</button>
                <button type="button" className="adm-btn adm-btn-sm" disabled={data.page >= data.pageCount} onClick={() => setPage(data.page + 1)}>Berikutnya</button>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
