// --- app.js ---

let db = {
    nick: "", avatar: "", theme: "#00ffff", level: 1, xp: 0, skillPoints: 0, 
    artes: [], inventory: [], unlockedSkills: [], customSkills: [],
    activeQuests: { daily: [], weekly: [], monthly: [] },
    questResets: { daily: 0, weekly: 0, monthly: 0 },
    customQuests: [],
    
    // LIMITES DE CRIAÇÃO (1 por ciclo)
    customLimits: { daily: false, weekly: false, monthly: false },
    
    // INVENTÁRIO
    occupation: "Computer Scientist",
    inventorySlots: 5,
    duplicates: [],
    collections: [],
    briefings: []
};

const ranks = [
    { name: "Bronze", color: "#cd7f32" }, { name: "Silver", color: "#c0c0c0" }, 
    { name: "Gold", color: "#ffd700" }, { name: "Platinum", color: "#e5e4e2" }, 
    { name: "Diamond", color: "#b9f2ff" }, { name: "Master", color: "#ff00ff" }, 
    { name: "Grandmaster", color: "#ff0000" }, { name: "Ruby", color: "#e0115f" }
];

function init() {
    const saved = localStorage.getItem('pegasus_db_v8');
    if (saved) {
        let loaded = JSON.parse(saved);
        db = { ...db, ...loaded };
        
        // Garante a existência dos arrays em saves antigos
        if(!db.duplicates) db.duplicates = [];
        if(!db.collections) db.collections = [];
        if(!db.briefings) db.briefings = [];
        if(!db.inventorySlots) db.inventorySlots = 5;
        if(!db.occupation) db.occupation = "Computer Scientist";
        if(!db.customLimits) db.customLimits = { daily: false, weekly: false, monthly: false };

        if(db.artes) { db.artes.forEach(a => { if (a.graus < 0) a.graus = 0; }); }

        // Corrige status de missões antigas
        ['daily', 'weekly', 'monthly'].forEach(t => {
            db.activeQuests[t].forEach(q => { if(!q.status) q.status = 'available'; });
        });
        db.customQuests.forEach(q => { if(!q.status) q.status = 'available'; });

        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
    }
    
    setupDynamicDropdowns();
    setupNotifications();
    checkQuestResets(); 
    applyTheme();
    updateUI();
}

function setupDynamicDropdowns() {
    const maSelect = document.getElementById('new-ma-type');
    if(maSelect && typeof progressionTracks !== 'undefined') {
        maSelect.innerHTML = Object.keys(progressionTracks).map(track => `<option value="${track}">${track}</option>`).join('');
    }
    const skillCatSelect = document.getElementById('new-skill-cat');
    if(skillCatSelect && typeof areasDB !== 'undefined') {
        skillCatSelect.innerHTML = areasDB.map(area => `<option value="${area.id}">${area.icon} ${area.name}</option>`).join('');
    }
}

function setupNotifications() {
    if ("Notification" in window) {
        Notification.requestPermission();
    }
}

// === SISTEMA DE MISSÕES E TEMPO ===

function checkQuestResets() {
    const now = new Date();
    let updated = false;

    if (now.getDate() !== new Date(db.questResets.daily).getDate()) {
        db.activeQuests.daily = getRandomQuests('daily', 3); 
        db.questResets.daily = now.getTime();
        db.customLimits.daily = false; 
        db.customQuests = db.customQuests.filter(q => q.type !== 'daily'); 
        updated = true;
    }

    const lastWeekly = new Date(db.questResets.weekly);
    const daysSinceWeekly = (now - lastWeekly) / (1000 * 60 * 60 * 24);
    if (daysSinceWeekly >= 7 || (now.getDay() === 1 && lastWeekly.getDay() !== 1)) {
        db.activeQuests.weekly = getRandomQuests('weekly', 2);
        db.questResets.weekly = now.getTime();
        db.customLimits.weekly = false;
        db.customQuests = db.customQuests.filter(q => q.type !== 'weekly');
        updated = true;
    }

    if (now.getMonth() !== new Date(db.questResets.monthly).getMonth()) {
        db.activeQuests.monthly = getRandomQuests('monthly', 1);
        db.questResets.monthly = now.getTime();
        db.customLimits.monthly = false;
        db.customQuests = db.customQuests.filter(q => q.type !== 'monthly');
        updated = true;
    }

    if (updated) saveAndRefresh();
}

