// --- app.js ---

let db = {
    nick: "", avatar: "", theme: "#00ffff", level: 1, xp: 0, artes: [], inventory: [], questTimers: {}
};

const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Ruby"];
const bjjBelts = ["#ffffff", "#0044cc", "#6600cc", "#663300", "#111111", "#cc0000"];

function init() {
    const saved = localStorage.getItem('pegasus_db_v5');
    if (saved) {
        db = JSON.parse(saved);
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        applyTheme();
        updateUI();
    }
}

function switchTab(tabName, btnElement) {
    document.querySelectorAll('.page').forEach(page => {
        if(page.id !== 'setup-screen') page.classList.add('hidden');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('page-' + tabName).classList.remove('hidden');
    btnElement.classList.add('active');
    updateUI();
}

function createProfile() {
    const nick = document.getElementById('input-nick').value;
    if (!nick) return showAlert("Error: Nickname required.");
    db.nick = nick;
    processImage(document.getElementById('input-avatar'), () => saveAndRefresh());
}

function updateProfile() {
    const nick = document.getElementById('edit-nick').value;
    if (nick) db.nick = nick;
    processImage(document.getElementById('edit-avatar'), () => {
        showAlert("Profile Updated!"); saveAndRefresh();
    });
}

function updateThemeColor() {
    db.theme = document.getElementById('edit-color').value;
    applyTheme(); saveAndRefresh(); showAlert("Theme Updated!");
}

function applyTheme() {
    document.documentElement.style.setProperty('--accent', db.theme);
    document.getElementById('edit-color').value = db.theme;
}

function processImage(fileInput, callback) {
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { db.avatar = e.target.result; callback(); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { callback(); }
}

function saveAndRefresh() {
    localStorage.setItem('pegasus_db_v5', JSON.stringify(db));
    if(!document.getElementById('setup-screen').classList.contains('hidden')) {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
    }
    updateUI();
}

function addXP(amount) {
    db.xp += amount;
    while (db.xp >= 100) { db.level++; db.xp -= 100; showAlert(`LEVEL UP! Nível ${db.level}`); }
    saveAndRefresh();
}

function rollLoot() {
    const roll = Math.random() * 100;
    const sortedItems = [...codexItems].sort((a,b) => a.chance - b.chance);
    for (let item of sortedItems) {
        if (roll <= item.chance) {
            if (!db.inventory.includes(item.id)) {
                db.inventory.push(item.id);
                showAlert(`LOOT: ${item.name} (${item.rarity})`);
                saveAndRefresh();
            } else { addXP(5); }
            return;
        }
    }
}

function claimQuest(questId, xp) {
    db.questTimers[questId] = Date.now();
    addXP(xp); rollLoot(); updateUI();
}

function isQuestAvailable(questId, type) {
    const lastDone = db.questTimers[questId];
    if (!lastDone) return true;
    const now = new Date(), last = new Date(lastDone);
    if (type === "daily") return last.getDate() !== now.getDate();
    if (type === "weekly") {
        let nextMon = new Date(last); nextMon.setDate(last.getDate() + ((1 + 7 - last.getDay()) % 7 || 7));
        return now >= nextMon;
    }
    if (type === "monthly") return now >= new Date(last.getFullYear(), last.getMonth() + 1, 1);
    return false;
}

function changeStripe(index, delta) {
    let arte = db.artes[index];
    let isBjj = arte.name.toLowerCase().includes('jiu-jitsu') || arte.name.toLowerCase().includes('jiujitsu');
    
    arte.graus += delta;
    
    if (delta > 0) { addXP(20); showAlert("Grau adicionado! +20 XP"); }
    else { db.xp -= 10; if(db.xp < 0) db.xp = 0; showAlert("Grau removido. Penalidade de XP."); }

    if (isBjj) {
        let currentBeltIdx = bjjBelts.indexOf(arte.color.toLowerCase());
        if(currentBeltIdx === -1) currentBeltIdx = 0;
        
        if (arte.graus > 4) { 
            if(currentBeltIdx < bjjBelts.length - 1) {
                arte.color = bjjBelts[currentBeltIdx + 1];
                arte.graus = 0;
                showAlert("PROMOÇÃO DE FAIXA! Excelente.");
            } else { arte.graus = 4; } 
        } else if (arte.graus < 0) { 
            if (currentBeltIdx > 0) {
                arte.color = bjjBelts[currentBeltIdx - 1];
                arte.graus = 4;
                showAlert("Rebaixado de faixa.");
            } else { arte.graus = 0; }
        }
    } else {
        if(arte.graus < 0) arte.graus = 0;
    }
    saveAndRefresh();
}

function addMartialArt() {
    const name = document.getElementById('new-ma-name').value;
    const date = document.getElementById('new-ma-date').value;
    const color = document.getElementById('new-ma-color').value;
    if (!name || !date) return showAlert("Error: Name and Date required.");
    db.artes.push({ name, date, color, graus: 0 });
    document.getElementById('new-ma-name').value = '';
    saveAndRefresh();
}

function updateUI() {
    document.getElementById('header-nick').innerText = db.nick;
    document.getElementById('header-avatar').src = db.avatar || 'https://via.placeholder.com/60/111/fff?text=OP';
    document.getElementById('header-level').innerText = db.level;
    document.getElementById('header-xp').innerText = db.xp;
    document.getElementById('header-xp-bar').style.width = db.xp + "%";
    
    let rankIdx = Math.floor(db.level / 10);
    document.getElementById('header-rank').innerText = ranks[Math.min(rankIdx, ranks.length - 1)].toUpperCase();

    renderQuests(); renderCodex(); renderMartialArts(); renderSkills();
}

function renderQuests() {
    ['daily', 'weekly', 'monthly'].forEach(type => {
        const container = document.getElementById(`quests-${type}-container`);
        container.innerHTML = '';
        questsDB.filter(q => q.type === type).forEach(q => {
            const avail = isQuestAvailable(q.id, q.type);
            container.innerHTML += `
                <div class="quest-box" style="opacity: ${avail ? '1' : '0.4'}">
                    <div class="quest-info">
                        <h3>${q.title}</h3>
                        <p>${q.desc} <br><span style="color:var(--accent)">+${q.xp} XP</span></p>
                    </div>
                    <button class="btn-claim" ${!avail ? 'disabled' : ''} onclick="claimQuest('${q.id}', ${q.xp})">
                        ${avail ? 'EXECUTE' : 'DONE'}
                    </button>
                </div>`;
        });
    });
}

function renderCodex() {
    const grid = document.getElementById('codex-grid');
    grid.innerHTML = '';
    codexItems.forEach(item => {
        const unlocked = db.inventory.includes(item.id);
        grid.innerHTML += unlocked ? `
            <div class="item-card ${item.css}">
                <div class="item-icon">${item.icon}</div>
                <div class="item-title">${item.name}</div>
                <div class="item-desc">${item.desc}</div>
                <div style="font-size: 0.6rem; margin-top:5px;">[ ${item.rarity} ]</div>
            </div>` : `
            <div class="item-card locked">
                <div class="item-icon">❔</div>
                <div class="item-title">DESCONHECIDO</div>
                <div class="item-desc">Item trancado na base de dados.</div>
            </div>`;
    });
}

function renderMartialArts() {
    const list = document.getElementById('martial-arts-list');
    list.innerHTML = "";
    db.artes.forEach((a, i) => {
        const days = Math.floor(Math.abs(new Date() - new Date(a.date)) / 86400000);
        const stripes = '<div class="stripe"></div>'.repeat(a.graus);
        list.innerHTML += `
            <div class="belt-container">
                <div style="display:flex; justify-content:space-between; color:#fff;">
                    <span style="font-weight:bold; text-transform:uppercase;">${a.name}</span>
                    <span style="color:var(--accent);">${days} Days</span>
                </div>
                <div class="belt" style="background-color: ${a.color};">
                    <div class="stripes">${stripes}</div>
                </div>
                <div class="grau-controls">
                    <button class="btn-grau" onclick="changeStripe(${i}, -1)">-</button>
                    <span style="color:#aaa; font-size:0.8rem; line-height: 25px;">${a.graus} Graus</span>
                    <button class="btn-grau" onclick="changeStripe(${i}, 1)">+</button>
                </div>
                <button onclick="if(confirm('Delete record?')){ db.artes.splice(${i}, 1); saveAndRefresh(); }" style="padding: 5px; margin-top: 5px; font-size: 0.7rem; border-color: #444; color: #888;">Remover Disciplina</button>
            </div>`;
    });
}

function renderSkills() {
    const container = document.getElementById('skills-container');
    container.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">Habilidades requerem nível mínimo de Operador para destravar.</p>';
    
    const categories = { tech: "O ARQUITETO (Tech)", combat: "O OPERADOR (Físico)", mental: "O ESTRATEGISTA (Mental)" };
    
    for(let cat in skillsDB) {
        container.innerHTML += `<h3 style="color: #fff; font-size: 0.9rem; margin: 15px 0 5px 0;">${categories[cat]}</h3>`;
        skillsDB[cat].forEach(skill => {
            const unlocked = db.level >= skill.req;
            container.innerHTML += `
                <div class="skill-node ${unlocked ? 'unlocked' : 'locked'}" onclick="showAlert('${unlocked ? skill.desc : `Requer Nível ${skill.req}`} ')">
                    ${skill.name} ${unlocked ? '' : `(Nv. ${skill.req})`}
                </div>`;
        });
    }
}

function showAlert(msg) {
    const box = document.getElementById('custom-alert');
    box.innerText = msg; box.classList.add('show');
    setTimeout(() => box.classList.remove('show'), 3000);
}

function resetSystem() {
    if(confirm("WARNING: Apagar todos os dados?")) { localStorage.removeItem('pegasus_db_v5'); location.reload(); }
}

window.onload = init;
