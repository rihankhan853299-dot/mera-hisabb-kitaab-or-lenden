let khataRegister = JSON.parse(localStorage.getItem("proKhataV5")) || {};
let savedShopName = localStorage.getItem("myShopName") || "Apni Dukan";

/* ==========================================
   🛠️ 1. CUSTOM POPUPS CONTROLS
========================================== */
function closeAllModals() {
    document.getElementById("customAlertOverlay").style.display = "none";
    document.getElementById("singleInputOverlay").style.display = "none";
    document.getElementById("tripleInputOverlay").style.display = "none";
    document.getElementById("confirmOverlay").style.display = "none";
    document.getElementById("historyOverlay").style.display = "none"; // Naya History modal
}

function showError(message) {
    document.getElementById("alertIconDisplay").innerText = "⚠️"; 
    document.getElementById("customAlertMessage").innerText = message;
    document.getElementById("customAlertOverlay").style.display = "flex";
}

function showVoiceResponse(message) {
    document.getElementById("alertIconDisplay").innerText = "🤖"; 
    document.getElementById("customAlertMessage").innerText = message;
    document.getElementById("customAlertOverlay").style.display = "flex";
}

function showSingleInputModal(title, defaultValue, callbackFunction) {
    document.getElementById("singleInputTitle").innerText = title;
    let inputField = document.getElementById("singleInputValue");
    inputField.value = defaultValue;
    document.getElementById("singleInputOverlay").style.display = "flex";
    inputField.focus();

    document.getElementById("btnSingleSave").onclick = function() {
        closeAllModals(); callbackFunction(inputField.value.trim());
    };
}

function showTripleInputModal(title, nameVal, moneyVal, itemVal, callbackFunction) {
    document.getElementById("tripleInputTitle").innerText = title;
    document.getElementById("tripleInputName").value = nameVal;
    document.getElementById("tripleInputMoney").value = moneyVal;
    document.getElementById("tripleInputItem").value = itemVal;

    document.getElementById("tripleInputOverlay").style.display = "flex";

    document.getElementById("btnTripleSave").onclick = function() {
        let finalName = document.getElementById("tripleInputName").value.trim();
        let finalMoney = document.getElementById("tripleInputMoney").value;
        let finalItem = document.getElementById("tripleInputItem").value.trim();
        closeAllModals();
        callbackFunction(finalName, finalMoney, finalItem);
    };
}

function showConfirmModal(message, callbackFunction, isWarning = false) {
    document.getElementById("confirmIconDisplay").innerText = isWarning ? "🚨" : "🗑️";
    document.getElementById("confirmTitle").innerText = message;
    document.getElementById("confirmOverlay").style.display = "flex";
    document.getElementById("btnConfirmYes").onclick = function() {
        closeAllModals(); callbackFunction();
    };
}

/* ==========================================
   🗣️ 2. TEXT-TO-SPEECH (BOLNE KI MACHINE)
========================================== */
function speakText(textMessage) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        setTimeout(function() {
            let utterance = new SpeechSynthesisUtterance(textMessage);
            utterance.lang = 'hi-IN'; 
            window.speechSynthesis.speak(utterance);
        }, 100);
    }
}

