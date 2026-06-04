import webbrowser
from flask import Flask, render_template, request, redirect, url_for,jsonify
from datetime import datetime
from google import genai
import os
from dotenv import load_dotenv
import threading
import webbrowser
import sys
# ➔ 元からあるインポートの下あたりに追加してください
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import auth

def get_resource_path(relative_path):
    if getattr(sys, 'frozen', False):
        # .exe ファイルとして実行されている場合（exeが置いてある本当のフォルダ）
        base_path = os.path.dirname(sys.executable)
    else:
        # 通常の main.py として実行されている場合（main.pyが置いてあるフォルダ）
        base_path = os.path.dirname(os.path.abspath(__file__))

    return os.path.join(base_path, relative_path)

load_dotenv(get_resource_path(".env"))

# 【追加1】Firebaseの初期設定（ダウンロードした鍵ファイルを読み込みます）
# ※ firebase-key.json という名前にリネームしてプロジェクトフォルダに置いてある想定です
cred = credentials.Certificate(
    get_resource_path("fire_basekey.json")
)
firebase_admin.initialize_app(cred)

# 🗄️ Firestore データベースを操作するための「クライアント」を作成
db = firestore.client()
client = genai.Client(api_key= os.getenv("GEMINI_API_KEY"))


keywords = {"授業中", "課題", "テスト", "レポート", "終了", "提出", "締め切り", "教授", "成績", "単位","大事"}
alllogs = []
display_logs = []

active = False


app = Flask(
    __name__,
    template_folder=get_resource_path('templates'),
    static_folder=get_resource_path('static')
)




def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000/')

#ここは重要ワードが出てきたらtrueにするための関数（現在は停止中)
def deactivate():
    global active
    active = False
    print("10秒経過 したので False に戻します")

def activate_for_10_seconds():
    global active
    active = True
    print("10秒間だけ True にします")
    
    # 10秒後に deactivate 関数を実行するように予約
    timer = threading.Timer(10.0, deactivate)
    timer.start()



@app.route("/approve_user", methods=["POST"])
def approve_user():

    data = request.json

    email = data["email"]
    password = data["password"]

    try:
        auth.create_user(
            email=email,
            password=password
        )

        return jsonify({
            "success": True
        })

    except Exception as e:
        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
        })

#初期画面
@app.route("/")
def index():
    return render_template("display.html", logs=display_logs, keywords=keywords)

@app.route("/eraselog",methods =['POST'])
def erase_log():
    alllogs.clear()
    return jsonify({"status": "ok"})

@app.route("/point.html")
def point():
    return render_template("index.html")

#全ログ画面
@app.route("/alllog.html")
def alllog():
    return render_template("alllog.html", logs=alllogs)

#キーワード追加・削除
@app.route("/add_keyword", methods=["POST"])
def add_keyword():
    new_keyword = request.form["new_keyword"]
    keywords.add(new_keyword)
    return redirect(url_for("index"))

@app.route("/erase_keyword", methods=["POST"])
def erase_keyword():
    keyword_to_remove = request.form["new_keyword"]
    keywords.discard(keyword_to_remove)
    return redirect(url_for("index"))

#全ログをjsonで返す
@app.route('/api/logs')
def get_logs_json():
    return jsonify(alllogs) #json形式の文字列であることに注意する

@app.route('/api/important_logs')
def get_important_logs_json():
    return jsonify(display_logs)
# Python（Flask）側の処理イメージ

# @app.route("/register")
# def register():
#     return render_template("register.html")


def prepare_text_for_gemini(alllogs):
    # 1. JSON（辞書のリスト）からテキスト部分だけを抽出して合体させる
    # のデータ構造（timestamp, text）を想定
    combined_text = ""
    for log in alllogs:
        combined_text += f"[{log['timestamp']}] {log['text']}\n"
    return combined_text

def call_gemini_api(alllogs, class_name):  
    # 合体させた文章を作成
    target_text = prepare_text_for_gemini(alllogs)

    prompt = f"""
    対象の授業科目: 【{class_name}】
    
    以下の文章は音声認識で作成されたログです。
    誤字脱字や文脈の乱れを適切に補完・修正してください。
    また、出力の際にはこれを課題の提出物として扱い、不自然な改行や絵文字はやめてください。
    [修正後の文章]の形式で出力してください。
    なお、wordにそのままコピペできるようにするために。###といった協調はやめてください。
    また、[修正後の文章]からスタートして、その内容の形式でタイトルと内容を明確に区別できるようにしてください。
    そして、いきなり要約から書き始めるのではなく、まずは修正後の文章から書き始めてください。
    なお、要約はする必要がありません。あくまで修正を行うだけで構いません。
    --- ログ内容 ---
    {target_text}
    """
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt,
    )
    return response.text
    

