import { test } from "node:test";
import assert from "node:assert/strict";
import { activeNavId, navFor, NAV_ITEMS } from "../lib/core/admin-nav.ts";
import { isCookieRequestAllowed, readCookie } from "../lib/core/csrf.ts";
import { parseListQuery, queryRows, type ListRow } from "../lib/core/content-query.ts";
import { buildPayload, FIELDS, toFormValues, validateForm } from "../lib/core/content-fields.ts";
import { can, type Permission } from "../lib/core/permissions.ts";

test("menu: Admin tidak melihat menu superadmin; Superadmin melihat semua", () => {
  const admin = navFor("admin").map((i) => i.id);
  for (const id of ["users", "audit", "backup", "redirects", "seo-global"]) assert.ok(!admin.includes(id), id);
  for (const id of ["overview", "projects", "services", "articles", "certifications", "media", "seo"]) assert.ok(admin.includes(id), id);
  assert.equal(navFor("superadmin").length, NAV_ITEMS.length);
  assert.deepEqual(navFor(null), []);
});

test("menu: setiap item mengikuti matriks izin (tidak ada menu tanpa izin)", () => {
  for (const role of ["admin", "superadmin"] as const) for (const i of navFor(role)) assert.ok(can(role, i.permission as Permission));
});

test("menu aktif memakai awalan terpanjang", () => {
  const items = navFor("superadmin");
  assert.equal(activeNavId("/admin/content/projects/new", items), "projects");
  assert.equal(activeNavId("/admin/settings/seo", items), "seo-global");
  assert.equal(activeNavId("/admin/seo", items), "seo");
  assert.equal(activeNavId("/admin/lain", items), null);
});

test("CSRF: metode aman lolos; POST wajib header kustom + same-origin", () => {
  const base = { origin: "https://a.id", host: "a.id", secFetchSite: null, customHeader: "1" };
  assert.ok(isCookieRequestAllowed({ ...base, method: "GET", customHeader: null, origin: null }));
  assert.ok(isCookieRequestAllowed({ ...base, method: "POST" }));
  assert.ok(!isCookieRequestAllowed({ ...base, method: "POST", customHeader: null }));
  assert.ok(!isCookieRequestAllowed({ ...base, method: "POST", origin: "https://evil.com" }));
  assert.ok(!isCookieRequestAllowed({ ...base, method: "DELETE", origin: null }));
  assert.ok(!isCookieRequestAllowed({ ...base, method: "PATCH", secFetchSite: "cross-site" }));
  assert.ok(isCookieRequestAllowed({ ...base, method: "PATCH", secFetchSite: "same-origin", origin: null }));
  assert.equal(readCookie("a=1; pg_session=abc%3D; b=2", "pg_session"), "abc=");
  assert.equal(readCookie(null, "x"), undefined);
});

const rows: ListRow[] = [
  { id: "1", title: "Gedung Kantor", slug: "gedung-kantor", publishStatus: "published", updatedAt: 3, extra: "Jakarta" },
  { id: "2", title: "Jalan Tol", slug: "jalan-tol", publishStatus: "draft", updatedAt: 5, extra: "Bekasi" },
  { id: "3", title: "Renovasi Ruko", slug: "renovasi-ruko", publishStatus: "archived", updatedAt: 1, extra: "" },
];

test("daftar: filter status, cari (tanpa aksen/kapital), urut terbaru, hitungan", () => {
  const q = (s: string) => parseListQuery(new URLSearchParams(s));
  const all = queryRows(rows, q(""));
  assert.deepEqual(all.items.map((r) => r.id), ["2", "1", "3"]);
  assert.deepEqual(all.counts, { all: 3, draft: 1, published: 1, archived: 1 });
  assert.deepEqual(queryRows(rows, q("status=draft")).items.map((r) => r.id), ["2"]);
  assert.deepEqual(queryRows(rows, q("q=JAKARTA")).items.map((r) => r.id), ["1"]);
  assert.equal(queryRows(rows, q("q=tidak-ada")).total, 0);
});

