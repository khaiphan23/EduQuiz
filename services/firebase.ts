import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDxH2jllKNAd1Cb6FFW6tYeYPSPdEhnoEM",
  authDomain: "edquiz-eba97.firebaseapp.com",
  projectId: "edquiz-eba97",
  storageBucket: "edquiz-eba97.firebasestorage.app",
  messagingSenderId: "606579471825",
  appId: "1:606579471825:web:b8617d8daf22e2c81c5cf0",
  measurementId: "G-2KSN15YEWE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Analytics is only supported in browser environments
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
