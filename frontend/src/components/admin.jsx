import "./admin.css";

export default function Admin() {
  return (
    <div className="admin-zone">
      <div className="admin-notification-box">
        <div className="admin-card-title">🔔 新規登録申請</div>

        <div id="admin-request-list">読み込み中...</div>
      </div>

      <button className="admin-toggle-btn">
        <span>管理者専用メニュー ＆ ユーザー管理</span>
        <span id="admin-toggle-arrow">▼</span>
      </button>

      <div className="admin-content">
        <div className="admin-card">
          <span className="admin-card-title">＋ ユーザー新規登録・変更</span>

          <div className="flex-container">
            <input
              type="email"
              id="admin-user-email"
              placeholder="メールアドレス (例: student1@example.com)"
            />

            <input
              type="text"
              id="admin-user-name"
              placeholder="表示する名前 (例: 山田太郎)"
            />

            <button id="admin-add-user-btn">ユーザーを登録・更新</button>
          </div>
        </div>

        <div className="admin-card">
          <span className="admin-card-title">登録済みユーザー一覧</span>

          <div id="admin-user-list">読み込み中...</div>
        </div>
      </div>
    </div>
  );
}
