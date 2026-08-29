import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Default config for qaaf-final
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyD0dJGyDBL7SE1Kh2C8PUFrtDFl4gfUmOw",
  authDomain: "qaaf-final.firebaseapp.com",
  projectId: "qaaf-final",
  storageBucket: "qaaf-final.firebasestorage.app",
  messagingSenderId: "699462717924",
  appId: "1:699462717924:web:021da61ff9a5531a5ef7f1",
  measurementId: "G-J1NFMTXVDV"
};

const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || DEFAULT_CONFIG.apiKey,
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || DEFAULT_CONFIG.authDomain,
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || DEFAULT_CONFIG.projectId,
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || DEFAULT_CONFIG.storageBucket,
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_CONFIG.messagingSenderId,
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || DEFAULT_CONFIG.appId,
  measurementId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) || DEFAULT_CONFIG.measurementId
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const rdb = getDatabase(app);
export default app;
