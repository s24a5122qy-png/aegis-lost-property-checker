/* ==========================================================================
   A.E.G.I.S. - APPLICATION ENGINE & LOGIC (JS) - VERSION 1.2.0
   ========================================================================== */

// --- AIコア人格とセリフの辞書定義 ---
const AI_CORES = {
    "AEGIS": {
        name: "A.E.G.I.S. (Standard)",
        pitch: 1.0,
        rate: 1.1,
        voiceGender: "female",
        phrases: {
            boot: "イージスシステム起動。装備スキャンを開始します。",
            mission: "ミッション、{name}、をロードしました。",
            complete: "スキャン完了。すべての装備が確保されました。いってらっしゃいませ、エージェント。",
            warning: "警告。出発予定時刻まで間もなくです。準備を確認してください。",
            camera_scan: "光学スキャンを開始。物体を分析しています。",
            camera_success: "スキャン完了。新たに {count} 個の装備を検知、確保しました。",
            timer_set: "出発時刻を {time} に設定。残り時間、約 {minutes} 分です。"
        }
    },
    "KRONOS": {
        name: "K.R.O.N.O.S. (Military)",
        pitch: 0.7,
        rate: 0.95,
        voiceGender: "male",
        phrases: {
            boot: "クロノス、起動完了。直ちに装備スキャンを実行せよ。",
            mission: "作戦指令、{name}、を受領。チェックリストをロードする。",
            complete: "全装備の確保完了を確認。直ちに出撃せよ、エージェント。",
            warning: "警告！出発限界時刻まで残りわずか！作戦準備を直ちに完了させよ。遅れることは許されない！",
            camera_scan: "光学レーダースキャン作動。不審物を検出する。",
            camera_success: "ターゲットロック完了。装備 {count} ユニットを確保した。",
            timer_set: "出発時刻を {time} にロック。残り {minutes} 分。遅刻は許されない。"
        }
    },
    "LUNA": {
        name: "L.U.N.A. (Support)",
        pitch: 1.3,
        rate: 1.15,
        voiceGender: "female",
        phrases: {
            boot: "ルナだよ！準備はいい？一緒に忘れ物チェックしよー！",
            mission: "今日の予定は {name} だね！りょーかい！",
            complete: "準備おっけー！忘れ物はないみたい。今日も楽しんできてね！",
            warning: "大変大変！もうすぐ出発の時間だよ！忘れ物はない？急ごう！",
            camera_scan: "カメラでスキャン中だよー！何があるかな？",
            camera_success: "じゃじゃーん！一気に {count} 個も見つけちゃった！",
            timer_set: "出発時間は {time} だね！あと {minutes} 分だよ！がんばろー！"
        }
    }
};

// --- 定数と初期データ定義 ---
const INITIAL_MISSIONS = {
    "DAILY_WORK": [
        { id: "dw-1", name: "スマートフォン", category: "DEVICE", priority: "CRITICAL", checked: false },
        { id: "dw-2", name: "財布 (現金/カード)", category: "CREDENTIAL", priority: "CRITICAL", checked: false },
        { id: "dw-3", name: "自宅の鍵 / キーケース", category: "CREDENTIAL", priority: "CRITICAL", checked: false },
        { id: "dw-4", name: "交通系ICカード / 定期券", category: "CREDENTIAL", priority: "STANDARD", checked: false },
        { id: "dw-5", name: "ワイヤレスイヤホン", category: "DEVICE", priority: "STANDARD", checked: false },
        { id: "dw-6", name: "ハンカチ / ティッシュ", category: "NECESSITY", priority: "STANDARD", checked: false }
    ],
    "BUSINESS_TRIP": [
        { id: "bt-1", name: "ノートPC & 充電ケーブル", category: "DEVICE", priority: "CRITICAL", checked: false },
        { id: "bt-2", name: "スマートフォン & モバイルバッテリー", category: "DEVICE", priority: "CRITICAL", checked: false },
        { id: "bt-3", name: "財布 & クレジットカード", category: "CREDENTIAL", priority: "CRITICAL", checked: false },
        { id: "bt-4", name: "社員証 / IDカード", category: "CREDENTIAL", priority: "CRITICAL", checked: false },
        { id: "bt-5", name: "名刺入れ (十分な枚数)", category: "CREDENTIAL", priority: "STANDARD", checked: false },
        { id: "bt-6", name: "筆記用具 / メモ帳", category: "NECESSITY", priority: "STANDARD", checked: false },
        { id: "bt-7", name: "折りたたみ傘", category: "NECESSITY", priority: "OPTIONAL", checked: false }
    ],
    "HOLIDAY_TRAVEL": [
        { id: "ht-1", name: "スマートフォン & 充電器", category: "DEVICE", priority: "CRITICAL", checked: false },
        { id: "ht-2", name: "財布 / 身分証明書", category: "CREDENTIAL", priority: "CRITICAL", checked: false },
        { id: "ht-3", name: "衣類 & 下着 (宿泊数分)", category: "NECESSITY", priority: "CRITICAL", checked: false },
        { id: "ht-4", name: "モバイルバッテリー", category: "DEVICE", priority: "STANDARD", checked: false },
        { id: "ht-5", name: "常備薬 / スキンケア用品", category: "NECESSITY", priority: "STANDARD", checked: false },
        { id: "ht-6", name: "カメラ", category: "DEVICE", priority: "OPTIONAL", checked: false },
        { id: "ht-7", name: "ガイドブック / 旅行日程表", category: "OTHER", priority: "OPTIONAL", checked: false }
    ]
};

