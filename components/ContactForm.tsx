"use client";

import { useState, type FormEvent } from "react";
import { whatsappLink } from "../lib/site";

const NEEDS = ["Konstruksi Gedung", "Infrastruktur", "Renovasi & Interior", "MEP", "Kerja sama / Vendor", "Lainnya"];

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "ok" };

/**
 * Form inquiry: menyusun pesan lalu membuka WhatsApp (tidak ada data yang disimpan di server).
 * Backend inquiry + proteksi spam (mis. Turnstile) adalah pengembangan lanjutan.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    // Honeypot sederhana: bot mengisi field tersembunyi.
    if (get("website")) return;

    const name = get("name");
    const email = get("email");
    const phone = get("phone");
    if (name.length < 2) return setStatus({ kind: "error", message: "Nama lengkap wajib diisi." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return setStatus({ kind: "error", message: "Format email tidak valid." });
    if (!/^[+\d][\d\s-]{7,}$/.test(phone)) return setStatus({ kind: "error", message: "Nomor WhatsApp tidak valid." });
    if (!NEEDS.includes(get("need"))) return setStatus({ kind: "error", message: "Pilih kebutuhan proyek." });

    const message = [
      "Halo PT Pillarians Group, saya ingin menghubungi tim terkait kebutuhan proyek.",
      "",
      `Nama: ${name}`,
      `Perusahaan: ${get("company") || "-"}`,
      `Email: ${email}`,
      `WhatsApp: ${phone}`,
      `Kebutuhan: ${get("need")}`,
      "",
      "Pesan:",
      get("message") || "-",
    ].join("\n");

    const opened = window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    if (!opened) return setStatus({ kind: "error", message: "Pop-up diblokir. Izinkan pop-up atau hubungi kami langsung lewat WhatsApp." });
    setStatus({ kind: "ok" });
    form.reset();
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <span className="eyebrow">PROJECT INQUIRY</span>
      <h2>Kirim pesan</h2>
      <label>
        Nama lengkap
        <input name="name" required autoComplete="name" placeholder="Nama Anda" />
      </label>
      <label>
        Perusahaan
        <input name="company" autoComplete="organization" placeholder="Nama perusahaan" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" placeholder="nama@email.com" />
      </label>
      <label>
        Nomor WhatsApp
        <input name="phone" type="tel" required autoComplete="tel" placeholder="08xxxxxxxxxx" />
      </label>
      <label>
        Kebutuhan proyek
        <select name="need" required defaultValue="">
          <option value="" disabled>
            Pilih kebutuhan
          </option>
          {NEEDS.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label>
        Pesan
        <textarea name="message" rows={4} placeholder="Ceritakan gambaran kebutuhan proyek Anda" />
      </label>
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button className="btn btn-orange" type="submit">
        KIRIM VIA WHATSAPP ↗
      </button>
      <p className="form-note" role="status" aria-live="polite">
        {status.kind === "error"
          ? status.message
          : status.kind === "ok"
            ? "WhatsApp dibuka dengan pesan Anda. Kirim pesan tersebut dari WhatsApp untuk menyelesaikan."
            : "Pesan akan disiapkan di WhatsApp. Data formulir tidak disimpan di server kami."}
      </p>
    </form>
  );
}
