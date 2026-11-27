"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ElementType, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { computeBevelMap } from "./bevel-map";
import { useRefractionSupport } from "./support";

const BLOCK_TAGS = new Set(["div", "header", "aside", "nav", "section", "article", "form"]);

export interface LiquidGlassProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Elemen/komponen akar (default "div"). Dipakai agar semantik HTML benar: header, aside, nav, form, a, button, Link. */
  as?: ElementType;
  children?: ReactNode;
  /** Radius sudut (px). */
  radius?: number;
  /** Ketebalan lengkungan kaca di tepi (px). */
  bevel?: number;
  /** Kekuatan pembiasan (skala feDisplacementMap, px). */
  strength?: number;
  /** Blur latar (px). Menjaga teks di belakang kaca tetap tidak terbaca mengganggu. */
  blur?: number;
  /** Override warna/gradien tint kaca. Tanpa ini, tint berasal dari token CSS (--lg-tint). */
  tint?: string;
  /** Penguat warna latar yang dibiaskan (1 = netral). Tombol berwarna memakai ~1 agar tidak neon. */
  saturate?: number;
  /** Dispersi warna RGB tipis di tepi kaca. Mahal: dipakai hemat. */
  aberration?: boolean;
  /** "off" = selalu pakai fallback blur (untuk permukaan besar yang latarnya statis). */
  refraction?: "auto" | "off";
  /** Kilau specular mengikuti kursor. */
  glint?: boolean;
  /** Kelas untuk lapisan konten (mis. layout flex/scroll). */
  contentClassName?: string;
}

/**
 * Kaca dengan pembiasan nyata di tepi bevel (SDF -> feDisplacementMap lewat backdrop-filter, Chromium).
 * Di browser lain / saat transparansi dikurangi: fallback blur + saturate (lihat glass.css).
 * Struktur: [svg filter] [refract] [rim] [glint?] [content]. Semua layer dekoratif memakai pointer-events: none.
 */
export function LiquidGlass({
  as: Root = "div",
  children,
  className,
  style,
  radius = 24,
  bevel = 28,
  strength = 36,
  blur = 10,
  saturate = 1.6,
  tint,
  aberration = false,
  refraction = "auto",
  glint = false,
  contentClassName,
  onPointerMove,
  onPointerLeave,
  ...rest
}: LiquidGlassProps) {
  // useId() dapat memuat karakter yang tidak valid di url(#...) (":" di React 18, "«»" di React 19.1+).
  const filterId = `lg-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ref = useRef<HTMLElement>(null);
  const supported = useRefractionSupport();
  const active = supported && refraction === "auto";
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mapUrl, setMapUrl] = useState("");

  // Ukuran border-box (offsetWidth/Height): akurat walau elemen punya padding dan tidak terpengaruh transform hover.
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize((p) => (p.w === w && p.h === h ? p : { w, h }));
    };
    const ro = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(read); });
    ro.observe(el);
    read();
    return () => { ro.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [active]);

  // Peta dibuat ulang hanya saat ukuran/geometri berubah, bukan per frame.
  useEffect(() => {
    if (!active || size.w <= 0 || size.h <= 0) { setMapUrl(""); return; }
    const map = computeBevelMap({ width: size.w, height: size.h, radius, bevel });
    const canvas = document.createElement("canvas");
    canvas.width = map.width;
    canvas.height = map.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setMapUrl(""); return; }
    const img = ctx.createImageData(map.width, map.height);
    img.data.set(map.data);
    ctx.putImageData(img, 0, 0);
    setMapUrl(canvas.toDataURL("image/png"));
  }, [active, size.w, size.h, radius, bevel]);

  const refracting = active && mapUrl !== "";
  const backdrop = refracting ? `url(#${filterId}) blur(var(--lg-blur)) saturate(${saturate})` : undefined;
  const Inner = typeof Root === "string" && BLOCK_TAGS.has(Root) ? "div" : "span";

  const handleMove = (e: PointerEvent<HTMLElement>) => {
    onPointerMove?.(e);
    if (!glint || e.pointerType === "touch") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--lg-gx", `${e.clientX - r.left}px`);
    el.style.setProperty("--lg-gy", `${e.clientY - r.top}px`);
    el.dataset.glint = "on";
  };
  const handleLeave = (e: PointerEvent<HTMLElement>) => {
    onPointerLeave?.(e);
    if (glint) delete e.currentTarget.dataset.glint;
  };

  const rootStyle = { borderRadius: radius, "--lg-blur": `${blur}px`, ...(tint ? { "--lg-tint": tint } : null), ...style } as CSSProperties;

  return (
    <Root
      ref={ref}
      className={className ? `lg ${className}` : "lg"}
      data-refract={refracting ? "on" : "off"}
      style={rootStyle}
      onPointerMove={glint ? handleMove : onPointerMove}
      onPointerLeave={glint ? handleLeave : onPointerLeave}
      {...rest}
    >
      {refracting ? (
        <svg className="lg__defs" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feImage href={mapUrl} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="bevel_map" />
              {aberration ? (
                <>
                  {/* Tiap kanal digeser sedikit berbeda -> dispersi cahaya di tepi kaca. */}
                  <feDisplacementMap in="SourceGraphic" in2="bevel_map" scale={strength * 1.08} xChannelSelector="R" yChannelSelector="G" result="d_r" />
                  <feColorMatrix in="d_r" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="only_r" />
                  <feDisplacementMap in="SourceGraphic" in2="bevel_map" scale={strength} xChannelSelector="R" yChannelSelector="G" result="d_g" />
                  <feColorMatrix in="d_g" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="only_g" />
                  <feDisplacementMap in="SourceGraphic" in2="bevel_map" scale={strength * 0.92} xChannelSelector="R" yChannelSelector="G" result="d_b" />
                  <feColorMatrix in="d_b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="only_b" />
                  <feBlend in="only_r" in2="only_g" mode="screen" result="rg" />
                  <feBlend in="rg" in2="only_b" mode="screen" />
                </>
              ) : (
                <feDisplacementMap in="SourceGraphic" in2="bevel_map" scale={strength} xChannelSelector="R" yChannelSelector="G" />
              )}
            </filter>
          </defs>
        </svg>
      ) : null}
      <span aria-hidden="true" className="lg__refract" style={backdrop ? { backdropFilter: backdrop, WebkitBackdropFilter: backdrop } : undefined} />
      <span aria-hidden="true" className="lg__rim" />
      {glint ? <span aria-hidden="true" className="lg__glint" /> : null}
      <Inner className={contentClassName ? `lg__content ${contentClassName}` : "lg__content"}>{children}</Inner>
    </Root>
  );
}
