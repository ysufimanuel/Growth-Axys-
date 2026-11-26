import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { StatusBadge } from "../../../../components/admin/StatusBadge";
import { CONTENT_LABEL } from "../../../../lib/core/admin-nav";
import { actionLabel, formatDateTime } from "../../../../lib/core/format";
import { can } from "../../../../lib/core/permissions";
import { actorFromSessionCookie, SESSION_COOKIE } from "../../../../lib/server/auth";
import { loadActivity, loadCounts, loadRecent } from "../../../../lib/server/dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ringkasan" };

function ErrorBox({ what }: { what: string }) {
  return (
    <div className="adm-alert adm-alert-error" role="alert">
      {what} gagal dimuat. Muat ulang halaman; jika berulang, periksa koneksi Firestore dan log server.
    </div>
  );
}

export default async function DashboardPage() {
  const actor = await actorFromSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  if (!actor || !can(actor.role, "dashboard.view")) notFound();

  const [counts, recent, activity] = await Promise.all([
    loadCounts(),
    loadRecent(),
    can(actor.role, "audit.view") ? loadActivity() : Promise.resolve(null),
  ]);

  const totalDrafts = counts.ok ? counts.data.reduce((n, c) => n + c.draft, 0) : null;

  return (
    <>
      <div className="adm-pagehead">
        <div>
          <h1>Ringkasan</h1>
          <p>Kondisi konten website saat ini, langsung dari database.</p>
        </div>
        {can(actor.role, "content.edit") ? (
          <div className="adm-actions">
            {(["projects", "articles"] as const).map((t) => (
              <Link key={t} className="adm-btn adm-btn-primary" href={`/admin/content/${t}/new`}>
                + {CONTENT_LABEL[t].singular[0]!.toUpperCase() + CONTENT_LABEL[t].singular.slice(1)} baru
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <section aria-labelledby="kpi-h" className="adm-grid">
        <h2 id="kpi-h" className="adm-sr">Jumlah konten</h2>
        {counts.ok ? (
          <div className="adm-grid adm-grid-kpi">
            {counts.data.map((c) => (
              <div key={c.type} className="adm-card adm-stat">
                <Link href={`/admin/content/${c.type}`}>
                  <span className="adm-stat-label">{CONTENT_LABEL[c.type].plural}</span>
                  <span className="adm-stat-value" style={{ display: "block", marginTop: 6 }}>{c.total}</span>
                </Link>
                <span className="adm-stat-sub">{c.published} terbit · {c.draft} draft · {c.archived} arsip</span>
              </div>
            ))}
          </div>
        ) : (
          <ErrorBox what="Jumlah konten" />
        )}
        {totalDrafts ? (
          <p className="adm-alert adm-alert-warn">Ada {totalDrafts} draft yang belum diterbitkan.</p>
        ) : null}
      </section>

      <div className="adm-grid adm-grid-2" style={{ marginTop: 14 }}>
        <section className="adm-card" aria-labelledby="recent-h">
          <h2 id="recent-h">Terakhir diubah</h2>
          {!recent.ok ? (
            <ErrorBox what="Konten terbaru" />
          ) : recent.data.length === 0 ? (
            <div className="adm-empty">
              <h2>Belum ada konten</h2>
              <p>Konten yang Anda buat akan muncul di sini.</p>
            </div>
          ) : (
            <ul className="adm-timeline">
              {recent.data.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <span>
                    <Link className="adm-rowtitle" href={`/admin/content/${r.type}/${r.id}`}>{r.title}</Link>{" "}
                    <StatusBadge status={r.status} />
                  </span>
                  <small>{CONTENT_LABEL[r.type].plural} · {formatDateTime(r.updatedAt)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        {activity ? (
          <section className="adm-card" aria-labelledby="act-h">
            <h2 id="act-h">Aktivitas terbaru</h2>
            {!activity.ok ? (
              <ErrorBox what="Aktivitas" />
            ) : activity.data.length === 0 ? (
              <p className="adm-hint">Belum ada aktivitas tercatat.</p>
            ) : (
              <ul className="adm-timeline">
                {activity.data.map((a) => (
                  <li key={a.id}>
                    <span>{a.actorRole ?? "Sistem"} {actionLabel(a.action)}{a.summary ? `: ${a.summary}` : ""}</span>
                    <time>{formatDateTime(a.timestamp)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}
