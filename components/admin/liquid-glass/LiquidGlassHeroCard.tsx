"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { LiquidGlass } from "./LiquidGlass";

interface Props extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

/** Kartu hero dashboard: kaca tebal (bevel besar) dengan judul, ringkasan, dan aksi utama. */
export function LiquidGlassHeroCard({ eyebrow, title, description, meta, actions, className, ...rest }: Props) {
  return (
    <LiquidGlass as="header" radius={30} bevel={46} strength={84} aberration className={className ? `adm-hero ${className}` : "adm-hero"} {...rest}>
      <div className="adm-hero-main">
        {eyebrow ? <p className="adm-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="adm-hero-sub">{description}</p> : null}
        {meta ? <p className="adm-hero-meta">{meta}</p> : null}
      </div>
      {actions ? <div className="adm-actions">{actions}</div> : null}
    </LiquidGlass>
  );
}