function getRandomQuests(type, count) {
    const shuffled = [...questsPool[type]].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(q => ({...q, status: 'available'}));
}

function createCustomQuest() {
    const title = document.getElementById('custom-quest-title').value;
    const type = document.getElementById('custom-quest-type').value;
    
    if (!title) return showAlert("Necessário definir objetivo.");
    if (db.customLimits[type]) return showAlert(`Limite atingido: Você já definiu sua missão ${type} ativa.`);
    
    const baseXP = type === 'daily' ? 50 : type === 'weekly' ? 150 : 500;
    const customXP = Math.floor(baseXP * 0.20); 

    db.customQuests.push({ 
        id: 'cq_' + Date.now(), title, type, xp: customXP, isCustom: true, area: "Pessoal", status: 'available' 
    });
    
    db.customLimits[type] = true; 
    document.getElementById('custom-quest-title').value = '';
    
    saveAndRefresh();
    showAlert("Objetivo registrado. XP Reduzida (Custom).");
}

function actQuest(id, type, isCustom, action) {
    let list = isCustom ? db.customQuests : db.activeQuests[type];
    let quest = list.find(q => q.id === id);
    if (!quest) return;

    if (action === 'start') {
        quest.status = 'in_progress';
        quest.startTime = Date.now(); 
        quest.warned = false; 
        saveAndRefresh();
        showAlert("Missão Iniciada! O relógio está correndo.");
    } else if (action === 'complete') {
        quest.status = 'completed';
        addXP(quest.xp);
        rollLoot();
        saveAndRefresh();
    }
}

// === XP E PROGRESSÃO ===
function addXP(amount) {
    db.xp += amount;
    while (db.xp >= 100) { db.level++; db.xp -= 100; db.skillPoints++; showAlert(`LEVEL UP! Nível ${db.level} | +1 SP`); }
    saveAndRefresh();
}

function removeXP(amount) {
    db.xp -= amount;
    while (db.xp < 0) {
        if (db.level > 1) { db.level--; db.xp += 100; showAlert(`NÍVEL CAIU... Agora Nível ${db.level}`); } 
        else { db.xp = 0; break; }
    }
    saveAndRefresh();
}

// === HABILIDADES ===
function createCustomSkill() {
    const name = document.getElementById('new-skill-name').value;
    const cat = document.getElementById('new-skill-cat').value;
    const req = parseInt(document.getElementById('new-skill-req').value);
    const cost = parseInt(document.getElementById('new-skill-cost').value);
    const desc = document.getElementById('new-skill-desc').value;

    if (!name || !desc) return showAlert("Erro: Nome e descrição obrigatórios.");
    db.customSkills.push({ id: 'cust_' + Date.now(), name, category: cat, req, cost, desc });
    document.getElementById('new-skill-name').value = '';
    document.getElementById('new-skill-desc').value = '';
    saveAndRefresh(); showAlert(`Nova trilha forjada: ${name}`);
}

function unlockSkill(skillId, reqLevel, cost) {
    if (db.unlockedSkills.includes(skillId)) return showAlert("Habilidade já destravada.");
    if (db.level < reqLevel) return showAlert(`Requer Nível ${reqLevel}.`);
    if (db.skillPoints < cost) return showAlert(`Sem Skill Points. Custa: ${cost} SP.`);
    
    db.skillPoints -= cost;
    db.unlockedSkills.push(skillId);
    saveAndRefresh(); showAlert("Habilidade Desbloqueada!");
}

// === DISCIPLINAS ===
function changeStripe(index, delta) {
    let arte = db.artes[index];
    let beltsArray = progressionTracks[arte.type] || progressionTracks["Outro"];
    
    arte.graus += delta;
    
    let currentBeltIdx = beltsArray.indexOf(arte.color);
    if(currentBeltIdx === -1) currentBeltIdx = 0;
    
    if (arte.graus > 4) { 
        if(currentBeltIdx < beltsArray.length - 1) {
            arte.color = beltsArray[currentBeltIdx + 1];
            arte.graus = 0; showAlert("PROMOÇÃO! Novo patamar alcançado.");
        } else { arte.graus = 4; } 
    } else if (arte.graus < 0) { 
        if (currentBeltIdx > 0) {
            arte.color = beltsArray[currentBeltIdx - 1];
            arte.graus = 4; showAlert("Rebaixado de nível.");
        } else { arte.graus = 0; }
    }

    if (delta > 0) { addXP(20); showAlert("Grau adicionado! +20 XP"); } 
    else { removeXP(15); showAlert("Grau removido. Penalidade de XP."); }
    saveAndRefresh();
}

