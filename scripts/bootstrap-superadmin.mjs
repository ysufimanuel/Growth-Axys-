// Menetapkan Superadmin pertama (custom claims + profil aktif) lewat Admin SDK.
//
// Pakai (lokal, kredensial dari env; JANGAN commit kunci service account):
//   FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY="..." \
//   FIREBASE_DATABASE_ID=default node scripts/bootstrap-superadmin.mjs admin@contoh.co.id
//
// Akun harus sudah ada di Firebase Authentication. Setelah dijalankan, pengguna perlu login ulang.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const email = process.argv[2]?.toLowerCase();
const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

if (!email || !FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("Usage: node scripts/bootstrap-superadmin.mjs <email>  (butuh FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY di env)");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const auth = getAuth(app);
const db = getFirestore(app, process.env.FIREBASE_DATABASE_ID || "default");

const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: "superadmin", admin: true });
await auth.updateUser(user.uid, { disabled: false });
await db.collection("profiles").doc(user.uid).set(
  { uid: user.uid, email, displayName: user.displayName ?? "", role: "superadmin", status: "active", updatedAt: FieldValue.serverTimestamp() },
  { merge: true },
);
await db.collection("auditLogs").add({
  actorUid: "bootstrap-script",
  action: "account.superadmin_bootstrapped",
  targetType: "account",
  targetId: user.uid,
  summary: `email=${email}`,
  timestamp: FieldValue.serverTimestamp(),
});
console.log(`OK: ${email} (${user.uid}) kini Superadmin. Minta pengguna logout lalu login ulang.`);
