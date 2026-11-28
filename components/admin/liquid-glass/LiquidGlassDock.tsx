"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode, type Ref } from "react";
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

const DRAG_THRESHOLD = 6;

/**
 * Dock mengambang di bawah layar. Lensa kaca di dalamnya menempel pada item aktif; saat ditekan ia membesar dan bisa
 * digeser dengan jari melintasi item (efek hover-geser). Lepas jari di atas item = item itu dibuka.
 * Ketukan biasa tetap lewat klik native sehingga aksesibilitas keyboard/pembaca layar tidak berubah.
 */
export function LiquidGlassDock({ items, label, className }: Props) {
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const lensRef = useRef<HTMLLIElement>(null);
  const drag = useRef({ down: false, moved: false, startX: 0, pointerId: -1, hover: -1 });
  const [hover, setHover] = useState(-1);
  const activeIndex = items.findIndex((i) => i.active);

  const measure = useCallback((index: number) => {
    const list = listRef.current;
    const el = list?.querySelectorAll<HTMLElement>("[data-dock-item]")[index];
    if (!list || !el) return null;
    const l = list.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - l.left, w: r.width, list: l };
  }, []);

  const place = useCallback((index: number) => {
    const lens = lensRef.current;
    const m = index >= 0 ? measure(index) : null;
    if (!lens) return;
    if (!m) { lens.removeAttribute("data-ready"); return; }
    lens.style.setProperty("--lens-x", `${m.x}px`);
    lens.style.setProperty("--lens-w", `${m.w}px`);
    lens.setAttribute("data-ready", "on");
  }, [measure]);

  // Lensa kembali ke item aktif saat rute berubah / ukuran layar berubah.
  useLayoutEffect(() => { place(activeIndex); }, [activeIndex, items.length, place]);
  useEffect(() => {
    const onResize = () => place(activeIndex);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex, place]);

  const indexAt = (clientX: number) => {
    const els = listRef.current?.querySelectorAll<HTMLElement>("[data-dock-item]");
    if (!els) return -1;
    let best = -1;
    let bestD = Infinity;
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(clientX - (r.left + r.width / 2));
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };

  const setHoverIndex = (i: number) => {
    if (drag.current.hover === i) return;
    drag.current.hover = i;
    setHover(i);
    if (i >= 0 && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(6);
  };

  const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { down: true, moved: false, startX: e.clientX, pointerId: e.pointerId, hover: -1 };
    lensRef.current?.setAttribute("data-pressing", "on");
  };

  const onPointerMove = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d.down) return;
    if (!d.moved && Math.abs(e.clientX - d.startX) > DRAG_THRESHOLD) {
      d.moved = true;
      // Tangkap pointer hanya saat benar-benar menggeser, agar ketukan biasa tetap menghasilkan klik pada itemnya.
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer sudah dilepas */ }
      lensRef.current?.setAttribute("data-dragging", "on");
    }
    if (!d.moved) return;
    const lens = lensRef.current;
    const first = measure(Math.max(activeIndex, 0));
    if (!lens || !first) return;
    const x = Math.min(Math.max(e.clientX - first.list.left - first.w / 2, 0), first.list.width - first.w);
    lens.style.setProperty("--lens-x", `${x}px`);
    setHoverIndex(indexAt(e.clientX));
  };

  const finish = (e: PointerEvent<HTMLUListElement>, commit: boolean) => {
    const d = drag.current;
    if (!d.down) return;
    const wasDrag = d.moved;
    const target = d.hover;
    drag.current = { down: false, moved: false, startX: 0, pointerId: -1, hover: -1 };
    setHover(-1);
    const lens = lensRef.current;
    lens?.removeAttribute("data-pressing");
    lens?.removeAttribute("data-dragging");
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* sudah dilepas */ }
    if (!wasDrag) return;
    // Setelah geser, klik sintetis yang menyusul diredam (lihat onClickCapture) dan item di bawah jari dibuka di sini.
    const item = commit && target >= 0 ? items[target] : undefined;
    if (!item) { place(activeIndex); return; }
    place(target);
    if (item.href) router.push(item.href);
    else { item.onClick?.(); window.setTimeout(() => place(activeIndex), 280); }
    if (item.href) item.onClick?.();
  };

  return (
    <div className={className ? `lg-dock ${className}` : "lg-dock"}>
      <LiquidGlass as="nav" aria-label={label} radius={999} bevel={30} strength={60} aberration glint className="lg-dock__glass">
        <ul
          ref={listRef}
          className="lg-dock__list"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => finish(e, true)}
          onPointerCancel={(e) => finish(e, false)}
          onClickCapture={(e) => {
            // Klik yang menyusul setelah menggeser tidak boleh membuka item kedua kali.
            if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); }
          }}
        >
          {items.map((item, idx) => {
            const inner = (
              <>
                {item.icon ? <span className="lg-dock__icon">{item.icon}</span> : null}
                <span className="lg-dock__label">{item.label}</span>
              </>
            );
            const state = hover === idx ? "on" : undefined;
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} data-dock-item="" data-hover={state} draggable={false} className="lg-dock__item" aria-current={item.active ? "page" : undefined} onClick={item.onClick}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" data-dock-item="" data-hover={state} ref={item.buttonRef} className="lg-dock__item" aria-current={item.active ? "page" : undefined} onClick={item.onClick}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
          <li ref={lensRef} className="lg-dock__lensmove" aria-hidden="true">
            <LiquidGlass as="span" className="lg-dock__lens" radius={999} bevel={22} strength={34} blur={0} saturate={1.1} aberration />
          </li>
        </ul>
      </LiquidGlass>
    </div>
  );
}