function addDiscipline() {
    const type = document.getElementById('new-ma-type').value;
    const date = document.getElementById('new-ma-date').value;
    if (!type || !date) return showAlert("Erro: Preencha a disciplina e a data.");
    
    const color = progressionTracks[type] ? progressionTracks[type][0] : "#ffffff"; 
    db.artes.push({ type, name: type, date, color, graus: 0 });
    saveAndRefresh();
}

// === LOOT E INVENTÁRIO ===
function rollLoot() {
    const roll = Math.random() * 100;
    const sortedItems = [...codexItems].sort((a,b) => a.chance - b.chance);
    for (let item of sortedItems) {
        if (item.chance === 0) continue; 
        if (roll <= item.chance) {
            if (!db.inventory.includes(item.id)) {
                db.inventory.push(item.id);
                showAlert(`LOOT INÉDITO: ${item.name} (${item.rarity})`);
            } else { 
                if (item.rarity === "Epic" || item.rarity === "Legendary" || item.rarity === "Mythic") {
                    addXP(50); showAlert(`Item Lendário Repetido convertido em +50 XP!`);
                } else {
                    if (db.duplicates.length < db.inventorySlots) {
                        db.duplicates.push(item.id); showAlert(`Já possui! ${item.name} enviado ao Inventário.`);
                    } else {
                        showAlert(`Inventário Cheio! Expanda os Slots.`); addXP(5); 
                    }
                }
            } 
            saveAndRefresh(); return;
        }
    }
}

function expandInventory() {
    if (db.skillPoints >= 1) {
        db.skillPoints -= 1; db.inventorySlots += 3;
        saveAndRefresh(); showAlert("Inventário expandido em +3 Slots!");
    } else { showAlert("SP Insuficiente. Custa 1 SP."); }
}

function checkBriefingAchievement() {
    if (db.briefings.length >= 49 && !db.inventory.includes(998)) {
        db.inventory.push(998); showAlert("REDE GLOBAL HACKEADA: Você desbloqueou The Traveller!");
    }
}

function checkCollectorAchievement() {
    if (db.collections.length >= 99 && !db.inventory.includes(999)) {
        db.inventory.push(999); showAlert("LENDA VIVA: Você desbloqueou The Collector!");
    }
}

function convertDuplicate(dupIndex, targetType) {
    db.duplicates.splice(dupIndex, 1); 

    const colMax = 99; const briMax = 49;
    const colDone = db.collections.length >= colMax;
    const briDone = db.briefings.length >= briMax;

    if (colDone && briDone) {
        db.skillPoints += 1; showAlert("Tudo completo! Item convertido em +1 SP.");
    } else if (targetType === 'collection' && !colDone) {
        const locked = collectionsDB.filter(c => !db.collections.includes(c.id));
        const drawn = locked[Math.floor(Math.random() * locked.length)];
        db.collections.push(drawn.id);
        showAlert(`Desbloqueado: Collection ${drawn.code}`);
        checkCollectorAchievement();
    } else if (targetType === 'briefing' && !briDone) {
        const locked = briefingsDB.filter(b => !db.briefings.includes(b.id));
        const drawn = locked[Math.floor(Math.random() * locked.length)];
        db.briefings.push(drawn.id);
        showAlert(`Briefing Descriptografado: ${drawn.code} ${drawn.title}`);
        checkBriefingAchievement();
    }
    saveAndRefresh();
}

