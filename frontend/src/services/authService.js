// src/services/authService.js

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";

//ログアウト機能
export async function logoutUser() {
  await signOut(auth);
}

//ログイン　＆　承認ユーザーかどうか
export async function loginUser(email, password) {
  //firebaseAutenticationにログインする
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  /*
{
  user: {...},
  providerId: null,
  operationType: "signIn"
}こんなかんじのオブジェクトが返される

  */

  //emailの要素がdbにあるかどうか探す
  const userSnap = await getDoc(doc(db, "users", email));

  //存在しないときは空のオブジェクトが生成されるのでnullではなかった
  if (!userSnap.exists()) {
    alert("管理者の承認待ちです。");
    await auth.signOut();
    throw new Error("管理者の承認待ちです。");
    //エラーを発生させるやつ
  }

  return userCredential.user;
}
