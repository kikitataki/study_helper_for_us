import webbrowser
from flask import Flask, render_template, request, redirect, url_for,jsonify
from datetime import datetime
from google import genai
import os
from dotenv import load_dotenv
import threading
import webbrowser
import sys

load_dotenv()

app = Flask(__name__)

keywords = {"授業中", "課題", "テスト", "レポート", "終了", "提出", "締め切り", "教授", "成績", "単位","大事"}
alllogs = []
display_logs = []

active = False
client = genai.Client(api_key= os.getenv("GEMINI_API_KEY"))


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


@app.route("/")
def index():
    return render_template("display.html", logs=display_logs, keywords=keywords)

@app.route("/alllog.html")
def alllog():
    return render_template("alllog.html", logs=alllogs)

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

@app.route('/api/logs')
def get_logs_json():
    return jsonify(alllogs) 

@app.route('/api/important_logs')
def get_important_logs_json():
    return jsonify(display_logs)
# Python（Flask）側の処理イメージ


def prepare_text_for_gemini(alllogs):
    # 1. JSON（辞書のリスト）からテキスト部分だけを抽出して合体させる
    # のデータ構造（timestamp, text）を想定
    combined_text = ""
    for log in alllogs:
        combined_text += f"[{log['timestamp']}] {log['text']}\n"
    return combined_text

def call_gemini_api(alllogs):
    #合体させた文章を作成
    target_text = prepare_text_for_gemini(alllogs)

    # Geminiへの命令（プロンプト）
    prompt = f"""
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
    # ここで Gemini SDK を使って送信
    # response = model.generate_content(prompt)
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



@app.route('/api/youyaku')
def get_summary():
    
    summary = call_gemini_api(alllogs)
    return jsonify({"summary": summary})



# 💡 Chromeを指定して開く関数
def open_real_chrome():
    url = "http://127.0.0.1:5000/"
    try:
        if sys.platform == "win32":
            # 💡 Windowsにおける本物Google Chromeの「標準的なインストール先」を直接指定
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
    