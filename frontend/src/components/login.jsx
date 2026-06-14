import "./login.css";

export default function Login() {
  return (
    <>
      <div className="login-box">
        <div className="login-container">
          <h2>授業ページ ログイン</h2>
          <input
            type="email"
            id="login-email"
            placeholder="登録したメールアドレス"
          />
          <input type="password" id="login-password" placeholder="パスワード" />
          <button>ログイン</button>
        </div>
      </div>

      <div className="register-link-box">
        <a href="https://stady-for-us.web.app/register.html">
          新規登録はこちら
        </a>
      </div>
    </>
  );
}
