import "server-only";
import { adminAuth, adminDb } from "./firebase-admin";
import { resolveRole, type AccountStatus, type AccountSummary, type Role } from "../core/permissions";

export interface AccountView extends AccountSummary {
  email: string;
  displayName: string;
  disabled: boolean;
  emailVerified: boolean;
  lastSignIn: string | null;
  created: string | null;
}

/** Daftar akun yang memiliki role admin/superadmin (maks. 1000 akun pertama). */
export async function listAccounts(): Promise<{ accounts: AccountView[]; truncated: boolean }> {
  const result = await adminAuth().listUsers(1000);
  const profiles = await adminDb().collection("profiles").get();
  const statusByUid = new Map(profiles.docs.map((d) => [d.id, d.get("status") as string | undefined]));

  const accounts: AccountView[] = [];
  for (const u of result.users) {
    const role = resolveRole(u.uid, u.customClaims, process.env.SUPER_ADMIN_UID);
    if (!role) continue;
    const stored = statusByUid.get(u.uid);
    const status: AccountStatus = u.disabled || stored === "disabled" ? "disabled" : stored === "invited" ? "invited" : "active";
    accounts.push({
      uid: u.uid,
      role: role as Role,
      status,
      email: u.email ?? "",
      displayName: u.displayName ?? "",
      disabled: u.disabled,
      emailVerified: u.emailVerified,
      lastSignIn: u.metadata.lastSignInTime ?? null,
      created: u.metadata.creationTime ?? null,
    });
  }
  return { accounts, truncated: Boolean(result.pageToken) };
}
