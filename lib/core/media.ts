// Port dari assets/js/media.js: klasifikasi URL media (gambar, video, embed).
// Modul murni; rendering dilakukan di komponen React.

export type MediaInfo =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string }
  | { kind: "youtube"; embedUrl: string; previewUrl: string }
  | { kind: "embed"; embedUrl: string; label: string }
  | { kind: "link"; href: string; label: string }
  | { kind: "invalid" };

const IMAGE_EXT = /\.(avif|gif|jpe?g|png|webp)(?:$|[?#])/i; // SVG sengaja tidak dianggap gambar tepercaya
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(?:$|[?#])/i;

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    return url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
  }
  return null;
}

export function mediaInfo(rawUrl: string): MediaInfo {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { kind: "invalid" };
  }
  if (url.protocol !== "https:") return { kind: "invalid" };
  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  const yt = youtubeId(url);
  if (yt && /^[a-zA-Z0-9_-]{6,}$/.test(yt)) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}`,
      previewUrl: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
    };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) return { kind: "embed", embedUrl: `https://player.vimeo.com/video/${id}`, label: "Vimeo video" };
  }
  if (host.endsWith("drive.google.com") || host.endsWith("docs.google.com")) {
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
    if (id) return { kind: "embed", embedUrl: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`, label: "Google Drive media" };
  }
  if (host.endsWith("pinterest.com") || host.endsWith("pin.it")) {
    const m = url.pathname.match(/\/pin\/(\d+)/);
    if (m) return { kind: "embed", embedUrl: `https://assets.pinterest.com/ext/embed.html?id=${m[1]}`, label: "Pinterest Pin" };
    return { kind: "link", href: url.href, label: "Pinterest" };
  }
  if (IMAGE_EXT.test(url.pathname + url.search) || host === "images.unsplash.com" || host === "i.pinimg.com" || host.endsWith("images.pexels.com")) {
    return { kind: "image", src: url.href };
  }
  if (VIDEO_EXT.test(url.pathname + url.search)) return { kind: "video", src: url.href };
  return { kind: "link", href: url.href, label: host };
}

/** Gambar yang boleh dioptimasi next/image (host terdaftar di next.config). */
export function isOptimizableImageHost(src: string): boolean {
  try {
    return new URL(src).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}