// SVG円周の長さ (2 * PI * r) -> r=85 なので 約534
const CIRCLE_CIRCUMFERENCE = 534;

// --- アプリケーション状態 ---
let missions = {};
let activeMissionKey = "";
let audioCtx = null;
let currentWeather = "SUNNY";
const WEATHER_ITEM_ID = "weather-umbrella";

// AIコア & 音声モデル
let currentAICore = "AEGIS";
let selectedVoice = null;
let voicesList = [];

// 出発タイマー
let departureTime = null;
let timerInterval = null;
let redAlertActive = false;
let alarmOsc = null;
let alarmInterval = null;

// カメラ
let cameraStream = null;

// --- DOM要素の取得 ---
const timeEl = document.getElementById("current-time");
const systemStatusEl = document.getElementById("system-status");
const missionSelectEl = document.getElementById("mission-select");
const btnAddMissionEl = document.getElementById("btn-add-mission");
const btnResetMissionEl = document.getElementById("btn-reset-mission");
const btnDeleteMissionEl = document.getElementById("btn-delete-mission");
const btnCheckAllEl = document.getElementById("btn-check-all");
const gearListContainerEl = document.getElementById("gear-list-container");
const addGearFormEl = document.getElementById("add-gear-form");
const gearNameInputEl = document.getElementById("gear-name");
const gearCategorySelectEl = document.getElementById("gear-category");
const gearPrioritySelectEl = document.getElementById("gear-priority");
const gearHintInputEl = document.getElementById("gear-hint");
const toggleSoundEl = document.getElementById("toggle-sound");
const toggleVoiceEl = document.getElementById("toggle-voice");
const logConsoleEl = document.getElementById("log-console");
const shieldOverlayEl = document.getElementById("shield-overlay");

// 進捗表示
const progressBarEl = document.getElementById("progress-bar");
const scanPercentageEl = document.getElementById("scan-percentage");
const scanStatusTextEl = document.getElementById("scan-status-text");
const totalCountEl = document.getElementById("total-count");
const securedCountEl = document.getElementById("secured-count");
const missingCountEl = document.getElementById("missing-count");

// モーダル
const missionModalEl = document.getElementById("mission-modal");
const btnModalCancelEl = document.getElementById("btn-modal-cancel");
const btnModalSubmitEl = document.getElementById("btn-modal-submit");
const newMissionNameInputEl = document.getElementById("new-mission-name");

// ==========================================================================
// 1. システム起動 & 初期化
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initClock();
    loadData();
    populateMissionSelector();
    applyWeatherEffects();
    renderActiveMission();
    
    // イベントリスナー登録
    missionSelectEl.addEventListener("change", handleMissionChange);
    btnAddMissionEl.addEventListener("click", showMissionModal);
    btnResetMissionEl.addEventListener("click", resetMissionsToDefault);
    btnDeleteMissionEl.addEventListener("click", deleteActiveMission);
    btnCheckAllEl.addEventListener("click", secureAllGear);
    addGearFormEl.addEventListener("submit", handleAddGear);
    
    btnModalCancelEl.addEventListener("click", hideMissionModal);
    btnModalSubmitEl.addEventListener("click", handleCreateMission);
    
    // 日本語音声エンジンのスキャン
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
            loadVoiceModels();
        };
        // 一部のブラウザ対策で初回に即読み込み
        loadVoiceModels();
    }
    
    // 初回インタラクション時にAudioContextを初期化するためのトリガー
    document.body.addEventListener("click", initAudioContext, { once: true });
    
    addLog("[SYSTEM] A.E.G.S. V1.2.0 Boot sequence completed. Click to activate audio.");
});

