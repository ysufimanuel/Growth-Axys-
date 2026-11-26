import "server-only";
import type { Metadata } from "next";
import { adminDb } from "./firebase-admin";
import { SITE_URL, site } from "../site";

type GlobalSeo = { title?: string; description?: string; ogImage?: string; index?: boolean; follow?: boolean };

export async function getGlobalMetadata(): Promise<Metadata> {
  let settings: GlobalSeo = {};
  try {
    const snap = await adminDb().collection("siteSettings").doc("seoGlobal").get();
    if (snap.exists) settings = snap.data() as GlobalSeo;
  } catch {
    // Public pages still render using verified repository defaults when Admin SDK is unavailable.
  }
  const title = settings.title?.trim() || `${site.name} | ${site.tagline}`;
  const description = settings.description?.trim() || site.description;
  const images = settings.ogImage ? [{ url: settings.ogImage }] : undefined;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${settings.title?.trim() || site.name}` },
    description,
    applicationName: site.name,
    openGraph: { title, description, siteName: site.name, locale: site.locale, type: "website", images },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images },
    robots: { index: settings.index !== false, follow: settings.follow !== false },
    formatDetection: { telephone: false },
  };
}
