// Database nikalna memory se (Local Storage)
let khataRegister = JSON.parse(localStorage.getItem("proKhataV5")) || {};
let savedShopName = localStorage.getItem("myShopName") || "Apni Dukan";

/* ==========================================
   🛠️ 1. CUSTOM POPUP (MODALS) CONTROLS
========================================== */

function closeAllModals() {
    document.getElementById("customAlertOverlay").style.display = "none";
    document.getElementById("singleInputOverlay").style.display = "none";
    document.getElementById("doubleInputOverlay").style.display = "none";
    document.getElementById("confirmOverlay").style.display = "none";
}

// Warning wala message
function showError(message) {
    document.getElementById("alertIconDisplay").innerText = "⚠️"; 
    document.getElementById("customAlertMessage").innerText = message;
    document.getElementById("customAlertOverlay").style.display = "flex";
}

// Robot (AI) ka jawab dikhane wala message
function showVoiceResponse(message) {
    document.getElementById("alertIconDisplay").innerText = "🤖"; 
    document.getElementById("customAlertMessage").innerText = message;
    document.getElementById("customAlertOverlay").style.display = "flex";
}

// Ek box wala popup (Dukan/Grahak ka naam badalne ke liye)
function showSingleInputModal(title, defaultValue, callbackFunction) {
    document.getElementById("singleInputTitle").innerText = title;
    let inputField = document.getElementById("singleInputValue");
    inputField.value = defaultValue;
    
    document.getElementById("singleInputOverlay").style.display = "flex";
    inputField.focus();

    document.getElementById("btnSingleSave").onclick = function() {
        let value = inputField.value.trim();
        closeAllModals();
        callbackFunction(value);
    };
}

// Do box wala popup (Udhar / Jama likhne ke liye)
function showDoubleInputModal(title, placeholder1, placeholder2, val1, val2, callbackFunction) {
    document.getElementById("doubleInputTitle").innerText = title;
    let input1 = document.getElementById("doubleInput1");
    let input2 = document.getElementById("doubleInput2");
    
    input1.placeholder = placeholder1;
    input2.placeholder = placeholder2;
    input1.value = val1;
    input2.value = val2;

    document.getElementById("doubleInputOverlay").style.display = "flex";
    input1.focus();

    document.getElementById("btnDoubleSave").onclick = function() {
        let moneyVal = input1.value;
        let detailsVal = input2.value.trim();
        closeAllModals();
        callbackFunction(moneyVal, detailsVal);
    };
}

// Haan / Naa poochna (Delete karne se pehle)
function showConfirmModal(message, callbackFunction) {
    document.getElementById("confirmTitle").innerText = message;
    document.getElementById("confirmOverlay").style.display = "flex";

    document.getElementById("btnConfirmYes").onclick = function() {
        closeAllModals();
        callbackFunction();
    };
}

/* ==========================================
   🗣️ 2. TEXT-TO-SPEECH (ROBOT KI AAWAZ)
========================================== */

function speakText(textMessage) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        let utterance = new SpeechSynthesisUtterance(textMessage);
        utterance.lang = 'hi-IN'; // Hindi bhasha
        utterance.rate = 1;       // Normal Speed
        window.speechSynthesis.speak(utterance);
    }
}

/* ==========================================
   🎙️ 3. VOICE AI (MIC) LOGIC & EASTER EGG
========================================== */

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showError("Aapka browser Voice feature support nahi karta. Kripya Chrome browser use karein.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi samajhne ki power

    const micBtn = document.getElementById("micBtn");
    const micStatus = document.getElementById("micStatus");

    recognition.onstart = function() {
        micBtn.classList.add("recording");
        micBtn.innerText = "🎙️ Sun raha hoon...";
        micStatus.innerText = "Sawaal poochein ya Udhar likhvayein...";
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
        showError("Theek se sunai nahi diya. Kripya dubara boliye!");
    };

    window.speechSynthesis.cancel();
    recognition.start();
}

