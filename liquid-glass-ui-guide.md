# Panduan Implementasi Eksperimen UI Liquid Glass (Next.js)

Dokumen ini berisi arsitektur dan kode lengkap untuk mengimplementasikan komponen UI bergaya **Liquid Glass** (dengan pembiasan cahaya nyata pada tepi *bevel* menggunakan SDF Displacement Map, bukan sekadar `backdrop-filter: blur()` standar) ke dalam proyek Next.js yang sudah ada.

Komponen yang disertakan:
1. **`LiquidGlass`** (Core wrapper berbasis SDF Canvas Normal Map + SVG `<feDisplacementMap>`)
2. **`LiquidGlassHeroCard`** (Hero card dengan kedalaman optik dan kontras tinggi)
3. **`LiquidGlassDock`** (Floating navbar/dock responsif di bagian bawah layar)
4. **`LiquidGlassButton`** (Tombol interaktif dengan *specular glint* yang mengikuti posisi kursor)

---

## 1. Persiapan Branch Eksperimen

Jalankan perintah berikut di terminal proyek Next.js Anda untuk membuat *branch* eksperimen terpisah agar *codebase* utama tetap aman:

```bash
git checkout -b exp/liquid-glass-ui
```

### Struktur File yang Akan Dibuat

```text
src/ (atau root proyek Anda)
├── components/
│   └── liquid-glass/
│       ├── LiquidGlass.tsx          # Komponen inti refraction + bevel SDF
│       ├── LiquidGlassHeroCard.tsx  # Komponen Hero Card
│       ├── LiquidGlassDock.tsx      # Komponen Floating Navbar / Dock
│       └── LiquidGlassButton.tsx    # Komponen Tombol interaktif + cursor glint
└── app/
    └── liquid-glass-lab/
        └── page.tsx                 # Halaman sandbox khusus eksperimen
```

---

## 2. Catatan Teknis & Kompatibilitas

* **Dukungan Browser:** Pembiasan optik melalui `backdrop-filter: url(#...)` berjalan optimal pada **Chrome, Edge, Brave, dan browser berbasis Chromium**. Pada Safari dan Firefox, komponen secara otomatis menggunakan *fallback* `backdrop-filter: blur() saturate()` dengan *specular border* agar tampilan tetap rapi dan tidak rusak.
* **Performa Perangkat:** Setiap komponen `LiquidGlass` menghasilkan *displacement map* PNG ringan melalui HTML5 `<canvas>` hanya saat ukuran elemen berubah (`ResizeObserver`), sehingga tidak membebani GPU pada *render loop* per frame.
* **Syarat Visual:** Efek pembiasan hanya akan terlihat jelas jika ada latar belakang berkontras tinggi di belakang komponen (foto, *mesh gradient*, tipografi besar, atau konten yang bergeser saat di-*scroll*).

---

## 3. Kode Implementasi Komponen

### A. Komponen Inti: `components/liquid-glass/LiquidGlass.tsx`

Komponen ini menghitung **Signed Distance Field (SDF)** untuk kotak membulat, mengubah gradien tepinya menjadi peta normal RGB (Merah = pergeseran X, Hijau = pergeseran Y), lalu mengumpankannya ke filter SVG `<feDisplacementMap>`.

