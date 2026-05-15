マイクから音声を取得してリアルタイムで文字起こしを行い、Gemini APIを使って内容を自動で訂正し補完するアプリケーションです。

主な機能
〇リアルタイム文字起こし**: `SpeechRecognition` ライブラリを使用した音声入力。
〇AI自動補完: Google Gemini API（Gemini 1.5 Flash）による会話内容の補完。
〇ログ保存: 認識したテキストと補完結果を一覧で表示・管理。
〇キーワード強調: 特定の単語が含まれるログを視覚的に強調。

技術スタック
- **Backend**: Python (Flask)
- **Frontend**: HTML5, CSS, JavaScript
- **AI/API**: Google Generative AI (Gemini API)
- **Voice**: SpeechRecognition, PyAudio
