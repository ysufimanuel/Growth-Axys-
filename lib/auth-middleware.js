const { getFirebaseAdmin } = require("./firebase-admin");

async function requireAdmin(req, res, options = {}) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: "Token autentikasi tidak ditemukan." });
    return null;
  }

  try {
    const { auth } = getFirebaseAdmin();
    const decoded = await auth.verifyIdToken(match[1]);
    if (decoded.admin !== true) {
      res.status(403).json({ error: "Akses admin diperlukan." });
      return null;
    }

    if (options.superAdmin) {
      const superAdminUid = process.env.SUPER_ADMIN_UID;
      if (!superAdminUid) {
        res.status(503).json({ error: "SUPER_ADMIN_UID belum dikonfigurasi di Vercel." });
        return null;
      }
      if (decoded.uid !== superAdminUid) {
        res.status(403).json({ error: "Hanya Super Admin yang dapat mengelola akun admin." });
        return null;
      }
    }

    return decoded;
  } catch (error) {
    console.error("Admin token verification failed:", error.message);
    res.status(401).json({ error: "Sesi tidak valid atau sudah kedaluwarsa." });
    return null;
  }
}

module.exports = { requireAdmin };
