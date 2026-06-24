//login.jsx
import "./login.css";
import { useState } from "react";
import { loginUser } from "../services/authService";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function judgeLogin() {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください。");
      return;
    }

    try {
      await loginUser(email, password);
      alert("ログインに成功しました！");
    } catch (e) {
      console.error("ログインエラー:", e);
      alert(e || "メールアドレスまたはパスワードが違います。");
    }
  }

  return (
    <>
      <div className="login-box">
        <div className="login-container">
          <h2>授業ページ ログイン</h2>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="登録したメールアドレス"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
          />

          <button onClick={judgeLogin}>ログイン</button>
        </div>
      </div>

      <div className="register-link-box">
        <Link to="/register">新規登録はこちら</Link>
      </div>
    </>
  );
}
