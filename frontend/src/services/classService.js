// src/services/classService.js

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export async function loadClassNames() {
  //授業名を取得する関数
  const querySnapshot = await getDocs(collection(db, "class_logs_summary"));

  const classNameSet = new Set();

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.className) {
      classNameSet.add(data.className);
    }
  });
  //辞書で重複を無くして配列で返す
  return Array.from(classNameSet);
}

//授業回数一覧取得
export async function loadClassCounts(className) {
  const q = query(
    collection(db, "class_logs_summary"),
    where("className", "==", className),
  );

  const querySnapshot = await getDocs(q);

  const counts = [];
  //重複なしなので配列で管理する
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.classCount !== undefined) {
      //文字列ではうまく昇順にならなかった
      //辞書順では1 →　10 → 2になる
      counts.push(Number(data.classCount));
    }
  });
  //昇順に
  counts.sort((a, b) => a - b);

  return counts;
}