function processVoiceCommand(text) {
    let textLower = text.toLowerCase();

    // 🌟 EASTER EGG: Creator Sawaal (Ab Hinglish aur Hindi dono samajh lega)
    if (textLower.includes("kisne banaya") || textLower.includes("tumhe kisne") || textLower.includes("aapko kisne") || textLower.includes("किसने बनाया") || textLower.includes("किसने")) {
        let creatorMsg = "Mujhe Rihan Khan ne banaya hai, aur Khan Sahab Salai ke rahne wale hain, aur ye chahte hain ki India independent ban jaye.";
        showVoiceResponse("🎙️ " + creatorMsg);
        speakText(creatorMsg);
        return; 
    }

    // 1. PAISE NIKALNA
    let amountMatch = textLower.match(/\d+/);
    let money = amountMatch ? Number(amountMatch[0]) : 0;

    // 2. KAAM SAMAJHNA: (Ab Hindi font words bhi add kiye hain)
    let type = 'udhar';
    if (textLower.includes("jama") || textLower.includes("jamma") || textLower.includes("जमा")) { 
        type = 'jama'; 
    } else if (textLower.includes("delete") || textLower.includes("kaat") || textLower.includes("hata") || textLower.includes("mita") || textLower.includes("काट") || textLower.includes("हटा") || textLower.includes("मिटा") || textLower.includes("डिलीट")) { 
        type = 'delete'; 
    }
    
    // Balance check karne ke lie
    if (textLower.includes("balance") || textLower.includes("kitne") || textLower.includes("kitna") || textLower.includes("baki") || textLower.includes("hisaab") || textLower.includes("batao") || textLower.includes("कितने") || textLower.includes("बाकी") || textLower.includes("हिसाब") || textLower.includes("बताओ")) {
        if (money === 0) { type = 'balance'; }
    }

    // 3. NAAM NIKALNA
    let foundName = "";
    let existingCustomers = Object.keys(khataRegister);
    for (let name of existingCustomers) {
        if (textLower.includes(name.toLowerCase())) { foundName = name; break; }
    }

    if (!foundName) {
        // Hinglish ke sath Hindi ke 'के', 'का', 'में' bhi shamil hain
        let nameMatch = textLower.match(/(.*?)\s+(ke|ka|pe|par|ko|account|mein|के|का|पे|पर|को|अकाउंट|में)/);
        if (nameMatch && nameMatch[1]) {
            foundName = nameMatch[1].trim();
            foundName = foundName.charAt(0).toUpperCase() + foundName.slice(1);
        }
    }

    if (!foundName) {
        showError(`Grahak ka naam samajh nahi aaya.\nAapne bola: "${text}"`); return;
    }

    // 🌟 4. BALANCE POOCHNE WALA JAWAB
    if (type === 'balance') {
        if (khataRegister[foundName] === undefined) {
            let msg = `Bhai, "${foundName}" ka dukan mein koi khata nahi hai.`;
            showVoiceResponse("🎙️ " + msg);
            speakText(msg);
            return;
        }
        
        let bal = khataRegister[foundName].totalBalance;
        let responseMsg = "";
        
        if (bal > 0) {
            responseMsg = `${foundName} par ${bal} rupiye ka udhar baki hai.`;
        } else if (bal < 0) {
            responseMsg = `${foundName} ke ${Math.abs(bal)} rupiye advance jama hain.`;
        } else {
            responseMsg = `${foundName} ka hisaab barabar hai. Koi udhar baki nahi hai.`;
        }
        
        showVoiceResponse("🎙️ " + responseMsg);
        speakText(responseMsg);
        return;
    }

    // 5. DELETE WALA COMMAND
    if (type === 'delete') {
        showConfirmModal(`Voice AI: Kya aap sach mein "${foundName}" ka pura khata Delete karna chahte hain?`, function() {
            delete khataRegister[foundName];
            localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
            updateScreen();
            speakText(`${foundName} ka khata hamesha ke liye delete kar diya gaya hai.`);
        });
        return;
    }

    // 6. UDHAR / JAMA WALA COMMAND
    if (money === 0) {
        showError(`Paise samajh nahi aaye. Aapne bola: "${text}"`); return;
    }

    // Samaan nikalne ke liye faltu words filter karna (Hindi bhi shamil hai)
    let samaan = textLower.replace(foundName.toLowerCase(), "")
                     .replace(money, "")
                     .replace(/ke|ka|pe|par|ko|account|mein|rupiye|likh|do|karo|jama|delete|kaat|hata|aur|के|का|पे|पर|को|अकाउंट|में|रुपये|रु|लिख|दो|करो|जमा|काट|हटा|और|है|हैं/g, "").trim();
    if (samaan === "") samaan = type === 'udhar' ? "Udhar" : "Jama";

    // Modals ke through Confirm karwana
    let title = `Voice Entry: ${foundName} (${type === 'udhar' ? 'Udhar Likhna' : 'Paise Jama'})`;
    showDoubleInputModal(title, "₹ Amount", "🛍️ Samaan", money, samaan, function(moneyStr, finalSamaan) {
        let finalMoney = Number(moneyStr);
        if (isNaN(finalMoney) || finalMoney <= 0) return;
        
        let exactTime = new Date().toLocaleString("en-IN");
        let uniqueId = Date.now();
        
        if (khataRegister[foundName] === undefined) { khataRegister[foundName] = { totalBalance: 0, history:[] }; }
        
        if (type === 'udhar') {
            khataRegister[foundName].totalBalance += finalMoney;
            khataRegister[foundName].history.push({ id: uniqueId, type: 'udhar', amount: finalMoney, samaan: finalSamaan, time: exactTime });
        } else {
            khataRegister[foundName].totalBalance -= finalMoney;
            khataRegister[foundName].history.push({ id: uniqueId, type: 'jama', amount: finalMoney, samaan: finalSamaan, time: exactTime });
        }
        
        localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
        updateScreen();
        
        let bolneWalaMsg = `${foundName} ke khate mein ${finalMoney} rupiye ${type === 'udhar' ? 'likh diye gaye hain' : 'jama kar liye gaye hain'}.`;
        speakText(bolneWalaMsg);
    });
}

