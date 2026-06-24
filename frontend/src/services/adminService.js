//src/services/adminService.js

//Firestoreで使用する関数をインポート
import {
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

//Firestoreの接続情報
import { db } from "./firebase";

//承認待ちユーザー一覧を取得
export async function loadRegisterRequests() {
  //register_requestsコレクションを全件取得
  const querySnapshot = await getDocs(collection(db, "register_requests"));

  //FirestoreのDocumentを扱いやすいオブジェクト配列へ変換
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id, //ドキュメントID
      email: data.email,
      name: data.name,
      password: data.password,
    };
  });
}

//ユーザー申請却下
export async function rejectUser(email) {
  //register_requestsから該当ユーザーを削除
  await deleteDoc(doc(db, "register_requests", email));
}

//ユーザー申請承認
export async function approveUser(email) {
  //承認対象の申請データを取得
  const requestRef = doc(db, "register_requests", email);
  const requestSnap = await getDoc(requestRef);

  //申請データが存在しない場合はエラー
  if (!requestSnap.exists()) {
    throw new Error("申請データが存在しません");
  }

  //Firestoreから取得した申請内容
  const data = requestSnap.data();

  //Flaskバックエンドへユーザー作成依頼を送信
  const response = await fetch("http://127.0.0.1:5000/approve_user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });

  //サーバーからのレスポンスを取得
  const result = await response.json();

  //Firebase Authenticationへの登録失敗時
  if (!result.success) {
    throw new Error(result.error || "Auth登録に失敗しました");
  }

  //usersコレクションへ正式ユーザーとして登録
  await setDoc(doc(db, "users", email), {
    name: data.name,
    email: data.email,
    createdAt: new Date(),
  });

  //承認済みなので申請データを削除
  await deleteDoc(requestRef);
}