// 時計の更新
function initClock() {
    function updateClock() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        timeEl.textContent = `${hrs}:${mins}:${secs}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// データのロード (Local Storage または 初期データ)
function loadData() {
    const savedMissions = localStorage.getItem("aegis_missions");
    const savedActive = localStorage.getItem("aegis_active_mission");
    
    if (savedMissions) {
        missions = JSON.parse(savedMissions);
    } else {
        missions = JSON.parse(JSON.stringify(INITIAL_MISSIONS)); // ディープコピー
        saveData();
    }
    
    if (savedActive && missions[savedActive]) {
        activeMissionKey = savedActive;
    } else {
        activeMissionKey = Object.keys(missions)[0] || "";
    }
}

// データの保存
function saveData() {
    localStorage.setItem("aegis_missions", JSON.stringify(missions));
    localStorage.setItem("aegis_active_mission", activeMissionKey);
}

// システムログ出力
function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logDiv = document.createElement("div");
    logDiv.textContent = `[${timestamp}] ${message}`;
    logConsoleEl.appendChild(logDiv);
    logConsoleEl.scrollTop = logConsoleEl.scrollHeight;
}

// ==========================================================================
// 2. Web Audio / Speech API 音響・音声制御
// ==========================================================================

// 音響コンテキストの初期化 (セキュリティ制限解除用)
function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        addLog("[AUDIO] Audio feedback systems online.");
        
        // 最初のインタラクションで歓迎音と音声合成を実行
        setTimeout(() => {
            playStartSound();
            speakVoice("boot");
        }, 150.0);
    }
}

// サウンドの再生設定を確認
function isSoundEnabled() {
    return toggleSoundEl.checked && audioCtx;
}

// 音声アシスタントの設定を確認
function isVoiceEnabled() {
    return toggleVoiceEl.checked;
}

// 1. システム起動時のSF音
function playStartSound() {
    if (!isSoundEnabled()) return;
    
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.35);
    
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.4);
    osc2.stop(audioCtx.currentTime + 0.4);
}

// 2. ボタンクリック等の基本効果音
function playClickSound() {
    if (!isSoundEnabled()) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.03);
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

// 3. アイテムチェック/チェック解除時の音
function playCheckSound(secured) {
    if (!isSoundEnabled()) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (secured) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(250, audioCtx.currentTime + 0.06);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    }
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

// 4. すべてチェック完了したときのファンファーレ
function playSuccessSound() {
    if (!isSoundEnabled()) return;
    
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (index * 0.08));
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + (index * 0.08) + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.08) + 0.35);
        
        osc.start();
        osc.stop(now + (index * 0.08) + 0.4);
    });
}

// 5. シャッター音
function playShutterSound() {
    if (!isSoundEnabled()) return;
    
    const now = audioCtx.currentTime;
    
    // ノイズバッファの生成
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    // サイン波ビープ
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    oscGain.gain.setValueAtTime(0.1, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    noiseNode.start(now);
    osc.start(now);
    osc.stop(now + 0.08);
}

// 6. アラームサイレン
function playAlarmSound() {
    if (!isSoundEnabled() || alarmOsc) return;
    
    alarmOsc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    alarmOsc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    alarmOsc.type = 'sine';
    alarmOsc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    
    let high = true;
    alarmInterval = setInterval(() => {
        if (!audioCtx || !alarmOsc) return;
        const targetFreq = high ? 800 : 600;
        alarmOsc.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.35);
        high = !high;
    }, 400);
    
    alarmOsc.start();
}

function stopAlarmSound() {
    if (alarmOsc) {
        try {
            alarmOsc.stop();
        } catch(e) {}
        alarmOsc = null;
    }
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
}

// 音声読み上げ（AIコアごとのセリフ・トーン）
function speakVoice(textKey, variables = {}) {
    if (!isVoiceEnabled()) return;
    
    window.speechSynthesis.cancel();
    
    const core = AI_CORES[currentAICore];
    let phrase = core.phrases[textKey] || textKey;
    
    // 変数の置換
    Object.keys(variables).forEach(key => {
        phrase = phrase.replace(`{${key}}`, variables[key]);
    });
    
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "ja-JP";
    utterance.pitch = core.pitch;
    utterance.rate = core.rate;
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

// ==========================================================================
// 3. AIコア & 音声モデルの切り替え処理
// ==========================================================================

// 利用可能な音声モデルをスキャン
function loadVoiceModels() {
    voicesList = window.speechSynthesis.getVoices();
    const select = document.getElementById("select-voice-model");
    if (!select) return;
    
    select.innerHTML = '<option value="default">System Default</option>';
    
    // 日本語の音声を抽出
    const jaVoices = voicesList.filter(v => v.lang.startsWith("ja"));
    
    jaVoices.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = v.name;
        select.appendChild(opt);
    });
    
    autoSelectVoiceForCore();
}

// 人格に応じて適した音声を自動選択
function autoSelectVoiceForCore() {
    const core = AI_CORES[currentAICore];
    const jaVoices = voicesList.filter(v => v.lang.startsWith("ja"));
    if (jaVoices.length === 0) return;
    
    let targetVoice = null;
    
    if (core.voiceGender === "male") {
        targetVoice = jaVoices.find(v => v.name.toLowerCase().includes("ichiro") || v.name.toLowerCase().includes("male")) || null;
    } else {
        targetVoice = jaVoices.find(v => v.name.toLowerCase().includes("ayumi") || v.name.toLowerCase().includes("haruka") || v.name.toLowerCase().includes("female")) || null;
    }
    
    if (!targetVoice && jaVoices.length > 0) {
        targetVoice = jaVoices[0];
    }
    
    if (targetVoice) {
        selectedVoice = targetVoice;
        const select = document.getElementById("select-voice-model");
        if (select) select.value = targetVoice.name;
    }
}

// AIコア（人格）の変更
window.changeAICore = function() {
    playClickSound();
    const select = document.getElementById("select-ai-core");
    if (!select) return;
    
    currentAICore = select.value;
    
    // ボディクラスを変更してCSSテーマ色を連動
    document.body.className = `ai-core-${currentAICore.toLowerCase()}`;
    if (redAlertActive) {
        document.body.classList.add("red-alert-active");
    }
    
    // 適した音声を自動再設定
    autoSelectVoiceForCore();
    
    addLog(`[SYSTEM] AIコア人格を [${AI_CORES[currentAICore].name}] に変更しました。`);
    speakVoice("boot");
};

// ボイスモデルの手動変更
window.changeVoiceModel = function() {
    playClickSound();
    const select = document.getElementById("select-voice-model");
    if (!select) return;
    
    if (select.value === "default") {
        selectedVoice = null;
        addLog(`[SYSTEM] 音声モデルをシステムデフォルトに設定しました。`);
    } else {
        const found = voicesList.find(v => v.name === select.value);
        if (found) {
            selectedVoice = found;
            addLog(`[SYSTEM] 音声モデルを [${found.name}] に設定しました。`);
            speakVoice("スキャンシステムオンライン。ボイス設定変更を確認。");
        }
    }
};

// ==========================================================================
// 4. 追加機能: 天気管理ロジック
// ==========================================================================

// 天気の変更
window.setWeather = function(weather) {
    if (currentWeather === weather) return;
    playClickSound();
    
    currentWeather = weather;
    
    // ボタンのactive表示切り替え
    const buttons = document.querySelectorAll(".weather-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    
    const activeBtn = document.getElementById(`btn-weather-${weather.toLowerCase()}`);
    if (activeBtn) activeBtn.classList.add("active");
    
    addLog(`[WEATHER] 天候センサーが [${weather}] に変更されました。`);
    
    applyWeatherEffects();
    renderActiveMission();
};

// 天気エフェクトを適用（雨具の自動追加・削除）
function applyWeatherEffects() {
    const list = missions[activeMissionKey];
    if (!list) return;
    
    const hasUmbrella = list.some(item => item.id === WEATHER_ITEM_ID);
    
    if (currentWeather === "RAINY") {
        if (!hasUmbrella) {
            const weatherUmbrella = {
                id: WEATHER_ITEM_ID,
                name: "雨具 (RAIN SHIELD)",
                category: "NECESSITY",
                priority: "CRITICAL",
                checked: false,
                isWeatherItem: true,
                hint: "外は雨です。傘やフードをお忘れなく。"
            };
            list.unshift(weatherUmbrella);
            addLog(`[WEATHER] 降水を検知。雨具 [RAIN SHIELD] をリストに追加。`);
            speakVoice("警告。降水反応を検知。レインシールドを装備リストに追加しました。");
        }
    } else {
        if (hasUmbrella) {
            const index = list.findIndex(item => item.id === WEATHER_ITEM_ID);
            if (index > -1) {
                list.splice(index, 1);
                addLog(`[WEATHER] 降水反応が消失。雨具を回収しました。`);
            }
        }
    }
}

// ==========================================================================
// 5. 追加機能: 出発カウントダウンタイマー
// ==========================================================================

window.setupTimer = function() {
    const input = document.getElementById("departure-time-input");
    if (!input || !input.value) return;
    
    playClickSound();
    stopAlarmSound();
    if (timerInterval) clearInterval(timerInterval);
    
    const [hrs, mins] = input.value.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hrs, mins, 0, 0);
    
    if (target < now) {
        target.setDate(target.getDate() + 1);
    }
    
    departureTime = target;
    redAlertActive = false;
    document.body.classList.remove("red-alert-active");
    
    const display = document.getElementById("countdown-display");
    if (display) {
        display.className = "timer-value countdown-active";
    }
    
    const status = document.getElementById("timer-alert-status");
    if (status) {
        status.textContent = "COUNTING";
        status.className = "status-normal";
    }
    
    const minutesLeft = Math.round((target - now) / 60000);
    addLog(`[TIMER] 出発時刻を [${input.value}] に設定。残り時間: 約 ${minutesLeft} 分。`);
    speakVoice("timer_set", { time: input.value, minutes: minutesLeft });
    
    timerInterval = setInterval(updateTimer, 33);
};

window.abortTimer = function() {
    playClickSound();
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    departureTime = null;
    redAlertActive = false;
    stopAlarmSound();
    
    document.body.classList.remove("red-alert-active");
    
    const display = document.getElementById("countdown-display");
    if (display) {
        display.textContent = "00:00:00.000";
        display.className = "timer-value countdown-inactive";
    }
    
    const status = document.getElementById("timer-alert-status");
    if (status) {
        status.textContent = "INACTIVE";
        status.className = "status-normal";
    }
    
    addLog(`[TIMER] タイマーを強制解除しました。`);
};

function updateTimer() {
    if (!departureTime) return;
    
    const now = new Date();
    const diff = departureTime - now;
    
    const display = document.getElementById("countdown-display");
    const status = document.getElementById("timer-alert-status");
    
    if (diff <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        departureTime = null;
        stopAlarmSound();
        
        if (display) display.textContent = "00:00:00.000";
        if (status) {
            status.textContent = "TIME UP";
            status.className = "status-alert";
        }
        
        addLog(`[TIMER] 出発予定時刻に到達。タイムアップ。`);
        speakVoice("warning");
        return;
    }
    
    const ms = String(diff % 1000).padStart(3, '0');
    const totalSecs = Math.floor(diff / 1000);
    const secs = String(totalSecs % 60).padStart(2, '0');
    const totalMins = Math.floor(totalSecs / 60);
    const mins = String(totalMins % 60).padStart(2, '0');
    const hrs = String(Math.floor(totalMins / 60)).padStart(2, '0');
    
    if (display) {
        display.textContent = `${hrs}:${mins}:${secs}.${ms}`;
    }
    
    // RED ALERT (残り60秒未満)
    if (diff < 60000 && !redAlertActive) {
        redAlertActive = true;
        document.body.classList.add("red-alert-active");
        if (status) {
            status.textContent = "RED ALERT";
            status.className = "status-alert";
        }
        addLog(`[TIMER] 緊急警告: 出発予定まで残り60秒以下。`);
        speakVoice("warning");
        playAlarmSound();
    }
}

// ==========================================================================
// 6. 追加機能: カメラHUDスキャナー
// ==========================================================================

window.openCameraScanner = function() {
    playClickSound();
    const modal = document.getElementById("camera-modal");
    if (!modal) return;
    
    modal.classList.remove("hidden");
    const video = document.getElementById("camera-stream");
    
    const log = document.getElementById("scan-results-log");
    if (log) log.innerHTML = '<div class="analysis-status">[SYS] INITIALIZING OPTICAL RECOGNITION...</div>';
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            cameraStream = stream;
            if (video) video.srcObject = stream;
            addLog(`[CAMERA] HUDスキャナー光学モジュール起動。`);
            speakVoice("camera_scan");
        })
        .catch(err => {
            addLog(`[CAMERA] 起動エラー: ${err}`);
            alert("カメラを起動できませんでした。パーミッション許可を確認してください。");
            closeCameraScanner();
        });
    } else {
        alert("非対応ブラウザです。");
        closeCameraScanner();
    }
};

window.closeCameraScanner = function() {
    playClickSound();
    const modal = document.getElementById("camera-modal");
    if (modal) modal.classList.add("hidden");
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    const video = document.getElementById("camera-stream");
    if (video) video.srcObject = null;
    
    addLog(`[CAMERA] HUDスキャナーをシャットダウン。`);
};

window.triggerOpticalScan = function() {
    playShutterSound();
    
    const flash = document.getElementById("camera-flash");
    if (flash) {
        flash.classList.add("active");
        setTimeout(() => flash.classList.remove("active"), 400);
    }
    
    const log = document.getElementById("scan-results-log");
    const status = document.getElementById("hud-status");
    if (status) status.textContent = "STATE: ANALYZING";
    
    const steps = [
        { text: "[SYS] DUMPING FRAME DATA...", delay: 200 },
        { text: "[SYS] DECOMPRESSING OPTICAL MATRIX...", delay: 400 },
        { text: "[SYS] RUNNING SHAPE DETECTION (YOLO_V8)...", delay: 700 },
        { text: "[SYS] RUNNING MATERIAL IDENTIFICATION...", delay: 1000 },
        { text: "[SYS] COMPARING WITH MISSON CHECKLIST...", delay: 1300 }
    ];
    
    steps.forEach(step => {
        setTimeout(() => {
            if (!cameraStream) return;
            const div = document.createElement("div");
            div.textContent = step.text;
            if (log) {
                log.appendChild(div);
                log.scrollTop = log.scrollHeight;
            }
        }, step.delay);
    });
    
    setTimeout(() => {
        if (!cameraStream) return;
        
        const list = missions[activeMissionKey];
        if (!list || list.length === 0) {
            const div = document.createElement("div");
            div.textContent = "[RESULT] NO ITEM ACTIVE IN MISSION.";
            if (log) log.appendChild(div);
            return;
        }
        
        const unchecked = list.filter(item => !item.checked);
        if (unchecked.length === 0) {
            const div = document.createElement("div");
            div.textContent = "[RESULT] ALL GEAR ALREADY SECURED.";
            if (log) {
                log.appendChild(div);
                log.scrollTop = log.scrollHeight;
            }
            if (status) status.textContent = "STATE: STANDBY";
            return;
        }
        
        const countToSecure = Math.min(unchecked.length, Math.floor(Math.random() * 2) + 1);
        const shuffled = [...unchecked].sort(() => 0.5 - Math.random());
        const selectedToSecure = shuffled.slice(0, countToSecure);
        
        selectedToSecure.forEach(item => {
            item.checked = true;
            const div = document.createElement("div");
            div.className = "log-item-match";
            div.textContent = `[MATCH] DETECTED: ${item.name} (CONFIDENCE: ${(92 + Math.random() * 7).toFixed(1)}%) -> SECURED`;
            if (log) {
                log.appendChild(div);
                log.scrollTop = log.scrollHeight;
            }
            addLog(`[CAMERA] スキャン判定: 装備: ${item.name} を自動確保。`);
        });
        
        saveData();
        renderActiveMission();
        
        if (status) status.textContent = "STATE: COMPLETE";
        speakVoice("camera_success", { count: countToSecure });
        
        // 全確保判定
        const allSecured = list.every(i => i.checked);
        if (allSecured) {
            setTimeout(() => {
                closeCameraScanner();
                triggerFullCompletion();
            }, 1500);
        }
    }, 1800);
};

// ==========================================================================
// 7. UIレンダリング & 基本イベント制御
// ==========================================================================

// ミッション選択ドロップダウンの更新
function populateMissionSelector() {
    missionSelectEl.innerHTML = "";
    
    Object.keys(missions).forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = getFriendlyMissionName(key);
        if (key === activeMissionKey) {
            option.selected = true;
        }
        missionSelectEl.appendChild(option);
    });
}

function getFriendlyMissionName(key) {
    const formatted = key.replace(/_/g, " ");
    return `MISSION: [ ${formatted} ]`;
}

// アクティブなミッションとそのアイテムリストを描画
function renderActiveMission() {
    const gearList = missions[activeMissionKey];
    
    if (!gearList || gearList.length === 0) {
        gearListContainerEl.innerHTML = `
            <div class="empty-state">
                <p>GEAR LIST IS EMPTY.</p>
                <p>下のフォームから装備をデプロイしてください。</p>
            </div>
        `;
        updateScanConsole(0, 0, 0);
        return;
    }
    
    const categories = {
        "DEVICE": [],
        "CREDENTIAL": [],
        "NECESSITY": [],
        "OTHER": []
    };
    
    gearList.forEach(item => {
        if (categories[item.category]) {
            categories[item.category].push(item);
        } else {
            categories["OTHER"].push(item);
        }
    });
    
    let html = "";
    let totalItems = gearList.length;
    let securedItems = 0;
    
    Object.keys(categories).forEach(cat => {
        const items = categories[cat];
        if (items.length === 0) return;
        
        html += `
            <div class="category-group" data-category="${cat}">
                <div class="category-title">
                    <span>${cat}</span>
                    <span>${items.length} UNITS</span>
                </div>
                <div class="gear-items-list">
        `;
        
        items.forEach(item => {
            if (item.checked) securedItems++;
            
            const isChecked = item.checked ? "checked" : "";
            const isSecuredClass = item.checked ? "secured" : "";
            const statusText = item.checked ? "SECURED" : "MISSING";
            const statusClass = item.checked ? "secured" : "missing";
            
            let badgeHtml = `<span class="badge badge-${item.priority.toLowerCase()}">${item.priority}</span>`;
            if (item.isWeatherItem) {
                badgeHtml = `<span class="badge badge-weather">WEATHER DETECTED</span>`;
            }
            
            const hintHtml = item.hint ? `<span class="gear-hint-text">${escapeHTML(item.hint)}</span>` : "";
            
            html += `
                <div class="gear-item ${isSecuredClass}" data-id="${item.id}">
                    <div class="gear-item-left">
                        <label class="checkbox-container">
                            <input type="checkbox" ${isChecked} onchange="toggleGearCheck('${item.id}', this.checked)">
                            <span class="checkmark"></span>
                        </label>
                        <div class="gear-label">
                            <span class="gear-name-text">${escapeHTML(item.name)}</span>
                            ${hintHtml}
                            <div class="gear-meta" style="margin-top: 4px;">
                                ${badgeHtml}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span class="gear-status-tag ${statusClass}">${statusText}</span>
                        ${item.isWeatherItem ? '' : `<button class="btn-delete-gear" onclick="deleteGearItem('${item.id}')" title="削除">✖</button>`}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    gearListContainerEl.innerHTML = html;
    
    const missingItems = totalItems - securedItems;
    updateScanConsole(totalItems, securedItems, missingItems);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function updateScanConsole(total, secured, missing) {
    totalCountEl.textContent = total;
    securedCountEl.textContent = secured;
    missingCountEl.textContent = missing;
    
    const percentage = total === 0 ? 0 : Math.round((secured / total) * 100);
    scanPercentageEl.textContent = `${percentage}%`;
    
    const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100) * CIRCLE_CIRCUMFERENCE;
    progressBarEl.style.strokeDashoffset = offset;
    
    if (total === 0) {
        scanStatusTextEl.textContent = "NO DATA";
        scanStatusTextEl.className = "scan-status";
        progressBarEl.className.baseVal = "circle-progress";
        scanPercentageEl.className = "scan-percent";
        systemStatusEl.textContent = "STANDBY";
        systemStatusEl.className = "status-value warning";
    } else if (percentage === 100) {
        scanStatusTextEl.textContent = "ALL SECURED";
        scanStatusTextEl.className = "scan-status complete";
        progressBarEl.className.baseVal = "circle-progress complete";
        scanPercentageEl.className = "scan-percent complete";
        systemStatusEl.textContent = "READY - GO";
        systemStatusEl.className = "status-value active";
    } else {
        scanStatusTextEl.textContent = "SCANNING";
        scanStatusTextEl.className = "scan-status";
        progressBarEl.className.baseVal = "circle-progress";
        scanPercentageEl.className = "scan-percent";
        systemStatusEl.textContent = "CHECKING";
        systemStatusEl.className = "status-value warning";
    }
}

