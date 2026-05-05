let khataRegister = JSON.parse(localStorage.getItem("proKhataV5")) || {};
let savedShopName = localStorage.getItem("myShopName") || "Apni Dukan";

/* ==========================================
   🛠️ UI & MODAL CONTROLS
========================================== */
function closeAllModals() { document.querySelectorAll('.custom-modal-overlay').forEach(el => el.style.display = 'none'); }
function showError(msg) { document.getElementById("alertIconDisplay").innerText = "⚠️"; document.getElementById("customAlertMessage").innerText = msg; document.getElementById("customAlertOverlay").style.display = "flex"; }
function showVoiceResponse(msg) { document.getElementById("alertIconDisplay").innerText = "🤖"; document.getElementById("customAlertMessage").innerText = msg; document.getElementById("customAlertOverlay").style.display = "flex"; }
function showSingleInputModal(title, defaultVal, callback) { document.getElementById("singleInputTitle").innerText = title; let input = document.getElementById("singleInputValue"); input.value = defaultVal; document.getElementById("singleInputOverlay").style.display = "flex"; input.focus(); document.getElementById("btnSingleSave").onclick = function() { closeAllModals(); callback(input.value.trim()); }; }
function showConfirmModal(msg, callback, isWarning = false) { document.getElementById("confirmIconDisplay").innerText = isWarning ? "🚨" : "🗑️"; document.getElementById("confirmTitle").innerText = msg; document.getElementById("confirmOverlay").style.display = "flex"; document.getElementById("btnConfirmYes").onclick = function() { closeAllModals(); callback(); }; }

/* ==========================================
   🗣️ TEXT-TO-SPEECH
========================================== */
function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        setTimeout(() => { let u = new SpeechSynthesisUtterance(text); u.lang = 'hi-IN'; window.speechSynthesis.speak(u); }, 100);
    }
}

/* ==========================================
   🎙️ DIRECT VOICE AI & CHATBOT
========================================== */
function startVoiceRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showError("Browser not supported. Use Google Chrome."); return; }
    const rec = new SR(); rec.lang = 'hi-IN'; 
    const btn = document.getElementById("micBtn"), stat = document.getElementById("micStatus");
    
    rec.onstart = () => { btn.classList.add("recording"); btn.innerHTML = "<span class='mic-icon'>🎙️</span> Sun raha hoon..."; stat.innerText = "Boliye..."; };
    rec.onspeechend = () => { btn.classList.remove("recording"); btn.innerHTML = "<span class='mic-icon'>🎙️</span> Bolkar Likhain ya Poochhein"; stat.innerText = "Soch raha hoon..."; };
    rec.onresult = (e) => { let text = e.results[0][0].transcript.toLowerCase(); stat.innerText = `Aapne bola: "${text}"`; processVoiceCommand(text); };
    rec.onerror = () => { btn.classList.remove("recording"); btn.innerHTML = "<span class='mic-icon'>🎙️</span> Bolkar Likhain"; showError("Theek se sunai nahi diya."); };
    
    window.speechSynthesis.cancel(); rec.start();
}

