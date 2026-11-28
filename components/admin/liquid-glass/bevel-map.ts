// Peta pembiasan (displacement map) untuk kaca: Signed Distance Field kotak membulat -> normal tepi bevel.
// Modul murni (tanpa DOM) agar bisa diuji di Node. Kanal R = pergeseran X, G = pergeseran Y, 128 = netral.

export interface BevelMapOptions {
  width: number;
  height: number;
  /** Radius sudut (px). Dibatasi otomatis ke setengah sisi terpendek. */
  radius: number;
  /** Ketebalan lengkungan di tepi (px). Dibatasi ke setengah sisi terpendek. */
  bevel: number;
}

/** Batas piksel peta. Elemen besar dihitung pada resolusi lebih rendah lalu diregangkan oleh <feImage>. */
export const MAX_MAP_PIXELS = 160_000;

export function mapScale(width: number, height: number): number {
  const px = width * height;
  return px > MAX_MAP_PIXELS ? Math.sqrt(MAX_MAP_PIXELS / px) : 1;
}

export function computeBevelMap({ width, height, radius, bevel }: BevelMapOptions): { width: number; height: number; data: Uint8ClampedArray } {
  const s = mapScale(width, height);
  const w = Math.max(1, Math.round(width * s));
  const h = Math.max(1, Math.round(height * s));
  const halfW = w / 2;
  const halfH = h / 2;
  const r = Math.min(radius * s, halfW, halfH);
  const bw = Math.max(0.0001, Math.min(bevel * s, Math.min(halfW, halfH)));
  const data = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;
      const qx = Math.abs(px) - (halfW - r);
      const qy = Math.abs(py) - (halfH - r);
      const dist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;

      let nx = 0;
      let ny = 0;
      if (dist < 0 && dist > -bw) {
        const t = (dist + bw) / bw;
        const curve = Math.cos((t * Math.PI) / 2); // profil lensa cembung: kuat di tepi, 0 di dalam
        let gx = 0;
        let gy = 0;
        if (qx > 0 || qy > 0) {
          const len = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) || 1;
          gx = (Math.max(qx, 0) / len) * Math.sign(px);
          gy = (Math.max(qy, 0) / len) * Math.sign(py);
        } else if (qx > qy) {
          gx = Math.sign(px);
        } else {
          gy = Math.sign(py);
        }
        nx = -gx * curve;
        ny = -gy * curve;
      }
      const i = (y * w + x) * 4;
      data[i] = Math.round(128 + nx * 127);
      data[i + 1] = Math.round(128 + ny * 127);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}
