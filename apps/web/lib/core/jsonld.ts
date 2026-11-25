// Builder JSON-LD. Hanya memuat properti yang benar-benar tersedia dan terlihat di halaman.
// Tidak ada rating/review/alamat karangan; properti kosong dibuang.

type Json = Record<string, unknown>;

function clean<T extends Json>(obj: T): Json {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)),
  );
}

export interface OrgInput {
  name: string;
  url: string;
  description?: string;
  telephone?: string;
  email?: string;
  logo?: string;
  address?: { streetAddress?: string; addressLocality?: string; addressCountry?: string } | null;
  sameAs?: string[];
}

export function organizationJsonLd(o: OrgInput): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: o.name,
    url: o.url,
    description: o.description,
    telephone: o.telephone,
    email: o.email,
    logo: o.logo,
    address: o.address ? clean({ "@type": "PostalAddress", ...o.address }) : undefined,
    sameAs: o.sameAs,
  });
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function serviceJsonLd(s: { name: string; description: string; url: string; provider: string; image?: string }): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    url: s.url,
    image: s.image,
    provider: { "@type": "Organization", name: s.provider },
  });
}

export function articleJsonLd(a: {
  headline: string;
  description?: string;
  url: string;
  image?: string;
  author?: string;
  publisher: string;
  datePublished?: string;
  dateModified?: string;
}): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    mainEntityOfPage: a.url,
    image: a.image,
    author: a.author ? { "@type": "Person", name: a.author } : { "@type": "Organization", name: a.publisher },
    publisher: { "@type": "Organization", name: a.publisher },
    datePublished: a.datePublished,
    dateModified: a.dateModified,
  });
}

/** Aman disisipkan ke <script type="application/ld+json">: cegah penutupan tag lewat "</script>". */
export function serializeJsonLd(data: Json): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
