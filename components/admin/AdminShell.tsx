"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { activeNavId, NAV_GROUP_LABEL, type NavItem } from "../../lib/core/admin-nav";
import { Icon } from "./icons";
import { LogoutButton } from "./LogoutButton";
import { ToastProvider } from "./Toast";

interface Props {
  nav: NavItem[];
  email: string;
  roleLabel: string;
  children: ReactNode;
}

const SEGMENT_LABEL: Record<string, string> = {
  admin: "Admin", dashboard: "Ringkasan", content: "Konten", projects: "Proyek", services: "Layanan", articles: "Artikel",
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
  // Grup bisa dilipat untuk mengurangi beban visual; grup yang memuat halaman aktif selalu terbuka.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const uid = useId(); // sidebar dan drawer sama-sama merender daftar ini: id harus unik.
  const groups = (Object.keys(NAV_GROUP_LABEL) as NavItem["group"][]).map((g) => ({ g, items: nav.filter((n) => n.group === g) })).filter((x) => x.items.length);
  const toggle = (g: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });

  return (
    <nav className="adm-nav" aria-label="Menu utama">
      {groups.map(({ g, items }) => {
        const hasActive = items.some((i) => i.id === activeId);
        const foldable = g !== "main";
        const open = !foldable || hasActive || !collapsed.has(g);
        const listId = `${uid}-nav-${g}`;
        return (
          <div className="adm-nav-group" key={g}>
            {foldable ? (
              <h2>
                <button
                  type="button"
                  className="adm-nav-toggle"
                  aria-expanded={open}
                  aria-controls={listId}
                  disabled={hasActive}
                  onClick={() => toggle(g)}
                >
                  <span>{NAV_GROUP_LABEL[g]}</span>
                  <Icon name="chevron" size={14} className="adm-icon adm-nav-chevron" />
                </button>
              </h2>
            ) : (
              <h2><span className="adm-nav-toggle adm-nav-toggle-static">{NAV_GROUP_LABEL[g]}</span></h2>
            )}
            <ul id={listId} hidden={!open}>
              {items.map((i) => (
                <li key={i.id}>
                  {i.available ? (
                    <Link className="adm-nav-link" href={i.href} aria-current={activeId === i.id ? "page" : undefined} onClick={onNavigate}>
                      <span className="adm-nav-label"><Icon name={i.icon} />{i.label}</span>
                    </Link>
                  ) : (
                    // Belum dibangun: bukan tautan, ditandai jelas (tidak ada tombol mati yang menyesatkan).
                    <span className="adm-nav-link" aria-disabled="true">
                      <span className="adm-nav-label"><Icon name={i.icon} />{i.label}</span>
                      <span className="adm-soon">Segera</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
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

function AccountRow({ email, roleLabel }: { email: string; roleLabel: string }) {
  return (
    <div className="adm-account-row">
      <span className="adm-avatar" aria-hidden="true">{email.trim().charAt(0).toUpperCase() || "?"}</span>
      <span className="adm-account-text"><b title={email}>{email}</b><span>{roleLabel}</span></span>
    </div>
  );
}

export function AdminShell({ nav, email, roleLabel, children }: Props) {
  const pathname = usePathname();
  const drawer = useRef<HTMLDialogElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const activeId = activeNavId(pathname, nav);

  // Tutup drawer saat pindah halaman.
  useEffect(() => { if (drawer.current?.open) drawer.current.close(); }, [pathname]);

  // Kembalikan fokus ke tombol menu setelah drawer tertutup (Esc, backdrop, tombol tutup, atau navigasi).
  useEffect(() => {
    const el = drawer.current;
    if (!el) return;
    const restore = () => menuBtn.current?.focus({ preventScroll: true });
    el.addEventListener("close", restore);
    return () => el.removeEventListener("close", restore);
  }, []);

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
            <button type="button" className="adm-iconbtn" aria-label="Tutup menu" onClick={() => drawer.current?.close()}><Icon name="close" /></button>
          </div>
          <NavList nav={nav} activeId={activeId} onNavigate={() => drawer.current?.close()} />
          <div className="adm-drawer-account">
            <AccountRow email={email} roleLabel={roleLabel} />
            <LogoutButton />
          </div>
        </dialog>

        <div className="adm-main-wrap">
          <header className="adm-topbar adm-glass">
            <div className="adm-topbar-left">
              <button ref={menuBtn} type="button" className="adm-iconbtn adm-menu-btn" aria-label="Buka menu" onClick={() => drawer.current?.showModal()}><Icon name="menu" /></button>
              <Breadcrumbs pathname={pathname} />
            </div>
            <div className="adm-topbar-right">
              <a className="adm-btn adm-btn-sm adm-site-link" href="/" target="_blank" rel="noopener">
                <Icon name="external" size={16} />
                <span className="adm-btn-label">Lihat situs</span>
                <span className="adm-sr">(tab baru)</span>
              </a>
              <div className="adm-account"><AccountRow email={email} roleLabel={roleLabel} /></div>
              <span className="adm-avatar adm-avatar-mobile" role="img" aria-label={`${email}, ${roleLabel}`} title={email}>{email.trim().charAt(0).toUpperCase() || "?"}</span>
              <span className="adm-logout-desktop"><LogoutButton /></span>
            </div>
          </header>
          <main id="adm-content" className="adm-main" tabIndex={-1}>{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
