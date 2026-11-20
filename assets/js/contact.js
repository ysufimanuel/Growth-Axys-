const form = document.getElementById("contactForm");
const adminNumber = "628138744366"; // Nomor WhatsApp tujuan dalam format internasional tanpa tanda +.

form?.addEventListener("submit", event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const message = [
    "Halo PT Pillarians Group, saya ingin menghubungi tim terkait kebutuhan proyek.",
    "",
    `Nama: ${data.get("name")}`,
    `Perusahaan: ${data.get("company") || "-"}`,
    `Email: ${data.get("email")}`,
    `WhatsApp: ${data.get("phone")}`,
    `Kebutuhan: ${data.get("need")}`,
    "",
    "Pesan:",
    data.get("message") || "-"
  ].join("\n");

  const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});