// ==========================================================================
// 8. データ操作イベントハンドラー
// ==========================================================================

window.toggleGearCheck = function(itemId, checked) {
    const list = missions[activeMissionKey];
    const item = list.find(i => i.id === itemId);
    
    if (item) {
        item.checked = checked;
        saveData();
        renderActiveMission();
        playCheckSound(checked);
        
        const status = checked ? "確保しました" : "解除しました";
        addLog(`[SECURE] ${item.name} を${status}`);
        
        const allSecured = list.every(i => i.checked);
        if (allSecured && checked) {
            triggerFullCompletion();
        } else {
            if (shieldOverlayEl) {
                shieldOverlayEl.classList.remove("active");
            }
        }
    }
};

function secureAllGear() {
    playClickSound();
    const list = missions[activeMissionKey];
    if (!list || list.length === 0) return;
    
    list.forEach(item => item.checked = true);
    saveData();
    renderActiveMission();
    
    addLog(`[SYSTEM] すべての装備のステータスを [SECURED] に設定。`);
    triggerFullCompletion();
}

function triggerFullCompletion() {
    // タイマーおよびアラームを停止
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    departureTime = null;
    redAlertActive = false;
    stopAlarmSound();
    
    document.body.classList.remove("red-alert-active");
    const status = document.getElementById("timer-alert-status");
    if (status) {
        status.textContent = "MISSION READY";
        status.className = "status-normal";
    }
    
    playSuccessSound();
    speakVoice("complete");
    
    document.body.classList.add("system-complete-flash");
    setTimeout(() => {
        document.body.classList.remove("system-complete-flash");
    }, 800);
    
    if (shieldOverlayEl) {
        shieldOverlayEl.classList.add("active");
        addLog(`[SHIELD] 外殻防御シールド起動。ALL SYSTEMS CLEAR.`);
    }
}