/* ==========================================
   🤖 3. AUTOMATED VOICE ALERTS (Har Ghante aur Raat 11 Baje)
========================================== */
// Ye function har 30 second mein check karega ki time kya hua hai
setInterval(function() {
    let now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    
    let lastSpokenHour = localStorage.getItem("lastSpokenHour");
    let lastSpoken11PM = localStorage.getItem("lastSpoken11PM");
    let todayDateStr = now.toLocaleDateString("en-IN"); // Aaj ki Date (e.g. 4/5/2026)

    // 🌟 Raat 11 Baje ki Special Report (23:00)
    if (h === 23 && m === 0 && lastSpoken11PM !== todayDateStr) {
        localStorage.setItem("lastSpoken11PM", todayDateStr);
        localStorage.setItem("lastSpokenHour", h); // Taki normal hourly wali dobara na chale
        
        // Aaj ka total udhar nikalna
        let todayUdharTotal = 0;
        let targetDateStr = now.toLocaleString("en-IN").split(",")[0].trim();
        for (let grahak in khataRegister) {
            khataRegister[grahak].history.forEach(bill => {
                // Agar lenden udhar ka hai aur uski tareekh aaj ki hai
                if (bill.type === 'udhar' && bill.time.split(",")[0].trim() === targetDateStr) {
                    todayUdharTotal += bill.amount;
                }
            });
        }

        let din = now.toLocaleDateString('hi-IN', { weekday: 'long' });
        let tareekh = now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' });
        
        let msg = `Aaj ${din}, ${tareekh} ko total ${todayUdharTotal} rupiye ka udhar gaya hai. Udhar ka paisa vasool karte ja, Aage udhar deta ja.`;
        speakText(msg);
        showVoiceResponse("🤖 " + msg);
    }
    // 🌟 Har Ghante ki Report (Jaise 1:00, 2:00, 3:00 par)
    else if (m === 0 && lastSpokenHour != h && h !== 23) {
        localStorage.setItem("lastSpokenHour", h);
        
        // Total Dukan Ka Udhar
        let totalUdhar = 0;
        for (let g in khataRegister) { totalUdhar += khataRegister[g].totalBalance; }
        
        let msg = `Malik, ab tak dukan ka total udhar ${totalUdhar} rupiye ja chuka hai.`;
        speakText(msg);
        // Isme popup na bhi dikhaye toh theek hai, par aapko pata chal jaye isliye dikha rahe hain
        showVoiceResponse("🤖 " + msg);
    }
}, 30000); // Har 30 seconds mein check karega


/* ==========================================
   📊 4. DUKAN KI HISTORY (Date Wise)
========================================== */
function showShopHistory() {
    let historyByDate = {};
    
    // Saare grahako ki history scan karo
    for (let grahak in khataRegister) {
        khataRegister[grahak].history.forEach(bill => {
            if (bill.type === 'udhar') {
                let dateStr = bill.time.split(",")[0].trim(); // Sirf date nikali
                if (!historyByDate[dateStr]) historyByDate[dateStr] = 0;
                historyByDate[dateStr] += bill.amount;
            }
        });
    }

    let listHTML = "";
    // Date ke hisaab se dikhana
    let dates = Object.keys(historyByDate).reverse(); // Nayi date upar
    if (dates.length === 0) {
        listHTML = "<p style='text-align:center; color:gray;'>Abhi tak koi udhar nahi diya gaya.</p>";
    } else {
        dates.forEach(date => {
            listHTML += `
                <li style="padding: 10px; border-bottom: 1px solid #ccc; display: flex; justify-content: space-between;">
                    <b>🗓️ ${date}</b> 
                    <span style="color:#ff4757; font-weight:bold;">₹${historyByDate[date]}</span>
                </li>
            `;
        });
    }

    document.getElementById("historyDataList").innerHTML = listHTML;
    document.getElementById("historyOverlay").style.display = "flex";
}


/* ==========================================
   🎙️ 5. HUMAN VOICE AI LOGIC
========================================== */
function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { showError("Browser support nahi karta."); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; 

    const micBtn = document.getElementById("micBtn");
    const micStatus = document.getElementById("micStatus");

    recognition.onstart = function() {
        micBtn.classList.add("recording");
        micBtn.innerText = "🎙️ Sun raha hoon...";
        micStatus.innerText = "Boliye...";
    };

    recognition.onspeechend = function() {
        micBtn.classList.remove("recording");
        micBtn.innerText = "🎙️ Bolkar Likhain ya Poochhein";
        micStatus.innerText = "Soch raha hoon...";
    };

    recognition.onresult = function(event) {
        let transcript = event.results[0][0].transcript.toLowerCase();
        micStatus.innerText = `Aapne bola: "${transcript}"`;
        processVoiceCommand(transcript);
    };

    recognition.onerror = function() {
        micBtn.classList.remove("recording");
        micBtn.innerText = "🎙️ Bolkar Likhain ya Poochhein";
        showError("Theek se sunai nahi diya. Dubara boliye.");
    };

    window.speechSynthesis.cancel();
    recognition.start();
}

