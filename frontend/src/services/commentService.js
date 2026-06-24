//Firestoreで使用する関数をインポート
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { getUserName } from "./userService";
//管理者メールアドレス
const ADMIN_EMAIL = "konankonan@test.com";

//返信一覧を取得
export async function loadReplies(docId, commentId) {
  const repliesRef = collection(
    db,
    "class_logs_summary",
    docId,
    "comments",
    commentId,
    "replies",
  );

  //作成日時の昇順で取得
  const q = query(repliesRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);

  //FirestoreのDocumentを扱いやすいオブジェクト配列へ変換
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

//コメント一覧を取得
export async function loadComments(docId, currentUser) {
  //指定した授業ログのcommentsサブコレクションを参照
  const commentsRef = collection(db, "class_logs_summary", docId, "comments");

  //作成日時の昇順で取得
  const q = query(commentsRef, orderBy("createdAt", "asc"));
  const querySnapshot = await getDocs(q);

  //現在のユーザーが管理者か判定
  const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

  //画面表示用のコメント配列
  const comments = [];

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();

    //表示名とメールアドレスを取得
    const displayedName = data.inputName || data.userName || "名無しさん";
    const commenterEmail = data.userEmail || "guest@example.com";

    let userDisplayName = displayedName;

    //管理者の場合は本名とメールアドレスも表示
    if (isAdmin) {
      const realName = await getUserName(commenterEmail);
      const resolvedRealName =
        realName !== commenterEmail ? realName : "名無しさん";

      userDisplayName = `${displayedName}（${resolvedRealName}:${commenterEmail}）`;
    }

    //コメントに紐づく返信を取得
    const replies = await loadReplies(docId, docSnap.id);
    //画面表示用の形に整えて配列に追加
    comments.push({
      id: docSnap.id,
      userDisplayName,
      text: data.text || "",
      likes: data.likes || 0,
      userEmail: commenterEmail,
      replies,
    });
  }

  return comments;
}

//コメントにいいねする
export async function likeComment(docId, commentId) {
  //現在ログイン中のユーザーを取得
  const user = auth.currentUser;

  //未ログインの場合はエラー
  if (!user) {
    throw new Error("ログインが必要です");
  }

  //いいね対象のコメントを参照
  const commentRef = doc(
    db,
    "class_logs_summary",
    docId,
    "comments",
    commentId,
  );

  //コメントデータを取得
  const commentSnap = await getDoc(commentRef);

  //コメントが存在しない場合はエラー
  if (!commentSnap.exists()) {
    throw new Error("コメントが存在しません");
  }

  const data = commentSnap.data();

  //同じユーザーが二重にいいねできないようにする
  if (data.likedUsers && data.likedUsers.includes(user.email)) {
    throw new Error("既にいいねしています");
  }

  //いいね数を1増やし、いいね済みユーザーに追加
  await updateDoc(commentRef, {
    likes: increment(1),
    likedUsers: arrayUnion(user.email),
  });
}

//コメントを削除
export async function deleteComment(docId, commentId) {
  //削除対象のコメントを参照
  const commentRef = doc(
    db,
    "class_logs_summary",
    docId,
    "comments",
    commentId,
  );

  //コメントを削除
  await deleteDoc(commentRef);
}

//コメントを追加
export async function addComment(docId, inputName, text) {
  //現在ログイン中のユーザーを取得
  const user = auth.currentUser;

  //未ログインの場合はエラー
  if (!user) {
    throw new Error("ログインが必要です");
  }

  //コメント追加先のcommentsサブコレクションを参照
  const commentsRef = collection(db, "class_logs_summary", docId, "comments");

  //コメントデータを追加
  await addDoc(commentsRef, {
    userEmail: user.email,
    inputName: inputName || "名無しさん",
    text,
    createdAt: new Date(),
    likes: 0,
    likedUsers: [],
  });
}

//返信を追加
export async function addReply(docId, commentId, inputName, text) {
  //現在ログイン中のユーザーを取得
  const user = auth.currentUser;

  //未ログインの場合はエラー
  if (!user) {
    throw new Error("ログインが必要です");
  }

  //返信追加先のrepliesサブコレクションを参照
  const repliesRef = collection(
    db,
    "class_logs_summary",
    docId,
    "comments",
    commentId,
    "replies",
  );

  //返信データを追加
  await addDoc(repliesRef, {
    userEmail: user.email,
    inputName: inputName || "名無しさん",
    text,
    createdAt: new Date(),
    likes: 0,
    likedUsers: [],
  });
}
