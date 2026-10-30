const form = document.getElementById("contactForm");
form?.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(form);
  const message = [
    "Halo PT Growth Axys, saya ingin menghubungi tim terkait kebutuhan proyek.",
    `Nama: ${data.get("name")}`,
    `Perusahaan: ${data.get("company") || "-"}`,
    `Email: ${data.get("email")}`,
    `WhatsApp: ${data.get("phone")}`,
    `Kebutuhan: ${data.get("need")}`,
    `Pesan: ${data.get("message") || "-"}`
  ].join("\\n");
  const adminNumber = "6281234567890"; // Ganti nomor WhatsApp admin.
  window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
});