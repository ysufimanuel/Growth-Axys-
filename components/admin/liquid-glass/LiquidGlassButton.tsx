"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { LiquidGlass } from "./LiquidGlass";

type Variant = "primary" | "glass" | "danger";

interface CommonProps {
  variant?: Variant;
  size?: "md" | "sm";
  /** Tombol selebar wadahnya. */
  block?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}
type ButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };
type LinkProps = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & { href: string; prefetch?: boolean };

const VARIANT_CLASS: Record<Variant, string> = { primary: " adm-btn-primary", glass: "", danger: " adm-btn-danger" };

/**
 * Tombol kaca dengan kilau specular mengikuti kursor. Tampilan dasar (warna, ukuran, fokus) sama dengan `.adm-btn`
 * supaya tombol biasa dan tombol kaca konsisten; komponen ini hanya menambah lapisan kaca + kilau.
 * Tanpa `href` -> <button>; dengan `href` -> next/link.
 */
export function LiquidGlassButton(props: ButtonProps | LinkProps) {
  const { variant = "glass", size = "md", block, icon, children, className, ...rest } = props;
  const cls = `adm-btn${VARIANT_CLASS[variant]}${size === "sm" ? " adm-btn-sm" : ""}${block ? " adm-btn-block" : ""} lg-btn${className ? ` ${className}` : ""}`;
  const common = { radius: 999, bevel: 20, strength: 34, saturate: 1.1, glint: true, className: cls } as const;

  // Props sisa (href/type/disabled/handler) diteruskan apa adanya ke <Link> atau <button>; tipenya sudah dijaga
  // oleh ButtonProps | LinkProps di atas, jadi di sini cukup dilewatkan tanpa dipersempit ulang.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passthrough = rest as any;
  const root = "href" in passthrough && passthrough.href !== undefined ? Link : "button";
  return (
    <LiquidGlass as={root} {...common} {...(root === "button" ? { type: "button" } : null)} {...passthrough}>
      {icon}
      {children}
    </LiquidGlass>
  );
}
