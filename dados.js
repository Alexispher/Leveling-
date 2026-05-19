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

// SISTEMA DE TRILHAS DINÂMICO (Disciplines)
const progressionTracks = {
    // LUTAS E SAÚDE (Com sistema de graus ou barras)
    "Jiu-Jitsu": { type: "belt", levels: ["Branca", "Azul", "Roxa", "Marrom", "Preta"], colors: ["#ffffff", "#0044cc", "#6600cc", "#663300", "#111111"], maxGraus: 4, xpPerStep: 20 },
    "Taekwondo": { type: "belt", levels: ["Branca", "Amarela", "Verde", "Azul", "Vermelha", "Preta"], colors: ["#ffffff", "#ffff00", "#00aa00", "#0044cc", "#cc0000", "#111111"], maxGraus: 0, xpPerStep: 100 },
    "Treino (Heavy Duty)": { type: "bar", levels: ["Adaptação", "Alta Intensidade", "Falha Muscular", "Força Bruta"], colors: ["#cccccc", "#00cc66", "#009944", "#ff0000"], maxGraus: 5, xpPerStep: 40 },
    "Saúde Geral": { type: "bar", levels: ["Iniciante", "Consistente", "Avançado", "Elite"], colors: ["#ffffff", "#00ffaa", "#0088ff", "#ff00ff"], maxGraus: 3, xpPerStep: 25 },
    "Outro (Geral)": { type: "bar", levels: ["Iniciante", "Praticante", "Avançado", "Mestre"], colors: ["#ffffff", "#999999", "#555555", "#ffd700"], maxGraus: 3, xpPerStep: 25 }
};

// LISTA DE LINGUAGENS DE PROGRAMAÇÃO
const devLanguages = [
    "C# / .NET", 
    "Python", 
    "JavaScript / TS", 
    "C / C++", 
    "Java", 
    "Swift", 
    "Kotlin", 
    "Go", 
    "Rust", 
    "PHP", 
    "SQL / Banco de Dados"
];

// INJETA AS LINGUAGENS AUTOMATICAMENTE NO SISTEMA
devLanguages.forEach(lang => {
    progressionTracks[`Dev: ${lang}`] = {
        type: "tech",
        levels: ["Trainee", "Júnior", "Pleno", "Sênior", "Especialista"],
        colors: ["#555555", "#00ffff", "#0088ff", "#6600cc", "#ffaa00"],
        maxGraus: 0,    // Sem graus intermediários (Pula direto de Jr pra Pleno, etc)
        xpPerStep: 500  // O salto de senioridade dá um boost massivo de XP
    };
});

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

// BANCO DE ACHIEVEMENTS (TROFÉUS)
const achievementsDB = [
    { id: "ach_1", name: "First Steps!", desc: "Concluiu a sua primeira missão.", icon: "🌱" },
    { id: "ach_2", name: "Offensive of an Owl", desc: "Concluiu missões consecutivamente por 7 dias.", icon: "🦉" },
    { id: "ach_3", name: "Various", desc: "Concluiu 20 missões no total.", icon: "🎲" },
    { id: "ach_4", name: "I AM THE NIGHT!", desc: "Concluiu 2 missões semanais no período noturno.", icon: "🦇" },
    { id: "ach_5", name: "Drake's Fortune", desc: "Coletou todos os artefatos.", icon: "🧭" },
    { id: "ach_6", name: "Master Collector", desc: "Coletou todas as 'Collections' disponíveis.", icon: "🖼️" },
    { id: "ach_7", name: "Around The World!", desc: "Coletou todas as 'Briefings' disponíveis.", icon: "🌎" },
    { id: "ach_8", name: "It Takes Gutwos", desc: "Adicionou a sua primeira Disciplina.", icon: "🥋" },
    { id: "ach_9", name: "Gym Rat", desc: "Concluiu 5 Missões de 'Academia'.", icon: "🏋️" },
    { id: "ach_10", name: "Like Goggins", desc: "Concluiu 1 Missão de 'Cardio'.", icon: "🏃" },
    { id: "ach_11", name: "To Infinity and Beyond!", desc: "Chegou ao level 70.", icon: "🚀" },
    { id: "ach_12", name: "Catchphrase", desc: "Adicionou uma 'Ocupação' no seu perfil.", icon: "🏷️" },
    { id: "ach_13", name: "Monthly speaking", desc: "Conclua uma missão 'Mensal' antes do contador passar das 48h, por dois meses consecutivos.", icon: "🗓️", secret: true },
    { id: "ach_14", name: "Don't Blink!", desc: "Concluiu 1 missão Diária, Semanal ou Mensal faltando apenas 1 segundo para o prazo.", icon: "⏱️", secret: true },
    { id: "ach_15", name: "I'm taking this personally.", desc: "Concluiu 25 'Objetivos Pessoais'.", icon: "🎯" },
    { id: "ach_16", name: "Chameleon", desc: "Alterou a cor do site.", icon: "🦎", secret: true },
    { id: "ach_17", name: "Tree Or Treat", desc: "Tenha pelo menos 5 Habilidades com o level Mínimo de 15.", icon: "🌳" },
    { id: "ach_0", name: "Easy Peasy Lemon Squeezy", desc: "Concluiu todos os 'Achievments' disponíveis.", icon: "🏆", secret: true }
];