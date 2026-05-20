from google import genai


client = genai.Client(api_key="")
#まちがえてgithubにあげちゃったので、キーは無効化しました。本当に焦った。

# print("--- あなたのキーで利用可能なモデル一覧 ---")
# try:
#     # モデルの一覧を取得
#     for model in client.models.list():
#         # オブジェクトの中身を辞書形式で表示
#         # これなら属性名が何であっても中身が見えます
#         print(f"Name: {model.name}")
#         print(f"Display Name: {model.display_name}")
#         print("-" * 40)
# except Exception as e:
#     print(f"エラーが発生しました: {e}")
    
try:
    
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents="以下の内容を要約してください : 本記事の内容をマスターできれば、水色コーダーになれると思います。水色コーダーといったら、AtCoder の上位 1 割ですので、十分中級者を名乗って良いと思います。ちなみに水色コーダーになると、半数以上の企業においてアルゴリズム構築能力がカンストします。",
    )
    
    print("-" * 30)
    print("AIからの回答:", response.text)
    print("-" * 30)

except Exception as e:
    print(f"エラーが発生しました: {e}")