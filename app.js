// --- app.js ---

let db = {
    nick: "", avatar: "", theme: "#00ffff", level: 1, xp: 0, skillPoints: 0, 
    artes: [], inventory: [], unlockedSkills: [], customSkills: [],
    activeQuests: { daily: [], weekly: [], monthly: [] },
    questResets: { daily: 0, weekly: 0, monthly: 0 },
    customQuests: [],
    
    // LIMITES DE CRIAÇÃO (1 por ciclo)
    customLimits: { daily: false, weekly: false, monthly: false },
    
    // INVENTÁRIO & CODEX
    occupation: " ",
    inventorySlots: 5,
    duplicates: [],
    collections: [],
    briefings: [],
    achievements: [],
    
    // RASTREADOR DE ESTATÍSTICAS (Para Troféus)
    stats: { 
        totalMissions: 0, customMissions: 0, gymMissions: 0, cardioMissions: 0, 
        nightMissions: 0, streakDays: 0, lastMissionDate: "", fastMonthlyStreak: 0
    }
};

const ranks = [
    { name: "Bronze", color: "#cd7f32" }, { name: "Silver", color: "#c0c0c0" }, 
    { name: "Gold", color: "#ffd700" }, { name: "Platinum", color: "#e5e4e2" }, 
    { name: "Diamond", color: "#b9f2ff" }, { name: "Master", color: "#ff00ff" }, 
    { name: "Grandmaster", color: "#ff0000" }, { name: "Ruby", color: "#e0115f" }
];

// --- NOVO SISTEMA DE XP ---
function getXPReq(level) {
    return Math.floor(100 * Math.pow(1.2, level - 1));
}

