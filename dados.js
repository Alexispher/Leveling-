// --- dados.js ---

// BANCO DE MISSÕES ALEATÓRIAS (O sistema sorteia destas)
const questsPool = {
    daily: [
        { id: "d_health_1", area: "Saúde", title: "Hidratação Consciente", xp: 30, desc: "Beber água adequadamente ao longo do dia." },
        { id: "d_health_2", area: "Saúde", title: "Movimento Diário", xp: 40, desc: "20 min de caminhada, treino leve ou alongamento." },
        { id: "d_study_1", area: "Estudos", title: "Sessão de Estudo Focada", xp: 60, desc: "Estudar por pelo menos 30 minutos com foco total." },
        { id: "d_work_1", area: "Trabalho", title: "Prioridade Principal", xp: 50, desc: "Concluir a tarefa profissional mais importante do dia." },
        { id: "d_tech_1", area: "Tecnologia", title: "Código Limpo", xp: 55, desc: "Melhorar ou organizar uma parte de um projeto digital." },
        { id: "d_spirit_1", area: "Propósito", title: "Reflexão Pessoal", xp: 40, desc: "Refletir sobre valores e direção de vida." }
    ],
    weekly: [
        { id: "w_health_1", area: "Saúde", title: "Semana Ativa", xp: 150, desc: "Completar pelo menos três sessões de atividade física." },
        { id: "w_study_1", area: "Estudos", title: "Ciclo de Estudos", xp: 180, desc: "Completar um ciclo semanal de aprendizado." },
        { id: "w_tech_1", area: "Tecnologia", title: "Sprint Técnica", xp: 190, desc: "Concluir uma melhoria relevante em sistema ou software." }
    ],
    monthly: [
        { id: "mo_tech_1", area: "Tecnologia", title: "Projeto Concluído", xp: 650, desc: "Finalizar uma etapa crucial de um sistema ou automação." },
        { id: "mo_study_1", area: "Estudos", title: "Marco de Aprendizado", xp: 550, desc: "Concluir um módulo ou curso relevante." }
    ]
};

// BANCO DE HABILIDADES (Nativas)
const skillsDB = {
    health: [
        { id: "health_1", name: "Energia Básica", req: 1, cost: 1, desc: "Consistência em sono e alimentação." }
    ],
    study: [
        { id: "study_1", name: "Foco de Aprendiz", req: 1, cost: 1, desc: "Facilidade para iniciar sessões de estudo." }
    ],
    tech: [
        { id: "tech_1", name: "Fundamentos Digitais", req: 1, cost: 1, desc: "Lógica inicial e compreensão de sistemas." }
    ]
};

// SISTEMA DE FAIXAS POR TRILHA (Disciplines)
const progressionTracks = {
    "Jiu-Jitsu": ["#ffffff", "#0044cc", "#6600cc", "#663300", "#111111", "#cc0000"],
    "Taekwondo": ["#ffffff", "#ffff00", "#00aa00", "#0044cc", "#cc0000", "#111111"],
    "Tecnologia": ["#cccccc", "#00ffff", "#0088ff", "#6600cc", "#111111", "#ffd700"],
    "Estudos": ["#cccccc", "#66ccff", "#0044cc", "#6600cc", "#111111", "#ffd700"],
    "Saúde": ["#cccccc", "#00cc66", "#009944", "#006633", "#111111", "#ffd700"],
    "Outro": ["#ffffff", "#999999", "#555555", "#111111", "#ffd700"]
};

// ÁREAS PARA FILTROS E CATEGORIAS
const areasDB = [
    { id: "health", name: "Saúde", icon: "💪" },
    { id: "study", name: "Estudos", icon: "📚" },
    { id: "work", name: "Trabalho", icon: "💼" },
    { id: "tech", name: "Tecnologia", icon: "💻" },
    { id: "mind", name: "Bem-estar", icon: "🧠" },
    { id: "purpose", name: "Propósito", icon: "🧭" }
];

// GERADOR DE COLLECTIONS (99 Itens, 10 Temas)
const collectionsDB = [];
const themes = ["Ocean", "Space", "Cyber", "Bio", "Crypto", "Relic", "Myth", "Tactical", "Shadow", "Neon"];
for (let i = 1; i <= 99; i++) {
    let themeIndex = Math.floor((i - 1) / 10);
    if (themeIndex > 9) themeIndex = 9;
    collectionsDB.push({
        id: i,
        code: `#${String(i).padStart(3, '0')}`,
        set: themes[themeIndex],
        name: `${themes[themeIndex]} Fragment ${i}`
    });
}

// GERADOR DE BRIEFINGS (49 Cidades)
const cities = [
    "Tokyo", "London", "New York", "Belo Horizonte", "Paris", "Berlin", "Moscow", "Beijing", "Seoul", "Rome",
    "Madrid", "Toronto", "Sydney", "Dubai", "Singapore", "Hong Kong", "Bangkok", "Istanbul", "Cairo", "Mumbai",
    "Cape Town", "Buenos Aires", "Lima", "Bogota", "Mexico City", "Los Angeles", "Chicago", "Miami", "Las Vegas", "Seattle",
    "Amsterdam", "Vienna", "Prague", "Warsaw", "Stockholm", "Oslo", "Helsinki", "Copenhagen", "Athens", "Lisbon",
    "Kyoto", "Osaka", "Shanghai", "Taipei", "Manila", "Jakarta", "Kuala Lumpur", "Hanoi", "Reykjavik"
];
const briefingsDB = cities.map((city, index) => ({
    id: index + 1,
    code: `#${String(index + 1).padStart(3, '0')}`,
    title: city
}));