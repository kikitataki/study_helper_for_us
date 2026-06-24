//comment.jsx
import "./comment.css";
import { useEffect, useState } from "react";
import {
  loadComments,
  likeComment,
  deleteComment,
  addComment,
  addReply,
} from "../services/commentService";
import { auth } from "../services/firebase";
import { createCommentNotification } from "../services/notificationService";

const ADMIN_EMAIL = "konankonan@test.com";

export default function CommentSection({ className, classCount }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentName, setCommentName] = useState(
    localStorage.getItem("chat_user_name") || "",
  );
  const [commentText, setCommentText] = useState("");

  const [replyTargetId, setReplyTargetId] = useState("");
  const [replyText, setReplyText] = useState("");

  const docId = className && classCount ? `${className}_${classCount}` : "";
  const isAdmin = auth.currentUser?.email === ADMIN_EMAIL;

  async function fetchComments() {
    if (!docId) return;

    try {
      setLoadingComments(true);
      const commentList = await loadComments(docId, auth.currentUser);
      setComments(commentList);
    } catch (error) {
      console.error(error);
      alert("コメントの読み込みに失敗しました。");
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleLikeComment(commentId) {
    try {
      await likeComment(docId, commentId);
      await fetchComments();
    } catch (error) {
      console.error(error);
      alert(error.message || "いいね失敗");
    }
  }

  async function handleDeleteComment(commentId) {
    if (!confirm("このコメントを本当に削除しますか？")) return;

    try {
      await deleteComment(docId, commentId);
      alert("コメントを削除しました。");
      await fetchComments();
    } catch (error) {
      console.error("コメント削除エラー:", error);
      alert("削除に失敗しました。権限がないか、通信エラーです。");
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) {
      alert("コメントを入力してください。");
      return;
    }

    if (!className || !classCount) {
      alert("授業を選択してください。");
      return;
    }

    try {
      const inputName = commentName.trim() || "名無しさん";

      await addComment(docId, inputName, commentText.trim());

      await createCommentNotification(
        className,
        classCount,
        commentText.trim(),
      );

      localStorage.setItem("chat_user_name", inputName);

      setCommentText("");

      await fetchComments();
    } catch (error) {
      console.error("投稿エラー:", error);
      alert(error.message || "投稿に失敗しました。");
    }
  }

  async function handleAddReply(commentId) {
    if (!replyText.trim()) {
      alert("返信内容を入力してください。");
      return;
    }

    try {
      const inputName = commentName.trim() || "名無しさん";

      await addReply(docId, commentId, inputName, replyText.trim());

      localStorage.setItem("chat_user_name", inputName);

      setReplyText("");
      setReplyTargetId("");

      await fetchComments();
    } catch (error) {
      console.error("返信投稿エラー:", error);
      alert(error.message || "返信に失敗しました。");
    }
  }

  useEffect(() => {
    if (docId) {
      fetchComments();
    } else {
      setComments([]);
    }
  }, [docId]);

  return (
    <>
      <h2>みんなのコメント</h2>

      <div className="comments-container">
        {!docId ? (
          <div>授業名と回数を選択すると、コメントが表示されます。</div>
        ) : loadingComments ? (
          <div>コメントを読み込み中...</div>
        ) : comments.length === 0 ? (
          <div>まだコメントはありません。最初の補足を残しよう！</div>
        ) : (
          comments.map((comment) => (
            <div className="comment-item" key={comment.id}>
              <div className="comment-user">👤 {comment.userDisplayName}</div>

              <div className="comment-text">{comment.text}</div>

              <div className="comment-actions">
                <button onClick={() => handleLikeComment(comment.id)}>
                  👍 いいね
                </button>

                <span>{comment.likes} いいね</span>

                <button onClick={() => setReplyTargetId(comment.id)}>
                  返信する
                </button>
              </div>

              {replyTargetId === comment.id && (
                <div className="reply-form">
                  <textarea
                    rows="2"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="返信を入力"
                  />

                  <button onClick={() => handleAddReply(comment.id)}>
                    返信を投稿
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReplyTargetId("");
                      setReplyText("");
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              )}

              {comment.replies?.length > 0 && (
                <div className="reply-list">
                  {comment.replies.map((reply) => (
                    <div className="reply-item" key={reply.id}>
                      <div className="comment-user">
                        ↳ 👤 {reply.inputName || "名無しさん"}
                      </div>
                      <div className="comment-text">{reply.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <button
                  className="comment-delete-btn"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  削除
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {docId && (
        <div className="comment-form">
          <input
            type="text"
            value={commentName}
            onChange={(e) => setCommentName(e.target.value)}
            placeholder="名前（ニックネーム）"
          />

          <textarea
            rows="3"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="補足情報やメモをここに書き込めます"
          />

          <button onClick={handleAddComment}>コメントを投稿する</button>
        </div>
      )}
    </>
  );
}
