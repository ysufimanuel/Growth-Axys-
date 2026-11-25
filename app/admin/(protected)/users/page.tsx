import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { can } from "../../../../lib/core/permissions";
import { listAccounts } from "../../../../lib/server/accounts";
import { actorFromSessionCookie, SESSION_COOKIE } from "../../../../lib/server/auth";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await actorFromSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  // Cek izin di server: Admin biasa mendapat 404, bukan sekadar tautan yang disembunyikan.
  if (!actor || !can(actor.role, "users.manage")) notFound();
  const { accounts, truncated } = await listAccounts();

  return (
    <>
      <h1>Akun admin</h1>
      <p>
        Undang, ubah role, atau nonaktifkan akun melalui <code>POST /api/admin/invitations</code> dan <code>PATCH /api/admin/users/[uid]</code>. Antarmuka form akan ditambahkan pada fase berikutnya.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Email</th>
            <th scope="col">Nama</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Login terakhir</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.uid}>
              <td>{a.email}</td>
              <td>{a.displayName}</td>
              <td>{a.role}</td>
              <td>{a.status}</td>
              <td>{a.lastSignIn ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {truncated ? <p>Daftar dipotong pada 1000 akun pertama.</p> : null}
    </>
  );
}
