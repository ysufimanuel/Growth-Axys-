import { test } from "node:test";
import assert from "node:assert/strict";
import { can, resolveRole, guardAccountChange, canEditRiskySeo } from "../lib/core/permissions.ts";
import type { AccountSummary } from "../lib/core/permissions.ts";
import { slugify, isValidSlug } from "../lib/core/slug.ts";
import { validateRedirect, normalizePath } from "../lib/core/redirects.ts";
import type { RedirectRule } from "../lib/core/redirects.ts";
import { legacyRedirects } from "../lib/core/legacy-redirects.ts";
import { normalizeProject, readPublishStatus, toParagraphs, toMillis, normalizeArticle } from "../lib/core/normalize.ts";
import { checkContent, isThinContent } from "../lib/core/content-checks.ts";
import { mediaInfo } from "../lib/core/media.ts";
import { organizationJsonLd, serializeJsonLd } from "../lib/core/jsonld.ts";
import { toFormValues, buildPayload } from "../lib/core/content-fields.ts";

// ---------- permissions (spec bagian 7 & 17: uji role minimum) ----------
test("Admin tidak punya izin manajemen akun, role, audit, hapus permanen, SEO global, redirect, restore", () => {
  for (const p of ["users.manage", "roles.change", "audit.view", "content.delete", "seo.global", "redirects.manage", "backup.restore"] as const) {
    assert.equal(can("admin", p), false, p);
    assert.equal(can("superadmin", p), true, p);
  }
});

test("Admin boleh operasi konten harian", () => {
  for (const p of ["dashboard.view", "content.edit", "content.preview", "content.publish", "content.archive", "media.manage", "seo.page"] as const) {
    assert.equal(can("admin", p), true, p);
  }
});

test("role kosong/null tidak punya izin apa pun", () => {
  assert.equal(can(null, "dashboard.view"), false);
  assert.equal(can(undefined, "dashboard.view"), false);
});

test("hanya Superadmin boleh mengubah canonical/noindex", () => {
  assert.equal(canEditRiskySeo("admin"), false);
  assert.equal(canEditRiskySeo("superadmin"), true);
});

test("resolveRole: claim role, legacy admin:true, dan SUPER_ADMIN_UID", () => {
  assert.equal(resolveRole("u1", { role: "admin" }), "admin");
  assert.equal(resolveRole("u1", { role: "superadmin" }), "superadmin");
  assert.equal(resolveRole("u1", { admin: true }), "admin"); // kompatibel dengan versi vanilla
  assert.equal(resolveRole("boss", { admin: true }, "boss"), "superadmin");
  assert.equal(resolveRole("u1", {}), null);
  assert.equal(resolveRole("u1", { role: "owner" }), null); // role tak dikenal ditolak
  assert.equal(resolveRole("u1", undefined, "boss"), null);
});

const accounts: AccountSummary[] = [
  { uid: "s1", role: "superadmin", status: "active" },
  { uid: "a1", role: "admin", status: "active" },
];

test("Superadmin terakhir tidak bisa diturunkan atau dinonaktifkan", () => {
  assert.equal(guardAccountChange(accounts, "s1", { role: "admin" }, "a1").ok, false);
  assert.equal(guardAccountChange(accounts, "s1", { status: "disabled" }, "a1").ok, false);
});

test("Superadmin boleh diturunkan jika masih ada superadmin aktif lain", () => {
  const two: AccountSummary[] = [...accounts, { uid: "s2", role: "superadmin", status: "active" }];
  assert.equal(guardAccountChange(two, "s1", { role: "admin" }, "s2").ok, true);
});

test("tidak bisa mengubah akun sendiri dan akun tak dikenal", () => {
  assert.equal(guardAccountChange(accounts, "a1", { status: "disabled" }, "a1").ok, false);
  assert.equal(guardAccountChange(accounts, "zzz", { status: "disabled" }, "s1").ok, false);
});

