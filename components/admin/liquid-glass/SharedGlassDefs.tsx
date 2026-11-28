"use client";

import { useEffect, useState } from "react";
import { computeBevelMap } from "./bevel-map";

/**
 * Filter pembiasan BERSAMA untuk elemen kecil berbentuk pil yang jumlahnya banyak (tombol, chip, tombol ikon).
 * Satu peta bevel dirender sekali, lalu diregangkan ke ukuran tiap elemen lewat primitiveUnits="objectBoundingBox"
 * (pergeseran proporsional terhadap ukuran elemen). Jauh lebih murah daripada satu filter + canvas per tombol.
 * Dipasang hanya bila pembiasan didukung (lihat AdminShell); CSS-nya ada di glass.css ([data-glass="on"]).
 */
export function SharedGlassDefs() {
  const [pillMap, setPillMap] = useState("");

  useEffect(() => {
    const map = computeBevelMap({ width: 320, height: 96, radius: 48, bevel: 48 });
    const canvas = document.createElement("canvas");
    canvas.width = map.width;
    canvas.height = map.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(map.width, map.height);
    img.data.set(map.data);
    ctx.putImageData(img, 0, 0);
    setPillMap(canvas.toDataURL("image/png"));
  }, []);

  if (!pillMap) return null;
  return (
    <svg className="lg__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="adm-glass-pill" x="0" y="0" width="1" height="1" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feImage href={pillMap} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="pill_map" />
          <feDisplacementMap in="SourceGraphic" in2="pill_map" scale="0.55" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
