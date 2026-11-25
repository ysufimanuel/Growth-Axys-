"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "../lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <span>PT Pillarians Group · Konstruksi &amp; Infrastruktur</span>
          <span>Komitmen pada mutu, keselamatan, dan ketepatan waktu</span>
        </div>
      </div>
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container nav-wrap">
          <Link className="brand" href="/" aria-label="PT Pillarians Group, beranda">
            <span className="brand-mark">
              PG<span></span>
            </span>
            <span className="brand-copy">
              <b>PILLARIANS GROUP</b>
              <small>CONSTRUCTION</small>
            </span>
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="mainNav"
            onClick={() => setOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav className={`main-nav${open ? " is-open" : ""}`} id="mainNav" aria-label="Navigasi utama">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : undefined} aria-current={isActive(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
            <Link className="btn btn-orange nav-cta" href="/kontak">
              Hubungi Kami <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