window.deleteGearItem = function(itemId) {
    playClickSound();
    const list = missions[activeMissionKey];
    const itemIndex = list.findIndex(i => i.id === itemId);
    
    if (itemIndex > -1) {
        const deletedItem = list[itemIndex];
        list.splice(itemIndex, 1);
        saveData();
        renderActiveMission();
        addLog(`[DELETE] 装備: ${deletedItem.name} を登録解除しました。`);
    }
};

function handleAddGear(e) {
    e.preventDefault();
    playClickSound();
    
    const name = gearNameInputEl.value.trim();
    const category = gearCategorySelectEl.value;
    const priority = gearPrioritySelectEl.value;
    const hint = gearHintInputEl.value.trim();
    
    if (!name) return;
    
    const newItem = {
        id: "gear-" + Date.now(),
        name: name,
        category: category,
        priority: priority,
        checked: false,
        hint: hint || ""
    };
    
    if (!missions[activeMissionKey]) {
        missions[activeMissionKey] = [];
    }
    
    missions[activeMissionKey].push(newItem);
    saveData();
    renderActiveMission();
    
    addLog(`[DEPLOY] 新規装備: ${name} [${priority}] を追加登録。`);
    gearNameInputEl.value = "";
    gearHintInputEl.value = "";
    gearNameInputEl.focus();
}

