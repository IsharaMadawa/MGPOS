import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD4JHMl4z52GDz3ZnhrOn3FO9_lG0H1hvk",
  authDomain: "mgpos-55dc3.firebaseapp.com",
  projectId: "mgpos-55dc3",
  storageBucket: "mgpos-55dc3.firebasestorage.app",
  messagingSenderId: "373605580127",
  appId: "1:373605580127:web:03d4967673d0bce5c44aea",
  measurementId: "G-Y068VKBV09"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);