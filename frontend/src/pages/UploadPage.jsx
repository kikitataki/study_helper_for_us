import { useEffect, useState } from "react";
import {
  postLecture,
  polishLectureText,
  isLocal,
  loadExistingLecture,
} from "../services/lectureService";
import { formatSummaryText } from "../utils/formatter";
import "./uploadpage.css";
import { createSummaryNotification } from "../services/notificationService";

export default function UploadPage() {
  //入力フォームの状態管理
  const [className, setClassName] = useState("");
  const [classCount, setClassCount] = useState("");
  const [lectureText, setLectureText] = useState("");

  //投稿中かどうかの状態管理
  const [posting, setPosting] = useState(false);

  //AI整形前の本文を保存
  const [originalText, setOriginalText] = useState("");

  //AI整形中かどうかの状態管理
  const [polishing, setPolishing] = useState(false);

  //授業名と講義回数が変わったときに既存の講義メモを取得
  useEffect(() => {
    async function fetchExistingLecture() {
      //授業名か講義回数が空なら取得しない
      if (!className.trim() || !classCount.trim()) {
        return;
      }

      try {
        //Firestoreから既存の講義メモを取得
        const existingSummary = await loadExistingLecture(
          className.trim(),
          classCount.trim(),
        );

        //既存の講義メモがあれば本文欄に表示
        if (existingSummary) {
          setLectureText(existingSummary);
          setOriginalText("");
        }
      } catch (error) {
        console.error("既存要約の自動取得エラー:", error);
      }
    }

    fetchExistingLecture();
  }, [className, classCount]);

  //AIで本文を整形
  async function handlePolishText() {
    //授業名か本文が空なら処理しない
    if (!className.trim() || !lectureText.trim()) {
      alert("授業名と本文を入力してください。");
      return;
    }

    try {
      //AI整形中状態にする
      setPolishing(true);

      //整形前の本文を保存
      setOriginalText(lectureText);

      //Flaskバックエンドで本文を整形
      const polishedText = await polishLectureText(
        className.trim(),
        lectureText.trim(),
      );

      //整形後の本文を反映
      setLectureText(polishedText);
    } catch (error) {
      console.error("整形エラー:", error);
      alert(error.message || "整形に失敗しました。");
    } finally {
      //AI整形中状態を解除
      setPolishing(false);
    }
  }

  //講義メモを投稿
  async function handlePostLecture() {
    //授業名、講義回数、本文が空なら処理しない
    if (!className.trim() || !classCount.trim() || !lectureText.trim()) {
      alert("授業名、講義回数、本文を入力してください。");
      return;
    }

    try {
      //投稿中状態にする
      setPosting(true);

      //講義メモを保存
      await postLecture(
        className.trim(),
        classCount.trim(),
        lectureText.trim(),
      );

      //お気に入り登録者向けに通知を作成
      await createSummaryNotification(className.trim(), classCount.trim());

      alert("投稿しました。");

      //本文と補正前テキストを初期化
      setLectureText("");
      setOriginalText("");
    } catch (error) {
      console.error("投稿エラー:", error);
      alert(error.message || "投稿に失敗しました。");
    } finally {
      //投稿中状態を解除
      setPosting(false);
    }
  }

  return (
    <>
      <h2>授業内容投稿ページ</h2>

      <div className="upload-form">
        <input
          className="upload-input"
          type="text"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="授業名"
        />

        <input
          className="upload-input"
          type="number"
          value={classCount}
          onChange={(e) => setClassCount(e.target.value)}
          placeholder="講義回数"
        />

        <textarea
          className="upload-textarea"
          rows="10"
          value={lectureText}
          onChange={(e) => setLectureText(e.target.value)}
          placeholder="授業内容を入力してください"
        />

        {isLocal() && (
          <button onClick={handlePolishText} disabled={polishing}>
            {polishing ? "AI整形中..." : "AIで綺麗に整える"}
          </button>
        )}

        <button onClick={handlePostLecture} disabled={posting}>
          {posting ? "投稿中..." : "投稿する"}
        </button>
      </div>

      <div className="upload-help-box">
        <h3>書き方ガイド</h3>

        <p>
          <strong>大見出し</strong>
          <br />
          1. ボリュームレンダリング
        </p>

        <p>
          <strong>重要キーワード</strong>
          <br />
          **マーチングキューブ法**
        </p>

        <p>
          <strong>箇条書き</strong>
          <br />- メリット：高速
        </p>

        <p>
          <strong>打ち消し線</strong>
          <br />
          ~~古い説明~~
        </p>
      </div>

      <div className="upload-preview">
        {originalText && (
          <>
            <h3>補正前の原文</h3>
            <div className="upload-preview-box">{originalText}</div>
          </>
        )}

        <h3>表示プレビュー</h3>
        <div
          className="upload-preview-box"
          dangerouslySetInnerHTML={{
            __html: formatSummaryText(lectureText),
          }}
        />
      </div>
    </>
  );
}
