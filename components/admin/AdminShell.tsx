"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { activeNavId, NAV_GROUP_LABEL, type NavItem } from "../../lib/core/admin-nav";
import { LogoutButton } from "./LogoutButton";
import { ToastProvider } from "./Toast";

interface Props {
  nav: NavItem[];
  email: string;
  roleLabel: string;
  children: ReactNode;
}

const SEGMENT_LABEL: Record<string, string> = {
  admin: "Admin", dashboard: "Ringkasan", profile: "Akun saya", content: "Konten", projects: "Proyek", services: "Layanan", articles: "Artikel",
  certifications: "Sertifikasi", new: "Baru", users: "Akun", profile: "Akun saya", media: "Media", seo: "SEO", redirects: "Redirect", audit: "Audit log", backup: "Backup & Restore", settings: "Pengaturan",
};

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((seg, i) => ({
    href: "/" + parts.slice(0, i + 1).join("/"),
    // Segmen dinamis (ID dokumen) tampil sebagai "Edit".
    label: SEGMENT_LABEL[seg] ?? "Edit",
  }));
  // "Konten" dan "Admin" bukan halaman sendiri: tampilkan sebagai teks, bukan tautan mati.
  const NO_PAGE = new Set(["/admin", "/admin/content", "/admin/settings"]);
  return (
    <nav className="adm-crumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href}>
              {last ? <span aria-current="page">{c.label}</span> : NO_PAGE.has(c.href) ? <span>{c.label}</span> : <Link href={c.href}>{c.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function NavList({ nav, activeId, onNavigate }: { nav: NavItem[]; activeId: string | null; onNavigate?: () => void }) {
  const groups = (Object.keys(NAV_GROUP_LABEL) as NavItem["group"][]).map((g) => ({ g, items: nav.filter((n) => n.group === g) })).filter((x) => x.items.length);
  return (
    <nav className="adm-nav" aria-label="Menu utama">
      {groups.map(({ g, items }) => (
        <div className="adm-nav-group" key={g}>
          <h2>{NAV_GROUP_LABEL[g]}</h2>
          <ul>
            {items.map((i) => (
              <li key={i.id}>
                {i.available ? (
                  <Link className="adm-nav-link" href={i.href} aria-current={activeId === i.id ? "page" : undefined} onClick={onNavigate}>
                    {i.label}
                  </Link>
                ) : (
                  // Belum dibangun: bukan tautan, ditandai jelas (tidak ada tombol mati yang menyesatkan).
                  <span className="adm-nav-link" aria-disabled="true">
                    {i.label}
                    <span className="adm-soon">Segera</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link className="adm-brand" href="/admin/dashboard">
      <span className="adm-brand-mark" aria-hidden="true">P</span>
      <span>Pillarians<small>Admin</small></span>
    </Link>
  );
}

export function AdminShell({ nav, email, roleLabel, children }: Props) {
  const pathname = usePathname();
  const drawer = useRef<HTMLDialogElement>(null);
  const activeId = activeNavId(pathname, nav);

  // Tutup drawer saat pindah halaman.
  useEffect(() => { if (drawer.current?.open) drawer.current.close(); }, [pathname]);

  return (
    <ToastProvider>
      <div className="adm">
        <a className="adm-skip" href="#adm-content">Lewati ke konten</a>

        <aside className="adm-sidebar adm-glass" aria-label="Sidebar">
          <Brand />
          <NavList nav={nav} activeId={activeId} />
        </aside>

        <dialog ref={drawer} className="adm-drawer adm-glass" aria-label="Menu navigasi" onClick={(e) => { if (e.target === drawer.current) drawer.current?.close(); }}>
          <div className="adm-drawer-head">
            <Brand />
            <button type="button" className="adm-iconbtn" aria-label="Tutup menu" onClick={() => drawer.current?.close()}>✕</button>
          </div>
          <NavList nav={nav} activeId={activeId} onNavigate={() => drawer.current?.close()} />
        </dialog>

        <div className="adm-main-wrap">
          <header className="adm-topbar adm-glass">
            <div className="adm-topbar-left">
              <button type="button" className="adm-iconbtn adm-menu-btn" aria-label="Buka menu" onClick={() => drawer.current?.showModal()}>☰</button>
              <Breadcrumbs pathname={pathname} />
            </div>
            <div className="adm-topbar-right">
              <a className="adm-btn adm-btn-sm" href="/" target="_blank" rel="noopener">Lihat situs <span className="adm-sr">(tab baru)</span> ↗</a>
              <div className="adm-account"><b title={email}>{email}</b><span>{roleLabel}</span></div>
              <LogoutButton />
            </div>
          </header>
          <main id="adm-content" className="adm-main" tabIndex={-1}>{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
