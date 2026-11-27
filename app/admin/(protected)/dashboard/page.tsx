import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DashboardMotion } from "../../../../components/admin/DashboardMotion";
import { Icon } from "../../../../components/admin/icons";
import { LiquidGlassButton, LiquidGlassHeroCard } from "../../../../components/admin/liquid-glass";
import { StatusBadge } from "../../../../components/admin/StatusBadge";
import { CONTENT_LABEL } from "../../../../lib/core/admin-nav";
import { actionLabel, formatDateLong, formatDateTime } from "../../../../lib/core/format";
import { can } from "../../../../lib/core/permissions";
import { actorFromSessionCookie, SESSION_COOKIE } from "../../../../lib/server/auth";
import { loadActivity, loadCounts, loadRecent } from "../../../../lib/server/dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ringkasan" };

const TYPES = ["projects", "articles", "services", "certifications"] as const;
const ROLE_LABEL: Record<string, string> = { superadmin: "Superadmin", admin: "Admin" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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

  const canEdit = can(actor.role, "content.edit");
  const canMedia = can(actor.role, "media.manage");
  const canAudit = can(actor.role, "audit.view");

  const [counts, recent, activity] = await Promise.all([
    loadCounts(),
    loadRecent(),
    canAudit ? loadActivity() : Promise.resolve(null),
  ]);
  const loadedAt = Date.now(); // waktu server memuat data (halaman dinamis, tidak di-cache)

  // Agregat hanya dihitung dari data nyata; jika gagal dimuat, KPI menampilkan error, bukan angka 0.
  const sum = counts.ok
    ? counts.data.reduce(
        (a, c) => ({ total: a.total + c.total, published: a.published + c.published, draft: a.draft + c.draft, archived: a.archived + c.archived }),
        { total: 0, published: 0, draft: 0, archived: 0 },
      )
    : null;
  const draftTypes = counts.ok ? counts.data.filter((c) => c.draft > 0).sort((a, b) => b.draft - a.draft) : [];
  const topDraft = draftTypes[0];

  return (
    <DashboardMotion>
      {/* 1. Header / hero */}
      <LiquidGlassHeroCard
        data-reveal
        eyebrow={<>{formatDateLong(loadedAt)} · {ROLE_LABEL[actor.role ?? ""] ?? "Admin"}</>}
        title="Selamat datang"
        description={
          sum
            ? sum.draft > 0
              ? `${sum.draft} draft menunggu ditinjau dari total ${sum.total} konten.`
              : `Semua dari ${sum.total} konten sudah ditangani. Tidak ada draft tertunda.`
            : "Ringkasan kondisi konten website Anda."
        }
        meta={<>Data dimuat {formatDateTime(loadedAt)} WIB, langsung dari database.</>}
        actions={
          canEdit ? (
            <LiquidGlassButton href="/admin/content/articles/new" variant="primary" icon={<Icon name="plus" size={16} />}>
              Artikel baru
            </LiquidGlassButton>
          ) : null
        }
      />

      {/* 2. KPI */}
      <section aria-labelledby="kpi-h" className="adm-section">
        <h2 id="kpi-h" className="adm-section-title">Ikhtisar konten</h2>
        {counts.ok && sum ? (
          <div className="adm-kpi-grid">
            <div className="adm-kpi adm-glass-card" data-reveal>
              <span className="adm-kpi-label">Total konten</span>
              <span className="adm-kpi-value">{sum.total}</span>
              <span className="adm-kpi-sub">Proyek, layanan, artikel, sertifikasi</span>
            </div>
            <div className="adm-kpi adm-glass-card adm-kpi-ok" data-reveal>
              <span className="adm-kpi-label">Terbit</span>
              <span className="adm-kpi-value">{sum.published}</span>
              <span className="adm-kpi-sub">Tampil di website publik</span>
            </div>
            {sum.draft > 0 && topDraft && canEdit ? (
              <Link className="adm-kpi adm-glass-card adm-kpi-warn adm-kpi-link" data-reveal href={`/admin/content/${topDraft.type}?status=draft`}>
                <span className="adm-kpi-label"><Icon name="alert" size={14} />Draft perlu perhatian</span>
                <span className="adm-kpi-value">{sum.draft}</span>
                <span className="adm-kpi-sub">
                  Terbanyak di {CONTENT_LABEL[topDraft.type].plural} ({topDraft.draft}) <Icon name="arrow" size={14} />
                </span>
              </Link>
            ) : (
              <div className={`adm-kpi adm-glass-card${sum.draft > 0 ? " adm-kpi-warn" : ""}`} data-reveal>
                <span className="adm-kpi-label">Draft perlu perhatian</span>
                <span className="adm-kpi-value">{sum.draft}</span>
                <span className="adm-kpi-sub">{sum.draft > 0 ? "Belum diterbitkan" : "Tidak ada draft tertunda"}</span>
              </div>
            )}
            <div className="adm-kpi adm-glass-card" data-reveal>
              <span className="adm-kpi-label">Diarsipkan</span>
              <span className="adm-kpi-value">{sum.archived}</span>
              <span className="adm-kpi-sub">Disembunyikan dari publik</span>
            </div>
          </div>
        ) : (
          <ErrorBox what="Jumlah konten" />
        )}
      </section>

      {/* 3. Aksi cepat (sesuai izin: tidak ada pintasan ke alur terlarang) */}
      {canEdit || canMedia ? (
        <section aria-labelledby="qa-h" className="adm-section">
          <h2 id="qa-h" className="adm-section-title">Aksi cepat</h2>
          <div className="adm-qa adm-glass-card" data-reveal>
            {canEdit ? (
              <div className="adm-qa-primary">
                {(["projects", "articles"] as const).map((t) => (
                  <Link key={t} className="adm-qa-tile" href={`/admin/content/${t}/new`}>
                    <span className="adm-qa-icon"><Icon name={t} size={20} /></span>
                    <span className="adm-qa-text">
                      <b>{cap(CONTENT_LABEL[t].singular)} baru</b>
                      <small>Dibuat sebagai draft</small>
                    </span>
                    <Icon name="plus" size={16} className="adm-icon adm-qa-go" />
                  </Link>
                ))}
              </div>
            ) : null}
            <ul className="adm-qa-secondary" aria-label="Pintasan lain">
              {canEdit
                ? (["services", "certifications"] as const).map((t) => (
                    <li key={t}>
                      <Link className="adm-chip" href={`/admin/content/${t}/new`}><Icon name={t} size={16} />{cap(CONTENT_LABEL[t].singular)} baru</Link>
                    </li>
                  ))
                : null}
              {canMedia ? (
                <li><Link className="adm-chip" href="/admin/media"><Icon name="media" size={16} />Pustaka media</Link></li>
              ) : null}
              <li>
                <a className="adm-chip" href="/" target="_blank" rel="noopener">
                  <Icon name="external" size={16} />Buka website<span className="adm-sr"> (tab baru)</span>
                </a>
              </li>
            </ul>
          </div>
        </section>
      ) : null}

      {/* 4. Rincian per jenis konten */}
      <section aria-labelledby="bd-h" className="adm-section">
        <h2 id="bd-h" className="adm-section-title">Per jenis konten</h2>
        {counts.ok ? (
          <div className="adm-type-grid">
            {TYPES.flatMap((t) => counts.data.filter((c) => c.type === t)).map((c) => {
              const body = (
                <>
                  <span className="adm-type-head">
                    <span className="adm-qa-icon"><Icon name={c.type} size={18} /></span>
                    <span className="adm-type-name">{CONTENT_LABEL[c.type].plural}</span>
                    <span className="adm-type-total">{c.total}</span>
                  </span>
                  <span className="adm-type-split">
                    <span><b>{c.published}</b> terbit</span>
                    <span><b>{c.draft}</b> draft</span>
                    <span><b>{c.archived}</b> arsip</span>
                  </span>
                </>
              );
              return canEdit ? (
                <Link key={c.type} className="adm-card adm-type-card" data-reveal href={`/admin/content/${c.type}`} aria-label={`${CONTENT_LABEL[c.type].plural}: ${c.total} total, buka daftar`}>
                  {body}
                </Link>
              ) : (
                <div key={c.type} className="adm-card adm-type-card" data-reveal>{body}</div>
              );
            })}
          </div>
        ) : (
          <ErrorBox what="Rincian konten" />
        )}
      </section>

      <div className="adm-grid adm-grid-2 adm-section">
        {/* 5. Perubahan terbaru */}
        <section className="adm-card" aria-labelledby="recent-h" data-reveal>
          <h2 id="recent-h">Terakhir diubah</h2>
          {!recent.ok ? (
            <ErrorBox what="Konten terbaru" />
          ) : recent.data.length === 0 ? (
            <div className="adm-empty">
              <h3>Belum ada konten</h3>
              <p>Konten yang Anda buat akan muncul di sini.</p>
              {canEdit ? <Link className="adm-btn adm-btn-primary" href="/admin/content/projects/new"><Icon name="plus" size={16} />Buat proyek pertama</Link> : null}
            </div>
          ) : (
            <ul className="adm-timeline">
              {recent.data.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <span className="adm-tl-row">
                    <Link className="adm-rowtitle" href={`/admin/content/${r.type}/${r.id}`}>{r.title}</Link>
                    <StatusBadge status={r.status} />
                  </span>
                  <small>{CONTENT_LABEL[r.type].plural} · {formatDateTime(r.updatedAt)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="adm-stack">
          {/* 7. Perhatian: hanya dari data nyata */}
          {counts.ok ? (
            <section className="adm-card" aria-labelledby="att-h" data-reveal>
              <h2 id="att-h">Perlu perhatian</h2>
              {draftTypes.length === 0 ? (
                <p className="adm-hint">Tidak ada draft yang menunggu. Semua konten sudah terbit atau diarsipkan.</p>
              ) : (
                <ul className="adm-attn">
                  {draftTypes.map((c) => (
                    <li key={c.type}>
                      {canEdit ? (
                        <Link href={`/admin/content/${c.type}?status=draft`}>
                          <span><b>{c.draft}</b> draft {CONTENT_LABEL[c.type].singular}</span>
                          <Icon name="arrow" size={16} />
                        </Link>
                      ) : (
                        <span><b>{c.draft}</b> draft {CONTENT_LABEL[c.type].singular}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {/* 6. Aktivitas: hanya untuk izin audit.view */}
          {activity ? (
            <section className="adm-card" aria-labelledby="act-h" data-reveal>
              <h2 id="act-h">Aktivitas terbaru</h2>
              {!activity.ok ? (
                <ErrorBox what="Aktivitas" />
              ) : activity.data.length === 0 ? (
                <p className="adm-hint">Belum ada aktivitas tercatat.</p>
              ) : (
                <ul className="adm-timeline">
                  {activity.data.map((a) => (
                    <li key={a.id}>
                      <span>
                        <b>{a.actorRole ? (ROLE_LABEL[a.actorRole] ?? a.actorRole) : "Sistem"}</b> {actionLabel(a.action)}
                      </span>
                      {a.summary ? <span className="adm-tl-summary">{a.summary}</span> : null}
                      <time>{formatDateTime(a.timestamp)}</time>
                    </li>
                  ))}
                </ul>
              )}
              <Link className="adm-more" href="/admin/audit">Lihat semua aktivitas <Icon name="arrow" size={14} /></Link>
            </section>
          ) : null}
        </div>
      </div>
    </DashboardMotion>
  );
}
