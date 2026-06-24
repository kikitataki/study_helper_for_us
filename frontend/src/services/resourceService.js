//src/services/resourceService.js

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

//授業資料一覧を取得
export async function loadResources(className, lectureCount) {
  //授業名と講義回数が一致する資料を検索
  const q = query(
    collection(db, "resources"),
    where("className", "==", className),
    where("lectureCount", "==", lectureCount),
  );

  //条件に一致する資料を取得
  const querySnapshot = await getDocs(q);

  //FirestoreのDocumentを扱いやすいオブジェクト配列へ変換
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      fileName: data.fileName || "ファイル名なし",
      url: data.url || "",
    };
  });
}
