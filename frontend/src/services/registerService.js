import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function createRegisterRequest({ email, name, password }) {
  await setDoc(doc(db, "register_requests", email), {
    email,
    name,
    password,
    createdAt: new Date(),
  });
}
