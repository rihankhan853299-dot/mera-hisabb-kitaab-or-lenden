let khataRegister = JSON.parse(localStorage.getItem("proKhataV5")) || {};
let savedShopName = localStorage.getItem("myShopName") || "Apni Dukan";

/* ==========================================================
   🛠️ CUSTOM POPUP (MODAL) CONTROLLERS 
========================================================== */

// 1. Koi bhi modal open ho, use band karne ka function
function closeAllModals() {
    document.getElementById("customAlertOverlay").style.display = "none";
    document.getElementById("singleInputOverlay").style.display = "none";
    document.getElementById("doubleInputOverlay").style.display = "none";
    document.getElementById("confirmOverlay").style.display = "none";
}

// 2. Galti dikhane wala Popup
function showError(message) {
    document.getElementById("customAlertMessage").innerText = message;
    document.getElementById("customAlertOverlay").style.display = "flex";
}

// 3. Ek Input wala Popup (Shop Name / Customer Name ke liye)
function showSingleInputModal(title, defaultValue, callbackFunction) {
    document.getElementById("singleInputTitle").innerText = title;
    let inputField = document.getElementById("singleInputValue");
    inputField.value = defaultValue;
    
    document.getElementById("singleInputOverlay").style.display = "flex";
    inputField.focus();

    // Jab OK (Save) button dabaya jaye
    document.getElementById("btnSingleSave").onclick = function() {
        let value = inputField.value.trim();
        closeAllModals(); // Popup band karo
        callbackFunction(value); // Jo kaam karna tha wo karo
    };
}

// 4. Do Input wala Popup (Naya Udhar / Edit ke liye)
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

// 5. Delete Confirm karne wala Popup
function showConfirmModal(message, callbackFunction) {
    document.getElementById("confirmTitle").innerText = message;
    document.getElementById("confirmOverlay").style.display = "flex";

    document.getElementById("btnConfirmYes").onclick = function() {
        closeAllModals();
        callbackFunction();
    };
}


/* ==========================================================
   🛒 MAIN APP LOGIC 
========================================================== */

function loadShopDetails() {
    document.getElementById("shopNameDisplay").innerText = savedShopName;
}

// 🌟 FIX: Ab Dukan ka naam badalne ke liye Center Popup aayega!
function editShopName() {
    showSingleInputModal("Dukan ka naya naam dalen:", savedShopName, function(nayaNaam) {
        if (nayaNaam !== "") {
            savedShopName = nayaNaam; 
            localStorage.setItem("myShopName", savedShopName); 
            loadShopDetails(); 
        }
    });
}

function calculateShopTotal() {
    let totalDukanKaUdhar = 0;
    for (let grahak in khataRegister) {
        totalDukanKaUdhar += khataRegister[grahak].totalBalance;
    }
    document.getElementById("totalShopBalance").innerText = "₹" + totalDukanKaUdhar;
}

function addTransaction(type) {
    let name = document.getElementById("customerName").value.trim();
    let moneyStr = document.getElementById("amount").value;
    let money = Number(moneyStr);
    let items = document.getElementById("items").value;

    if (name === "" && (moneyStr === "" || money <= 0)) {
        showError("Bhai, aapne na toh grahak ka naam likha hai aur na hi paise bhare hain!"); return; 
    } else if (name === "") {
        showError("Bhai, aapne grahak ka naam nahi likha hai!"); return;
    } else if (moneyStr === "" || money <= 0) {
        showError("Bhai, aapne udhar ya jama ke paise nahi bhare hain!"); return;
    }

    let exactTime = new Date().toLocaleString("en-IN");
    let uniqueId = Date.now(); 

    if (khataRegister[name] === undefined) { khataRegister[name] = { totalBalance: 0, history:[] }; }

    if (type === 'udhar') {
        khataRegister[name].totalBalance += money;
        khataRegister[name].history.push({ id: uniqueId, type: 'udhar', amount: money, samaan: items || "Udhar", time: exactTime });
    } else if (type === 'jama') {
        khataRegister[name].totalBalance -= money;
        khataRegister[name].history.push({ id: uniqueId, type: 'jama', amount: money, samaan: items || "Jama kiye", time: exactTime });
    }

    localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));

    document.getElementById("customerName").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("items").value = "";
    updateScreen();
}

// 🌟 FIX: Quick Udhar Likhne par Center Popup (2 Input wala) aayega!
function quickTransaction(grahakKaNaam, type) {
    let title = `"${grahakKaNaam}" ka ${type === 'udhar' ? 'Udhar Likh' : 'Paise Jama Kar'}`;
    
    showDoubleInputModal(title, "₹ Kitne rupiye?", "🛍️ Samaan ki detail", "", "", function(moneyStr, items) {
        let money = Number(moneyStr);
        if (isNaN(money) || money <= 0) {
            showError("Aapne sahi paise (Number) nahi bhare hain bhai!"); return;
        }

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

// 🌟 FIX: Delete Confirm karne ke liye Center Popup aayega!
function deleteTransactionItem(grahakKaNaam, transactionID) {
    let grahakData = khataRegister[grahakKaNaam];
    let billIndex = grahakData.history.findIndex(bill => bill.id === transactionID);
    if(billIndex === -1) return;
    let uskBazaHisaab = grahakData.history[billIndex];

    showConfirmModal(`Kya aap sach mein "${uskBazaHisaab.samaan}" (₹${uskBazaHisaab.amount}) ko delete karna chahte hain?`, function() {
        if (uskBazaHisaab.type === 'udhar') {
            grahakData.totalBalance -= uskBazaHisaab.amount;
        } else {
            grahakData.totalBalance += uskBazaHisaab.amount;
        }
        grahakData.history.splice(billIndex, 1);
        localStorage.setItem("proKhataV5", JSON.stringify(khataRegister));
        updateScreen();
    });
}

function editCustomerName(puranaNaam) {
    showSingleInputModal("Grahak ka naya naam likhein:", puranaNaam, function(nayaNaam) {
        if (nayaNaam === "" || nayaNaam === puranaNaam) return; 
        if (khataRegister[nayaNaam] !== undefined) { 
            showError("Bhai, is naam ka grahak pehle se dukan mein hai."); return; 
        }

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
        if(isNaN(nayePaise) || nayePaise <= 0) { 
            showError("Aapne sahi paise nahi bhare hain!"); return; 
        }

        if (uskBazaHisaab.type === 'udhar') {
            grahakData.totalBalance = grahakData.totalBalance - uskBazaHisaab.amount + nayePaise;
        } else {
            grahakData.totalBalance = grahakData.totalBalance + uskBazaHisaab.amount - nayePaise;
        }

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