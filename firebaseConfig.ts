import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAuRd5KNdRgjMNX0C2TB_JzgxOxbPNUys",
  authDomain: "idatang-2fb55.firebaseapp.com",
  databaseURL: "https://idatang-2fb55-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "idatang-2fb55",
  storageBucket: "idatang-2fb55.firebasestorage.app",
  messagingSenderId: "465572830617",
  appId: "1:465572830617:web:73690642412c3e109dc708",
};

// Initialize Firebase app only if not already initialized
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Auth with React Native persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firebase Realtime Database
const db = getDatabase(app);

// Export initialized instances
export { app, auth, db, getApp };
