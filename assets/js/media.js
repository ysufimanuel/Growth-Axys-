const IMAGE_EXT = /\.(avif|gif|jpe?g|png|webp|svg)(?:$|[?#])/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(?:$|[?#])/i;

function youtubeId(url) {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
  if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
    return match?.[1] || null;
  }
  return null;
}

function driveId(url) {
  return url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
}

export function mediaInfo(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return { kind: "invalid" }; }
  if (url.protocol !== "https:") return { kind: "invalid" };

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const ytId = youtubeId(url);
  if (ytId && /^[a-zA-Z0-9_-]{6,}$/.test(ytId)) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
      previewUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) return { kind: "embed", embedUrl: `https://player.vimeo.com/video/${id}`, label: "Vimeo video" };
  }

  if (host.endsWith("drive.google.com") || host.endsWith("docs.google.com")) {
    const id = driveId(url);
    if (id) return { kind: "embed", embedUrl: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`, label: "Google Drive media" };
  }

  if (host.endsWith("pinterest.com") || host.endsWith("pin.it")) {
    const match = url.pathname.match(/\/pin\/(\d+)/);
    if (match) return { kind: "embed", embedUrl: `https://assets.pinterest.com/ext/embed.html?id=${match[1]}`, label: "Pinterest Pin" };
    return { kind: "link", href: url.href, label: "Pinterest" };
  }

  if (IMAGE_EXT.test(url.pathname + url.search) ||
      host === "images.unsplash.com" ||
      host === "i.pinimg.com" ||
      host.endsWith("images.pexels.com")) {
    return { kind: "image", src: url.href };
  }

  if (VIDEO_EXT.test(url.pathname + url.search)) return { kind: "video", src: url.href };
  return { kind: "link", href: url.href, label: host };
}

export function createMediaElement(rawUrl, options = {}) {
  const info = mediaInfo(rawUrl);
  const alt = options.alt || "Dokumentasi proyek Growth Axys";
  const className = options.className || "media-item";
  const preview = Boolean(options.preview);

  if (info.kind === "image") {
    const img = document.createElement("img");
    img.src = info.src;
    img.alt = alt;
    img.loading = "lazy";
    img.className = className;
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "media-fallback";
      fallback.textContent = "Gambar tidak dapat dimuat";
      img.replaceWith(fallback);
    }, { once: true });
    return img;
  }

  if (info.kind === "video") {
    if (preview) {
      const tile = document.createElement("div");
      tile.className = "media-link-preview";
      tile.textContent = "▶ Video proyek";
      return tile;
    }
    const video = document.createElement("video");
    video.src = info.src;
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.className = className;
    return video;
  }

  if (info.kind === "youtube" && preview) {
    const img = document.createElement("img");
    img.src = info.previewUrl;
    img.alt = alt + " - thumbnail YouTube";
    img.loading = "lazy";
    img.className = className;
    return img;
  }

  if (info.kind === "youtube" || info.kind === "embed") {
    if (preview) {
      const tile = document.createElement("div");
      tile.className = "media-link-preview";
      tile.textContent = "▶ " + (info.label || "Video / media eksternal");
      return tile;
    }
    const frame = document.createElement("iframe");
    frame.src = info.embedUrl;
    frame.title = alt;
    frame.loading = "lazy";
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.className = className;
    return frame;
  }

  const link = document.createElement("a");
  link.href = info.href || rawUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "media-link-preview";
  link.textContent = "Buka media eksternal ↗";
  return link;
}
