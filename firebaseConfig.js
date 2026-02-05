import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA672c8blJAGxd2wqgvHFQWPynuJnAgXRk",
  authDomain: "gymmanager-790b7.firebaseapp.com",
  projectId: "gymmanager-790b7",
  storageBucket: "gymmanager-790b7.appspot.com",
  messagingSenderId: "750996579554",
  appId: "1:750996579554:android:3783e5f550b177400b6abb",
};

// Prevent duplicate app initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
