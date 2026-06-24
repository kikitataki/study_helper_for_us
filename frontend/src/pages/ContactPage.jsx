import { useEffect, useState } from "react";
import { sendContact, loadContacts } from "../services/contactService";

const ADMIN_EMAIL = "konankonan@test.com";

export default function ContactPage({ user }) {
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [contacts, setContacts] = useState([]);
  const [sending, setSending] = useState(false);

  async function handleSendContact() {
    if (!title.trim() || !detail.trim()) {
      alert("件名と詳細を入力してください。");
      return;
    }

    try {
      setSending(true);

      await sendContact({
        title: title.trim(),
        detail: detail.trim(),
      });

      alert("お問い合わせを送信しました。");

      setTitle("");
      setDetail("");
    } catch (error) {
      console.error("問い合わせ送信エラー:", error);
      alert("送信に失敗しました。");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;

    async function fetchContacts() {
      try {
        const list = await loadContacts();
        setContacts(list);
      } catch (error) {
        console.error("問い合わせ取得エラー:", error);
      }
    }

    fetchContacts();
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <>
        <h2>お問い合わせ一覧</h2>

        {contacts.length === 0 ? (
          <p>お問い合わせはありません。</p>
        ) : (
          contacts.map((contact) => (
            <div className="contact-card" key={contact.id}>
              <h3>{contact.title}</h3>
              <p>{contact.detail}</p>
              <small>{contact.userEmail}</small>
            </div>
          ))
        )}
      </>
    );
  }

  return (
    <>
      <h2>お問い合わせ</h2>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="件名"
      />

      <textarea
        rows="6"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="お問い合わせ内容"
      />

      <button onClick={handleSendContact} disabled={sending}>
        {sending ? "送信中..." : "送信する"}
      </button>
    </>
  );
}