// === RENDERIZAÇÃO DA UI ===
function updateUI() {
    let rankIdx = Math.floor((db.level - 1) / 10);
    let rankDisplay = ""; let nickColor = "";

    if (rankIdx >= 7) {
        rankIdx = 7; 
        let excessLevel = db.level - 71; 
        rankDisplay = `RUBY | <span class="excelencia-text">EXCELÊNCIA +${excessLevel}</span>`;
        nickColor = ranks[7].color;
    } else {
        rankDisplay = ranks[rankIdx].name.toUpperCase();
        nickColor = ranks[rankIdx].color;
    }

    document.getElementById('header-nick').innerText = db.nick;
    document.getElementById('header-nick').style.color = nickColor;
    document.getElementById('header-occ').innerText = db.occupation; 
    document.getElementById('header-rank').innerHTML = rankDisplay;
    document.getElementById('header-rank').style.color = nickColor;
    
    document.getElementById('header-avatar').src = db.avatar || 'https://via.placeholder.com/60/111/fff?text=OP';
    document.getElementById('header-level').innerText = db.level;
    document.getElementById('header-xp').innerText = db.xp;
    document.getElementById('header-sp').innerText = db.skillPoints;
    document.getElementById('header-xp-bar').style.width = db.xp + "%";

    if(document.getElementById('edit-nick')) document.getElementById('edit-nick').value = db.nick;
    if(document.getElementById('edit-occ')) document.getElementById('edit-occ').value = db.occupation;
    if(document.getElementById('profile-avatar-large')) document.getElementById('profile-avatar-large').src = db.avatar || 'https://via.placeholder.com/100/111/fff?text=OP';

    renderQuests(); renderCodex(); renderDisciplines(); renderSkills();
    renderInventory(); renderCollectionsGrid(); renderBriefingsGrid();   
}

function renderQuests() {
    ['daily', 'weekly', 'monthly'].forEach(type => {
        const container = document.getElementById(`quests-${type}-container`);
        container.innerHTML = '';
        
        let renderList = (list, isCustom) => {
            list.forEach(q => {
                let btnHTML = ''; let opacity = 1; let timerHTML = '';

                if (q.status === 'completed') {
                    opacity = 0.4;
                    btnHTML = `<button class="btn-claim" disabled style="border-color:#555; color:#555;">CONCLUÍDO</button>`;
                    timerHTML = `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:5px;">Reset em: <span class="countdown-timer" data-type="${type}" style="color:var(--accent);">--:--:--</span></div>`;
                } else if (q.status === 'in_progress') {
                    btnHTML = `<button class="btn-claim" onclick="actQuest('${q.id}', '${type}', ${isCustom}, 'complete')" style="border-color:#ffaa00; color:#ffaa00;">CONCLUIR</button>`;
                    timerHTML = `<div style="font-size:0.7rem; color:#ff5555; margin-top:5px;">Prazo Fatal: <span id="timer-${q.id}" style="font-weight:bold;">--:--:--</span></div>`;
                } else {
                    btnHTML = `<button class="btn-claim" onclick="actQuest('${q.id}', '${type}', ${isCustom}, 'start')">INICIAR</button>`;
                }

                let titleStyle = isCustom ? 'color: #dd88ff;' : '';
                let boxStyle = isCustom ? 'border-left-color: #aa00ff;' : '';
                let xpColor = isCustom ? '#aa00ff' : 'var(--accent)';
                let areaTag = `<span style="color:var(--text-muted); font-size:0.8rem;">[${q.area || 'Geral'}]</span> `;

                container.innerHTML += `
                    <div class="quest-box" style="opacity: ${opacity}; ${boxStyle}">
                        <div class="quest-info" style="width:100%; padding-right:15px;">
                            <h3 style="${titleStyle}">${areaTag}${q.title}</h3>
                            <p>${q.desc || 'Missão Autogerada'} <br><span style="color:${xpColor}">+${q.xp} XP</span></p>
                            ${timerHTML}
                        </div>
                        <div style="min-width: 100px;">${btnHTML}</div>
                    </div>`;
            });
        };

        renderList(db.activeQuests[type], false);
        renderList(db.customQuests.filter(q => q.type === type), true);
    });
}

