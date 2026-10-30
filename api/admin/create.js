const { getFirebaseAdmin } = require("../../lib/firebase-admin");
const { requireAdmin } = require("../../lib/auth-middleware");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method tidak diizinkan." });
  }

  const actor = await requireAdmin(req, res, { superAdmin: true });
  if (!actor) return;

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const displayName = String(req.body?.displayName || "").trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Format email tidak valid." });
  if (password.length < 12) return res.status(400).json({ error: "Password sementara minimal 12 karakter." });
  if (displayName.length < 2 || displayName.length > 80) return res.status(400).json({ error: "Nama admin harus 2-80 karakter." });

  const { auth } = getFirebaseAdmin();
  let createdUser;
  try {
    createdUser = await auth.createUser({ email, password, displayName, emailVerified: false });
    await auth.setCustomUserClaims(createdUser.uid, { admin: true });
    return res.status(201).json({
      message: "Akun admin berhasil dibuat. Berikan password sementara secara aman dan minta admin menggantinya setelah login.",
      user: { uid: createdUser.uid, email: createdUser.email, displayName: createdUser.displayName }
    });
  } catch (error) {
    if (createdUser?.uid) {
      try { await auth.deleteUser(createdUser.uid); } catch (rollbackError) {
        console.error("Admin account rollback failed:", rollbackError.message);
      }
    }
    console.error("Create admin failed:", error.message);
    const status = error.code === "auth/email-already-exists" ? 409 : 500;
    return res.status(status).json({ error: status === 409 ? "Email sudah digunakan." : "Gagal membuat akun admin." });
  }
};
