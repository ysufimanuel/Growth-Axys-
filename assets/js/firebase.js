// Firebase Web SDK configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7JIIetP_avf5LCtUwRONNIrErbP-voKc",
  authDomain: "growth-axys.firebaseapp.com",
  projectId: "growth-axys",
  storageBucket: "growth-axys.firebasestorage.app",
  messagingSenderId: "882255452807",
  appId: "1:882255452807:web:9e1b77cd139fb611537622",
  measurementId: "G-NQX5ZJP5FG"
};

export const firebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  !firebaseConfig.apiKey.startsWith("GANTI_");

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is optional and only supported in compatible environments.
export let analytics = null;

isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch((error) => {
    console.warn("Firebase Analytics unavailable:", error);
  });