function renderInventory() {
    const dupContainer = document.getElementById('duplicates-container');
    if(!dupContainer) return;

    document.getElementById('inv-slots-count').innerText = `${db.duplicates.length} / ${db.inventorySlots}`;
    dupContainer.innerHTML = '';
    
    if (db.duplicates.length === 0) {
        dupContainer.innerHTML = '<p style="color:#555; font-size:0.8rem;">Nenhum item repetido no momento.</p>';
    } else {
        db.duplicates.forEach((itemId, index) => {
            const item = codexItems.find(i => i.id === itemId);
            const colDone = db.collections.length >= 99;
            const briDone = db.briefings.length >= 49;

            let btnHTML = "";
            if (colDone && briDone) {
                btnHTML = `<button class="btn-claim" onclick="convertDuplicate(${index}, 'sp')" style="border-color:#ffaa00; color:#ffaa00;">Extrair SP</button>`;
            } else {
                if (!colDone) btnHTML += `<button class="btn-claim" onclick="convertDuplicate(${index}, 'collection')">Virar Collection</button>`;
                if (!briDone) btnHTML += `<button class="btn-claim" onclick="convertDuplicate(${index}, 'briefing')" style="border-color:#00ffaa; color:#00ffaa;">Virar Briefing</button>`;
            }

            dupContainer.innerHTML += `
                <div class="quest-box">
                    <div class="quest-info" style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.5rem;">${item.icon}</span>
                        <div><h3 style="font-size:0.8rem;">${item.name} (Repetido)</h3></div>
                    </div>
                    <div style="display:flex; gap:5px;">${btnHTML}</div>
                </div>`;
        });
    }
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
            <div class="item-card locked"><div class="item-icon">❔</div><div class="item-title">DESCONHECIDO</div><div class="item-desc">Trancado.</div></div>`;
    });
}

function renderDisciplines() {
    const list = document.getElementById('martial-arts-list');
    list.innerHTML = "";
    db.artes.forEach((a, i) => {
        const days = Math.floor(Math.abs(new Date() - new Date(a.date)) / 86400000);
        const stripes = '<div class="stripe"></div>'.repeat(Math.max(0, a.graus));
        list.innerHTML += `
            <div class="belt-container">
                <div style="display:flex; justify-content:space-between; color:#fff;">
                    <span style="font-weight:bold; text-transform:uppercase;">${a.name}</span>
                    <span style="color:var(--accent);">${days} Dias</span>
                </div>
                <div class="belt" style="background-color: ${a.color};"><div class="stripes">${stripes}</div></div>
                <div class="grau-controls">
                    <button class="btn-grau" onclick="changeStripe(${i}, -1)">-</button>
                    <span style="color:#aaa; font-size:0.8rem; line-height: 25px;">${a.graus} Graus</span>
                    <button class="btn-grau" onclick="changeStripe(${i}, 1)">+</button>
                </div>
                <button onclick="if(confirm('Remover trilha?')){ db.artes.splice(${i}, 1); saveAndRefresh(); }" style="padding: 5px; margin-top: 5px; font-size: 0.7rem; border-color: #444; color: #888;">Remover Disciplina</button>
            </div>`;
    });
}

function renderSkills() {
    const container = document.getElementById('skills-container');
    container.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">Aprimore suas estatísticas vitais com SP.</p>`;
    
    areasDB.forEach(area => {
        const cat = area.id;
        const hasNative = skillsDB[cat] && skillsDB[cat].length > 0;
        const hasCustom = db.customSkills.filter(s => s.category === cat).length > 0;

        if (hasNative || hasCustom) {
            container.innerHTML += `<h3 style="color: #fff; font-size: 0.9rem; margin: 20px 0 10px 0; border-bottom: 1px solid #333; padding-bottom: 5px;">${area.icon} ${area.name.toUpperCase()}</h3>`;
            if(hasNative) skillsDB[cat].forEach(skill => renderSkillNode(skill, container));
            db.customSkills.filter(s => s.category === cat).forEach(skill => renderSkillNode(skill, container));
        }
    });
}

function renderSkillNode(skill, container) {
    const unlocked = db.unlockedSkills.includes(skill.id);
    const canUnlock = db.level >= skill.req && !unlocked;
    let typeTag = skill.id.startsWith('cust_') ? '<span style="color:#aa00ff; font-size:0.6rem;">[CUSTOM]</span> ' : '';

    container.innerHTML += `
        <div class="skill-node ${unlocked ? 'unlocked' : (canUnlock ? 'can-unlock' : 'locked')}" 
             onclick="unlockSkill('${skill.id}', ${skill.req}, ${skill.cost})">
            <strong style="display:block;">${typeTag}${skill.name}</strong>
            <span style="font-size: 0.7rem;">${unlocked ? 'ADQUIRIDO: ' + skill.desc : `Requer Nv.${skill.req} | Custo: ${skill.cost} SP`}</span>
        </div>`;
}

