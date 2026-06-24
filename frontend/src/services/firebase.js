// src/services/firebase.js

import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth";

import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCFMBsujpkwA-vgccTSiGv4mfItaQt3rLs",
  authDomain: "stady-for-us.firebaseapp.com",
  projectId: "stady-for-us",
  storageBucket: "stady-for-us.firebasestorage.app",
  messagingSenderId: "984845838636",
  appId: "1:984845838636:web:bafd664d3a55b063fda489",
  measurementId: "G-DT7JCESQTD",
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Authentication
export const auth = getAuth(app);

// Storage
export const storage = getStorage(app);
