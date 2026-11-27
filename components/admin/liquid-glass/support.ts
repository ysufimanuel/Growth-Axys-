"use client";

import { useEffect, useState } from "react";

/**
 * Pembiasan nyata memakai `backdrop-filter: url(#svg-filter)` yang hanya berfungsi di mesin Chromium.
 * Safari/Firefox membuang deklarasi itu (tanpa blur sama sekali), jadi di sana komponen memakai
 * fallback blur + saturate lewat CSS. Deteksi dilakukan sekali setelah mount (aman untuk SSR).
 */
function isChromiumEngine(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return false; // semua browser iOS memakai WebKit
  if (/Firefox\//.test(ua)) return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands;
  if (brands?.length) return brands.some((b) => /Chromium/i.test(b.brand));
  return /Chrome\/\d+/.test(ua);
}

// Hanya deviceMemory yang dipakai: hardwareConcurrency sering di-clamp browser demi privasi sehingga tidak andal.
function isLowEndDevice(): boolean {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof mem === "number" && mem <= 2;
}

/** true bila pembiasan SVG boleh dipakai: Chromium, bukan perangkat lemah, dan pengguna tidak meminta transparansi dikurangi. */
export function useRefractionSupport(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-transparency: reduce)");
    const update = () => setOk(isChromiumEngine() && !isLowEndDevice() && !reduced.matches);
    update();
    reduced.addEventListener("change", update);
    return () => reduced.removeEventListener("change", update);
  }, []);
  return ok;
}