function renderCollectionsGrid() {
    const grid = document.getElementById('collections-grid');
    if(!grid) return;
    let html = '';
    collectionsDB.forEach(c => {
        const isUnlocked = db.collections.includes(c.id);
        if(isUnlocked) { html += `<div class="cb-item unlocked-col"><div class="cb-code">${c.code}</div><div class="cb-name">${c.name}</div></div>`; } 
        else { html += `<div class="cb-item"><div class="cb-code">${c.code}</div><div class="cb-name">???</div></div>`; }
    });
    grid.innerHTML = html;
}

function renderBriefingsGrid() {
    const grid = document.getElementById('briefings-grid');
    if(!grid) return;
    let html = '';
    briefingsDB.forEach(b => {
        const isUnlocked = db.briefings.includes(b.id);
        if(isUnlocked) { html += `<div class="cb-item unlocked-bri"><div class="cb-code">${b.code}</div><div class="cb-name">${b.title}</div></div>`; } 
        else { html += `<div class="cb-item"><div class="cb-code">${b.code}</div><div class="cb-name">???</div></div>`; }
    });
    grid.innerHTML = html;
}

// === UTILITÁRIOS ===
function updateProfileData() {
    db.nick = document.getElementById('edit-nick').value || "OPERATOR";
    db.occupation = document.getElementById('edit-occ').value || "COMPUTER SCIENTIST";
    saveAndRefresh();
}
function updateProfileAvatar() { processImage(document.getElementById('edit-avatar'), () => { saveAndRefresh(); }); }

// ---> FUNÇÃO NOVA: ATUALIZAR FOTO VIA LINK <---
function atualizarFotoViaLink() {
    const inputElement = document.getElementById('input-link-foto');
    if(!inputElement) return;

    const linkDigitado = inputElement.value;

    if (linkDigitado.trim() !== "") {
        db.avatar = linkDigitado; // Joga o link direto no seu banco de dados
        inputElement.value = ""; // Limpa o campo
        saveAndRefresh(); // Salva e atualiza toda a tela (header e perfil)
        showAlert("AVATAR ATUALIZADO VIA LINK");
    } else {
        showAlert("SISTEMA: INSIRA UM LINK VÁLIDO.");
    }
}

function switchTab(tabName, btnElement) {
    document.querySelectorAll('.page').forEach(page => { if(page.id !== 'setup-screen') page.classList.add('hidden'); });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('page-' + tabName).classList.remove('hidden');
    btnElement.classList.add('active');
    updateUI();
}
function createProfile() { db.nick = document.getElementById('input-nick').value || "OPERATOR"; processImage(document.getElementById('input-avatar'), () => saveAndRefresh()); }
function updateThemeColor() { db.theme = document.getElementById('edit-color').value; applyTheme(); saveAndRefresh(); showAlert("Cor Atualizada!"); }
function applyTheme() { document.documentElement.style.setProperty('--accent', db.theme); document.getElementById('edit-color').value = db.theme; }
function processImage(fileInput, cb) {
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader(); reader.onload = e => { db.avatar = e.target.result; cb(); }; reader.readAsDataURL(fileInput.files[0]);
    } else cb();
}
function saveAndRefresh() {
    localStorage.setItem('pegasus_db_v8', JSON.stringify(db)); 
    if(!document.getElementById('setup-screen').classList.contains('hidden')) {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
    }
    updateUI();
}
function showAlert(msg) {
    const box = document.getElementById('custom-alert');
    box.innerText = msg; box.classList.add('show');
    setTimeout(() => box.classList.remove('show'), 3000);
}
function resetSystem() { if(confirm("Apagar todos os dados permanentemente?")) { localStorage.removeItem('pegasus_db_v8'); location.reload(); } }

