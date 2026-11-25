import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/** True jika kredensial Admin SDK tersedia (tidak ada di build tanpa env). */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

export class AdminNotConfiguredError extends Error {
  constructor() {
    super("Firebase Admin credentials belum dikonfigurasi di environment server.");
    this.name = "AdminNotConfiguredError";
  }
}

function app(): App {
  if (!isAdminConfigured()) throw new AdminNotConfiguredError();
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    }),
  });
}

export function adminAuth(): Auth {
  return getAuth(app());
}

/** Project ini memakai database Firestore bernama "default" (bukan "(default)"). */
export function adminDb(): Firestore {
  return getFirestore(app(), process.env.FIREBASE_DATABASE_ID || "default");
}
