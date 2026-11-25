import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "./JsonLd";
import { breadcrumbJsonLd } from "../lib/core/jsonld";
import { absoluteUrl } from "../lib/site";

export interface Crumb {
  name: string;
  href: string;
}

/** Hero halaman + breadcrumb HTML yang dapat di-crawl + BreadcrumbList JSON-LD. */
export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  crumbs: Crumb[]; // tanpa "Beranda"; item terakhir = halaman saat ini
}) {
  const all: Crumb[] = [{ name: "Beranda", href: "/" }, ...crumbs];
  return (
    <section className="page-hero">
      <JsonLd data={breadcrumbJsonLd(all.map((c) => ({ name: c.name, url: absoluteUrl(c.href) })))} />
      <div className="container">
        <span className="eyebrow light">{eyebrow}</span>
        <h1>{title}</h1>
        {lead ? <p>{lead}</p> : null}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {all.map((c, i) => (
            <span key={c.href}>
              {i > 0 ? " / " : ""}
              {i < all.length - 1 ? <Link href={c.href}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
}
