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
        closeAllModals();
        callbackFunction(inputField.value.trim());
    };
}

// 🌟 NAYA: Triple Input Modal (Naam, Paise, Samaan - Galti theek karne ke liye)
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

function showConfirmModal(message, callbackFunction) {
    document.getElementById("confirmTitle").innerText = message;
    document.getElementById("confirmOverlay").style.display = "flex";
    document.getElementById("btnConfirmYes").onclick = function() {
        closeAllModals(); callbackFunction();
    };
}

function speakText(textMessage) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        let utterance = new SpeechSynthesisUtterance(textMessage);
        utterance.lang = 'hi-IN'; 
        window.speechSynthesis.speak(utterance);
    }
}

/* ==========================================
   🎙️ 2. VOICE AI LOGIC (WITH NEW FILTERS)
========================================== */
function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showError("Browser support nahi karta."); return;
    }

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

    // EASTER EGG (Creator wala)
    if (textLower.includes("kisne banaya") || textLower.includes("tumhe kisne") || textLower.includes("aapko kisne") || textLower.includes("किसने बनाया") || textLower.includes("किसने")) {
        let creatorMsg = "Mujhe Rihan Khan ne banaya hai, aur Khan Sahab Salai ke rahne wale hain, aur ye chahte hain ki India independent ban jaye.";
        showVoiceResponse("🎙️ " + creatorMsg);
        speakText(creatorMsg);
        return; 
    }

    // 🌟 FIX PROBLEM 3: Samaan box mein ₹ nahi aayega! (Pehle hi saare currency words hata do)
    let cleanedTextForAmount = textLower.replace(/[₹$]/g, "").trim();
    
    // 1. PAISE NIKALNA
    let amountMatch = cleanedTextForAmount.match(/\d+/);
    let money = amountMatch ? Number(amountMatch[0]) : 0;

    // 2. KAAM SAMAJHNA (Action)
    let type = 'udhar';
    if (/(jama|jamma|jma|prapt|aaye|jamaa|जमा)/i.test(cleanedTextForAmount)) { 
        type = 'jama'; 
    } else if (/(delete|kaat|hata|mita|डिलीट|काट|हटा)/i.test(cleanedTextForAmount)) { 
        type = 'delete'; 
    }
    
    // Balance check
    if (/(balance|kitne|kitna|baki|hisaab|batao|कितने|बाकी|हिसाब)/i.test(cleanedTextForAmount)) {
        if (money === 0) { type = 'balance'; }
    }

    // 3. NAAM NIKALNA
    let foundName = "";
    let existingCustomers = Object.keys(khataRegister);
    
    // Pehle purane grahako mein dhoondho
    for (let name of existingCustomers) {
        if (cleanedTextForAmount.includes(name.toLowerCase())) { foundName = name; break; }
    }

    // 🌟 FIX PROBLEM 2: Agar naam nahi mila toh naya AI Logic
    if (!foundName) {
        // Sentence ka pehla word nikal lo (Kyunki naam hamesha shuru mein hota hai)
        let words = cleanedTextForAmount.split(" ");
        foundName = words[0]; 
        foundName = foundName.charAt(0).toUpperCase() + foundName.slice(1);
    }

    // 4. BALANCE POOCHNE WALA JAWAB
    if (type === 'balance') {
        if (khataRegister[foundName] === undefined) {
            let msg = `Bhai, "${foundName}" ka dukan mein koi khata nahi hai.`;
            showVoiceResponse("🎙️ " + msg); speakText(msg); return;
        }
        let bal = khataRegister[foundName].totalBalance;
        let responseMsg = bal > 0 ? `${foundName} par ${bal} rupiye ka udhar baki hai.` : (bal < 0 ? `${foundName} ke ${Math.abs(bal)} rupiye jama hain.` : `${foundName} ka hisaab barabar hai.`);
        showVoiceResponse("🎙️ " + responseMsg); speakText(responseMsg); return;
    }

    // 5. DELETE WALA COMMAND
    if (type === 'delete') {
        showConfirmModal(`Voice AI: Kya aap sach mein "${foundName}" ka pura khata Delete karna chahte hain?`, function() {
            delete khataRegister[foundName]; localStorage.setItem("proKhataV5", JSON.stringify(khataRegister)); updateScreen(); speakText(`${foundName} ka khata delete ho gaya.`);
        });
        return;
    }

    if (money === 0) { showError(`Paise samajh nahi aaye.\nAapne bola: "${text}"`); return; }

    // 🌟 FIX PROBLEM 2 & 3: SAMAAN NIKALNA (Saare kachra words Delete)
    let fillerWordsRegex = /ke|ka|pe|par|ko|account|mein|me|khata|dhoondhkar|dhoodhkar|add|kar|do|abhi|chadhao|likho|likh|jama|jamma|delete|hata|kaat|rupiye|rupees|rs|₹|के|का|पे|पर|को|अकाउंट|में|रुपये|रु|लिख|दो|करो|जमा|काट|हटा|और|है|हैं|वाले|की|का|वाले/gi;
    
    let samaan = cleanedTextForAmount.replace(foundName.toLowerCase(), "")
                                     .replace(money.toString(), "")
                                     .replace(fillerWordsRegex, "")
                                     .trim();
    // Extra space hatana
    samaan = samaan.replace(/\s+/g, ' ').trim();
    if (samaan === "") samaan = type === 'udhar' ? "Udhar" : "Jama";

    // 🌟 FIX PROBLEM 1: TRIPLE INPUT MODAL (Jahan naam bhi theek kiya ja sake)
    let title = `Voice Entry (${type === 'udhar' ? 'Udhar Likhna' : 'Paise Jama'})`;
    
    showTripleInputModal(title, foundName, money, samaan, function(finalName, moneyStr, finalSamaan) {
        let finalMoney = Number(moneyStr);
        if (finalName === "" || isNaN(finalMoney) || finalMoney <= 0) {
            showError("Aapne naam ya paise theek se nahi bhare!"); return;
        }
        
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
   🛒 3. MAIN APP LOGIC (MANUAL)
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
    // Purana showDoubleInputModal iske liye theek hai (Kyunki naam pehle se pata hai)
    showTripleInputModal(title, grahakKaNaam, "", "", function(finalName, moneyStr, items) {
        let money = Number(moneyStr);
        if (isNaN(money) || money <= 0) { showError("Aapne sahi paise nahi bhare hain!"); return; }

        let exactTime = new Date().toLocaleString("en-IN");
        let uniqueId = Date.now();
        
        // Agar naam change kar diya gaya popup mein, toh check karo
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
        if(isNaN(nayePaise) || nayePaise <= 0) { showError("Aapne sahi paise nahi bhare hain!"); return; }

        // Balance adjust
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