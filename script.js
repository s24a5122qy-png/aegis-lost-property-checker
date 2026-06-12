/* ==========================================================================
   A.E.G.I.S. - APPLICATION ENGINE & LOGIC (JS) - VERSION 1.3.0
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
            timer_set: "出発時刻を {time} に設定。残り時間、約 {minutes} 分です。",
            geo_breach: "警告。セーフゾーンから離脱。未確保の装備があります。直ちに確認してください。",
            streak: "ストリーク、{streak} 回達成。素晴らしい規律です、エージェント。",
            streak_reset: "装備未確保での出撃を検知。ストリーク記録がリセットされました。"
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
            camera_scan: "光学スキャン作動。不審物を検出する。",
            camera_success: "ターゲットロック完了。装備 {count} ユニットを確保した。",
            timer_set: "出発時刻を {time} にロック。残り {minutes} 分。遅刻は許されない。",
            geo_breach: "警告！防衛境界線（セーフゾーン）を越えた！未確保の装備がある。ただちに引き返せ！",
            streak: "ストリーク {streak} 到達。見事な装備管理だ。引き続き軍紀を維持せよ。",
            streak_reset: "作戦失敗。装備未確保での境界越え。連続記録をリセットする。怠慢だ。"
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
            timer_set: "出発時間は {time} だね！あと {minutes} 分だよ！がんばろー！",
            geo_breach: "あっ！お家から出ちゃったみたい！まだ忘れ物があるよ、戻って戻ってー！",
            streak: "すごーい！ストリーク {streak} 回達成！忘れ物ゼロの天才だね！",
            streak_reset: "あちゃー、忘れ物があるのにお出かけしちゃった。連続記録はリセットだよー、次はがんばろ！"
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

// Geolocation (位置情報)
let homeCoords = { lat: null, lon: null };
let geoSimulated = false;
let geoBreachActive = false;
let geoAlarmOsc = null;
let geoAlarmInterval = null;
let watchId = null;

// 実績 & ストリーク
let achievements = { first: false, streak3: false, redline: false, weather: false };
let stats = { totalMissions: 0, maxStreak: 0 };
let streakCount = 0;

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
    
    // 位置情報イニシャライズ
    initGeolocation();
    
    // UIへの実績・統計のレンダリング
    renderAchievements();
    updateStatsDisplay();
    
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
        loadVoiceModels();
    }
    
    // 初回インタラクション時にAudioContextを初期化するためのトリガー
    document.body.addEventListener("click", initAudioContext, { once: true });
    
    addLog("[SYSTEM] A.E.G.I.S. V1.3.0 Boot sequence completed.");
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
    
    // 自宅緯度経度
    const savedHome = localStorage.getItem("aegis_home_coords");
    if (savedHome) {
        homeCoords = JSON.parse(savedHome);
    }
    
    // 実績・統計
    const savedAch = localStorage.getItem("aegis_achievements");
    if (savedAch) {
        achievements = JSON.parse(savedAch);
    }
    const savedStats = localStorage.getItem("aegis_stats");
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
    const savedStreak = localStorage.getItem("aegis_streak");
    if (savedStreak) {
        streakCount = parseInt(savedStreak, 10) || 0;
    }
}

// データの保存
function saveData() {
    localStorage.setItem("aegis_missions", JSON.stringify(missions));
    localStorage.setItem("aegis_active_mission", activeMissionKey);
    localStorage.setItem("aegis_home_coords", JSON.stringify(homeCoords));
    localStorage.setItem("aegis_achievements", JSON.stringify(achievements));
    localStorage.setItem("aegis_stats", JSON.stringify(stats));
    localStorage.setItem("aegis_streak", streakCount.toString());
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

// 6. アラームサイレン (タイマー用)
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

// 7. GPS警告サイレン (不協和音)
function playGeoAlarmSound() {
    if (!isSoundEnabled() || geoAlarmOsc) return;
    
    geoAlarmOsc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    geoAlarmOsc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    geoAlarmOsc.type = 'sawtooth';
    geoAlarmOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    
    let low = true;
    geoAlarmInterval = setInterval(() => {
        if (!audioCtx || !geoAlarmOsc) return;
        const targetFreq = low ? 150 : 250;
        geoAlarmOsc.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
        low = !low;
    }, 250);
    
    geoAlarmOsc.start();
}

function stopGeoAlarmSound() {
    if (geoAlarmOsc) {
        try {
            geoAlarmOsc.stop();
        } catch(e) {}
        geoAlarmOsc = null;
    }
    if (geoAlarmInterval) {
        clearInterval(geoAlarmInterval);
        geoAlarmInterval = null;
    }
}

// 8. 実績アンロックファンファーレ
function playAchievementSound() {
    if (!isSoundEnabled()) return;
    const now = audioCtx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    
    freqs.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + (index * 0.05));
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + (index * 0.05) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.05) + 0.3);
        
        osc.start(now);
        osc.stop(now + (index * 0.05) + 0.45);
    });
}

// 音声読み上げ（AIコアごとのセリフ・トーン）
function speakVoice(textKey, variables = {}) {
    if (!isVoiceEnabled()) return;
    
    window.speechSynthesis.cancel();
    
    const core = AI_CORES[currentAICore];
    let phrase = core.phrases[textKey] || textKey;
    
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
    
    document.body.className = `ai-core-${currentAICore.toLowerCase()}`;
    if (redAlertActive) document.body.classList.add("red-alert-active");
    if (geoBreachActive) document.body.classList.add("geo-breach-active");
    
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
        addLog(`[SYSTEM] 音声モデルをシステムデフォルトに設定。`);
    } else {
        const found = voicesList.find(v => v.name === select.value);
        if (found) {
            selectedVoice = found;
            addLog(`[SYSTEM] 音声モデルを [${found.name}] に設定。`);
            speakVoice("スキャンシステムオンライン。ボイス設定変更を確認。");
        }
    }
};

// ==========================================================================
// 4. 追加機能: 天気管理ロジック
// ==========================================================================

window.setWeather = function(weather) {
    if (currentWeather === weather) return;
    playClickSound();
    
    currentWeather = weather;
    
    const buttons = document.querySelectorAll(".weather-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    
    const activeBtn = document.getElementById(`btn-weather-${weather.toLowerCase()}`);
    if (activeBtn) activeBtn.classList.add("active");
    
    addLog(`[WEATHER] 天候センサーが [${weather}] に変更されました。`);
    
    applyWeatherEffects();
    renderActiveMission();
};

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
        
        // タイムアップ時の判定（忘れ物があればストリークリセット）
        const list = missions[activeMissionKey];
        const allSecured = list && list.length > 0 && list.every(i => i.checked);
        if (!allSecured) {
            resetStreak();
        } else {
            speakVoice("complete");
        }
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
// 6. 追加機能: Geolocation 自宅離脱警告センサー
// ==========================================================================

function initGeolocation() {
    const statusVal = document.getElementById("geo-status-value");
    if (!navigator.geolocation) {
        if (statusVal) statusVal.textContent = "NOT SUPPORTED";
        return;
    }
    
    if (statusVal) statusVal.textContent = "ACQUIRING...";
    
    // 位置の常時監視
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            if (statusVal) {
                statusVal.textContent = "ONLINE";
                statusVal.className = "status-normal";
            }
            
            updateDistanceDisplay(lat, lon);
        },
        (error) => {
            addLog(`[GEOLOCATION] 位置情報取得エラー: ${error.message}`);
            if (statusVal) {
                statusVal.textContent = "ERROR";
                statusVal.className = "status-alert";
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// 緯度経度から2地点間の距離を求める（ハバーシン公式、メートル単位）
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球の半径 (m)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
}

// 自宅との距離表示の更新
function updateDistanceDisplay(lat, lon) {
    const distVal = document.getElementById("geo-distance-value");
    if (!homeCoords.lat || !homeCoords.lon) {
        if (distVal) distVal.textContent = "HOME NOT SET";
        return;
    }
    
    const distance = getDistance(lat, lon, homeCoords.lat, homeCoords.lon);
    if (distVal) distVal.textContent = `${distance.toFixed(1)}m`;
    
    // 実GPSでの30m離脱警告判定
    checkSafeZoneBreach(distance);
}

// 自宅を設定
window.setHomeLocation = function() {
    playClickSound();
    if (!navigator.geolocation) {
        alert("位置情報に対応していません。");
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            homeCoords.lat = position.coords.latitude;
            homeCoords.lon = position.coords.longitude;
            saveData();
            
            addLog(`[GEOLOCATION] 自宅（セーフゾーン）を設定: LAT ${homeCoords.lat.toFixed(4)}, LON ${homeCoords.lon.toFixed(4)}`);
            speakVoice("自宅をセーフゾーンに設定しました。");
            
            updateDistanceDisplay(homeCoords.lat, homeCoords.lon);
        },
        (error) => {
            alert("位置情報を取得できませんでした。: " + error.message);
        }
    );
};

// 離脱シミュレータのトグル
window.toggleGeoSimulation = function(checked) {
    playClickSound();
    geoSimulated = checked;
    
    addLog(`[GEOLOCATION] 離脱シミュレーションを [${checked ? "ON" : "OFF"}] に設定。`);
    
    if (geoSimulated) {
        checkSafeZoneBreach(50.0); // 仮想的に50m離れた状態にする
    } else {
        // 自宅距離測定に復帰させるため、GPSが取得できていれば再計算
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const distance = getDistance(position.coords.latitude, position.coords.longitude, homeCoords.lat, homeCoords.lon);
                checkSafeZoneBreach(distance);
            }, () => checkSafeZoneBreach(0.0));
        } else {
            checkSafeZoneBreach(0.0);
        }
    }
};

// セーフゾーン境界の検証
function checkSafeZoneBreach(distance) {
    const statusVal = document.getElementById("geo-status-value");
    
    // 自宅設定なし、または離脱判定外なら何もしない
    const isLeaved = distance > 30.0;
    
    const list = missions[activeMissionKey];
    const allSecured = list && list.length > 0 && list.every(i => i.checked);
    
    if (isLeaved && !allSecured) {
        // 自宅を離れていて、かつ忘れ物がある場合 ➔ 警告発動
        if (!geoBreachActive) {
            geoBreachActive = true;
            document.body.classList.add("geo-breach-active");
            if (statusVal) {
                statusVal.textContent = "BREACHED";
                statusVal.className = "status-breach";
            }
            addLog(`[GEOLOCATION] 警告: セーフゾーン離脱を検知！未確保の装備があります！`);
            speakVoice("geo_breach");
            playGeoAlarmSound();
            
            // 警告状態でセーフゾーンを出たため、ストリークは即時リセット
            resetStreak();
        }
    } else {
        // 自宅内に戻る、または全て確保完了時 ➔ 警告解除
        if (geoBreachActive) {
            geoBreachActive = false;
            document.body.classList.remove("geo-breach-active");
            if (statusVal) {
                statusVal.textContent = geoSimulated ? "ONLINE (SIM)" : "ONLINE";
                statusVal.className = "status-normal";
            }
            addLog(`[GEOLOCATION] セーフゾーン防衛警報を解除。`);
            stopGeoAlarmSound();
            
            // 離脱中（シミュレート含む）に100%確保してクリアされた場合、ストリークカウントのチャンス
            if (isLeaved && allSecured) {
                // 完了トリガーを実行
                triggerFullCompletion();
            }
        }
    }
}

// ==========================================================================
// 7. 追加機能: 実績 ＆ 連続成功システム
// ==========================================================================

// 実績のUI描画
function renderAchievements() {
    Object.keys(achievements).forEach(id => {
        const el = document.getElementById(`ach-${id}`);
        if (el) {
            if (achievements[id]) {
                el.className = "achievement-item unlocked";
            } else {
                el.className = "achievement-item locked";
            }
        }
    });
}

// 実績のアンロック判定
function unlockAchievement(id, name) {
    if (achievements[id]) return; // 既に解除済み
    
    achievements[id] = true;
    saveData();
    renderAchievements();
    
    // 解放ポップアップの演出
    const popup = document.getElementById("achievement-popup");
    const popName = document.getElementById("pop-achievement-name");
    
    if (popName) popName.textContent = name;
    if (popup) {
        popup.classList.add("show");
        popup.classList.remove("hidden");
        
        playAchievementSound();
        addLog(`[ACHIEVEMENT] 実績解放: [${name}] !`);
        
        // 人格ごとに実績解除の音声アナウンス
        speakVoice(`実績、${name}、のロックを解除。追加データをロードしました。`);
        
        setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => popup.classList.add("hidden"), 500);
        }, 4000);
    }
}

// 統計表示の更新
function updateStatsDisplay() {
    const totalEl = document.getElementById("stats-total-count");
    const maxEl = document.getElementById("stats-max-streak");
    const streakBadge = document.getElementById("streak-badge-display");
    
    if (totalEl) totalEl.textContent = stats.totalMissions;
    if (maxEl) maxEl.textContent = stats.maxStreak;
    if (streakBadge) {
        streakBadge.textContent = `🔥 ${streakCount} STREAK`;
        // ストリーク数に応じて発光を変化
        if (streakCount > 0) {
            streakBadge.style.filter = `drop-shadow(0 0 ${Math.min(streakCount * 3, 15)}px var(--neon-orange))`;
        } else {
            streakBadge.style.filter = "none";
        }
    }
}

// ストリークのカウントアップ
function incrementStreak() {
    streakCount++;
    if (streakCount > stats.maxStreak) {
        stats.maxStreak = streakCount;
    }
    stats.totalMissions++;
    saveData();
    updateStatsDisplay();
    
    addLog(`[STREAK] ミッション成功！連続成功記録: ${streakCount} 回`);
    
    // 音声でストリーク数の称賛
    if (streakCount === 3 || streakCount === 5 || streakCount === 10) {
        speakVoice("streak", { streak: streakCount });
    }
    
    // 実績アンロックの検証
    checkAchievementsUnlocks();
}

// ストリークのリセット
function resetStreak() {
    if (streakCount === 0) return;
    
    streakCount = 0;
    saveData();
    updateStatsDisplay();
    
    addLog(`[STREAK] 装備の未確保により、連続成功記録がリセットされました。`);
    speakVoice("streak_reset");
}

// 実績解除チェック
function checkAchievementsUnlocks() {
    // 1. FIRST EXPEDITION
    if (stats.totalMissions >= 1) {
        unlockAchievement("first", "FIRST EXPEDITION");
    }
    // 2. MASTER AGENT (3 Streak)
    if (streakCount >= 3) {
        unlockAchievement("streak3", "MASTER AGENT");
    }
    // 3. RED LINE SURVIVOR (RED ALERT中にクリア)
    if (redAlertActive) {
        unlockAchievement("redline", "RED LINE SURVIVOR");
    }
    // 4. WEATHERPROOF (雨の日に傘を含めて完了)
    if (currentWeather === "RAINY") {
        unlockAchievement("weather", "WEATHERPROOF");
    }
}

// ==========================================================================
// 8. 追加機能: カメラHUDスキャナー
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
// 9. UIレンダリング & 基本イベント制御
// ==========================================================================

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
// 10. データ操作イベントハンドラー
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
    
    // ストリーク数の加算
    incrementStreak();
    
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
        
        // 実績・ストリークも初期化
        achievements = { first: false, streak3: false, redline: false, weather: false };
        stats = { totalMissions: 0, maxStreak: 0 };
        streakCount = 0;
        saveData();
        renderAchievements();
        updateStatsDisplay();
        
        addLog("[SYSTEM] データベースとアチーブメントをリセットしました。");
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
// 11. 新規ミッション追加モーダル
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
