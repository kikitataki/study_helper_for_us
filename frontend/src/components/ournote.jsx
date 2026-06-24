//ournote.jsx
//授業取得と内容表示部分
import "./ournote.css";
import { useEffect, useState } from "react";
import {
  savePendingPatch,
  loadSummary,
  deleteSummaryPage,
  checkAndRunPendingPatches,
} from "../services/summaryService";
import { formatSummaryText } from "../utils/formatter";
import { auth } from "../services/firebase";

const ADMIN_EMAIL = "konankonan@test.com";

export default function OurNote({ className, classCount }) {
  //要約本文の状態管理
  const [summary, setSummary] = useState(
    "授業名と回数を選択すると、ここに要約が表示されます。",
  );

  //追記・修正要望の入力内容
  const [patchText, setPatchText] = useState("");

  //修正要望を保存中かどうかの状態管理
  const [savingPatch, setSavingPatch] = useState(false);

  //現在のユーザーが管理者か判定
  const isAdmin = auth.currentUser?.email === ADMIN_EMAIL;

  //選択中の授業要約を取得
  async function fetchSummary() {
    //授業名か講義回数が未選択なら初期文を表示
    if (!className || !classCount) {
      setSummary("授業名と回数を選択すると、ここに要約が表示されます。");
      return;
    }

    //授業名と講義回数からドキュメントIDを作成
    const docId = `${className}_${classCount}`;

    try {
      setSummary("読み込み中...");

      //管理者の場合のみ、未処理の修正要望を確認
      const isAdmin = auth.currentUser?.email === ADMIN_EMAIL;

      if (isAdmin) {
        //一時保存された修正要望をAIで統合
        const patched = await checkAndRunPendingPatches(docId);

        //統合された場合は一時メッセージを表示
        if (patched) {
          setSummary("スマホからの修正要望を統合しました。再読み込み中...");
        }
      }

      //Firestoreから要約本文を取得
      const summaryText = await loadSummary(docId);

      //要約があれば表示し、なければ未登録メッセージを表示
      if (summaryText) {
        setSummary(summaryText);
      } else {
        setSummary("データが見つかりませんでした。");
      }
    } catch (error) {
      console.error("要約取得・修正統合エラー:", error);
      setSummary("エラーが発生しました。");
    }
  }

  //追記・修正要望を一時保存
  async function handleSavePatch() {
    //入力内容が空なら処理しない
    if (!patchText.trim()) {
      alert("追加・修正したいメモを入力してください");
      return;
    }

    //授業が未選択なら処理しない
    if (!className || !classCount) {
      alert("授業を選択してからメモを送信してください");
      return;
    }

    //授業名と講義回数からドキュメントIDを作成
    const docId = `${className}_${classCount}`;

    try {
      //保存中状態にする
      setSavingPatch(true);

      //修正要望をFirestoreに一時保存
      await savePendingPatch(docId, patchText.trim());

      alert(`「${className} 第${classCount}回」の修正要望を一時保存しました！`);

      //入力欄を初期化
      setPatchText("");
    } catch (error) {
      console.error(error);
      alert("一時保存に失敗しました。");
    } finally {
      //保存中状態を解除
      setSavingPatch(false);
    }
  }

  //授業ページを削除
  async function handleDeleteSummary() {
    //授業が未選択なら処理しない
    if (!className || !classCount) {
      alert("授業を選択してください");
      return;
    }

    //削除前に確認する
    const ok = confirm(
      `本当に「${className} 第${classCount}回」を削除しますか？`,
    );

    if (!ok) return;

    try {
      //授業名と講義回数からドキュメントIDを作成
      const docId = `${className}_${classCount}`;

      //Firestoreから授業ページを削除
      await deleteSummaryPage(docId);

      alert("授業ページを削除しました");

      //削除後は初期文に戻す
      setSummary("授業名と回数を選択すると、ここに要約が表示されます。");
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    }
  }

  //授業名または講義回数が変わったら要約を再取得
  useEffect(() => {
    fetchSummary();
  }, [className, classCount]);

  return (
    <>
      <div
        id="summary-box"
        dangerouslySetInnerHTML={{
          __html: formatSummaryText(summary),
        }}
      />

      <div className="mobile-patch-zone">
        {isAdmin && (
          <button className="delete-summary-btn" onClick={handleDeleteSummary}>
            この授業ページを削除
          </button>
        )}

        <p className="patch-title">この講義ノートに追記・修正する</p>

        <div className="patch-form">
          <input
            type="text"
            value={patchText}
            onChange={(e) => setPatchText(e.target.value)}
            placeholder="追加したい板書、重要な補足、修正点を入力（Enterでも送信可）"
            className="patch-input"
          />

          <button
            className="patch-submit-btn"
            onClick={handleSavePatch}
            disabled={savingPatch}
          >
            {savingPatch ? "保存中..." : "要望を送信"}
          </button>
        </div>

        <small className="patch-note">
          ※送信されたメモはFirestoreに一時保存され、次にローカル（PC環境）でこのページを開いた際、自動的にAIがノートへ統合します。
        </small>
      </div>
    </>
  );
}