function processVoiceCommand(text) {
    let textLower = text.toLowerCase();

    // EASTER EGG
    let creatorWords =["kisne banaya", "tumhe kisne", "aapko kisne", "किसने बनाया", "किसने"];
    if (creatorWords.some(w => textLower.includes(w))) {
        let creatorMsg = "Mujhe Rihan Khan ne banaya hai, aur Khan Sahab Salai ke rahne wale hain, aur ye chahte hain ki India independent ban jaye.";
        showVoiceResponse("🎙️ " + creatorMsg); speakText(creatorMsg); return; 
    }

    // DELETE ALL ACCOUNTS
    if (textLower.includes("sabko kaat do") || textLower.includes("saare account delete") || textLower.includes("sab delete") || textLower.includes("udhar band") || textLower.includes("saare khate delete") || textLower.includes("सबको काट दो")) {
        let warnMsg = "🚨 SAVADHAAN: Kya aap sach mein dukan ke SAARE KHATE hamesha ke liye delete karna chahte hain?";
        speakText("Savadhaan. Kya aap sach mein saare khate delete karna chahte hain?");
        showConfirmModal(warnMsg, function() {
            khataRegister = {}; 
            localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
            updateScreen();
            speakText("Saare khate hamesha ke liye delete kar diye gaye hain.");
        }, true);
        return;
    }

    let cleanText = textLower.replace(/[₹$]/g, " ").replace(/\s+/g, " ").trim();
    let amountMatch = cleanText.match(/\d+/);
    let money = amountMatch ? Number(amountMatch[0]) : 0;

    let type = 'udhar';
    if (/(jama|jamma|jma|prapt|aaye|jamaa|जमा)/i.test(cleanText)) { type = 'jama'; } 
    else if (/(delete|kaat|hata|mita|डिलीट|काट|हटा)/i.test(cleanText)) { type = 'delete'; }
    
    if (/(balance|kitne|kitna|baki|hisaab|batao|कितने|बाकी|हिसाब)/i.test(cleanText) && money === 0) { type = 'balance'; }

    let wordsArray = cleanText.split(" ");
    let foundName = "";
    let existingCustomers = Object.keys(khataRegister);
    
    for (let name of existingCustomers) {
        if (cleanText.includes(name.toLowerCase())) { foundName = name; break; }
    }

    if (!foundName) {
        let indicators =["ke","ka","pe","par","ko","account","mein","me","khata","khaate","के","का","पे","पर","को","अकाउंट","में","खाते","खाता"];
        let indicatorIndex = wordsArray.findIndex(w => indicators.includes(w));
        if (indicatorIndex > 0) { foundName = wordsArray.slice(0, indicatorIndex).join(" "); } 
        else { foundName = wordsArray[0]; }
        if(foundName) { foundName = foundName.charAt(0).toUpperCase() + foundName.slice(1); }
    }

    if (type === 'delete' || type === 'balance') {
        if (khataRegister[foundName] === undefined) {
            let errorMsg = `Bhai, dukan mein "${foundName}" naam ka koi khata nahi hai.`;
            showVoiceResponse("🤖 " + errorMsg); speakText(errorMsg); return; 
        }
    }

    if (type === 'balance') {
        let bal = khataRegister[foundName].totalBalance;
        let responseMsg = bal > 0 ? `${foundName} par ${bal} rupiye ka udhar baki hai.` : (bal < 0 ? `${foundName} ke ${Math.abs(bal)} rupiye jama hain.` : `${foundName} ka hisaab barabar hai.`);
        showVoiceResponse("🎙️ " + responseMsg); speakText(responseMsg); return;
    }

    if (type === 'delete') {
        showConfirmModal(`Kya aap sach mein "${foundName}" ka pura khata Delete karna chahte hain?`, function() {
            delete khataRegister[foundName]; localStorage.setItem("proKhataV5", JSON.stringify(khataRegister)); updateScreen(); speakText(`${foundName} ka khata delete ho gaya.`);
        });
        return;
    }

    if (money === 0) { showError("Aapne paise nahi bataye."); return; }

    let fillerWords =["ke","ka","pe","par","ko","account","mein","me","khata","khaate","dhoondhkar","dhoodhkar","add","kar","do","abhi","chadhao","likho","likh","jama","jamma","delete","hata","kaat","rupiye","rupees","rs","₹","के","का","पे","पर","को","अकाउंट","में","रुपये","रु","रुपया","लिख","दो","करो","जमा","काट","हटा","और","है","हैं","वाले","की","चढ़ाओ","खाते","हिसाब","लगा", "bhai", "yaar"];
    
    let filteredTokens = wordsArray.filter(w => !fillerWords.includes(w));
    let nameWords = foundName.toLowerCase().split(" ");
    filteredTokens = filteredTokens.filter(w => !nameWords.includes(w) && w !== money.toString());

    let samaan = filteredTokens.join(" ").trim();
    if (samaan === "") samaan = type === 'udhar' ? "Udhar" : "Jama";

    let title = `Voice Entry (${type === 'udhar' ? 'Udhar Likhna' : 'Paise Jama'})`;
    
    showTripleInputModal(title, foundName, money, samaan, function(finalName, moneyStr, finalSamaan) {
        let finalMoney = Number(moneyStr);
        if (finalName === "" || isNaN(finalMoney) || finalMoney <= 0) { showError("Naam ya paise theek se nahi bhare!"); return; }
        
        let exactTime = new Date().toLocaleString("en-IN");
        let uniqueId = Date.now();
        
        if (khataRegister[finalName] === undefined) { khataRegister[finalName] = { totalBalance: 0, history:[] }; }
        
        if (type === 'udhar') {
            khataRegister[finalName].totalBalance += finalMoney;
            khataRegister[finalName].history.push({ id: uniqueId, type: 'udhar', amount: finalMoney, samaan: finalSamaan, time: exactTime });
        } else {
            khataRegister[finalName].totalBalance -= finalMoney;
            khataRegister[finalName].history.push({ id: uniqueId, type: 'jama', amount: finalMoney, samaan: finalSamaan, time: exactTime });
        }
        
        localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
        updateScreen();
        speakText(`${finalName} ke khate mein ${finalMoney} rupiye ${type === 'udhar' ? 'likh diye gaye hain' : 'jama kar liye gaye hain'}.`);
    });
}

