// src/services/notificationService.js

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db, auth } from "./firebase";

export async function deleteMyNotification(notificationId) {
  const email = auth.currentUser.email;

  await deleteDoc(doc(db, "users", email, "notifications", notificationId));
}

//通知データの取得
export async function loadMyNotifications() {
  const email = auth.currentUser.email;

  const snapshot = await getDocs(
    collection(db, "users", email, "notifications"),
  );

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function loadUnreadNotificationCount() {
  const email = auth.currentUser.email;

  const q = query(
    collection(db, "users", email, "notifications"),
    where("read", "==", false),
  );

  const snapshot = await getDocs(q);

  return snapshot.size;
}

export async function createCommentNotification(
  className,
  classCount,
  commentText,
) {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const currentUserEmail = auth.currentUser?.email;

  for (const userDoc of usersSnapshot.docs) {
    const email = userDoc.id;

    if (email === currentUserEmail) continue;

    const favoriteRef = collection(db, "users", email, "favorites");

    const favoriteQuery = query(
      favoriteRef,
      where("className", "==", className),
    );

    const favoriteSnapshot = await getDocs(favoriteQuery);

    if (favoriteSnapshot.empty) continue;

    await addDoc(collection(db, "users", email, "notifications"), {
      type: "comment",
      className,
      classCount: Number(classCount),
      message: `${className} 第${classCount}回に新しいコメントが投稿されました`,
      preview: commentText.slice(0, 50),
      read: false,
      createdAt: serverTimestamp(),
    });
  }
}

export async function createSummaryNotification(className, classCount) {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const currentUserEmail = auth.currentUser?.email;

  for (const userDoc of usersSnapshot.docs) {
    const email = userDoc.id;

    if (email === currentUserEmail) continue;

    const favoriteRef = collection(db, "users", email, "favorites");

    const favoriteQuery = query(
      favoriteRef,
      where("className", "==", className),
    );

    const favoriteSnapshot = await getDocs(favoriteQuery);

    if (favoriteSnapshot.empty) continue;

    await addDoc(collection(db, "users", email, "notifications"), {
      type: "summary",
      className,
      classCount: Number(classCount),
      message: `${className} 第${classCount}回の要約が投稿されました`,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
}