function processVoiceCommand(text) {
    let t = text.toLowerCase();
    
    // 🌟 1. EASTER EGG
    if (/(kisne banaya|tumhe kisne|aapko kisne|किसने बनाया|किसने)/i.test(t)) {
        let msg = "Mujhe Rihan Khan ne banaya hai, aur Khan Sahab Salai ke rahne wale hain, aur ye chahte hain ki India independent ban jaye.";
        showVoiceResponse("🎙️ " + msg); speakText(msg); return; 
    }

    // 🌟 2. ADVANCED AI CHATBOT QUERIES (A to Z Sawaal)
    if (/(sabse zyada udhar|sabse jyada udhar|sabse adhik udhar|सबसे ज्यादा उधार)/i.test(t)) {
        let maxName = "", maxAmt = 0;
        for (let g in khataRegister) { if(khataRegister[g].totalBalance > maxAmt) { maxAmt = khataRegister[g].totalBalance; maxName = g; } }
        let msg = maxName ? `Dukan ka sabse zyada udhar ${maxName} par hai, jo ki ${maxAmt} rupiye hai.` : "Dukan mein kisi par udhar nahi hai.";
        showVoiceResponse("🤖 " + msg); speakText(msg); return;
    }

    if (/(aaj kitna udhar|aaj ka udhar|aaj total udhar|आज कितना उधार)/i.test(t)) {
        let todayStr = new Date().toLocaleString("en-IN").split(",")[0].trim(), todayTotal = 0;
        for (let g in khataRegister) khataRegister[g].history.forEach(b => { if (b.type === 'udhar' && b.time.split(",")[0].trim() === todayStr) todayTotal += b.amount; });
        let msg = `Aaj dukan se total ${todayTotal} rupiye ka udhar gaya hai.`; showVoiceResponse("🤖 " + msg); speakText(msg); return;
    }

    if (/(aaj kitna jama|aaj ka jama|aaj kitne paise aaye|आज कितना जमा)/i.test(t)) {
        let todayStr = new Date().toLocaleString("en-IN").split(",")[0].trim(), todayTotal = 0;
        for (let g in khataRegister) khataRegister[g].history.forEach(b => { if (b.type === 'jama' && b.time.split(",")[0].trim() === todayStr) todayTotal += b.amount; });
        let msg = `Aaj dukan mein total ${todayTotal} rupiye jama hue hain.`; showVoiceResponse("🤖 " + msg); speakText(msg); return;
    }

    if (/(total grahak|kitne grahak|kul grahak|total customer|कितने ग्राहक)/i.test(t)) {
        let count = Object.keys(khataRegister).length;
        let msg = `Dukan mein abhi total ${count} grahakon ke khate hain.`; showVoiceResponse("🤖 " + msg); speakText(msg); return;
    }

    if (/(sabko kaat do|saare account delete|sab delete|udhar band|सबको काट दो)/i.test(t)) {
        speakText("Kya aap sach mein saare khate delete karna chahte hain?");
        showConfirmModal("🚨 SAVADHAAN: Saare khate delete karein?", () => { khataRegister = {}; localStorage.setItem("proKhataV5", JSON.stringify(khataRegister)); updateScreen(); speakText("Saare khate Delete ho gaye."); }, true); return;
    }

    if (/(total udhar|ab tak total|dukan ka total|kul udhar|टोटल उधार|कुल उधार)/i.test(t)) {
        let total = 0; for (let g in khataRegister) total += khataRegister[g].totalBalance;
        let msg = `Malik, ab tak dukan ka total udhar ${total} rupiye hai.`; showVoiceResponse("🤖 " + msg); speakText(msg); return;
    }

    if (/(last udhar|aakhiri udhar|aakhri udhar|pichla udhar|आखरी उधार|पिछला उधार)/i.test(t)) {
        let lName = "", lAmt = 0, lTime = 0;
        for(let g in khataRegister) khataRegister[g].history.forEach(b => { if(b.type === 'udhar' && b.id > lTime) { lTime = b.id; lName = g; lAmt = b.amount; }});
        let msg = lName ? `Aapne aakhiri udhar ${lName} ko ${lAmt} rupiye ka diya tha.` : "Koi udhar nahi gaya."; showVoiceResponse("🤖 " + msg); speakText(msg); return;
    }

    if (/(kise kitna udhar|kis par kitna|kaun kaun udhar|sabka hisaab|किस पर कितना)/i.test(t)) {
        let arr =[]; for(let g in khataRegister) if(khataRegister[g].totalBalance > 0) arr.push(`${g} par ${khataRegister[g].totalBalance}`);
        let msg = arr.length ? "Udhar is prakar hai: " + arr.join(", ") : "Kisi par udhar nahi hai."; showVoiceResponse("🤖 " + msg); speakText(msg); return;
    }

    // 🌟 3. DIRECT ENTRY LOGIC (NO POPUP)
    let clean = t.replace(/[₹$]/g, " ").replace(/\s+/g, " ").trim();
    let amtMatch = clean.match(/\d+/); let money = amtMatch ? Number(amtMatch[0]) : 0;

    let type = 'udhar';
    if (/(jama|jamma|prapt|aaye|जमा)/i.test(clean)) type = 'jama';
    else if (/(delete|kaat|hata|mita|डिलीट|काट|हटा)/i.test(clean)) type = 'delete';
    if (/(balance|kitne|kitna|baki|hisaab|batao|कितने|बाकी|हिसाब)/i.test(clean) && money === 0) type = 'balance';

    let words = clean.split(" "), foundName = "";
    for (let name of Object.keys(khataRegister)) if (clean.includes(name.toLowerCase())) { foundName = name; break; }

    if (!foundName) {
        let idx = words.findIndex(w =>["ke","ka","pe","par","ko","account","mein","me","khata","khaate","के","का","पे","पर","को","अकाउंट","में","खाते","खाता"].includes(w));
        foundName = idx > 0 ? words.slice(0, idx).join(" ") : words[0];
        if(foundName) foundName = foundName.charAt(0).toUpperCase() + foundName.slice(1);
    }

    if (type === 'delete' || type === 'balance') {
        if (!khataRegister[foundName]) { let err = `Bhai, "${foundName}" ka khata dukan mein nahi hai.`; speakText(err); showError(err); return; }
    }
    if (type === 'balance') {
        let bal = khataRegister[foundName].totalBalance;
        let msg = bal > 0 ? `${foundName} par ${bal} baki hai.` : (bal < 0 ? `${foundName} ke ${Math.abs(bal)} jama hain.` : "Hisaab barabar hai.");
        speakText(msg); showVoiceResponse("🎙️ " + msg); return;
    }
    if (type === 'delete') {
        showConfirmModal(`"${foundName}" ka pura khata Delete karein?`, () => { delete khataRegister[foundName]; localStorage.setItem("proKhataV5", JSON.stringify(khataRegister)); updateScreen(); speakText("Delete ho gaya."); }); return;
    }

    if (money === 0) { speakText("Paise samajh nahi aaye."); showError("Paise samajh nahi aaye."); return; }

    let fillers =["ke","ka","pe","par","ko","account","mein","me","khata","khaate","dhoondhkar","add","kar","do","abhi","chadhao","likho","likh","jama","delete","hata","kaat","rupiye","rs","₹","के","का","पे","पर","को","अकाउंट","में","रुपये","रु","लिख","दो","करो","जमा","काट","हटा","और","है","हैं","वाले","की","चढ़ाओ","खाते","हिसाब","लगा","bhai","yaar"];
    let filtered = words.filter(w => !fillers.includes(w) && !foundName.toLowerCase().split(" ").includes(w) && w !== money.toString());
    let samaan = filtered.join(" ").trim();
    if (!samaan) samaan = type === 'udhar' ? "Udhar" : "Jama";

    // ✅ MAGIC: DIRECT SAVE WITHOUT POPUP
    let exactTime = new Date().toLocaleString("en-IN"), uniqueId = Date.now();
    if (!khataRegister[foundName]) khataRegister[foundName] = { totalBalance: 0, history:[] };
    
    khataRegister[foundName].totalBalance += type === 'udhar' ? money : -money;
    khataRegister[foundName].history.push({ id: uniqueId, type: type, amount: money, samaan: samaan, time: exactTime });
    localStorage.setItem("proKhataV5", JSON.stringify(khataRegister)); 
    updateScreen();

    let successMsg = `${foundName} ke khate mein ${money} rupiye ${type === 'udhar' ? 'likh diye gaye hain' : 'jama kar liye gaye hain'}.`;
    speakText(successMsg);
    
    let stat = document.getElementById("micStatus");
    stat.style.color = "#10b981"; stat.innerText = `✅ ${successMsg}`;
    setTimeout(() => { stat.style.color = "#94a3b8"; stat.innerText = "Poochiye: Aaj kitna udhar gaya?"; }, 4000);
}

