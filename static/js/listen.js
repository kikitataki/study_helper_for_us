"use strict";
console.log("てすと。tsファイルの読み込みができてるかどうか");
const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognitionClass) {
    console.error("ブラウザをクロームにしてるか確認");
}
else {
    const recognition = new SpeechRecognitionClass();
    //初期設定
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';
    //ここがマイク起動したときのイベント
    recognition.onstart = () => {
        console.log("音声認識中");
    };
    recognition.onerror = (event) => {
        console.error("エラーふざけんな", event.error);
    };
    //音声を認識したときの処理
    recognition.onresult = (event) => {
        let script = '';
        //[][0]は、最初の認識結果の最も信頼度の高い候補を指す。めっちゃ面白い
        //新しい分の中での戦闘インデックスがresultIndexから始まる。
        for (let i = event.resultIndex; i < event.results.length; i++) {
            console.log("認識結果", event.results[i][0].transcript);
            if (event.results[i].isFinal) {
                const finalText = event.results[i][0].transcript;
                if (finalText.trim()) {
                    script += finalText;
                    console.log("Pythonに送信します:", script);
                    fetch('/send_voice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: script
                    })
                        .then(response => {
                        if (response.ok)
                            console.log("文字列の送信に成功！");
                    })
                        .catch(error => {
                        console.error("エラー:", error);
                    });
                }
            }
        }
    };
    //音声認識が終了（切断）したときの処理
    recognition.onend = () => {
        console.log("音声認識が終了しました。1秒後再起動したい");
        // 💡 1秒（1000ミリ秒）待ってから再起動することで、ブラウザがフリーズする無限ループを防ぎます
        setTimeout(() => {
            try {
                recognition.start();
            }
            catch (e) {
                // すでに起動している場合などの二重起動エラーは安全に無視します
                console.log("再起動できてるやんけ");
            }
        }, 1000);
    };
    console.log("音声認識yes");
    recognition.start();
}
