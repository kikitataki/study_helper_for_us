//src/services/lectureService.js

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

//既存の講義メモを取得
export async function loadExistingLecture(className, classCount) {
  //授業名と講義回数からドキュメントIDを作成
  const docId = `${className}_${classCount}`;

  //class_logs_summaryから該当する講義メモを取得
  const docRef = doc(db, "class_logs_summary", docId);
  const docSnap = await getDoc(docRef);

  //データが存在しない場合はnullを返す
  if (!docSnap.exists()) {
    return null;
  }

  //summaryがあれば返し、なければ空文字を返す
  return docSnap.data().summary || "";
}

const API_BASE_URL = "http://127.0.0.1:5000";

//ローカル環境かどうかを判定
export function isLocal() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

//講義本文を講義ノート形式に整形
export async function polishLectureText(className, lectureText) {
  //Flaskバックエンドへ講義ノート化を依頼
  const response = await fetch("http://127.0.0.1:5000/api/polish_lecture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      className,
      text: lectureText,
    }),
  });

  //通信に失敗した場合はエラー
  if (!response.ok) {
    throw new Error("講義ノート化に失敗しました。");
  }

  //サーバーからのレスポンスを取得
  const data = await response.json();

  //講義ノート化に失敗した場合はエラー
  if (data.status !== "success") {
    throw new Error(data.message || "講義ノート化に失敗しました。");
  }

  //整形された講義ノートを返す
  return data.text;
}

//講義メモをFirestoreに直接保存
export async function saveLectureDirectly(className, classCount, text) {
  //授業名と講義回数からドキュメントIDを作成
  const docId = `${className}_${classCount}`;

  //class_logs_summaryに講義メモを保存
  await setDoc(
    doc(db, "class_logs_summary", docId),
    {
      className,
      classCount: Number(classCount),
      summary: text,
      updatedAt: new Date(),
    },
    { merge: true },
  );
}

//コメント通知を作成
export async function createCommentNotification(className, commentText) {
  console.log(`${className} にコメント通知を作成`, commentText);
}

//講義メモを投稿
export async function postLecture(className, classCount, text) {
  //講義メモをFirestoreに保存
  await saveLectureDirectly(className, classCount, text);

  //投稿成功時の結果を返す
  return {
    status: "success",
    mode: "direct",
  };
}
