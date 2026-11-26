import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CONTENT_LABEL } from "../core/admin-nav";
import { can, type Permission } from "../core/permissions";
import { actorFromSessionCookie, SESSION_COOKIE } from "./auth";
import { isContentType, type ContentType } from "./content-schemas";

/** Verifikasi ulang sesi + izin di SETIAP halaman (layout saja tidak cukup). Tanpa izin -> 404. */
export async function requirePageActor(permission: Permission) {
  const actor = await actorFromSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  if (!actor) redirect("/admin/login");
  if (!can(actor.role, permission)) notFound();
  return actor;
}

export function contentTypeOr404(raw: string): ContentType {
  if (!isContentType(raw)) notFound();
  return raw;
}

export const labelOf = (t: ContentType) => CONTENT_LABEL[t];

export function capsFor(role: "admin" | "superadmin") {
  return {
    isSuper: can(role, "seo.global"),
    publish: can(role, "content.publish"),
    archive: can(role, "content.archive"),
    restore: can(role, "backup.restore"),
    remove: can(role, "content.delete"),
  };
}