// ---------- slug ----------
test("slugify & isValidSlug", () => {
  assert.equal(slugify("Jalan & Infrastruktur"), "jalan-dan-infrastruktur");
  assert.equal(slugify("  Renovasi   Gedung Kantor!! "), "renovasi-gedung-kantor");
  assert.equal(slugify("Café Évolution"), "cafe-evolution");
  assert.equal(isValidSlug("konstruksi-sipil"), true);
  assert.equal(isValidSlug("Konstruksi"), false);
  assert.equal(isValidSlug("a--b"), false);
  assert.equal(isValidSlug("admin"), false); // reserved
  assert.equal(isValidSlug(""), false);
});

// ---------- redirects ----------
const rule = (from: string, to: string): RedirectRule => ({ from, to, statusCode: 308, active: true });

test("normalizePath membuang query dan trailing slash", () => {
  assert.equal(normalizePath("/layanan/mep/?x=1"), "/layanan/mep");
  assert.equal(normalizePath("layanan"), "/layanan");
  assert.equal(normalizePath("/"), "/");
});

test("validateRedirect menolak loop, chain, duplikat, dan redirect ke beranda", () => {
  assert.equal(validateRedirect({ from: "/a", to: "/a/" }, []).ok, false);
  assert.equal(validateRedirect({ from: "/a", to: "/" }, []).ok, false);
  assert.equal(validateRedirect({ from: "/a", to: "/b" }, [rule("/a", "/c")]).ok, false);
  assert.equal(validateRedirect({ from: "/a", to: "/b" }, [rule("/b", "/c")]).ok, false); // chain
  assert.equal(validateRedirect({ from: "/c", to: "/a" }, [rule("/a", "/b"), rule("/b", "/c")]).ok, false); // loop
  assert.equal(validateRedirect({ from: "x", to: "/b" }, []).ok, false);
  assert.equal(validateRedirect({ from: "/a", to: "/b" }, []).ok, true);
});

test("redirect legacy: semua halaman .html lama punya tujuan baru dan tidak ada loop", () => {
  const map = new Map(legacyRedirects.map((r) => [r.source, r.destination]));
  for (const src of ["/about.html", "/services.html", "/projects.html", "/certifications.html", "/contact.html", "/index.html", "/project-detail.html"]) {
    assert.ok(map.has(src), src);
  }
  for (const r of legacyRedirects) {
    assert.equal(r.permanent, true);
    assert.notEqual(r.source, r.destination);
    assert.ok(!map.has(r.destination.replace(/:.*/, "")) || r.destination === "/", `chain: ${r.source} -> ${r.destination}`);
  }
  const detail = legacyRedirects.find((r) => r.source === "/project-detail.html" && r.has);
  assert.equal(detail?.destination, "/proyek/:id");
});

// ---------- normalize (dokumen legacy) ----------
test("normalizeProject memetakan dokumen legacy dari situs vanilla", () => {
  const p = normalizeProject("abc123", {
    name: "Gedung A", location: "Bogor", year: "2025", type: "Gedung", status: "Selesai",
    owner: "PT X", value: "", cover: "https://images.unsplash.com/x.jpg",
    description: "Lingkup A.\n\nLingkup B.", gallery: ["https://a.id/1.jpg", 5, " "],
    mediaSettings: { autoplay: true }, createdAt: { seconds: 10 },
  });
  assert.equal(p.slug, "abc123"); // docId jadi slug -> /project-detail.html?id=abc123 tetap valid
  assert.equal(p.title, "Gedung A");
  assert.equal(p.year, 2025);
  assert.equal(p.category, "Gedung");
  assert.equal(p.progress, "Selesai");
  assert.equal(p.publishStatus, "published"); // legacy sudah publik
  assert.deepEqual(p.gallery, ["https://a.id/1.jpg"]);
  assert.deepEqual(p.mediaSettings, { autoplay: true, muted: true });
  assert.equal(p.createdAt, 10000);
});

test("dokumen baru memakai publishStatus; nilai tak dikenal jatuh ke published hanya untuk legacy", () => {
  assert.equal(readPublishStatus({ publishStatus: "draft" }), "draft");
  assert.equal(readPublishStatus({ publishStatus: "archived" }), "archived");
  assert.equal(readPublishStatus({}), "published");
  assert.equal(normalizeProject("x", { title: "T", slug: "t-baru", progress: "Berjalan", publishStatus: "draft" }).progress, "Berjalan");
});

