import speech_recognition as sr
import threading # 追加: スレッドを使用するためのインポート
from flask import Flask, render_template, request, redirect, url_for,jsonify
from datetime import datetime
from google import genai
import os
from dotenv import load_dotenv

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

# 実行


def listen_for_keyword():
    
    r = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("静聴中")
        r.adjust_for_ambient_noise(source)
        pre_st = "直前の文字列"
        while True:
            try:
                now = datetime.now()
                nowstr = now.strftime("%Y-%m-%d %H:%M:%S")
                audio = r.listen(source)
                text = r.recognize_google(audio, language="ja-JP")
                print(f"認識されたテキスト: {text}")
                alllogs.append({
                    "timestamp": nowstr,
                    "text": text
                })
                if active:
                    display_logs.append({
                        "timestamp": nowstr,
                        "text": text
                    })
                    continue
            
                for word in keywords:
                    if word in text:
                        print(f"キーワード '{word}' が検出されました: {text}")
                        if pre_st != "直前の文字列":
                            display_logs.append({
                                "timestamp": nowstr,
                                "text": pre_st
                            })
                        display_logs.append({
                            "timestamp": nowstr,
                            "text": text
                        })
                        activate_for_10_seconds()
                        break
                pre_st = text
                
                
                    
            except sr.UnknownValueError:
                print("音声を認識できませんでした")
            except sr.RequestError as e:
                print(f"APIエラー: {e}")
                continue

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
    

@app.route('/api/youyaku')
def get_summary():
    
    summary = call_gemini_api(alllogs)
    return jsonify({"summary": summary})

if __name__ == "__main__":
    listen_thread = threading.Thread(target=listen_for_keyword, daemon=True)
    listen_thread.start()
    app.run(debug=True, use_reloader=False)
    