/* ==========================================
   ⏰ 4. AUTOMATED ALERTS (11 PM & HOURLY)
========================================== */
setInterval(() => {
    let now = new Date(), h = now.getHours(), m = now.getMinutes();
    let l11 = localStorage.getItem("lastSpoken11PM"), lHr = localStorage.getItem("lastSpokenHour");
    let today = now.toLocaleDateString("en-IN"); 

    if (h === 23 && m === 0 && l11 !== today) {
        localStorage.setItem("lastSpoken11PM", today); localStorage.setItem("lastSpokenHour", h); 
        let total = 0, dateStr = now.toLocaleString("en-IN").split(",")[0].trim();
        for (let g in khataRegister) khataRegister[g].history.forEach(b => { if (b.type === 'udhar' && b.time.split(",")[0].trim() === dateStr) total += b.amount; });
        let din = now.toLocaleDateString('hi-IN', { weekday: 'long' }), tar = now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' });
        speakText(`Aaj ${din}, ${tar} ko total ${total} rupiye ka udhar gaya hai. Udhar ka paisa vasool karte ja, Aage udhar deta ja.`);
    }
    else if (m === 0 && lHr != h && h !== 23) {
        localStorage.setItem("lastSpokenHour", h);
        let total = 0; for (let g in khataRegister) total += khataRegister[g].totalBalance;
        speakText(`Malik, ab tak dukan ka total udhar ${total} rupiye ja chuka hai.`);
    }
}, 30000); 

/* ==========================================
   📊 5. DUKAN KI HISTORY & MANUAL ENTRY UI
========================================== */
function showShopHistory() {
    let historyByDate = {};
    for (let g in khataRegister) {
        khataRegister[g].history.forEach(b => {
            if (b.type === 'udhar') {
                let d = b.time.split(",")[0].trim();
                if (!historyByDate[d]) historyByDate[d] = 0; historyByDate[d] += b.amount;
            }
        });
    }
    let listHTML = "", dates = Object.keys(historyByDate).reverse();
    if (dates.length === 0) listHTML = "<p style='color:gray; text-align:center;'>Koi udhar nahi diya gaya.</p>";
    else dates.forEach(d => { listHTML += `<li class="history-item"><b>🗓️ ${d}</b> <span class="text-red">₹${historyByDate[d]}</span></li>`; });
    document.getElementById("historyDataList").innerHTML = listHTML; document.getElementById("historyOverlay").style.display = "flex";
}

