//notificationbell.jsx
import { Link } from "react-router-dom";
import "./notificationBell.css";

export default function NotificationBell({ unreadCount }) {
  //1件以上で通知数を表示する
  return (
    <Link to="/notifications" className="notification-bell">
      🔔
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </Link>
  );
}