/* ==========================================
   🛒 4. MAIN APP LOGIC (MANUAL ENTRY)
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

    if (name === "" && (moneyStr === "" || money <= 0)) { showError("Aapne na toh grahak ka naam likha hai aur na hi paise bhare hain!"); return; } 
    else if (name === "") { showError("Aapne grahak ka naam nahi likha hai!"); return; } 
    else if (moneyStr === "" || money <= 0) { showError("Aapne udhar ya jama ke paise nahi bhare hain!"); return; }

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
    document.getElementById("customerName").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("items").value = "";
    updateScreen();
}

function quickTransaction(grahakKaNaam, type) {
    let title = `"${grahakKaNaam}" ka ${type === 'udhar' ? 'Udhar Likh' : 'Paise Jama Kar'}`;
    showDoubleInputModal(title, "₹ Kitne rupiye?", "🛍️ Samaan ki detail", "", "", function(moneyStr, items) {
        let money = Number(moneyStr);
        if (isNaN(money) || money <= 0) { showError("Aapne sahi paise nahi bhare hain!"); return; }

        let exactTime = new Date().toLocaleString("en-IN");
        let uniqueId = Date.now();
        let grahakData = khataRegister[grahakKaNaam];

        if (type === 'udhar') {
            grahakData.totalBalance += money;
            grahakData.history.push({ id: uniqueId, type: 'udhar', amount: money, samaan: items || "Udhar", time: exactTime });
        } else {
            grahakData.totalBalance -= money;
            grahakData.history.push({ id: uniqueId, type: 'jama', amount: money, samaan: items || "Jama kiye", time: exactTime });
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

    showConfirmModal(`Kya aap sach mein "${uskBazaHisaab.samaan}" ko delete karna chahte hain?`, function() {
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

    showDoubleInputModal("Entry Edit Karein", "₹ Naye Paise", "🛍️ Naya Samaan", uskBazaHisaab.amount, uskBazaHisaab.samaan, function(moneyStr, nayaSamaan) {
        let nayePaise = Number(moneyStr);
        if(isNaN(nayePaise) || nayePaise <= 0) { showError("Aapne sahi paise nahi bhare hain!"); return; }

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

// App chalu hote hi data aur naam load karo
loadShopDetails();
updateScreen();