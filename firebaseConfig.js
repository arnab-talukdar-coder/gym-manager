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

// const firebaseConfig = {
//   apiKey: "AIzaSyCWTqpJbvap75uFK38bqlsCEnhqCK3Y7AE",
//   authDomain: "member-management-5239a.firebaseapp.com",
//   projectId: "member-management-5239a",
//   storageBucket: "member-management-5239a.firebasestorage.app",
//   messagingSenderId: "221714862404",
//   appId: "1:221714862404:android:30a83e0e463d19e0734711",
// };

// Prevent duplicate app initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
