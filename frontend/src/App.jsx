//App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
//BrowserRouterが画面切り替えライブラリ
//
import { useState, useEffect } from "react";
import LoginForm from "./components/login";
import useAuth from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import UploadPage from "./pages/UploadPage";
import RegisterPage from "./pages/RegisterPage";
import HamburgerMenu from "./components/HamburgerMenu";
import ContactPage from "./pages/ContactPage";
import NotificationBell from "./components/NotificationBell";
import NotificationPage from "./pages/NotificationPage";
import { loadUnreadNotificationCount } from "./services/notificationService";

function App() {
  //ログイン状態を取得する
  //userがnullで未ログイン
  //loadingがtrueで確認中（詳しくはhooks/useAuth.js参照）
  const { user, loading } = useAuth();

  //未読通知数を管理
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnreadCount() {
      //async() =>{}ではエラーになった
      //→調べたところ返り値promiseがあるからとのこと
      //処理関数か返り値なしじゃないといけないらしい

      if (!user) return;

      try {
        const count = await loadUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("未読通知取得エラー", error);
      }
    }
    fetchUnreadCount();
  }, [user]); //userが変わるときに実行する

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <BrowserRouter>
      <h1>授業内容共有サイト</h1>
      {/* 通知ベル */}
      {user && <NotificationBell unreadCount={unreadCount} />}
      {user && (
        <>
          <Link to="/">閲覧ページ</Link>
          {" | "}
          <Link to="/upload">投稿ページ</Link>
        </>
      )}
      {user && <HamburgerMenu user={user} />}
      <Routes>
        <Route
          path="/notifications"
          //userがいるなら表示、いなければ非表示する
          element={user ? <NotificationPage /> : <LoginForm />}
        />

        <Route
          path="/"
          element={user ? <HomePage user={user} /> : <LoginForm />}
        />

        <Route
          path="/upload"
          element={user ? <UploadPage user={user} /> : <LoginForm />}
        />

        <Route
          path="/contact"
          element={user ? <ContactPage user={user} /> : <LoginForm />}
        />

        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