function init() {
    const saved = localStorage.getItem('pegasus_db_v8');
    if (saved) {
        let loaded = JSON.parse(saved);
        db = { ...db, ...loaded };
        
        // Garante a existência dos arrays em saves antigos
        if(!db.duplicates) db.duplicates = [];
        if(!db.collections) db.collections = [];
        if(!db.briefings) db.briefings = [];
        if(!db.achievements) db.achievements = [];
        if(!db.stats) db.stats = { totalMissions: 0, customMissions: 0, gymMissions: 0, cardioMissions: 0, nightMissions: 0, streakDays: 0, lastMissionDate: "" };
        if(db.stats.fastMonthlyStreak === undefined) db.stats.fastMonthlyStreak = 0;
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

// === SISTEMA DE ACHIEVEMENTS ===
function unlockAchievement(id) {
    if (!db.achievements) db.achievements = [];
    if (!db.achievements.includes(id)) {
        db.achievements.push(id);
        const ach = achievementsDB.find(a => a.id === id);
        if (ach) showAlert(`🏆 TROFÉU DESBLOQUEADO: ${ach.name}`);
        saveAndRefresh();
        
        // Checa se pegou tudo para o Platina
        if (db.achievements.length >= achievementsDB.length - 1 && !db.achievements.includes("ach_0")) {
            unlockAchievement("ach_0"); // Easy Peasy Lemon Squeezy
        }
    }
}

function checkSkillsAchievement() {
    let highLevelSkills = 0;
    // Conta skills nativas >= 15
    Object.values(skillsDB).flat().forEach(s => {
        if(db.unlockedSkills.includes(s.id) && s.req >= 15) highLevelSkills++;
    });
    // Conta skills customizadas >= 15
    db.customSkills.forEach(s => {
        if(db.unlockedSkills.includes(s.id) && s.req >= 15) highLevelSkills++;
    });
    
    if (highLevelSkills >= 5) unlockAchievement("ach_17"); // Tree Or Treat
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
        
        // --- RASTREAMENTO DE ESTATÍSTICAS PARA TROFÉUS ---
        db.stats.totalMissions++;
        if (isCustom) db.stats.customMissions++;
        
        const qTitle = quest.title ? quest.title.toLowerCase() : "";
        const qDesc = quest.desc ? quest.desc.toLowerCase() : "";
        const qArea = quest.area || "";

        if (qArea === "Saúde" || qArea === "Academia") db.stats.gymMissions++;
        if (qTitle.includes("cardio") || qTitle.includes("caminhada") || qTitle.includes("corrida") || qDesc.includes("caminhada") || qDesc.includes("cardio")) {
            db.stats.cardioMissions++;
        }

        const hour = new Date().getHours();
        if (type === 'weekly' && (hour >= 18 || hour < 5)) db.stats.nightMissions++;

        // Verifica Streak
        const todayStr = new Date().toDateString();
        if (db.stats.lastMissionDate !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (db.stats.lastMissionDate === yesterday.toDateString()) {
                db.stats.streakDays++;
            } else {
                db.stats.streakDays = 1;
            }
            db.stats.lastMissionDate = todayStr;
        }

        // Verifica Tempo para Troféus
        const nowMs = Date.now();
        const timeLimits = { daily: 24 * 3600000, weekly: 48 * 3600000, monthly: 72 * 3600000 };
        const limit = timeLimits[quest.type || type];
        const deadline = quest.startTime + limit;
        const timeLeft = deadline - nowMs;

        if (timeLeft > 0 && timeLeft <= 2000) unlockAchievement("ach_14"); // Don't Blink! (1 seg + delay)
        
        // Nova Lógica da Streak Mensal
        if (type === 'monthly') {
            if (timeLeft >= 48 * 3600000) {
                db.stats.fastMonthlyStreak++;
                if (db.stats.fastMonthlyStreak >= 2) unlockAchievement("ach_13"); // Fez 2 seguidas no prazo!
            } else {
                db.stats.fastMonthlyStreak = 0; // Demorou demais, quebrou a sequência
            }
        }

        // Gatilhos de Troféus Baseados em Quantidade
        unlockAchievement("ach_1"); // First Steps
        if (db.stats.totalMissions >= 20) unlockAchievement("ach_3");
        if (db.stats.streakDays >= 7) unlockAchievement("ach_2");
        if (db.stats.nightMissions >= 2) unlockAchievement("ach_4");
        if (db.stats.gymMissions >= 5) unlockAchievement("ach_9");
        if (db.stats.cardioMissions >= 1) unlockAchievement("ach_10");
        if (db.stats.customMissions >= 25) unlockAchievement("ach_15");

        addXP(quest.xp);
        rollLoot();
        saveAndRefresh();
    }
}

// === XP E PROGRESSÃO ===
function addXP(amount) {
    db.xp += amount;
    let req = getXPReq(db.level);
    
    while (db.xp >= req) { 
        db.level++; 
        db.xp -= req; 
        db.skillPoints++; 
        showAlert(`LEVEL UP! Nível ${db.level} | +1 SP`);
        if (db.level >= 70) unlockAchievement("ach_11"); // To Infinity and Beyond
        req = getXPReq(db.level); 
    }
    saveAndRefresh();
}

function removeXP(amount) {
    db.xp -= amount;
    
    while (db.xp < 0) {
        if (db.level > 1) { 
            db.level--; 
            let req = getXPReq(db.level);
            db.xp += req; 
            showAlert(`NÍVEL CAIU... Agora Nível ${db.level}`); 
        } 
        else { 
            db.xp = 0; 
            break; 
        }
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
    
    checkSkillsAchievement();
    
    saveAndRefresh(); showAlert("Habilidade Desbloqueada!");
}

// === DISCIPLINAS ===
function changeStripe(index, delta) {
    let arte = db.artes[index];
    let trackData = progressionTracks[arte.type] || progressionTracks["Outro (Geral)"];
    
    arte.graus += delta;
    
    let currentLvlIdx = trackData.colors.indexOf(arte.color);
    if (currentLvlIdx === -1) currentLvlIdx = 0;
    
    if (arte.graus > trackData.maxGraus) { 
        if(currentLvlIdx < trackData.colors.length - 1) {
            arte.color = trackData.colors[currentLvlIdx + 1];
            arte.graus = 0; 
            showAlert("PROMOÇÃO! Novo patamar alcançado.");
        } else { 
            arte.graus = trackData.maxGraus; 
        } 
    } else if (arte.graus < 0) { 
        if (currentLvlIdx > 0) {
            arte.color = trackData.colors[currentLvlIdx - 1];
            arte.graus = trackData.maxGraus; 
            showAlert("Rebaixado de nível.");
        } else { 
            arte.graus = 0; 
        }
    }

    if (delta > 0) { 
        addXP(trackData.xpPerStep); 
        showAlert(`Progresso registrado! +${trackData.xpPerStep} XP`); 
    } else { 
        removeXP(trackData.xpPerStep); 
        showAlert("Progresso perdido. Penalidade de XP."); 
    }
    saveAndRefresh();
}

function addDiscipline() {
    const type = document.getElementById('new-ma-type').value;
    const date = document.getElementById('new-ma-date').value;
    if (!type || !date) return showAlert("Erro: Preencha a disciplina e a data.");
    
    const trackData = progressionTracks[type] || progressionTracks["Outro (Geral)"]; 
    const color = trackData.colors ? trackData.colors[0] : "#ffffff"; 
    
    db.artes.push({ type, name: type, date, color, graus: 0 });
    unlockAchievement("ach_8"); // It Takes Gutwos
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
                
                // Checa se tem todos os artefatos (excluindo os de recompensa final 998 e 999)
                const totalArts = codexItems.length - 2;
                if (db.inventory.filter(id => id !== 998 && id !== 999).length >= totalArts) {
                    unlockAchievement("ach_5"); // Drake's Fortune
                }

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
        
        if (db.collections.length >= colMax) {
            if (!db.inventory.includes(999)) { db.inventory.push(999); showAlert("LENDA VIVA: Você desbloqueou The Collector!"); }
            unlockAchievement("ach_6"); // Master Collector
        }
    } else if (targetType === 'briefing' && !briDone) {
        const locked = briefingsDB.filter(b => !db.briefings.includes(b.id));
        const drawn = locked[Math.floor(Math.random() * locked.length)];
        db.briefings.push(drawn.id);
        showAlert(`Briefing Descriptografado: ${drawn.code} ${drawn.title}`);
        
        if (db.briefings.length >= briMax) {
            if (!db.inventory.includes(998)) { db.inventory.push(998); showAlert("REDE GLOBAL HACKEADA: Você desbloqueou The Traveller!"); }
            unlockAchievement("ach_7"); // Around The World
        }
    }
    saveAndRefresh();
}

// === CÓDEX E NAVEGAÇÃO ===
function openCodexView(category) {
    document.getElementById('codex-dashboard').classList.add('hidden');
    document.getElementById('codex-details').classList.remove('hidden');
    
    const titleEl = document.getElementById('codex-details-title');
    const gridEl = document.getElementById('codex-dynamic-grid');
    gridEl.className = ""; // Limpa classes antigas

    if (category === 'artefatos') {
        titleEl.innerText = "ARTEFATOS";
        gridEl.classList.add('codex-grid');
        gridEl.innerHTML = '';
        codexItems.forEach(item => {
            if(item.id === 998 || item.id === 999) return; 
            const unlocked = db.inventory.includes(item.id);
            if (unlocked) {
                gridEl.innerHTML += `<div class="item-card ${item.css}"><div class="item-icon">${item.icon}</div><div class="item-title">${item.name}</div><div class="item-desc">${item.desc}</div></div>`;
            } else {
                gridEl.innerHTML += `<div class="item-card locked"><div class="item-icon">❔</div><div class="item-title">???</div><div class="item-desc">???</div></div>`;
            }
        });
    } 
    else if (category === 'collections') {
        titleEl.innerText = "COLLECTIONS DATABASE";
        gridEl.classList.add('cb-grid');
        gridEl.innerHTML = '';
        collectionsDB.forEach(c => {
            if(db.collections.includes(c.id)) { gridEl.innerHTML += `<div class="cb-item unlocked-col"><div class="cb-code">${c.code}</div><div class="cb-name">${c.name}</div></div>`; } 
            else { gridEl.innerHTML += `<div class="cb-item"><div class="cb-code">${c.code}</div><div class="cb-name">???</div></div>`; }
        });
    }
    else if (category === 'briefings') {
        titleEl.innerText = "GLOBAL BRIEFINGS";
        gridEl.classList.add('cb-grid');
        gridEl.innerHTML = '';
        briefingsDB.forEach(b => {
            if(db.briefings.includes(b.id)) { gridEl.innerHTML += `<div class="cb-item unlocked-bri"><div class="cb-code">${b.code}</div><div class="cb-name">${b.title}</div></div>`; } 
            else { gridEl.innerHTML += `<div class="cb-item"><div class="cb-code">${b.code}</div><div class="cb-name">???</div></div>`; }
        });
    }
    else if (category === 'achievements') {
        titleEl.innerText = "TROPHIES & ACHIEVEMENTS";
        gridEl.classList.add('ach-grid');
        gridEl.innerHTML = '';
        achievementsDB.forEach(ach => {
            const unlocked = db.achievements.includes(ach.id);
            if (unlocked) {
                gridEl.innerHTML += `
                    <div class="ach-item unlocked">
                        <div class="ach-icon">${ach.icon}</div>
                        <div class="ach-info"><h4>${ach.name}</h4><p>${ach.desc}</p></div>
                    </div>`;
            } else if (!ach.secret) {
                gridEl.innerHTML += `
                    <div class="ach-item locked">
                        <div class="ach-icon" style="filter: grayscale(100%) opacity(30%);">❔</div>
                        <div class="ach-info"><h4>???</h4><p>???</p></div>
                    </div>`;
            }
        });
    }
}

function closeCodexView() {
    document.getElementById('codex-details').classList.add('hidden');
    document.getElementById('codex-dashboard').classList.remove('hidden');
    updateCodexDashboard(); 
}

function updateCodexDashboard() {
    if(!document.getElementById('prog-art')) return;
    
    // Artefatos
    const totalArts = codexItems.length - 2; 
    const myArts = db.inventory.filter(id => id !== 998 && id !== 999).length;
    document.getElementById('prog-art').innerText = `${myArts}/${totalArts}`;
    document.getElementById('pct-art').innerText = ((myArts / totalArts) * 100).toFixed(2) + "%";

    // Collections
    const myCol = db.collections.length;
    document.getElementById('prog-col').innerText = `${myCol}/99`;
    document.getElementById('pct-col').innerText = ((myCol / 99) * 100).toFixed(2) + "%";

    // Briefings
    const myBri = db.briefings.length;
    document.getElementById('prog-bri').innerText = `${myBri}/49`;
    document.getElementById('pct-bri').innerText = ((myBri / 49) * 100).toFixed(2) + "%";

    // Achievements
    const myAch = db.achievements.length;
    const totalAch = achievementsDB.length;
    document.getElementById('prog-ach').innerText = `${myAch}/${totalAch}`;
    document.getElementById('pct-ach').innerText = ((myAch / totalAch) * 100).toFixed(2) + "%";
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
    document.getElementById('header-sp').innerText = db.skillPoints;
    
    let reqXP = getXPReq(db.level);
    document.getElementById('header-xp-text').innerText = `${Math.floor(db.xp)} / ${reqXP}`;
    
    let xpPercentage = Math.min(100, (db.xp / reqXP) * 100);
    document.getElementById('header-xp-bar').style.width = xpPercentage + "%";

    if(document.getElementById('edit-nick')) document.getElementById('edit-nick').value = db.nick;
    if(document.getElementById('edit-occ')) document.getElementById('edit-occ').value = db.occupation;
    if(document.getElementById('profile-avatar-large')) document.getElementById('profile-avatar-large').src = db.avatar || 'https://via.placeholder.com/100/111/fff?text=OP';

    renderQuests(); renderDisciplines(); renderSkills(); renderInventory(); 
    updateCodexDashboard();
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
                if (!colDone) btnHTML += `<button class="btn-claim" onclick="convertDuplicate(${index}, 'collection')">Fabricar Collection</button>`;
                if (!briDone) btnHTML += `<button class="btn-claim" onclick="convertDuplicate(${index}, 'briefing')" style="border-color:#00ffaa; color:#00ffaa;">Fabricar Briefing</button>`;
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

function renderDisciplines() {
    const list = document.getElementById('martial-arts-list');
    list.innerHTML = "";
    
    db.artes.forEach((a, i) => {
        const trackData = progressionTracks[a.type] || progressionTracks["Outro (Geral)"];
        const days = Math.floor(Math.abs(new Date() - new Date(a.date)) / 86400000);
        
        const currentLvlIdx = trackData.colors.indexOf(a.color) > -1 ? trackData.colors.indexOf(a.color) : 0;
        const levelName = trackData.levels[currentLvlIdx];

        let visualHTML = "";
        let controlesHTML = "";

        if (trackData.type === 'belt') {
            const stripes = '<div class="stripe"></div>'.repeat(Math.max(0, a.graus));
            visualHTML = `<div class="belt" style="background-color: ${a.color};"><div class="stripes">${stripes}</div></div>`;
            
            controlesHTML = `
                <div class="grau-controls">
                    <button class="btn-grau" onclick="changeStripe(${i}, -1)">-</button>
                    <span style="color:#aaa; font-size:0.8rem; line-height: 25px;">Graus: ${a.graus}/${trackData.maxGraus}</span>
                    <button class="btn-grau" onclick="changeStripe(${i}, 1)">+</button>
                </div>`;
        } else {
            visualHTML = `
                <div style="margin-top:10px; padding: 10px; background: #050505; border-left: 3px solid ${a.color}; border-radius: 2px;">
                    <span style="color: ${a.color}; font-weight:bold; font-size: 1.1rem; text-transform: uppercase;">${levelName}</span>
                </div>`;
                
            if (trackData.maxGraus === 0) {
                controlesHTML = `
                    <div style="margin-top: 10px; text-align: center;">
                        <button onclick="changeStripe(${i}, 1)" style="border-color: #00ffaa; color: #00ffaa; width: 100%; font-size: 0.8rem;">[ PROMOVER SENIORIDADE ]</button>
                    </div>`;
            } else {
                const progressDots = '▮'.repeat(Math.max(0, a.graus)) + '▯'.repeat(Math.max(0, trackData.maxGraus - a.graus));
                controlesHTML = `
                    <div style="color: var(--text-muted); font-size: 0.8rem; letter-spacing: 2px; margin-top: 5px; text-align: center;">Progresso: ${progressDots}</div>
                    <div class="grau-controls">
                        <button class="btn-grau" onclick="changeStripe(${i}, -1)">-</button>
                        <span style="color:#aaa; font-size:0.8rem; line-height: 25px;">Subnível: ${a.graus}/${trackData.maxGraus}</span>
                        <button class="btn-grau" onclick="changeStripe(${i}, 1)">+</button>
                    </div>`;
            }
        }

        list.innerHTML += `
            <div class="belt-container">
                <div style="display:flex; justify-content:space-between; color:#fff;">
                    <span style="font-weight:bold; text-transform:uppercase;">${a.name}</span>
                    <span style="color:var(--accent);">${days} Dias</span>
                </div>
                ${visualHTML}
                ${controlesHTML}
                <button onclick="if(confirm('Remover trilha?')){ db.artes.splice(${i}, 1); saveAndRefresh(); }" style="padding: 5px; margin-top: 10px; font-size: 0.7rem; border-color: #444; color: #888;">Remover Trilha</button>
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

// === UTILITÁRIOS ===
function updateProfileData() {
    db.nick = document.getElementById('edit-nick').value || "OPERATOR";
    db.occupation = document.getElementById('edit-occ').value || "COMPUTER SCIENTIST";
    if (db.occupation !== "Computer Scientist" && db.occupation !== "COMPUTER SCIENTIST" && db.occupation !== "") {
        unlockAchievement("ach_12"); // Catchphrase
    }
    saveAndRefresh();
}
function updateProfileAvatar() { processImage(document.getElementById('edit-avatar'), () => { saveAndRefresh(); }); }
function switchTab(tabName, btnElement) {
    document.querySelectorAll('.page').forEach(page => { if(page.id !== 'setup-screen') page.classList.add('hidden'); });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('page-' + tabName).classList.remove('hidden');
    btnElement.classList.add('active');
    updateUI();
}
function createProfile() { db.nick = document.getElementById('input-nick').value || "OPERATOR"; processImage(document.getElementById('input-avatar'), () => saveAndRefresh()); }
function updateThemeColor() { 
    db.theme = document.getElementById('edit-color').value; 
    applyTheme(); 
    unlockAchievement("ach_16"); // Chameleon
    saveAndRefresh(); 
    showAlert("Cor Atualizada!"); 
}
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
                        if ((q.type || type) === 'monthly') db.stats.fastMonthlyStreak = 0; // Quebra a sequência se falhar
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
                if (q.type === 'monthly') db.stats.fastMonthlyStreak = 0; // Quebra a sequência se falhar o custom mensal
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