```tsx
'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Ketebalan lengkungan kaca di bagian tepi (px) */
  bevelWidth?: number;
  /** Kekuatan pembiasan cahaya / indeks bias */
  refractionStrength?: number;
  /** Radius sudut elemen (px) */
  borderRadius?: number;
  /** Warna tint tipis kaca (gunakan rgba transparan) */
  tintColor?: string;
  /** Aktifkan chromatic aberration tipis (pemisahan warna RGB di tepi) */
  chromaticAberration?: boolean;
}

export function LiquidGlass({
  children,
  className = '',
  bevelWidth = 32,
  refractionStrength = 44,
  borderRadius = 28,
  tintColor = 'rgba(255, 255, 255, 0.05)',
  chromaticAberration = false,
  style,
  ...props
}: LiquidGlassProps) {
  const rawId = useId();
  const filterId = `lg-filter-${rawId.replace(/:/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapDataUrl, setMapDataUrl] = useState<string>('');
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = size;
    if (width <= 0 || height <= 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const halfW = width / 2;
    const halfH = height / 2;
    const r = Math.min(borderRadius, halfW, halfH);
    const bevel = Math.min(bevelWidth, r);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = x + 0.5 - halfW;
        const py = y + 0.5 - halfH;

        // SDF Rounded Rectangle
        const qx = Math.abs(px) - (halfW - r);
        const qy = Math.abs(py) - (halfH - r);
        const outDist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
        const inDist = Math.min(Math.max(qx, qy), 0);
        const dist = outDist + inDist - r;

        let nx = 0;
        let ny = 0;

        if (dist < 0 && dist > -bevel) {
          const t = (dist + bevel) / bevel;
          // Profil lengkungan lensa cembung
          const curve = Math.cos((t * Math.PI) / 2);

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

        const idx = (y * width + x) * 4;
        data[idx] = Math.round(128 + nx * 127);
        data[idx + 1] = Math.round(128 + ny * 127);
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setMapDataUrl(canvas.toDataURL('image/png'));
  }, [size, bevelWidth, borderRadius]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        backgroundColor: tintColor,
        ...style,
      }}
      {...props}
    >
      {mapDataUrl && size.width > 0 && (
        <svg
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          aria-hidden="true"
        >
          <defs>
            <filter
              id={filterId}
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={mapDataUrl}
                x="0"
                y="0"
                width={size.width}
                height={size.height}
                result="bevel_map"
              />

              {chromaticAberration ? (
                <>
                  {/* Pemisahan kanal R, G, B untuk efek dispersi cahaya di tepi kaca */}
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="bevel_map"
                    scale={refractionStrength * 1.08}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="disp_r"
                  />
                  <feColorMatrix
                    in="disp_r"
                    type="matrix"
                    values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    result="red_only"
                  />

                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="bevel_map"
                    scale={refractionStrength}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="disp_g"
                  />
                  <feColorMatrix
                    in="disp_g"
                    type="matrix"
                    values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    result="green_only"
                  />

                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="bevel_map"
                    scale={refractionStrength * 0.92}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="disp_b"
                  />
                  <feColorMatrix
                    in="disp_b"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                    result="blue_only"
                  />

                  <feBlend in="red_only" in2="green_only" mode="screen" result="rg" />
                  <feBlend in="rg" in2="blue_only" mode="screen" result="refracted" />
                </>
              ) : (
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="bevel_map"
                  scale={refractionStrength}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="refracted"
                />
              )}

              <feColorMatrix in="refracted" type="saturate" values="1.28" />
            </filter>
          </defs>
        </svg>
      )}

      {/* Layer Pembiasan Latar Belakang */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: `${borderRadius}px`,
          backdropFilter: mapDataUrl
            ? `url(#${filterId}) blur(0.4px)`
            : 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: mapDataUrl
            ? `url(#${filterId}) blur(0.4px)`
            : 'blur(14px) saturate(140%)',
        }}
      />

      {/* Layer Specular Rim & Inner Bevel Shadow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: `${borderRadius}px`,
          boxShadow: `
            inset 0 1.5px 2px rgba(255, 255, 255, 0.65),
            inset 0 -2.5px 5px rgba(0, 0, 0, 0.4),
            inset 2px 0 4px rgba(255, 255, 255, 0.18),
            inset -2px 0 4px rgba(255, 255, 255, 0.18),
            0 18px 38px -10px rgba(0, 0, 0, 0.45)
          `,
          border: '1px solid rgba(255, 255, 255, 0.32)',
        }}
      />

      {/* Konten Komponen */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
```

---

### B. Tombol Interaktif dengan Kilau Mengikuti Kursor: `components/liquid-glass/LiquidGlassButton.tsx`

Tombol berbentuk kapsul (*pill*) dengan efek pembiasan kaca di bagian pinggir serta lapisan cahaya *specular spotlight* yang bergerak dinamis mengikuti posisi kursor (`onPointerMove`).

```tsx
'use client';

import React, { useRef, useState } from 'react';
import { LiquidGlass } from './LiquidGlass';

interface LiquidGlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  tintColor?: string;
  glintColor?: string;
  refractionStrength?: number;
}

