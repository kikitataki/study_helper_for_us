import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { db, auth } from "./firebase";

export async function addFavoriteClass(className) {
  const email = auth.currentUser.email;

  await setDoc(doc(db, "users", email, "favorites", className), {
    className,
    createdAt: new Date(),
  });
}

export async function removeFavoriteClass(className) {
  const email = auth.currentUser.email;

  await deleteDoc(doc(db, "users", email, "favorites", className));
}

//お気に入りの授業のidを配列で返す
export async function loadFavoriteClasses() {
  const email = auth.currentUser.email;
  const snapshot = await getDocs(collection(db, "users", email, "favorites"));
  return snapshot.docs.map((docSnap) => docSnap.id);
}
