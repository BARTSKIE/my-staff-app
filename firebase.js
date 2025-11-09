// firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB3GGbWzI-n4sTGxuhCB2PLa8d4ikLCbmU",
  authDomain: "don-elmers.firebaseapp.com",
  databaseURL: "https://don-elmers-default-rtdb.firebaseio.com",
  projectId: "don-elmers",
  storageBucket: "don-elmers.appspot.com",
  messagingSenderId: "569277809850",
  appId: "1:569277809850:web:4faa2330b9ae7d224f2e83",
  measurementId: "G-55MR6RC4GZ"
};

const app = initializeApp(firebaseConfig);

// Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
export const db = getFirestore(app);

// Realtime Database
export const rtdb = getDatabase(app);

export default app;
