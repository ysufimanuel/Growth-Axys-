"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type FormEvent } from "react";
import { buildPayload, FIELDS, toFormValues, validateForm, type ContentType, type FieldDef, type FormValues } from "../../lib/core/content-fields";
import { adminFetch } from "./api";
import { ConfirmDialog } from "./ConfirmDialog";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "./Toast";

type Status = "draft" | "published" | "archived";
interface Props {
  type: ContentType;
  singular: string;
  /** null = buat baru */
  doc: (Record<string, unknown> & { id: string; publishStatus: Status }) | null;
  caps: { isSuper: boolean; publish: boolean; archive: boolean; restore: boolean; remove: boolean };
}

const GROUPS: Record<FieldDef["group"], string> = { main: "Konten utama", detail: "Detail", media: "Media", geo: "Kualitas & sumber (GEO)", seo: "SEO" };

function Field({ f, value, error, disabled, onChange }: { f: FieldDef; value: string | boolean; error?: string; disabled: boolean; onChange: (v: string | boolean) => void }) {
  const id = useId();
  const hintId = `${id}-h`;
  const errId = `${id}-e`;
  const describedBy = [f.hint ? hintId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined;
  const common = { id, disabled, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, "aria-required": f.required || undefined };

  if (f.kind === "checkbox") {
    return (
      <div className={`adm-field${f.span ? " adm-span" : ""}`}>
        <label className="adm-check" htmlFor={id}>
          <input {...common} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} /> {f.label}
        </label>
        {f.hint ? <span id={hintId} className="adm-hint">{f.hint}</span> : null}
      </div>
    );
  }
  const str = String(value);
  return (
    <div className={`adm-field${f.span || f.kind === "textarea" || f.kind === "lines" || f.kind === "sources" ? " adm-span" : ""}`}>
      <label htmlFor={id}>{f.label}{f.required ? <span aria-hidden="true"> *</span> : null}</label>
      {f.kind === "textarea" || f.kind === "lines" || f.kind === "sources" ? (
        <textarea {...common} value={str} rows={f.kind === "textarea" ? 8 : 5} onChange={(e) => onChange(e.target.value)} />
      ) : f.kind === "select" ? (
        <select {...common} value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">— pilih —</option>
          {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input {...common} type={f.kind === "url" ? "url" : f.kind === "number" ? "text" : f.kind === "date" ? "date" : "text"} inputMode={f.kind === "number" ? "numeric" : undefined} value={str} onChange={(e) => onChange(e.target.value)} />
      )}
      {f.hint ? <span id={hintId} className="adm-hint">{f.hint}</span> : null}
      {error ? <span id={errId} className="adm-field-error" role="alert">{error}</span> : null}
    </div>
  );
}

export function ContentEditor({ type, singular, doc, caps }: Props) {
  const router = useRouter();
  const toast = useToast();
  const initial = useMemo(() => toFormValues(type, doc), [type, doc]);
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState(String(initial.instagramUrl || ""));
  const [importingInstagram, setImportingInstagram] = useState(false);
  const [instagramError, setInstagramError] = useState("");
  const [confirm, setConfirm] = useState<null | { kind: "slug" | Status | "delete" }>(null);

  const status = doc?.publishStatus ?? "draft";
  const readOnly = status === "archived";
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const fields = FIELDS[type].filter((f) => !f.superOnly || caps.isSuper);
  const groups = (Object.keys(GROUPS) as FieldDef["group"][]).map((g) => ({ g, fields: fields.filter((f) => f.group === g) })).filter((x) => x.fields.length);

  async function importInstagram() {
    setInstagramError(""); setImportingInstagram(true);
    try {
      const result = await adminFetch<{ url: string; caption: string; thumbnailUrl?: string }>("/api/admin/instagram/import", { method: "POST", body: { url: instagramUrl.trim() } });
      if (!result.ok || !result.data) throw new Error(result.error || "Postingan Instagram gagal diimpor.");
      const caption = result.data.caption || "";
      setValues((current) => ({ ...current, instagramUrl: result.data!.url,
        ...(type === "projects" ? { scope: caption || current.scope, cover: "" } : type === "articles" ? { content: caption || current.content, excerpt: caption.slice(0, 400) || current.excerpt, image: "" } : { content: caption || current.content, image: "" }) }));
      setInstagramUrl(result.data.url);
      toast("ok", caption ? "Link diimpor dan caption dimasukkan ke deskripsi." : "Link diimpor. Caption tidak tersedia dari Meta, isi deskripsi manual.");
    } catch (error) { setInstagramError(error instanceof Error ? error.message : "Impor Instagram gagal."); }
    finally { setImportingInstagram(false); }
  }

  async function save(redirectConfirmed = false) {
    const errs = validateForm(type, values, { isSuper: caps.isSuper });
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) {
      setFormError("Periksa isian yang ditandai.");
      return;
    }
    const payload = buildPayload(type, values, doc ? initial : null, { isSuper: caps.isSuper });
    if (doc && Object.keys(payload).length === 0) { toast("ok", "Tidak ada perubahan."); return; }
    setBusy(true);
    const res = doc
      ? await adminFetch<{ id?: string; warnings: string[] }>(`/api/admin/content/${type}/${doc.id}`, { method: "PATCH", body: redirectConfirmed ? { ...payload, redirectConfirmed: true } : payload })
      : await adminFetch<{ id?: string; warnings: string[] }>(`/api/admin/content/${type}`, { method: "POST", body: payload });
    setBusy(false);
    setConfirm(null);
    if (!res.ok) {
      if (res.code === "SLUG_CHANGE_NEEDS_CONFIRMATION") return setConfirm({ kind: "slug" });
      setFormError(res.error);
      toast("error", res.error ?? "Gagal menyimpan.");
      return;
    }
    toast("ok", doc ? "Perubahan disimpan." : `${singular[0]!.toUpperCase() + singular.slice(1)} dibuat sebagai draft.`);
    if (!doc) return router.replace(`/admin/content/${type}/${res.data?.id ?? ""}`);
    setWarnings(res.data?.warnings ?? []);
    router.refresh();
  }

  async function changeStatus(to: Status) {
    if (!doc) return;
    setBusy(true);
    const res = await adminFetch<{ warnings: string[] }>(`/api/admin/content/${type}/${doc.id}/status`, { method: "POST", body: { to } });
    setBusy(false);
    setConfirm(null);
    if (!res.ok) { toast("error", res.error ?? "Gagal mengubah status."); return; }
    setWarnings(res.data?.warnings ?? []);
    toast("ok", to === "published" ? "Konten diterbitkan." : to === "archived" ? "Konten diarsipkan." : "Konten dikembalikan ke draft.");
    router.refresh();
  }

  async function remove() {
    if (!doc) return;
    setBusy(true);
    const res = await adminFetch(`/api/admin/content/${type}/${doc.id}`, { method: "DELETE" });
    setBusy(false);
    setConfirm(null);
    if (!res.ok) { toast("error", res.error ?? "Gagal menghapus."); return; }
    toast("ok", "Konten dihapus permanen.");
    router.replace(`/admin/content/${type}`);
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); if (!readOnly) void save(); }

  return (
    <>
      {readOnly ? <p className="adm-alert adm-alert-warn" role="status">Konten ini diarsipkan dan tidak dapat diubah. {caps.restore ? "Pulihkan ke draft untuk mengedit." : "Hanya Superadmin yang dapat memulihkannya."}</p> : null}
      {formError ? <p className="adm-alert adm-alert-error" role="alert">{formError}</p> : null}
      {warnings.length ? (
        <div className="adm-alert adm-alert-warn" role="status">
          Saran perbaikan kualitas:
          <ul>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      ) : null}

      {type !== "certifications" ? <section className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h2>Impor dari Instagram</h2><p className="adm-hint">Tempel link postingan, Reel, atau video Instagram untuk mengisi URL media dan deskripsi.</p>
        <div className="adm-actions" style={{ alignItems: "end", gap: ".75rem" }}><div className="adm-field" style={{ flex: 1 }}><label htmlFor="instagram-import-url">Link postingan Instagram</label><input id="instagram-import-url" type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://www.instagram.com/p/.../" /></div><button type="button" className="adm-btn adm-btn-primary" disabled={importingInstagram || !instagramUrl.trim() || readOnly} onClick={() => void importInstagram()}>{importingInstagram ? "Mengambil…" : "Ambil postingan"}</button></div>
        {instagramError ? <p className="adm-field-error" role="alert">{instagramError}</p> : null}<p className="adm-hint">Caption hanya dapat diisi otomatis jika Meta mengembalikannya melalui oEmbed.</p>
      </section> : null}
      <form className="adm-form" onSubmit={onSubmit} noValidate>
        {groups.map(({ g, fields: fs }) => (
          <fieldset key={g} className="adm-fieldset" disabled={readOnly}>
            <legend>{GROUPS[g]}</legend>
            <div className="adm-formgrid">
              {fs.map((f) => <Field key={f.name} f={f} value={values[f.name] ?? ""} error={errors[f.name]} disabled={readOnly} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />)}
            </div>
          </fieldset>
        ))}

        <div className="adm-stickybar">
          <span className="adm-actions" style={{ alignItems: "center" }}>
            {doc ? <StatusBadge status={status} /> : <span className="adm-hint">Konten baru disimpan sebagai draft.</span>}
            {dirty && !readOnly ? <span className="adm-hint">Ada perubahan belum disimpan</span> : null}
          </span>
          <span className="adm-actions">
            <Link className="adm-btn" href={`/admin/content/${type}`}>Kembali</Link>
            {doc ? <Link className="adm-btn" href={`/admin/content/${type}/${doc.id}/preview`}>Pratinjau</Link> : null}
            {doc && status === "draft" && caps.publish ? <button type="button" className="adm-btn" disabled={busy || dirty} title={dirty ? "Simpan perubahan dulu" : undefined} onClick={() => setConfirm({ kind: "published" })}>Terbitkan</button> : null}
            {doc && status === "published" && caps.publish ? <button type="button" className="adm-btn" disabled={busy || dirty} onClick={() => setConfirm({ kind: "draft" })}>Tarik ke draft</button> : null}
            {doc && status !== "archived" && caps.archive ? <button type="button" className="adm-btn" disabled={busy || dirty} onClick={() => setConfirm({ kind: "archived" })}>Arsipkan</button> : null}
            {doc && status === "archived" && caps.restore ? <button type="button" className="adm-btn" disabled={busy} onClick={() => setConfirm({ kind: "draft" })}>Pulihkan ke draft</button> : null}
            {doc && status === "archived" && caps.remove ? <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={() => setConfirm({ kind: "delete" })}>Hapus permanen</button> : null}
            {!readOnly ? <button type="submit" className="adm-btn adm-btn-primary" disabled={busy || (!!doc && !dirty)}>{busy ? "Menyimpan…" : doc ? "Simpan perubahan" : "Buat draft"}</button> : null}
          </span>
        </div>
      </form>

      <ConfirmDialog open={confirm?.kind === "slug"} title="Ubah slug konten terbit?" confirmLabel="Ubah & buat redirect" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void save(true)}>
        <p>URL lama akan dialihkan permanen (308) ke URL baru agar tautan dan peringkat pencarian tidak putus.</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm?.kind === "published"} title="Terbitkan konten?" confirmLabel="Terbitkan" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void changeStatus("published")}>
        <p>Konten akan tampil di website publik dan masuk sitemap (jika memenuhi syarat indeks).</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm?.kind === "draft"} title={status === "archived" ? "Pulihkan ke draft?" : "Tarik ke draft?"} confirmLabel={status === "archived" ? "Pulihkan" : "Tarik ke draft"} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void changeStatus("draft")}>
        <p>{status === "archived" ? "Konten dapat diedit lagi dan belum tampil di publik." : "Konten tidak lagi tampil di website publik."}</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm?.kind === "archived"} title="Arsipkan konten?" confirmLabel="Arsipkan" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void changeStatus("archived")}>
        <p>Konten disembunyikan dari website dan tidak dapat diedit. Hanya Superadmin yang dapat memulihkannya.</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm?.kind === "delete"} danger title="Hapus permanen?" confirmLabel="Hapus permanen" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void remove()}>
        <p>Tindakan ini tidak dapat dibatalkan. Salinan terakhir tetap tersimpan di riwayat revisi.</p>
      </ConfirmDialog>
    </>
  );
}
