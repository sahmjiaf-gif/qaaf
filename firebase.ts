
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAT2FHmRT7JJ9IAVdtMPAQoQ4KDhT_0hqo",
  authDomain: "qaaf-1301b.firebaseapp.com",
  projectId: "qaaf-1301b",
  storageBucket: "qaaf-1301b.firebasestorage.app",
  messagingSenderId: "210980315588",
  appId: "1:210980315588:web:7cb6abdb710d10c515c491",
  measurementId: "G-7XTFS5QRM7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
