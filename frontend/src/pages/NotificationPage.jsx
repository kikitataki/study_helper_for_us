//通知一覧ページ
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadMyNotifications,
  deleteMyNotification,
} from "../services/notificationService";
import "./notification.css";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]); //件数
  const [loading, setLoading] = useState(true); //取得状況

  useEffect(() => {
    async function fetchNotifications() {
      try {
        //通知データの取得
        const list = await loadMyNotifications();
        setNotifications(list);
      } catch (error) {
        console.error("通知取得エラー:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  if (loading) {
    return <div>通知を読み込み中...</div>;
  }

  return (
    <>
      <h2>通知一覧</h2>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div>通知はありません。</div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification.id}
              // 移動先
              to={`/?className=${encodeURIComponent(
                notification.className,
              )}&classCount=${notification.classCount}`}
              className="notification-item"
              onClick={() => deleteMyNotification(notification.id)}
            >
              <div className="notification-message">{notification.message}</div>

              {notification.preview && (
                <div className="notification-preview">
                  {notification.preview}
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </>
  );
}