/* ==========================================
   🛒 6. MAIN APP LOGIC (MANUAL ENTRY)
========================================== */
function loadShopDetails() { document.getElementById("shopNameDisplay").innerText = savedShopName; }

function editShopName() {
    showSingleInputModal("Dukan ka naya naam dalen:", savedShopName, function(nayaNaam) {
        if (nayaNaam !== "") { savedShopName = nayaNaam; localStorage.setItem("myShopName", savedShopName); loadShopDetails(); }
    });
}

function calculateShopTotal() {
    let totalDukanKaUdhar = 0;
    for (let grahak in khataRegister) { totalDukanKaUdhar += khataRegister[grahak].totalBalance; }
    document.getElementById("totalShopBalance").innerText = "₹" + totalDukanKaUdhar;
}

function addTransaction(type) {
    let name = document.getElementById("customerName").value.trim();
    let moneyStr = document.getElementById("amount").value;
    let money = Number(moneyStr);
    let items = document.getElementById("items").value;

    if (name === "" && (moneyStr === "" || money <= 0)) { showError("Naam aur paise dono bharein!"); return; } 
    else if (name === "") { showError("Naam nahi likha hai!"); return; } 
    else if (moneyStr === "" || money <= 0) { showError("Paise nahi bhare hain!"); return; }

    let exactTime = new Date().toLocaleString("en-IN");
    let uniqueId = Date.now(); 

    if (khataRegister[name] === undefined) { khataRegister[name] = { totalBalance: 0, history:[] }; }

    if (type === 'udhar') {
        khataRegister[name].totalBalance += money;
        khataRegister[name].history.push({ id: uniqueId, type: 'udhar', amount: money, samaan: items || "Udhar", time: exactTime });
    } else {
        khataRegister[name].totalBalance -= money;
        khataRegister[name].history.push({ id: uniqueId, type: 'jama', amount: money, samaan: items || "Jama kiye", time: exactTime });
    }

    localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
    document.getElementById("customerName").value = ""; document.getElementById("amount").value = ""; document.getElementById("items").value = "";
    updateScreen();
}

