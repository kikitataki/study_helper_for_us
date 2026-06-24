// components/Admin.jsx
import "./admin.css";
import { useEffect, useState } from "react";
import {
  loadAllUsers,
  deleteUser,
  addOrUpdateUser,
} from "../services/userService";
import {
  loadRegisterRequests,
  rejectUser,
  approveUser,
} from "../services/adminService";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  //ユーザー取得関数
  async function fetchUsers() {
    try {
      //読み込み開始にする
      setLoadingUsers(true);
      const userList = await loadAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error("ユーザー一覧取得エラー:", error);
    } finally {
      setLoadingUsers(false);
    }
  }

  //申請表示
  async function fetchRegisterRequests() {
    try {
      setLoadingRequests(true);
      const requestList = await loadRegisterRequests();
      setRequests(requestList);
    } catch (error) {
      console.error("申請一覧取得エラー:", error);
    } finally {
      setLoadingRequests(false);
    }
  }

  async function handleAddOrUpdateUser() {
    if (!userEmail || !userName) {
      alert("メールアドレスと名前の両方を入力してください。");
      return;
    }

    try {
      await addOrUpdateUser(userEmail, userName);

      alert(`ユーザー「${userName}」を登録・更新しました。`);

      setUserEmail("");
      setUserName("");

      await fetchUsers();
    } catch (error) {
      console.error("ユーザー登録エラー:", error);
      alert("ユーザーの登録に失敗しました。");
    }
  }

  async function handleApproveUser(email) {
    try {
      await approveUser(email);
      alert("承認しました");

      await fetchRegisterRequests();
      await fetchUsers();
    } catch (error) {
      console.error(error);
      alert(error.message || "承認失敗");
    }
  }

  async function handleRejectUser(email) {
    const ok = confirm(`${email} の申請を拒否しますか？`);
    if (!ok) return;

    try {
      await rejectUser(email);
      alert("申請を拒否しました");

      await fetchRegisterRequests();
    } catch (error) {
      console.error(error);
      alert("拒否に失敗しました");
    }
  }

  async function handleDeleteUser(email) {
    const ok = confirm(`本当にこのユーザー (${email}) の登録を削除しますか？`);
    if (!ok) return;

    try {
      await deleteUser(email);
      alert("ユーザー登録を削除しました。");

      await fetchUsers();
    } catch (error) {
      console.error("ユーザー削除エラー:", error);
      alert("ユーザーの削除に失敗しました。");
    }
  }

  useEffect(() => {
    fetchUsers();
    fetchRegisterRequests();
  }, []);

  return (
    <div className="admin-zone">
      <div className="admin-notification-box">
        <div className="admin-card-title">新規登録申請</div>

        <div className="admin-request-list">
          {loadingRequests ? (
            <div>読み込み中...</div>
          ) : requests.length === 0 ? (
            <div>新規登録申請はありません。</div>
          ) : (
            requests.map((request) => (
              <div className="admin-request-row" key={request.id}>
                <div>
                  <strong>{request.name}</strong>
                </div>

                <div className="admin-request-email">{request.email}</div>

                <button
                  className="approve-btn"
                  onClick={() => handleApproveUser(request.email)}
                >
                  承認
                </button>

                <button
                  className="reject-btn"
                  onClick={() => handleRejectUser(request.email)}
                >
                  拒否
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        className="admin-toggle-btn"
        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
      >
        <span>管理者専用メニュー ＆ ユーザー管理</span>
        <span>{isAdminMenuOpen ? "▲" : "▼"}</span>
      </button>

      {isAdminMenuOpen && (
        <div className="admin-content">
          <div className="admin-card">
            <span className="admin-card-title">＋ ユーザー新規登録・変更</span>

            <div className="flex-container">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="メールアドレス (例: student1@example.com)"
              />

              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="表示する名前 (例: 山田太郎)"
              />

              <button onClick={handleAddOrUpdateUser}>
                ユーザーを登録・更新
              </button>
            </div>
          </div>

          <div className="admin-card">
            <span className="admin-card-title">登録済みユーザー一覧</span>

            <div className="admin-user-list">
              {loadingUsers ? (
                <div>読み込み中...</div>
              ) : users.length === 0 ? (
                <div>登録されたユーザーはいません。</div>
              ) : (
                users.map((user) => (
                  <div className="admin-user-row" key={user.email}>
                    <span>
                      <strong>{user.name}</strong> <small>({user.email})</small>
                    </span>

                    <button
                      className="admin-delete-btn"
                      onClick={() => handleDeleteUser(user.email)}
                    >
                      削除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