function handleMissionChange() {
    playClickSound();
    activeMissionKey = missionSelectEl.value;
    
    applyWeatherEffects();
    saveData();
    renderActiveMission();
    
    addLog(`[MISSION] アクティブミッションを [${activeMissionKey}] に変更しました。`);
    speakVoice("mission", { name: activeMissionKey.replace(/_/g, " ") });
}

function resetMissionsToDefault() {
    playClickSound();
    if (confirm("全ミッションのデータを初期プリセットに戻しますか？")) {
        missions = JSON.parse(JSON.stringify(INITIAL_MISSIONS));
        activeMissionKey = Object.keys(missions)[0] || "";
        saveData();
        populateMissionSelector();
        renderActiveMission();
        addLog("[SYSTEM] データベースを初期リセットしました。");
        speakVoice("データベースを初期化しました。");
    }
}

function deleteActiveMission() {
    playClickSound();
    if (confirm(`ミッション "${activeMissionKey}" を消去しますか？`)) {
        delete missions[activeMissionKey];
        activeMissionKey = Object.keys(missions)[0] || "";
        saveData();
        populateMissionSelector();
        renderActiveMission();
        addLog(`[SYSTEM] ミッションを消去しました。`);
    }
}

// ==========================================================================
// 9. 新規ミッション追加モーダル
// ==========================================================================

function showMissionModal() {
    playClickSound();
    missionModalEl.classList.remove("hidden");
    newMissionNameInputEl.value = "";
    newMissionNameInputEl.focus();
}

function hideMissionModal() {
    playClickSound();
    missionModalEl.classList.add("hidden");
}

function handleCreateMission() {
    let nameInput = newMissionNameInputEl.value.trim();
    if (!nameInput) return;
    
    const keyName = nameInput.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    
    if (missions[keyName]) {
        alert("同名のミッションキーが既に存在します。");
        return;
    }
    
    missions[keyName] = [];
    activeMissionKey = keyName;
    
    saveData();
    populateMissionSelector();
    renderActiveMission();
    hideMissionModal();
    
    addLog(`[MISSION] 新規ミッション: [${keyName}] を作成。`);
    speakVoice("mission", { name: keyName.replace(/_/g, " ") });
}