function quickTransaction(grahakKaNaam, type) {
    let title = `"${grahakKaNaam}" ka ${type === 'udhar' ? 'Udhar Likh' : 'Paise Jama'}`;
    showTripleInputModal(title, grahakKaNaam, "", "", function(finalName, moneyStr, items) {
        let money = Number(moneyStr);
        if (isNaN(money) || money <= 0) { showError("Sahi paise nahi bhare hain!"); return; }

        let exactTime = new Date().toLocaleString("en-IN");
        let uniqueId = Date.now();
        if (khataRegister[finalName] === undefined) { khataRegister[finalName] = { totalBalance: 0, history:[] }; }

        if (type === 'udhar') {
            khataRegister[finalName].totalBalance += money;
            khataRegister[finalName].history.push({ id: uniqueId, type: 'udhar', amount: money, samaan: items || "Udhar", time: exactTime });
        } else {
            khataRegister[finalName].totalBalance -= money;
            khataRegister[finalName].history.push({ id: uniqueId, type: 'jama', amount: money, samaan: items || "Jama kiye", time: exactTime });
        }
        localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
        updateScreen();
    });
}

function deleteTransactionItem(grahakKaNaam, transactionID) {
    let grahakData = khataRegister[grahakKaNaam];
    let billIndex = grahakData.history.findIndex(bill => bill.id === transactionID);
    if(billIndex === -1) return;
    let uskBazaHisaab = grahakData.history[billIndex];

    showConfirmModal(`Kya aap "${uskBazaHisaab.samaan}" ko delete karna chahte hain?`, function() {
        if (uskBazaHisaab.type === 'udhar') { grahakData.totalBalance -= uskBazaHisaab.amount; } 
        else { grahakData.totalBalance += uskBazaHisaab.amount; }
        
        grahakData.history.splice(billIndex, 1);
        localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
        updateScreen();
    });
}

function editCustomerName(puranaNaam) {
    showSingleInputModal("Grahak ka naya naam likhein:", puranaNaam, function(nayaNaam) {
        if (nayaNaam === "" || nayaNaam === puranaNaam) return; 
        if (khataRegister[nayaNaam] !== undefined) { showError("Bhai, is naam ka grahak pehle se dukan mein hai."); return; }

        khataRegister[nayaNaam] = khataRegister[puranaNaam];
        delete khataRegister[puranaNaam];
        localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
        updateScreen();
    });
}

function editTransaction(grahakKaNaam, transactionID) {
    let grahakData = khataRegister[grahakKaNaam];
    let uskBazaHisaab = grahakData.history.find(bill => bill.id === transactionID);
    if(!uskBazaHisaab) return; 

    showTripleInputModal("Entry Edit Karein", grahakKaNaam, uskBazaHisaab.amount, uskBazaHisaab.samaan, function(finalName, moneyStr, nayaSamaan) {
        let nayePaise = Number(moneyStr);
        if(isNaN(nayePaise) || nayePaise <= 0) { showError("Sahi paise nahi bhare hain!"); return; }

        if (uskBazaHisaab.type === 'udhar') { grahakData.totalBalance = grahakData.totalBalance - uskBazaHisaab.amount + nayePaise; } 
        else { grahakData.totalBalance = grahakData.totalBalance + uskBazaHisaab.amount - nayePaise; }

        uskBazaHisaab.samaan = nayaSamaan;
        uskBazaHisaab.amount = nayePaise;

        localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
        updateScreen();
    });
}