export function LiquidGlassButton({
  children,
  className = '',
  tintColor = 'rgba(255, 255, 255, 0.08)',
  glintColor = 'rgba(255, 255, 255, 0.45)',
  refractionStrength = 34,
  onClick,
  ...props
}: LiquidGlassButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50, active: false });

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursor({ x, y, active: true });
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setCursor((prev) => ({ ...prev, active: false }))}
      className={`group relative inline-flex cursor-pointer items-center justify-center rounded-full transition-transform duration-200 ease-out hover:scale-[1.03] active:scale-[0.96] focus:outline-none ${className}`}
      {...props}
    >
      <LiquidGlass
        borderRadius={999}
        bevelWidth={20}
        refractionStrength={refractionStrength}
        tintColor={tintColor}
        className="w-full"
      >
        {/* Lapisan Kilau Specular Mengikuti Kursor */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300"
          style={{
            opacity: cursor.active ? 1 : 0,
            background: `radial-gradient(circle 90px at ${cursor.x}% ${cursor.y}%, ${glintColor}, transparent 75%)`,
            mixBlendMode: 'overlay',
          }}
        />

        {/* Lapisan Kilau Tepi (Border Glint) Mengikuti Kursor */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300"
          style={{
            opacity: cursor.active ? 0.9 : 0,
            background: `radial-gradient(circle 70px at ${cursor.x}% ${cursor.y}%, rgba(255,255,255,0.65), transparent 70%)`,
            maskImage:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1.5px',
          }}
        />

        <div className="relative z-10 flex items-center justify-center gap-2 px-7 py-3.5 font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          {children}
        </div>
      </LiquidGlass>
    </button>
  );
}
```

---

### C. Floating Navbar / Dock: `components/liquid-glass/LiquidGlassDock.tsx`

Bilah navigasi mengambang (*floating dock*) yang melayang di atas konten halaman sehingga setiap elemen yang lewat di bawahnya akan mengalami pembiasan optik saat halaman di-*scroll*.

```tsx
'use client';

import React, { useState } from 'react';
import { LiquidGlass } from './LiquidGlass';

export interface DockItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface LiquidGlassDockProps {
  items: DockItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function LiquidGlassDock({
  items,
  activeId,
  onSelect,
  className = '',
}: LiquidGlassDockProps) {
  const [internalActive, setInternalActive] = useState(items[0]?.id ?? '');
  const currentActive = activeId ?? internalActive;

  const handleSelect = (id: string) => {
    setInternalActive(id);
    onSelect?.(id);
  };

  return (
    <nav
      aria-label="Floating Liquid Glass Navigation"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 ${className}`}
    >
      <LiquidGlass
        borderRadius={999}
        bevelWidth={22}
        refractionStrength={42}
        tintColor="rgba(18, 18, 22, 0.25)"
        chromaticAberration={true}
      >
        <ul className="flex items-center gap-1.5 px-2.5 py-2">
          {items.map((item) => {
            const isActive = item.id === currentActive;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/25 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon && <span className="h-4 w-4">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </LiquidGlass>
    </nav>
  );
}
```

---

### D. Hero Card: `components/liquid-glass/LiquidGlassHeroCard.tsx`

Kartu utama berukuran besar dengan *bevel* tebal (`38px`) dan opsi *chromatic aberration* untuk menampilkan judul, deskripsi, serta tombol aksi di atas *background* dinamis.

```tsx
'use client';

import React from 'react';
import { LiquidGlass } from './LiquidGlass';

interface LiquidGlassHeroCardProps {
  badge?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export function LiquidGlassHeroCard({
  badge,
  title,
  description,
  actions,
  className = '',
}: LiquidGlassHeroCardProps) {
  return (
    <LiquidGlass
      borderRadius={36}
      bevelWidth={38}
      refractionStrength={52}
      tintColor="rgba(255, 255, 255, 0.04)"
      chromaticAberration={true}
      className={`w-full max-w-2xl ${className}`}
    >
      <div className="flex flex-col items-start p-8 sm:p-11">
        {badge && (
          <span className="mb-4 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-medium tracking-wide text-white/90">
            {badge}
          </span>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-5xl">
          {title}
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] sm:text-lg">
          {description}
        </p>

        {actions && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {actions}
          </div>
        )}
      </div>
    </LiquidGlass>
  );
}
```

---

## 4. Halaman Sandbox Pengujian (`app/liquid-glass-lab/page.tsx`)

Buat halaman rute baru ini agar Anda bisa menguji seluruh komponen tanpa mengubah halaman utama proyek yang sedang berjalan. Halaman ini menyertakan **panel kontrol parameter real-time** dan latar belakang bergaris/kode untuk memverifikasi efek pembiasan.

```tsx
'use client';

import React, { useState } from 'react';
import { LiquidGlassHeroCard } from '@/components/liquid-glass/LiquidGlassHeroCard';
import { LiquidGlassButton } from '@/components/liquid-glass/LiquidGlassButton';
import { LiquidGlassDock } from '@/components/liquid-glass/LiquidGlassDock';
import { LiquidGlass } from '@/components/liquid-glass/LiquidGlass';

export default function LiquidGlassLabPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refraction, setRefraction] = useState(50);
  const [bevel, setBevel] = useState(36);

  return (
    <div className="relative min-h-[180vh] overflow-x-hidden bg-neutral-950 text-white selection:bg-orange-500 selection:text-white">
      {/* Background Pattern Kontras Tinggi agar Pembiasan Terlihat Jelas */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-85"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 25%, #ea580c 0%, transparent 45%),
            radial-gradient(circle at 80% 65%, #2563eb 0%, transparent 50%),
            repeating-linear-gradient(
              -30deg,
              rgba(255, 255, 255, 0.06) 0px,
              rgba(255, 255, 255, 0.06) 18px,
              transparent 18px,
              transparent 42px
            )
          `,
        }}
      />

