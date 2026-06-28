import { useState } from "react";
import { createRegisterRequest } from "../services/registerService";

export default function RegisterPage() {
  //入力フォームの状態管理
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  //送信中かどうかの状態管理
  const [sending, setSending] = useState(false);

  //登録申請ボタン押下時の処理
  async function handleRegisterRequest() {
    //入力チェック
    if (!email.trim() || !name.trim() || !password) {
      alert("メールアドレス、名前、パスワードを入力してください。");
      return;
    }

    try {
      //送信中状態
      setSending(true);

      //登録申請
      await createRegisterRequest({
        email: email.trim(),
        name: name.trim(),
        password,
      });

      alert("登録申請を送信しました。管理者の承認をお待ちください。");

      //入力フォームを初期化
      setEmail("");
      setName("");
      setPassword("");
    } catch (error) {
      console.error("登録申請エラー:", error);
      alert("登録申請に失敗しました。");
    } finally {
      //送信中状態を解除
      setSending(false);
    }
  }

  return (
    <>
      <h2>新規登録申請</h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
      />

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="表示名"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
      />

      <button onClick={handleRegisterRequest} disabled={sending}>
        {sending ? "送信中..." : "登録申請する"}
      </button>
    </>
  );
}