test("daftar: paginasi dibatasi & halaman di luar rentang dijepit", () => {
  const many = Array.from({ length: 45 }, (_, i): ListRow => ({ id: String(i), title: `T${i}`, slug: `t${i}`, publishStatus: "published", updatedAt: i, extra: "" }));
  const r = queryRows(many, parseListQuery(new URLSearchParams("page=99&pageSize=20")));
  assert.equal(r.pageCount, 3);
  assert.equal(r.page, 3);
  assert.equal(r.items.length, 5);
  assert.equal(parseListQuery(new URLSearchParams("pageSize=9999")).pageSize, 50);
  assert.equal(parseListQuery(new URLSearchParams("status=hack")).status, "all");
});

test("form: validasi cermin skema server", () => {
  const v = toFormValues("projects", null);
  assert.ok(validateForm("projects", v, { isSuper: false }).title);
  const ok = { ...v, title: "Proyek A", cover: "http://x.com/a.jpg", gallery: "https://a.id/1.jpg\nftp://x" };
  const e = validateForm("projects", ok, { isSuper: false });
  assert.ok(e.cover);
  assert.ok(e.gallery);
  assert.ok(!e.title);
  assert.ok(validateForm("projects", { ...v, title: "Proyek A", year: "99" }, { isSuper: false }).year);
});

test("form: canonical/noindex tidak pernah dikirim oleh Admin; Superadmin boleh", () => {
  const v = { ...toFormValues("services", null), title: "Layanan A", "seo.canonical": "https://a.id/x", "seo.noindex": true };
  const asAdmin = buildPayload("services", v, null, { isSuper: false });
  assert.equal((asAdmin.seo as Record<string, unknown> | undefined)?.canonical, undefined);
  assert.equal((asAdmin.seo as Record<string, unknown> | undefined)?.noindex, undefined);
  const asSuper = buildPayload("services", v, null, { isSuper: true });
  assert.equal((asSuper.seo as Record<string, unknown>).canonical, "https://a.id/x");
  assert.equal((asSuper.seo as Record<string, unknown>).noindex, true);
});

test("form: edit hanya mengirim field yang berubah; create tidak mengirim field kosong", () => {
  const doc = { id: "x", title: "Lama", slug: "lama", location: "Jakarta", gallery: ["https://a.id/1.jpg"], year: 2020 };
  const initial = toFormValues("projects", doc);
  assert.deepEqual(buildPayload("projects", { ...initial, title: "Baru" }, initial, { isSuper: false }), { title: "Baru" });
  assert.deepEqual(buildPayload("projects", initial, initial, { isSuper: false }), {});
  assert.deepEqual(buildPayload("projects", { ...initial, year: "" }, initial, { isSuper: false }), { year: null });
  const created = buildPayload("projects", { ...toFormValues("projects", null), title: "Proyek B" }, null, { isSuper: false });
  assert.deepEqual(created, { title: "Proyek B" });
});

test("form: sumber artikel diparse 'Judul | URL' dan roundtrip", () => {
  const doc = { sources: [{ title: "BPS", url: "https://bps.go.id/a" }], reviewedAt: Date.UTC(2026, 0, 5, 10) };
  const init = toFormValues("articles", doc);
  assert.equal(init.sources, "BPS | https://bps.go.id/a");
  assert.equal(init.reviewedAt, "2026-01-05");
  const p = buildPayload("articles", { ...init, sources: "A | https://a.id\nB | https://b.id" }, init, { isSuper: false });
  assert.deepEqual(p.sources, [{ title: "A", url: "https://a.id" }, { title: "B", url: "https://b.id" }]);
  assert.ok(validateForm("articles", { ...init, sources: "tanpa url" }, { isSuper: false }).sources);
});

test("field: tiap tipe punya field wajib judul/nama", () => {
  for (const t of Object.keys(FIELDS) as (keyof typeof FIELDS)[]) assert.ok(FIELDS[t].some((f) => f.required));
});