// === MOTOR DO CRONÔMETRO GLOBAL E INDIVIDUAL ===
function getNextResetDate(type) {
    const now = new Date(); let next = new Date(now);
    if (type === 'daily') { next.setDate(now.getDate() + 1); next.setHours(0,0,0,0); } 
    else if (type === 'weekly') { let diff = (1 + 7 - now.getDay()) % 7 || 7; next.setDate(now.getDate() + diff); next.setHours(0,0,0,0); } 
    else if (type === 'monthly') { next.setMonth(now.getMonth() + 1, 1); next.setHours(0,0,0,0); }
    return next;
}

setInterval(() => {
    const nowMs = Date.now();
    const nowDate = new Date();
    let needsSave = false;

    // 1. Cronômetro de Reset (Missões Concluídas)
    document.querySelectorAll('.countdown-timer').forEach(el => {
        let type = el.getAttribute('data-type');
        let next = getNextResetDate(type);
        let diff = next - nowDate;
        if(diff < 0) diff = 0;
        
        let h = Math.floor((diff / (1000 * 60 * 60))); 
        let m = Math.floor((diff / (1000 * 60)) % 60);
        let s = Math.floor((diff / 1000) % 60);
        
        let display = h > 48 ? `${Math.floor(h / 24)}d ${h%24}h ${m}m` : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        el.innerText = display;
    });

    // 2. Cronômetro de Execução (Missões Em Andamento)
    const timeLimits = { daily: 24 * 3600000, weekly: 48 * 3600000, monthly: 72 * 3600000 };

    ['daily', 'weekly', 'monthly'].forEach(type => {
        let processActive = (list) => {
            for (let i = list.length - 1; i >= 0; i--) {
                let q = list[i];
                if (q.status === 'in_progress' && q.startTime) {
                    const limit = timeLimits[q.type || type];
                    const deadline = q.startTime + limit;
                    const timeLeft = deadline - nowMs;
                    
                    if (timeLeft <= 0) {
                        list.splice(i, 1); 
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification("PEGASUS OS: Falha Crítica", { body: `Tempo esgotado para a missão: ${q.title}. XP e recompensa perdidos.`});
                        }
                        needsSave = true;
                    } else {
                        if (timeLeft <= 3600000 && !q.warned) {
                            q.warned = true;
                            if ("Notification" in window && Notification.permission === "granted") {
                                new Notification("PEGASUS OS: Alerta Extremo", { body: `Falta menos de 1 hora para falhar na missão: ${q.title}!`});
                            }
                            needsSave = true;
                        }
                        const timerEl = document.getElementById(`timer-${q.id}`);
                        if (timerEl) {
                            let h = Math.floor(timeLeft / 3600000);
                            let m = Math.floor((timeLeft % 3600000) / 60000);
                            let s = Math.floor((timeLeft % 60000) / 1000);
                            timerEl.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                        }
                    }
                }
            }
        };
        processActive(db.activeQuests[type]);
    });

    for (let i = db.customQuests.length - 1; i >= 0; i--) {
        let q = db.customQuests[i];
        if (q.status === 'in_progress' && q.startTime) {
            const limit = timeLimits[q.type];
            const deadline = q.startTime + limit;
            const timeLeft = deadline - nowMs;
            
            if (timeLeft <= 0) {
                db.customQuests.splice(i, 1);
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("PEGASUS OS: Falha Crítica", { body: `Tempo esgotado para o seu objetivo: ${q.title}.`});
                }
                needsSave = true;
            } else {
                if (timeLeft <= 3600000 && !q.warned) {
                    q.warned = true;
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification("PEGASUS OS: Alerta Extremo", { body: `Falta menos de 1 hora para falhar no seu objetivo: ${q.title}!`});
                    }
                    needsSave = true;
                }
                const timerEl = document.getElementById(`timer-${q.id}`);
                if (timerEl) {
                    let h = Math.floor(timeLeft / 3600000);
                    let m = Math.floor((timeLeft % 3600000) / 60000);
                    let s = Math.floor((timeLeft % 60000) / 1000);
                    timerEl.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }
            }
        }
    }

    if (needsSave) saveAndRefresh();
    if (nowDate.getSeconds() === 0 && nowDate.getMinutes() === 0) checkQuestResets();
}, 1000);

window.onload = init;
