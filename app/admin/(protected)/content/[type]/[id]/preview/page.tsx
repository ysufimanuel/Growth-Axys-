import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "../../../../../../../components/admin/StatusBadge";
import { FIELDS } from "../../../../../../../lib/core/content-fields";
import { contentTypeOr404, requirePageActor } from "../../../../../../../lib/server/admin-page";
import { getContent } from "../../../../../../../lib/server/content-service";
import { HttpError } from "../../../../../../../lib/server/http";
import { LiquidGlass } from "../../../../../../../components/admin/liquid-glass";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pratinjau" };

const get = (o: unknown, path: string) => path.split(".").reduce<unknown>((x, k) => (x && typeof x === "object" ? (x as Record<string, unknown>)[k] : undefined), o);

/** Pratinjau internal (draft/arsip ikut tampil). Semua isi dirender sebagai teks, bukan HTML. */
export default async function PreviewPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  await requirePageActor("content.preview");
  const { type: rawType, id } = await params;
  const type = contentTypeOr404(rawType);
  let doc;
  try { doc = await getContent(type, id); } catch (e) { if (e instanceof HttpError && e.status === 404) notFound(); throw e; }
  const status = doc.publishStatus as "draft" | "published" | "archived";

  return (
    <>
      <div className="adm-pagehead">
        <div><h1>Pratinjau</h1><p>Tampilan data apa adanya. Halaman publik hanya menampilkan konten berstatus terbit.</p></div>
        <Link className="adm-btn" href={`/admin/content/${type}/${id}`}>← Kembali ke editor</Link>
      </div>
      <LiquidGlass as="article" className="adm-card" style={{ display: "grid", gap: 14 }}>
        <StatusBadge status={status} />
        {FIELDS[type].filter((f) => f.kind !== "checkbox" || get(doc, f.name) === true).map((f) => {
          const v = get(doc, f.name);
          if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return null;
          const text = Array.isArray(v) ? v.map((x) => (typeof x === "object" ? `${(x as { title?: string }).title} — ${(x as { url?: string }).url}` : String(x))).join("\n") : f.kind === "date" ? new Date(v as number).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) : String(v);
          return (
            <section key={f.name}>
              <h2 style={{ fontSize: 13, color: "var(--adm-muted)" }}>{f.label}</h2>
              <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{text}</p>
            </section>
          );
        })}
      </LiquidGlass>
    </>
  );
}
