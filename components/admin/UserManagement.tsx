"use client";

import { useMemo, useState, type FormEvent } from "react";
import { adminFetch } from "./api";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

type Role = "admin" | "superadmin";
type Status = "invited" | "active" | "disabled";
interface Account {
  uid: string; email: string; displayName: string; role: Role | null; status: Status;
  disabled: boolean; emailVerified: boolean; lastSignIn: string | null; created: string | null;
}
type Action = { uid: string; kind: "role" | "status"; value: Role | "active" | "disabled"; label: string } | null;

function dateLabel(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function UserManagement({ initialAccounts, truncated, actorUid }: { initialAccounts: Account[]; truncated: boolean; actorUid: string }) {
  const toast = useToast();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<Action>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteNote, setInviteNote] = useState("");

  const visible = useMemo(() => accounts.filter((a) => {
    const q = query.trim().toLowerCase();
    return (!q || [a.email, a.displayName, a.uid].some((v) => v.toLowerCase().includes(q)))
      && (roleFilter === "all" || a.role === roleFilter)
      && (statusFilter === "all" || a.status === statusFilter);
  }), [accounts, query, roleFilter, statusFilter]);

  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const result = await adminFetch<{ setupLink: string; note: string }>("/api/admin/invitations", {
      method: "POST", body: { email: email.trim(), displayName: displayName.trim(), role: "admin" },
    });
    setBusy(false);
    if (!result.ok || !result.data) { toast("error", result.error ?? "Undangan gagal dibuat."); return; }
    setInviteLink(result.data.setupLink);
    setInviteNote(result.data.note);
    toast("ok", "Undangan dibuat. Salin tautan dan kirim hanya ke email yang diundang.");
  }

  async function applyAction() {
    if (!action) return;
    setBusy(true);
    const body = action.kind === "role" ? { role: action.value, confirm: true } : { status: action.value, confirm: true };
    const result = await adminFetch("/api/admin/users/" + encodeURIComponent(action.uid), { method: "PATCH", body });
    setBusy(false);
    if (!result.ok) { toast("error", result.error ?? "Perubahan akun gagal."); return; }
    setAccounts((old) => old.map((a) => a.uid === action.uid
      ? { ...a, ...(action.kind === "role" ? { role: action.value as Role } : { status: action.value as Status, disabled: action.value === "disabled" }) }
      : a));
    toast("ok", "Akun berhasil diperbarui.");
    setAction(null);
  }

  return (
    <section className="adm-users">
      <div className="adm-users-toolbar">
        <label className="adm-users-search">Cari akun
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Email, nama, atau UID" />
        </label>
        <label>Role
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Semua role</option><option value="admin">Admin</option><option value="superadmin">Superadmin</option>
          </select>
        </label>
        <label>Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Semua status</option><option value="active">Aktif</option><option value="invited">Diundang</option><option value="disabled">Nonaktif</option>
          </select>
        </label>
        <button className="adm-btn adm-btn-primary" type="button" onClick={() => { setInviteOpen((v) => !v); setInviteLink(""); }}>+ Undang Admin</button>
      </div>

      {inviteOpen ? (
        <form className="adm-card adm-invite-form" onSubmit={invite}>
          <div className="adm-pagehead"><div><h2>Undang Admin</h2><p>Akun baru dibuat dengan status diundang. Undangan berlaku 72 jam.</p></div></div>
          <div className="adm-formgrid">
            <label>Nama lengkap<input required minLength={2} maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
            <label>Email<input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          </div>
          <div className="adm-actions">
            <button className="adm-btn" type="button" onClick={() => setInviteOpen(false)} disabled={busy}>Tutup</button>
            <button className="adm-btn adm-btn-primary" type="submit" disabled={busy}>{busy ? "Membuat undangan…" : "Buat undangan"}</button>
          </div>
          {inviteLink ? <div className="adm-alert adm-alert-warn" role="status">
            <strong>Tautan penyetelan password</strong><p>{inviteNote}</p>
            <label>Salin tautan ini dan kirim hanya ke email undangan<input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} /></label>
            <button className="adm-btn" type="button" onClick={() => { if (!navigator.clipboard) { toast("error", "Salin tautan secara manual."); return; } void navigator.clipboard.writeText(inviteLink).then(() => toast("ok", "Tautan disalin.")).catch(() => toast("error", "Salin tautan secara manual.")); }}>Salin tautan</button>
          </div> : null}
        </form>
      ) : null}

      <div className="adm-card adm-tablewrap">
        <table className="adm-table">
          <caption className="adm-sr">Daftar akun admin</caption>
          <thead><tr><th>Email / Nama</th><th>Role</th><th>Status</th><th>Login terakhir</th><th>Aksi</th></tr></thead>
          <tbody>
            {visible.map((a) => {
              const self = a.uid === actorUid;
              const protectedAccount = self || a.status === "invited";
              return <tr key={a.uid}>
                <td><strong>{a.email || "Email belum tersedia"}</strong><small className="adm-users-name">{a.displayName || a.uid}</small></td>
                <td>{a.role === "superadmin" ? "Superadmin" : "Admin"}</td>
                <td><span className="adm-status">{a.status === "active" ? "Aktif" : a.status === "invited" ? "Diundang" : "Nonaktif"}</span></td>
                <td>{dateLabel(a.lastSignIn)}</td>
                <td><div className="adm-actions adm-users-actions">
                  {!protectedAccount ? <>
                    <select aria-label={"Role untuk " + a.email} value={a.role ?? "admin"} disabled={busy} onChange={(e) => setAction({ uid: a.uid, kind: "role", value: e.target.value as Role, label: "Ubah role " + a.email + " menjadi " + e.target.value })}>
                      <option value="admin">Admin</option><option value="superadmin">Superadmin</option>
                    </select>
                    <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => setAction({ uid: a.uid, kind: "status", value: a.status === "disabled" ? "active" : "disabled", label: (a.status === "disabled" ? "Aktifkan " : "Nonaktifkan ") + a.email })}>{a.status === "disabled" ? "Aktifkan" : "Nonaktifkan"}</button>
                  </> : <span className="adm-hint">{self ? "Akun Anda" : "Undangan belum diterima"}</span>}
                </div></td>
              </tr>;
            })}
            {visible.length === 0 ? <tr><td colSpan={5}><p className="adm-hint">Tidak ada akun yang cocok dengan filter.</p></td></tr> : null}
          </tbody>
        </table>
      </div>
      {truncated ? <p className="adm-hint">Daftar dipotong pada 1000 akun pertama.</p> : null}
      <p className="adm-hint">Perubahan role/status mencabut sesi lama. Pengguna perlu login kembali. Superadmin utama dan akun sendiri dilindungi oleh server.</p>

      <ConfirmDialog open={!!action} title={action?.label ?? "Konfirmasi perubahan"} confirmLabel="Konfirmasi" busy={busy} onCancel={() => setAction(null)} onConfirm={() => void applyAction()}>
        <p>Perubahan ini memengaruhi akses akun dan akan dicatat di audit log. Lanjutkan?</p>
      </ConfirmDialog>
    </section>
  );
}
