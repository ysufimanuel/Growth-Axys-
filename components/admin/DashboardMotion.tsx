"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/**
 * Batas animasi dashboard (client). Konten tetap dirender server; di sini hanya entrance singkat
 * (fade + geser kecil, hanya transform/opacity) untuk elemen bertanda [data-reveal].
 * Dinonaktifkan untuk pengguna prefers-reduced-motion; semua efek di-revert saat unmount.
 */
export function DashboardMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-reveal]", {
          autoAlpha: 0,
          y: 12,
          duration: 0.5,
          stagger: 0.07,
          ease: "power2.out",
          clearProps: "opacity,visibility,transform",
        });
      });
      return () => media.revert();
    }, element);

    return () => context.revert();
  }, []);

  // data-motion: dikecualikan dari entrance CSS halaman (layout.css) agar tidak dianimasikan dua kali.
  return <div ref={root} data-motion="gsap">{children}</div>;
}
