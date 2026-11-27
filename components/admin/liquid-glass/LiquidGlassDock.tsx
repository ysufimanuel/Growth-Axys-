"use client";

import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { LiquidGlass } from "./LiquidGlass";

export interface DockItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Ada href -> tautan navigasi; tidak ada -> tombol (mis. membuka menu). */
  href?: string;
  onClick?: () => void;
  active?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
}

interface Props {
  items: DockItem[];
  label: string;
  className?: string;
}

/** Dock mengambang di bawah layar: elemen yang lewat di bawahnya terbias saat halaman di-scroll. */
export function LiquidGlassDock({ items, label, className }: Props) {
  return (
    <div className={className ? `lg-dock ${className}` : "lg-dock"}>
      <LiquidGlass as="nav" aria-label={label} radius={999} bevel={22} strength={36} blur={8} aberration glint className="lg-dock__glass" contentClassName="lg-dock__list-wrap">
        <ul className="lg-dock__list">
          {items.map((item) => {
            const inner = (
              <>
                {item.icon ? <span className="lg-dock__icon">{item.icon}</span> : null}
                <span className="lg-dock__label">{item.label}</span>
              </>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="lg-dock__item" aria-current={item.active ? "page" : undefined} onClick={item.onClick}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" ref={item.buttonRef} className="lg-dock__item" aria-current={item.active ? "page" : undefined} onClick={item.onClick}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </LiquidGlass>
    </div>
  );
}
