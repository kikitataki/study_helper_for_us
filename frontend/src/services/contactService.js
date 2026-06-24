import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

export async function sendContact({ title, detail }) {
  await addDoc(collection(db, "contacts"), {
    title,
    detail,
    userEmail: auth.currentUser?.email || "",
    createdAt: serverTimestamp(),
    status: "未対応",
  });
}

export async function loadContacts() {
  const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}