@app.route('/send_voice', methods=['POST'])
def receive_voice():
    # 💡 送られてきた生のデータを「テキスト（文字列）」としてそのまま受け取る
    spoken_text = request.get_data(as_text=True)
    
    print(f"ブラウザから届いた生の文字列: {spoken_text}")
    if spoken_text == "":
        print("文章を認識できませんでした")
        return "Empty string received, ignoring.", 200
    alllogs.append({"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "text": spoken_text})
    return "Received", 200



@app.route('/api/youyaku', methods=['POST']) # ← methods=['POST'] を追加！
def get_summary():
    # 💡 HTMLから送られてきたJSONデータ（授業名）を引き取る
    data = request.get_json() or {}
    class_name = data.get('className', '未設定').strip()
    
    # 💡 call_gemini_apiに「class_name」を渡して呼び出す
    summary = call_gemini_api(alllogs, class_name)
    return jsonify({"summary": summary})


@app.route('/api/save_log', methods=['POST'])
def save_log():
    try:
        data = request.get_json() or {}
        user_name = os.getenv('USER_NAME', 'guest_user')
        class_name = data.get('className', '未設定').strip()
        class_count = data.get('classCount', '1')
        summary_text = data.get('summary', '').strip()  # 今回届いた、個人の補完データ

        # 安全のためのチェック（空っぽ、またはAIがまだ処理中・エラーのデータなら弾く）
        if not summary_text or summary_text == "補完中..." or "【エラー】" in summary_text:
            return jsonify({"status": "error", "message": "保存する文章が正しく生成されていません"}), 400

        # --------------------------------------------------------
        # 1. 【個人用フォルダ】への保存（これまでの送信履歴として蓄積）
        # --------------------------------------------------------
        personal_data = {
            "userName": user_name,
            "className": class_name,
            "classCount": int(class_count),
            "summary": summary_text,
            "createdAt": datetime.now()
        }
        db.collection("class_logs_personal").add(personal_data)

        # --------------------------------------------------------
        # 2. 【全体用（和集合）フォルダ】への保存（上書き更新）
        # --------------------------------------------------------
        doc_id = f"{class_name}_{class_count}"
        doc_ref = db.collection("class_logs_summary").document(doc_id)
        doc_snapshot = doc_ref.get()

        # 最終的に保存する要約を格納する変数
        updated_summary = summary_text

        existing_data = doc_snapshot.to_dict()
        past_summary = "ありませんでした"

        if doc_snapshot.exists:
            past_summary = existing_data.get("summary", "")
            # 🔮 Gemini APIを呼び出して、新旧2つの要約の「和集合」を作る
        prompt = f"""
あなたは大学の講義ノートを整理する優秀なアシスタントです。
これまでの「蓄積された要約ノート」と、新しく届いた「個人の補完データ」の2つを統合し、教科書のように美しく、復習しやすいノートにアップデートしてください。

【★最重要：レイアウトと視覚的階層のルール】
画面に出力する際、システム独自の表示文法（CSS）が適用されます。AIは文章の羅列（すべてが箇条書きになる状態）を絶対に避け、以下の構造を厳格に守って成形してください。

1. 大見出し（章・大きなテーマ）：
   行頭には必ず「1. 」「2. 」「3. 」のように「数字＋ドット＋半角スペース」から始めてください。
   見出しの行には解説文などを続けず、テーマ名だけにしてください。
   （例：2. ボリュームデータの表現とポリゴン化手法）

2. 通常の解説文（箇条書きにしない！）：
   各テーマの概要や説明文は、行頭に「- 」を付けず、通常の文章として記述してください。
   適切な位置で普通に改行（Enter）を入れて段落を分けてください。
   （例：ボリュームデータの描画手法の一つに、パーティクル（粒子）表現があります。これは大気中の水分量データなどから雲を表現する研究などに用いられます。）

3. 箇条書き「- 」の使用制限：
   行頭の「- 」（半角ハイフンと半角スペース）は、以下の【要素の列挙】や【メリット・デメリット・特徴】を並べる時「だけ」に使用してください。すべての行の頭に機械的に付けるのは絶対に禁止します。
   （例）：
   - メリット：データ量を抑えてリアルタイム性を確保できる。
   - 欠点：拡大すると隙間が空いてスカスカに見えてしまう。

4. 重要キーワード（文字拡大＋太字＋マーカー）：
   核心となる専門用語は、必ず ** と ** で挟んで出力してください。
   （例：**マーチングキューブ法**）

5. 訂正・変更情報（打ち消し線）：
   不要になった古い情報や変更点がある場合は、必ず ~~ と ~~ で挟んでください。

【出力形式】
前置きや挨拶は一切不要です。いきなり「1. テーマ：〜」から記述を開始してください。

--- 蓄積された要約ノート（過去の全体データ） ---
{past_summary}

--- 個人の補完データ（今回追加するデータ） ---
{summary_text}
        """
            
        try:
            # 💡 clientのインポートや初期化がmain.pyの上部で行われている前提です
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt,
            )
            if response.text:
                updated_summary = response.text
        except Exception as gemini_err:
            print(f"Gemini合体APIエラー: {gemini_err}")
            # 今回は合体に失敗したので、過去のデータを消さないために「過去データ」をそのまま維持する安全策
            updated_summary = past_summary

        # 最新の和集合データを組み立てて保存
        summary_data = {
            "className": class_name,
            "classCount": int(class_count),
            "summary": updated_summary,
            "updatedAt": datetime.now()
        }
        # .set() で上書き、または新規作成
        doc_ref.set(summary_data)

        print(f"Firestore保存完了! [個人履歴追加] & [全体和集合更新: {doc_id}]")
        return jsonify({"status": "success"}), 200

    except Exception as e:
        print(f"サーバー内保存エラー: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/patch_summary', methods=['POST'])
def api_patch_summary():
    try:
        data = request.get_json()
        class_name = data.get('className')
        class_count = data.get('classCount')
        patch_instruction = data.get('additionalText') # 「〜の解説を追加して」「〜のタイポを修正」など

        if not class_name or not class_count or not patch_instruction:
            return jsonify({"status": "error", "message": "必要なデータが足りません"}), 400

        doc_id = f"{class_name}_{class_count}"
        
        # 1. Firestore から「現在の要約ノート」を取得
        doc_ref = db.collection("class_logs_summary").document(doc_id)
        doc_snap = doc_ref.get()

        if doc_snap.exists:
            current_summary = doc_snap.to_dict().get("summary", "")
        else:
            return jsonify({"status": "error", "message": "元の要約データが見つかりません"}), 444

        # 2. 修正・推敲専用のプロンプトを作成
        prompt = f"""
あなたは大学の講義ノートを美しく推敲・修正する優秀なアシスタントです。
提示された「現在の要約ノート」に対して、ユーザーからの「修正・追記の指示」を完全に反映した、新しい最高に見やすい要約ノートを作成してください。

【修正の指示】
ユーザーからの指示：{patch_instruction}
※この指示に基づいて、元のノートに情報を追加したり、誤りを訂正したり、構成を整えたりしてください。

【★最重要：レイアウトと視覚的階層のルール】
画面に出力する際、システム独自の表示文法（CSS）が適用されます。AIは文章の羅列（すべてが箇条書きになる状態）を絶対に避け、以下の構造を厳格に守って成形してください。

1. 大見出し（章・大きなテーマ）：
   行頭には必ず「1. 」「2. 」「3. 」のように「数字＋ドット＋半角スペース」から始めてください。
   見出しの行には解説文などを続けず、テーマ名だけにしてください。
   （例：2. ボリュームデータの表現とポリゴン化手法）

2. 通常の解説文（箇条書きにしない！）：
   各テーマの概要や説明文は、行頭に「- 」を付けず、通常の文章として記述してください。
   適切な位置で普通に改行（Enter）を入れて段落を分けてください。

3. 箇条書き「- 」の使用制限：
   行頭の「- 」は、【要素の列挙】や【メリット・デメリット・特徴】を並べる時「だけ」に使用してください。すべての行の頭に機械的に付けるのは絶対に禁止します。

4. 重要キーワード（文字拡大＋太字＋マーカー）：
   核心となる専門用語は、必ず ** と ** で挟んで出力してください。

5. 訂正・変更情報（打ち消し線）：
   古い情報や不要になった情報がある場合は、必ず ~~ と ~~ で挟んでください。

【出力形式】
前置きや挨拶は一切不要です。いきなり「1. テーマ：〜」から記述を開始してください。

--- 現在の要約ノート（修正前） ---
{current_summary}
"""

        # 3. ✨ Gemini API で修正版の要約を生成 (最新のSDKの書き方に修正)
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )
        updated_summary = response.text

        # 4. 生成された新しい要約で Firestore を上書き保存
        doc_ref.set({
            "summary": updated_summary,
            "updatedAt": datetime.now()  # いつ更新されたかタイムスタンプも残すと親切です
        }, merge=True)

        # 5. フロントエンドに成功を返す
        return jsonify({
            "status": "success",
            "summary": updated_summary
        })

    except Exception as e:
        print(f"AI修正反映エラー: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# Chromeを指定して開く関数
def open_real_chrome():
    url = "http://127.0.0.1:5000/"
    try:
        if sys.platform == "win32":
            # Windowsにおける本物Google Chromeの「標準的なインストール先」を直接指定
            chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"
            
            if os.path.exists(chrome_path):
                # パスの後ろに %s をつけるのが、Pythonのwebbrowserで直接アプリを指定する時の決まり事です
                webbrowser.get(f'"{chrome_path}" %s').open(url)
                return # 起動に成功したらここで終了
                
        elif sys.platform == "darwin":
            # Macの場合の本物のChromeの場所
            webbrowser.get('open -a "Google Chrome" %s').open(url)
            return

        # 上記の直接指定が見つからなかった場合の保険（いつもの既定ブラウザ）
        webbrowser.open(url)
        
    except Exception as e:
        print(f"ブラウザ起動エラー: {e}")
        webbrowser.open(url)

if __name__ == "__main__":
    # 0.5秒後に本物のChromeを開く
    threading.Timer(0.5, open_real_chrome).start()
    
    # 2重起動を防ぐためデバッグはオフ
    app.run(debug=False)
    