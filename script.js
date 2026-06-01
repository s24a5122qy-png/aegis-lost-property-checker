/* ==========================================================================
   A.E.G.I.S. - APPLICATION ENGINE & LOGIC (JS)
   ========================================================================== */

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
    
    // 初回インタラクション時にAudioContextを初期化するためのトリガー
    document.body.addEventListener("click", initAudioContext, { once: true });
    
    addLog("[SYSTEM] A.E.G.I.S. Boot sequence completed.");
});

// ==========================================================================
// 追加機能: 天気管理ロジック
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
            // 雨具を追加 (最優先)
            const weatherUmbrella = {
                id: WEATHER_ITEM_ID,
                name: "雨具 (RAIN SHIELD)",
                category: "NECESSITY",
                priority: "CRITICAL",
                checked: false,
                isWeatherItem: true,
                hint: "外は雨です。傘やフードをお忘れなく。"
            };
            // リストの先頭に追加
            list.unshift(weatherUmbrella);
            addLog(`[WEATHER] 降水を検知。雨具 [RAIN SHIELD] をリストに追加。`);
            speakVoice("警告。降水反応を検知。レインシールドを装備リストに追加しました。");
        }
    } else {
        if (hasUmbrella) {
            // 雨具を削除
            const index = list.findIndex(item => item.id === WEATHER_ITEM_ID);
            if (index > -1) {
                list.splice(index, 1);
                addLog(`[WEATHER] 降水反応が消失。雨具を回収しました。`);
            }
        }
    }
}

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
            speakVoice("イージスシステム起動。装備スキャンを開始します。");
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
        // 高音のサイバーなチェック音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    } else {
        // 低めの解除音
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
    
    // コードをアルペジオで鳴らす (Cコード: C5 -> E5 -> G5 -> C6)
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

// AI合成音声による喋り
function speakVoice(text) {
    if (!isVoiceEnabled()) return;
    
    // 発言中の音声をキャンセル
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 1.1; // 若干スピーディーかつロボット的に
    utterance.pitch = 1.05; // やや高め（知的な近未来AIアシスタント風）
    
    window.speechSynthesis.speak(utterance);
}

// ==========================================================================
// 3. UIレンダリング & コントロール
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

// キー名を分かりやすい名前に変換
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
    
    // カテゴリごとにグループ化
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
            
            // バッジの選択
            let badgeHtml = `<span class="badge badge-${item.priority.toLowerCase()}">${item.priority}</span>`;
            if (item.isWeatherItem) {
                badgeHtml = `<span class="badge badge-weather">WEATHER DETECTED</span>`;
            }
            
            // ヒント表示
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
    
    // コンソールの更新
    const missingItems = totalItems - securedItems;
    updateScanConsole(totalItems, securedItems, missingItems);
}

// HTMLエスケープ処理
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// コンソールステータスと進捗円の更新
function updateScanConsole(total, secured, missing) {
    totalCountEl.textContent = total;
    securedCountEl.textContent = secured;
    missingCountEl.textContent = missing;
    
    const percentage = total === 0 ? 0 : Math.round((secured / total) * 100);
    
    // 進捗率テキスト
    scanPercentageEl.textContent = `${percentage}%`;
    
    // SVG進捗バーのアニメーション
    const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100) * CIRCLE_CIRCUMFERENCE;
    progressBarEl.style.strokeDashoffset = offset;
    
    // ステータステキストと色の制御
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
// 4. データ操作イベントハンドラー
// ==========================================================================

// アイテムのチェック切り替え
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
        
        // 全チェック完了時の演出
        const allSecured = list.every(i => i.checked);
        if (allSecured && checked) {
            triggerFullCompletion();
        } else {
            // シールド解除
            if (shieldOverlayEl) {
                shieldOverlayEl.classList.remove("active");
            }
        }
    }
};

// 全て確保ボタン
function secureAllGear() {
    playClickSound();
    const list = missions[activeMissionKey];
    if (!list || list.length === 0) return;
    
    list.forEach(item => item.checked = true);
    saveData();
    renderActiveMission();
    
    addLog(`[SYSTEM] すべての装備のステータスを [SECURED] に設定しました。`);
    triggerFullCompletion();
}

// 全チェック完了時の特別演出
function triggerFullCompletion() {
    playSuccessSound();
    speakVoice("スキャン完了。すべての装備が確保されました。いってらっしゃいませ、エージェント。");
    
    // 全体発光フラッシュエフェクト
    document.body.classList.add("system-complete-flash");
    setTimeout(() => {
        document.body.classList.remove("system-complete-flash");
    }, 800);
    
    // 外殻シールド起動
    if (shieldOverlayEl) {
        shieldOverlayEl.classList.add("active");
        addLog(`[SHIELD] 外殻シールド起動。ALL SYSTEMS CLEAR.`);
    }
}

// アイテムの削除
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

// アイテムの新規追加
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

// ミッションの切り替え
function handleMissionChange() {
    playClickSound();
    activeMissionKey = missionSelectEl.value;
    
    // 新しいミッションに対して現在の天気を適用
    applyWeatherEffects();
    
    saveData();
    renderActiveMission();
    
    const friendlyName = getFriendlyMissionName(activeMissionKey);
    addLog(`[MISSION] アクティブミッションを [${activeMissionKey}] に変更しました。`);
    speakVoice(`ミッション、${activeMissionKey.replace(/_/g, " ")}、をロードしました。`);
}

// ミッションの初期化 (プリセットに戻す)
function resetMissionsToDefault() {
    playClickSound();
    if (confirm("全ミッションのデータを初期プリセットに戻しますか？現在のカスタマイズは失われます。")) {
        missions = JSON.parse(JSON.stringify(INITIAL_MISSIONS));
        activeMissionKey = Object.keys(missions)[0] || "";
        saveData();
        populateMissionSelector();
        renderActiveMission();
        addLog("[SYSTEM] データベースを初期状態にリセットしました。");
        speakVoice("データベースを初期化しました。");
    }
}

// 現在のミッションを消去
function deleteActiveMission() {
    playClickSound();
    if (confirm(`ミッション "${activeMissionKey}" を完全に削除しますか？`)) {
        delete missions[activeMissionKey];
        activeMissionKey = Object.keys(missions)[0] || "";
        saveData();
        populateMissionSelector();
        renderActiveMission();
        addLog(`[SYSTEM] ミッションを消去しました。現在のミッション: ${activeMissionKey}`);
    }
}

// ==========================================================================
// 5. 新規ミッション追加用モーダルの処理
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
    
    // スペースや記号をアンダースコアに整形
    const keyName = nameInput.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    
    if (missions[keyName]) {
        alert("同名のミッションキーが既に存在します。");
        return;
    }
    
    // 新規ミッションの空配列を作成
    missions[keyName] = [];
    activeMissionKey = keyName;
    
    saveData();
    populateMissionSelector();
    renderActiveMission();
    hideMissionModal();
    
    addLog(`[MISSION] 新規ミッション: [${keyName}] を作成・初期化しました。`);
    speakVoice(`新しいミッション、${keyName.replace(/_/g, " ")}、を作成しました。`);
}