      {/* Konten Latar Belakang yang Ikut Bergeser Saat Di-Scroll */}
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-40">
        {/* Hero Card */}
        <LiquidGlassHeroCard
          badge="Experimental Optical UI"
          title="Real 3D Refraction Glass"
          description="Scroll halaman ini atau arahkan kursor ke tombol di bawah untuk melihat bagaimana cahaya di latar belakang dibelokkan oleh kelengkungan bevel kaca."
          actions={
            <>
              <LiquidGlassButton
                tintColor="rgba(234, 67, 25, 0.55)"
                glintColor="rgba(255, 220, 180, 0.65)"
              >
                Eksplorasi Komponen
              </LiquidGlassButton>

              <LiquidGlassButton>
                Dokumentasi
              </LiquidGlassButton>
            </>
          }
        />

        {/* Panel Tuning Parameter Real-Time */}
        <section className="mt-16 w-full max-w-2xl">
          <LiquidGlass
            borderRadius={28}
            bevelWidth={bevel}
            refractionStrength={refraction}
            chromaticAberration={true}
            className="p-6 sm:p-8"
          >
            <h2 className="text-lg font-semibold">
              Sandbox Tuning Parameter
            </h2>
            <p className="mt-1 text-sm text-white/75">
              Ubah nilai di bawah untuk menguji ketebalan bevel dan indeks bias pada kartu ini.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-white/80">
                  <span>Refraction Strength (IOR)</span>
                  <span>{refraction}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={refraction}
                  onChange={(e) => setRefraction(Number(e.target.value))}
                  className="mt-2 w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-white/80">
                  <span>Bevel Width (px)</span>
                  <span>{bevel}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={bevel}
                  onChange={(e) => setBevel(Number(e.target.value))}
                  className="mt-2 w-full accent-orange-500"
                />
              </div>
            </div>
          </LiquidGlass>
        </section>

        {/* Teks Referensi di Belakang untuk Menguji Scroll Refraction */}
        <section className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/15 bg-white/5 p-6 font-mono text-sm text-white/70"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Layer Belakang #{idx + 1}
              </div>
              <p className="mt-2">
                Perhatikan saat elemen ini melewati bagian bawah Floating Dock saat halaman di-scroll. Garis tepi dock akan membelokkan teks ini secara optik.
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* Floating Navbar / Dock */}
      <LiquidGlassDock
        activeId={activeTab}
        onSelect={setActiveTab}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'components', label: 'Components' },
          { id: 'tokens', label: 'Shaders' },
          { id: 'lab', label: 'Lab' },
        ]}
      />
    </div>
  );
}
```

---

## 5. Checklist Integrasi ke Proyek Eksisting

1. Pastikan proyek Next.js Anda sudah terpasang **Tailwind CSS** (v3 atau v4 kompatibel dengan semua kelas utilitas di atas).
2. Jika `tsconfig.json` Anda tidak menggunakan alias `@/*`, sesuaikan jalur `import` pada file halaman menjadi jalur relatif (`../../components/liquid-glass/...`).
3. Jalankan server pengembangan (`npm run dev`) dan buka `http://localhost:3000/liquid-glass-lab` menggunakan browser berbasis Chromium untuk melihat hasil lengkapnya.
4. Setelah menemukan kombinasi `bevelWidth`, `refractionStrength`, dan `tintColor` yang pas dengan identitas visual web Anda, impor `LiquidGlassHeroCard`, `LiquidGlassDock`, atau `LiquidGlassButton` langsung ke halaman utama.
