/*HamburgerMenu.jsx*/
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./HamburgerMenu.css";
import { logoutUser } from "../services/authService";
import { getUserName } from "../services/userService";

export default function HamburgerMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false); //開いているかどうか
  const [userName, setUserName] = useState("ユーザー"); //表示してるユーザー名

  useEffect(() => {
    async function fetchUserName() {
      if (!user?.email) {
        setUserName("ユーザー");
        return;
      }

      try {
        let name = await getUserName(user.email);
        if (name === user.email) name = "ななしさん";
        setUserName(name);
      } catch (error) {
        console.error("ユーザー名取得エラー:", error);
        setUserName("ユーザー");
      }
    }
    //同様に返り値の問題があるので間接的に呼ぶ
    fetchUserName();
  }, [user]);

  //ログアウト機能
  async function handleLogout() {
    try {
      await logoutUser();
      alert("ログアウトしました。");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      alert("ログアウトに失敗しました。");
    }
  }

  return (
    <>
      <div
        className={`hamburger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <nav className={`menu ${isOpen ? "open" : ""}`}>
        <div className="menu-user-box">
          <div className="menu-user-name">{userName}</div>
          <div className="menu-user-email">{user?.email}</div>
        </div>

        <ul>
          <li>
            <Link to="/" onClick={() => setIsOpen(false)}>
              閲覧ページ
            </Link>
          </li>

          <li>
            <Link to="/upload" onClick={() => setIsOpen(false)}>
              投稿ページ
            </Link>
          </li>

          <li>
            <Link to="/contact" onClick={() => setIsOpen(false)}>
              お問い合わせ＆改善案
            </Link>
          </li>

          <li onClick={handleLogout}>ログアウト</li>
        </ul>
      </nav>
    </>
  );
}
