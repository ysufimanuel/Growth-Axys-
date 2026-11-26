import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AccountSettings } from "../../../../components/admin/AccountSettings";
import { can } from "../../../../lib/core/permissions";
import { actorFromSessionCookie, SESSION_COOKIE } from "../../../../lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaturan akun saya" };

export default async function ProfilePage() {
  const actor = await actorFromSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  if (!actor || !can(actor.role, "dashboard.view")) notFound();

  return (
    <>
      <div className="adm-pagehead">
        <div><h1>Pengaturan akun saya</h1><p>Perbarui email dan password akun admin yang sedang digunakan.</p></div>
      </div>
      <AccountSettings email={actor.email} />
    </>
  );
}
