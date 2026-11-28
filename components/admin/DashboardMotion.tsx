import type { ReactNode } from "react";

/**
 * Pembungkus dashboard. Entrance (pageEnter + stagger) kini ditangani satu mekanisme CSS di ios.css untuk semua halaman
 * (elemen [data-reveal] ikut di-stagger), jadi tidak ada lagi animasi GSAP yang menimpa/menggandakan.
 * data-motion tetap dipasang agar wrapper ini sendiri tidak ikut dianimasikan sebagai satu blok.
 */
export function DashboardMotion({ children }: { children: ReactNode }) {
  return <div data-motion="gsap">{children}</div>;
}
