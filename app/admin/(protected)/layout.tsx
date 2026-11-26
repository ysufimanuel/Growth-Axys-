import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "../../../components/admin/AdminShell";
import { navFor } from "../../../lib/core/admin-nav";
import { actorFromSessionCookie, SESSION_COOKIE } from "../../../lib/server/auth";
import { isAdminConfigured } from "../../../lib/server/firebase-admin";

// Gerbang server: semua halaman di bawah ini memverifikasi session cookie, akun aktif, dan role
// pada SETIAP request. Menyembunyikan menu di UI bukan kontrol keamanan; tiap halaman & endpoint cek ulang.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured()) {
    return (
      <main className="adm-main" style={{ padding: "2rem" }}>
        <p role="alert">Kredensial Firebase Admin belum dikonfigurasi di environment server.</p>
      </main>
    );
  }
  const actor = await actorFromSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  if (!actor) redirect("/admin/login");

  return (
    <AdminShell nav={navFor(actor.role)} email={actor.email} roleLabel={actor.role === "superadmin" ? "Superadmin" : "Admin"}>
      {children}
    </AdminShell>
  );
}
