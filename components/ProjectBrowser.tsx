"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Media } from "./Media";

export interface ProjectCardData {
  slug: string;
  title: string;
  year: number | null;
  location: string;
  category: string;
  progress: string;
  cover: string;
}

/**
 * Daftar proyek + filter. Seluruh kartu dirender di HTML awal (server) sehingga crawler
 * melihat semua tautan proyek; filter hanya menyembunyikan kartu di browser.
 */
export function ProjectBrowser({ projects }: { projects: ProjectCardData[] }) {
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [progress, setProgress] = useState("");

  const years = useMemo(() => [...new Set(projects.map((p) => p.year).filter((y): y is number => y !== null))].sort((a, b) => b - a), [projects]);
  const categories = useMemo(() => [...new Set(projects.map((p) => p.category).filter(Boolean))].sort(), [projects]);
  const visible = (p: ProjectCardData) =>
    (!year || String(p.year) === year) && (!category || p.category === category) && (!progress || p.progress === progress);
  const count = projects.filter(visible).length;

  return (
    <>
      <div className="filter-bar">
        <div>
          <span className="eyebrow">PROJECT ARCHIVE</span>
          <h2>Portofolio proyek</h2>
        </div>
        <div className="filters">
          <select aria-label="Filter tahun" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Semua Tahun</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select aria-label="Filter kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select aria-label="Filter status" value={progress} onChange={(e) => setProgress(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Berjalan">Berjalan</option>
          </select>
        </div>
      </div>
      <div className="project-grid portfolio-grid">
        {projects.map((p) => (
          <Link key={p.slug} className="project-card" href={`/proyek/${p.slug}`} hidden={!visible(p)}>
            <Media url={p.cover} alt={p.title} preview className="project-card-media" ratio="4 / 3" />
            <span className="project-overlay">
              <small>{[p.year, p.location, p.category].filter(Boolean).join(" · ")}</small>
              <b>{p.title}</b>
              <i>LIHAT DETAIL ↗</i>
            </span>
          </Link>
        ))}
      </div>
      <div className="empty-state" hidden={count > 0} role="status">
        Tidak ada proyek yang sesuai dengan filter.
      </div>
    </>
  );
}