function sendToWhatsApp(grahakKaNaam) {
    let grahakKaData = khataRegister[grahakKaNaam];
    let message = `📘 *${savedShopName} - KhataBook* 📘\n\n👤 *Grahak:* ${grahakKaNaam}\n💰 *Baki Balance:* ₹${grahakKaData.totalBalance}\n\n*--- Hisaab Details ---*\n`;

    grahakKaData.history.forEach(function(bill) {
        let nishan = bill.type === 'udhar' ? '+ ₹' : '- ₹';
        message += `🗓️ ${bill.time}\n📝 ${bill.samaan} : ${nishan}${bill.amount}\n\n`;
    });

    let internetWalaMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${internetWalaMessage}`, '_blank');
}

function deleteAccount(grahakKaNaam) {
    showConfirmModal(`🚨 Kya aap sach mein "${grahakKaNaam}" ka pura khata udana chahte hain?`, function() {
        delete khataRegister[grahakKaNaam];
        localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
        updateScreen();
    });
}

function updateScreen(searchWord = "") {
    let listDiv = document.getElementById("accountList");
    listDiv.innerHTML = ""; 

    for (let grahak in khataRegister) {
        if (grahak.toLowerCase().includes(searchWord.toLowerCase())) {
            let grahakKaData = khataRegister[grahak];
            let historyHTML = "";
            let reversedHistory =[...grahakKaData.history].reverse();

            reversedHistory.forEach(function(bill) {
                let colorClass = bill.type === 'udhar' ? 'text-red' : 'text-green';
                let sign = bill.type === 'udhar' ? '+ ₹' : '- ₹';

                historyHTML += `
                    <li class="history-item">
                        <div>
                            <span>${bill.samaan}</span>
                            <span class="date-time">🕒 ${bill.time}</span>
                        </div>
                        <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end;">
                            <span class="${colorClass}">${sign}${bill.amount}</span>
                            <div style="display:flex; gap:5px;">
                                <button class="btn-edit" onclick="editTransaction('${grahak}', ${bill.id})">✏️ Edit</button>
                                <button class="btn-delete-item" onclick="deleteTransactionItem('${grahak}', ${bill.id})">🗑️ Delete</button>
                            </div>
                        </div>
                    </li>
                `;
            });

            let balanceColor = grahakKaData.totalBalance > 0 ? "color: #ff4757;" : "color: #2ed573;";

            listDiv.innerHTML += `
                <div class="account-card">
                    <div class="card-header">
                        <div class="header-row">
                            <h4 onclick="editCustomerName('${grahak}')" style="cursor:pointer;" title="Naam badalne ke liye click karein">👤 ${grahak} ✏️</h4>
                            <span style="font-weight:bold; font-size:18px; ${balanceColor}">₹${grahakKaData.totalBalance} Baki</span>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn-whatsapp" onclick="sendToWhatsApp('${grahak}')">📲 WhatsApp</button>
                            <button class="btn-delete" onclick="deleteAccount('${grahak}')">🗑️ Khata Delete</button>
                        </div>
                        
                        <div class="quick-actions">
                            <button class="btn-quick-udhar" onclick="quickTransaction('${grahak}', 'udhar')">➕ Naya Udhar Likh</button>
                            <button class="btn-quick-jama" onclick="quickTransaction('${grahak}', 'jama')">💰 Paise Jama Kar</button>
                        </div>
                    </div>
                    <ul class="history-list">
                        ${historyHTML}
                    </ul>
                </div>
            `;
        }
    }
    calculateShopTotal();
}

function searchCustomer() {
    let word = document.getElementById("searchInput").value;
    updateScreen(word);
}

loadShopDetails();
updateScreen();