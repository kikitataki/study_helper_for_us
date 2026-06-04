console.log("てすと。tsファイルの読み込みができてるかどうか");

const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

if (!SpeechRecognitionClass) {
    console.error("ブラウザをクロームにしてるか確認");
} else {
    const recognition = new SpeechRecognitionClass();
    //初期設定
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    let canlistening = false;

    //ここがマイク起動したときのイベント
    recognition.onstart = () => {
        console.log("音声認識中");
    };

    recognition.onerror = (event: any) => {
        console.error("エラーふざけんな", event.error);
    };

    //音声を認識したときの処理
    recognition.onresult = (event: any) => {
        let script : string  = '';
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
                                if (response.ok) console.log("文字列の送信に成功！");
                            })
                            .catch(error => {
                                console.error("エラー:", error);
                            });
                        }
            }
        }

    }

    //音声認識が終了（切断）したときの処理
    recognition.onend = () => {
        if (!canlistening) {
            console.log("明示的にストップされたため、再起動はしません。");
            return;
        }
        console.log("音声認識が終了しました。1秒後再起動したい");
        
        // 💡 1秒（1000ミリ秒）待ってから再起動することで、ブラウザがフリーズする無限ループを防ぎます
        setTimeout(() => {
            try {
                recognition.start();
            } catch (e) {
                // すでに起動している場合などの二重起動エラーは安全に無視します
                console.log("再起動できてるやんけ");
            }
        }, 1000);
    }
    (window as any).toggleRecognition = function() {
        const btn = document.getElementById("toggle-recognition-btn") as HTMLButtonElement;
        
        if (!canlistening) {
            // 🛑 停止中 ➔ 🚀 開始
            canlistening = true;
            try {
                recognition.start();
                if (btn) {
                    btn.textContent = "録音を中断する";
                    btn.style.backgroundColor = "#dc3545"; // 赤色に変更
                }
            } catch (e) {
                console.error("開始エラー:", e);
            }
        } else {
            // 🚀 動作中 ➔ 🛑 停止
            canlistening = false; // 💡 先にフラグを折ることでonendの自動再起動を防ぐ
            try {
                recognition.stop();
                if (btn) {
                    btn.textContent = "録音を開始する";
                    btn.style.backgroundColor = "#28a745"; // 緑色に変更
                }
            } catch (e) {
                console.error("停止エラー:", e);
            }
        }
    };
}