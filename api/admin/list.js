const { getFirebaseAdmin } = require("../../lib/firebase-admin");
const { requireAdmin } = require("../../lib/auth-middleware");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method tidak diizinkan." });
  }

  const actor = await requireAdmin(req, res, { superAdmin: true });
  if (!actor) return;

  try {
    const { auth } = getFirebaseAdmin();
    const result = await auth.listUsers(1000);
    const admins = result.users
      .filter(user => user.customClaims?.admin === true)
      .map(user => ({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime || null,
        isSuperAdmin: user.uid === process.env.SUPER_ADMIN_UID
      }));

    return res.status(200).json({ admins, truncated: Boolean(result.pageToken) });
  } catch (error) {
    console.error("List admins failed:", error.message);
    return res.status(500).json({ error: "Gagal memuat daftar admin." });
  }
};