test("artikel: sumber tanpa URL http(s) dibuang", () => {
  const a = normalizeArticle("a", { title: "T", sources: [{ title: "OK", url: "https://x.id" }, { title: "Bad", url: "javascript:alert(1)" }] });
  assert.equal(a.sources.length, 1);
});

test("toParagraphs & toMillis", () => {
  assert.deepEqual(toParagraphs("a\nb\n\nc"), ["a b", "c"]);
  assert.equal(toMillis("2026-01-01T00:00:00Z"), Date.parse("2026-01-01T00:00:00Z"));
  assert.equal(toMillis(null), null);
});

// ---------- checks ----------
test("checkContent memberi peringatan, bukan keputusan", () => {
  const w = checkContent({ title: "Layanan", body: "pendek", hasImage: true, isArticle: true });
  assert.ok(w.some((x) => x.includes("Meta description kosong")));
  assert.ok(w.some((x) => x.includes("tipis")));
  assert.ok(w.some((x) => x.includes("alt text")));
  assert.ok(w.some((x) => x.includes("sumber")));
  assert.ok(w.some((x) => x.includes("reviewer")));
  assert.equal(isThinContent("x".repeat(700)), false);
});

// ---------- media ----------
test("mediaInfo: gambar, YouTube, Drive, dan penolakan non-HTTPS", () => {
  assert.equal(mediaInfo("http://x.id/a.jpg").kind, "invalid");
  assert.equal(mediaInfo("not a url").kind, "invalid");
  assert.equal(mediaInfo("https://images.unsplash.com/photo-1?w=1").kind, "image");
  assert.equal(mediaInfo("https://youtu.be/dQw4w9WgXcQ").kind, "youtube");
  assert.equal(mediaInfo("https://drive.google.com/file/d/ABC/view").kind, "embed");
  assert.equal(mediaInfo("https://x.id/evil.svg").kind, "link"); // SVG tidak dirender sebagai gambar
});

// ---------- json-ld ----------
test("organizationJsonLd membuang properti kosong dan tidak mengarang alamat", () => {
  const j = organizationJsonLd({ name: "PT Pillarians Group", url: "https://x.id", address: null, telephone: "" });
  assert.equal("address" in j, false);
  assert.equal("telephone" in j, false);
  assert.equal(j["@type"], "Organization");
});

test("serializeJsonLd mencegah injeksi </script>", () => {
  const s = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.equal(s.includes("</script>"), false);
});


// ---------- admin editor legacy compatibility ----------
test("editor proyek membaca field legacy dan mempertahankan media settings", () => {
  const legacy = {
    name: "Gedung Lama",
    year: "2024",
    type: "Infrastruktur",
    status: "Berjalan",
    description: "Lingkup pekerjaan lama",
    mediaSettings: { autoplay: true, muted: false },
    gallery: ["https://example.com/a.jpg"],
  };
  const values = toFormValues("projects", legacy);
  assert.equal(values.title, "Gedung Lama");
  assert.equal(values.year, "2024");
  assert.equal(values.category, "Infrastruktur");
  assert.equal(values.progress, "Berjalan");
  assert.equal(values.scope, "Lingkup pekerjaan lama");
  assert.equal(values["mediaSettings.autoplay"], true);
  assert.equal(values["mediaSettings.muted"], false);
  assert.deepEqual(buildPayload("projects", values, values, { isSuper: true }), {});
});

test("editor proyek mengirim hanya perubahan dan tidak menghapus field legacy", () => {
  const legacy = { name: "Gedung Lama", type: "Gedung", status: "Selesai", description: "Lingkup lama" };
  const initial = toFormValues("projects", legacy);
  const changed = { ...initial, title: "Gedung Baru", "mediaSettings.autoplay": true };
  const payload = buildPayload("projects", changed, initial, { isSuper: true });
  assert.equal(payload.title, "Gedung Baru");
  assert.deepEqual(payload.mediaSettings, { autoplay: true, muted: false });
  assert.equal("name" in payload, false);
  assert.equal("description" in payload, false);
});
