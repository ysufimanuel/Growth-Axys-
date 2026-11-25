import { cookies } from "next/headers";
import { actorFromSessionCookie, SESSION_COOKIE } from "../../../../lib/server/auth";
import { adminDb } from "../../../../lib/server/firebase-admin";
import { can } from "../../../../lib/core/permissions";

export const dynamic = "force-dynamic";

const TYPES = [
  { key: "projects", label: "Proyek" },
  { key: "services", label: "Layanan (Firestore)" },
  { key: "articles", label: "Artikel" },
  { key: "certifications", label: "Sertifikasi" },
] as const;

export default async function DashboardPage() {
  const actor = await actorFromSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  const db = adminDb();
  const counts = await Promise.all(
    TYPES.map(async (t) => {
      const snap = await db.collection(t.key).get();
      const by = { draft: 0, published: 0, archived: 0 };
      for (const d of snap.docs) {
        const raw: unknown = d.get("publishStatus");
        const key: keyof typeof by = raw === "draft" || raw === "archived" ? raw : "published";
        by[key]++;
      }
      return { ...t, ...by };
    }),
  );

  return (
    <>
      <h1>Dashboard</h1>
      <p>
        Masuk sebagai <b>{actor?.role}</b>. Pengelolaan konten saat ini melalui API (<code>/api/admin/content/[jenis]</code>); editor visual adalah pekerjaan lanjutan.
      </p>
      <table>
        <caption>Status konten</caption>
        <thead>
          <tr>
            <th scope="col">Jenis</th>
            <th scope="col">Published</th>
            <th scope="col">Draft</th>
            <th scope="col">Archived</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((c) => (
            <tr key={c.key}>
              <th scope="row">{c.label}</th>
              <td>{c.published}</td>
              <td>{c.draft}</td>
              <td>{c.archived}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Izin Anda: {can(actor?.role, "content.publish") ? "publish, " : ""}
        {can(actor?.role, "users.manage") ? "kelola akun, " : ""}
        {can(actor?.role, "audit.view") ? "audit log, " : ""}
        edit konten.
      </p>
    </>
  );
}
