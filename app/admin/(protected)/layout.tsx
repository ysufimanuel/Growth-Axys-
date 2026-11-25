import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { can } from "../../../lib/core/permissions";
import { actorFromSessionCookie, SESSION_COOKIE } from "../../../lib/server/auth";
import { isAdminConfigured } from "../../../lib/server/firebase-admin";

// Gerbang server: semua halaman di bawah ini memverifikasi session cookie, akun aktif, dan role
// pada SETIAP request. Menyembunyikan tautan di UI bukan kontrol keamanan.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured()) {
    return <p style={{ padding: "2rem" }}>Kredensial Firebase Admin belum dikonfigurasi di environment server.</p>;
  }
  const actor = await actorFromSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  if (!actor) redirect("/admin/login");

  return (
    <div className="admin-layout">
      <header className="admin-topbar">
        <nav aria-label="Navigasi admin">
          <Link href="/admin/dashboard">Dashboard</Link>
          {can(actor.role, "users.manage") ? <Link href="/admin/users">Akun</Link> : null}
          <Link href="/" target="_blank">
            Lihat website ↗
          </Link>
        </nav>
        <span>
          {actor.email} · <b>{actor.role}</b>
        </span>
      </header>
      <div className="admin-content">{children}</div>
    </div>
  );
}
