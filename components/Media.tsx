/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { isOptimizableImageHost, mediaInfo } from "../lib/core/media";

interface Props {
  url: string;
  alt: string;
  className?: string;
  /** Mode kartu/thumbnail: video & embed tampil sebagai ubin, bukan player. */
  preview?: boolean;
  priority?: boolean;
  sizes?: string;
  autoplay?: boolean;
  muted?: boolean;
  /** Rasio tetap untuk mencegah CLS (default 4/3). */
  ratio?: string;
}

/**
 * Render media dari URL CMS. Gambar dari host terdaftar dioptimasi next/image;
 * host lain (pinimg, dsb.) memakai <img> dengan dimensi tetap agar tidak menggeser layout.
 */
export function Media({ url, alt, className, preview, priority, sizes = "(max-width: 900px) 100vw, 50vw", autoplay, muted = true, ratio = "4 / 3" }: Props) {
  const info = mediaInfo(url);
  const box = { aspectRatio: ratio, width: "100%", objectFit: "cover" as const };

  if (info.kind === "image") {
    if (isOptimizableImageHost(info.src)) {
      return (
        <span style={{ position: "relative", display: "block", aspectRatio: ratio, width: "100%" }}>
          <Image src={info.src} alt={alt} fill sizes={sizes} className={className} style={{ objectFit: "cover" }} priority={priority} />
        </span>
      );
    }
    return <img src={info.src} alt={alt} className={className} style={box} loading={priority ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" />;
  }

  if (info.kind === "youtube" && preview) {
    return <img src={info.previewUrl} alt={`${alt} (thumbnail video)`} className={className} style={box} loading="lazy" decoding="async" />;
  }

  if (info.kind === "video") {
    if (preview) return <div className="media-link-preview" style={{ aspectRatio: ratio }}>▶ Video proyek</div>;
    return (
      <video src={info.src} className={className} style={box} controls playsInline preload={autoplay ? "auto" : "metadata"} muted={muted || autoplay} autoPlay={autoplay} loop={autoplay} />
    );
  }

  if (info.kind === "instagram") {
    if (preview) return <div className="media-link-preview" style={{ aspectRatio: ratio }}>Instagram post</div>;
    return <iframe src={info.embedUrl} title={alt} className={className} style={{ ...box, border: 0, background: "#fff" }} loading="lazy" allow="encrypted-media; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />;
  }

  if (info.kind === "youtube" || info.kind === "embed") {
    if (preview) {
      return <div className="media-link-preview" style={{ aspectRatio: ratio }}>▶ {info.kind === "embed" ? info.label : "Video proyek"}</div>;
    }
    const embed = new URL(info.embedUrl);
    if (autoplay) {
      if (embed.hostname.includes("youtube")) {
        embed.searchParams.set("autoplay", "1");
        embed.searchParams.set("mute", muted ? "1" : "0");
        embed.searchParams.set("playsinline", "1");
      } else if (embed.hostname.includes("vimeo")) {
        embed.searchParams.set("autoplay", "1");
        embed.searchParams.set("muted", muted ? "1" : "0");
        embed.searchParams.set("loop", "1");
      }
    }
    return (
      <iframe
        src={embed.href}
        title={alt}
        className={className}
        style={{ ...box, border: 0 }}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (info.kind === "link") {
    return (
      <a className="media-link-preview" href={info.href} target="_blank" rel="noopener noreferrer">
        Buka media eksternal ↗
      </a>
    );
  }
  return null;
}
