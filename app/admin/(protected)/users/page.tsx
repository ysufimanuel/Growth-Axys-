import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { UserManagement } from "../../../../components/admin/UserManagement";
import { can } from "../../../../lib/core/permissions";
import { listAccounts } from "../../../../lib/server/accounts";
import { actorFromSessionCookie, SESSION_COOKIE } from "../../../../lib/server/auth";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await actorFromSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  // Server-side gate remains authoritative; the client UI is not an access-control boundary.
  if (!actor || !can(actor.role, "users.manage")) notFound();
  const { accounts, truncated } = await listAccounts();

  return (
    <>
      <div className="adm-pagehead">
        <div>
          <h1>Akun admin</h1>
          <p>Undang Admin, tinjau status akun, dan kelola akses. Perubahan penting memerlukan konfirmasi.</p>
        </div>
      </div>
      <UserManagement initialAccounts={accounts} truncated={truncated} actorUid={actor.uid} />
    </>
  );
}