function loadShopDetails() { document.getElementById("shopNameDisplay").innerText = savedShopName; }
function editShopName() { showSingleInputModal("Dukan ka naya naam dalen:", savedShopName, n => { if (n) { savedShopName = n; localStorage.setItem("myShopName", n); loadShopDetails(); } }); }
function calculateShopTotal() { let total = 0; for (let g in khataRegister) total += khataRegister[g].totalBalance; document.getElementById("totalShopBalance").innerText = "₹" + total; }

function addTransaction(type) {
    let name = document.getElementById("customerName").value.trim(), mStr = document.getElementById("amount").value, m = Number(mStr), items = document.getElementById("items").value;
    if (!name || isNaN(m) || m <= 0) { showError("Sahi Naam aur Paise bharein!"); return; }
    let time = new Date().toLocaleString("en-IN"), id = Date.now(); 
    if (!khataRegister[name]) khataRegister[name] = { totalBalance: 0, history:[] };
    khataRegister[name].totalBalance += type === 'udhar' ? m : -m;
    khataRegister[name].history.push({ id, type, amount: m, samaan: items || (type === 'udhar'?"Udhar":"Jama"), time });
    localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
    document.getElementById("customerName").value = ""; document.getElementById("amount").value = ""; document.getElementById("items").value = ""; updateScreen();
}

function deleteTransactionItem(grahak, id) {
    let idx = khataRegister[grahak].history.findIndex(b => b.id === id); if(idx === -1) return; let b = khataRegister[grahak].history[idx];
    showConfirmModal(`Kya aap delete karna chahte hain?`, () => {
        khataRegister[grahak].totalBalance += b.type === 'udhar' ? -b.amount : b.amount;
        khataRegister[grahak].history.splice(idx, 1); localStorage.setItem("proKhataV5", JSON.stringify(khataRegister)); updateScreen();
    });
}

function editCustomerName(old) { showSingleInputModal("Naya naam likhein:", old, n => { if (!n || n === old) return; if (khataRegister[n]) { showError("Naam pehle se hai."); return; } khataRegister[n] = khataRegister[old]; delete khataRegister[old]; localStorage.setItem("proKhataV5", JSON.stringify(khataRegister)); updateScreen(); }); }

function sendToWhatsApp(grahak) {
    let data = khataRegister[grahak], msg = `📘 *${savedShopName} - KhataBook* 📘\n\n👤 *Grahak:* ${grahak}\n💰 *Baki Balance:* ₹${data.totalBalance}\n\n*--- Hisaab Details ---*\n`;
    data.history.forEach(b => { msg += `🗓️ ${b.time}\n📝 ${b.samaan} : ${b.type==='udhar'?'+':'-'} ₹${b.amount}\n\n`; });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function deleteAccount(grahak) { showConfirmModal(`🚨 "${grahak}" ka khata udana chahte hain?`, () => { delete khataRegister[grahak]; localStorage.setItem("proKhataV5", JSON.stringify(khataRegister)); updateScreen(); }, true); }

function updateScreen(search = "") {
    let listDiv = document.getElementById("accountList"); listDiv.innerHTML = ""; 
    for (let g in khataRegister) {
        if (g.toLowerCase().includes(search.toLowerCase())) {
            let data = khataRegister[g], histHTML = "";[...data.history].reverse().forEach(b => {
                let col = b.type === 'udhar' ? 'text-red' : 'text-green', sign = b.type === 'udhar' ? '+' : '-';
                histHTML += `<li class="history-item"><div><span>${b.samaan}</span><span class="date-time">🕒 ${b.time}</span></div><div style="text-align:right;"><span class="${col}">${sign} ₹${b.amount}</span><div style="display:flex; gap:5px; margin-top:5px;"><button class="btn-delete-item" onclick="deleteTransactionItem('${g}', ${b.id})">🗑️ Delete</button></div></div></li>`;
            });
            let bCol = data.totalBalance > 0 ? "color:#ef4444;" : "color:#10b981;";
            listDiv.innerHTML += `<div class="account-card"><div class="card-header"><div class="header-row"><h4 onclick="editCustomerName('${g}')" style="cursor:pointer;">👤 ${g} ✏️</h4><span style="font-weight:800; font-size:18px; ${bCol}">₹${data.totalBalance} Baki</span></div><div class="action-buttons"><button class="btn-whatsapp" onclick="sendToWhatsApp('${g}')">📲 WhatsApp</button><button class="btn-delete" onclick="deleteAccount('${g}')">🗑️ Khata Delete</button></div></div><ul class="history-list">${histHTML}</ul></div>`;
        }
    }
    calculateShopTotal();
}
function searchCustomer() { updateScreen(document.getElementById("searchInput").value); }
loadShopDetails(); updateScreen();