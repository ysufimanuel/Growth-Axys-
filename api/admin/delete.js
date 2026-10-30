const { getFirebaseAdmin } = require("../../lib/firebase-admin");
const { requireAdmin } = require("../../lib/auth-middleware");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method tidak diizinkan." });
  }

  const actor = await requireAdmin(req, res, { superAdmin: true });
  if (!actor) return;

  const uid = String(req.body?.uid || "").trim();
  if (!uid) return res.status(400).json({ error: "UID admin wajib diisi." });
  if (uid === actor.uid || uid === process.env.SUPER_ADMIN_UID) {
    return res.status(400).json({ error: "Akun Super Admin utama tidak dapat dihapus dari dashboard." });
  }

  try {
    const { auth } = getFirebaseAdmin();
    const target = await auth.getUser(uid);
    if (target.customClaims?.admin !== true) {
      return res.status(404).json({ error: "Akun admin tidak ditemukan." });
    }
    await auth.deleteUser(uid);
    return res.status(200).json({ message: "Akun admin berhasil dihapus." });
  } catch (error) {
    console.error("Delete admin failed:", error.message);
    return res.status(error.code === "auth/user-not-found" ? 404 : 500).json({
      error: error.code === "auth/user-not-found" ? "Akun tidak ditemukan." : "Gagal menghapus akun admin."
    });
  }
};
