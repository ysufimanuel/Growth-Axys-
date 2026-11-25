// Utilitas slug: huruf kecil, angka, tanda hubung. Modul murni.

const RESERVED = new Set([
  "admin", "api", "login", "new", "baru", "edit", "sitemap", "robots", "_next", "static",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80 && !RESERVED.has(slug);
}
