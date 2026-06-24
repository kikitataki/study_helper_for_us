// src/services/userService.js

import { db } from "./firebase";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

//ユーザー名を取得する関数
export async function getUserName(email) {
  if (!email) return "ゲスト";

  try {
    const userSnap = await getDoc(doc(db, "users", email));
    if (userSnap.exists()) {
      return userSnap.data().name;
    }

    return email;
  } catch (error) {
    console.error("ユーザー名取得エラー:", error);
    return email;
  }
}

export async function addOrUpdateUser(email, name) {
  await setDoc(doc(db, "users", email), {
    name: name,
  });
}

export async function loadAllUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));

  return querySnapshot.docs.map((userDoc) => {
    const data = userDoc.data();

    return {
      email: userDoc.id,
      name: data.name || "名前なし",
    };
  });
}

export async function deleteUser(email) {
  await deleteDoc(doc(db, "users", email));
}
