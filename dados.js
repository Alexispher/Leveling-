// --- dados.js ---

// BANCO DE ITENS (CODEX)
const codexItems = [
    { id: 1, name: "Fragmento de Dados", rarity: "Common", css: "rarity-common", chance: 50.0, icon: "💾", desc: "Lógica básica de código extraída de um terminal antigo." },
    { id: 2, name: "Fio de Kevlar", rarity: "Uncommon", css: "rarity-uncommon", chance: 29.0, icon: "🧵", desc: "Material de alfaiataria de alta tensão para armaduras táticas." },
    { id: 3, name: "Grappling Hook da Ada", rarity: "Rare", css: "rarity-rare", chance: 15.0, icon: "🪝", desc: "Ferramenta de infiltração sofisticada com assinatura em vermelho." },
    { id: 4, name: "Blueprint: Hunter 350", rarity: "Legendary", css: "rarity-legendary", chance: 4.99, icon: "🏍️", desc: "Esquema mecânico avançado de uma máquina Royal Enfield." },
    { id: 5, name: "Relíquia da Fé", rarity: "Legendary", css: "rarity-legendary", chance: 1.00, icon: "✝️", desc: "Um símbolo inabalável de proteção divina e força espiritual." },
    { id: 6, name: "Runa do Caçador", rarity: "Ultra Rare", css: "rarity-ultra", chance: 0.01, icon: "🔥", desc: "Artefato de poder imenso. Pulsa com uma chama constante." }
];

// BANCO DE MISSÕES (QUESTS)
const questsDB = [
    // Diárias
    { id: "d1", title: "Treinamento Físico de Base", type: "daily", xp: 15, desc: "Flexões, abdominais ou corrida." },
    { id: "d2", title: "Leitura Espiritual", type: "daily", xp: 15, desc: "Ler 1 capítulo da Bíblia e meditar." },
    { id: "d3", title: "Estudo Tático (Dev)", type: "daily", xp: 15, desc: "Avançar em um módulo de programação." },
    
    // Semanais
    { id: "w1", title: "Progressão no Tatame", type: "weekly", xp: 50, desc: "Completar pelo menos 3 treinos de Jiu-Jitsu." },
    { id: "w2", title: "Infiltração Bem-Sucedida", type: "weekly", xp: 50, desc: "Completar um projeto ou tarefa de alto risco no trabalho." },
    
    // Mensais
    { id: "m1", title: "Platinar um Jogo Souls", type: "monthly", xp: 200, desc: "Dedicação extrema à esquiva e timing." },
    { id: "m2", title: "Evolução do Arsenal", type: "monthly", xp: 150, desc: "Adquirir ou fazer manutenção em equipamento tático/veículo." }
];

// BANCO DE HABILIDADES (SKILL TREE)
const skillsDB = {
    tech: [
        { id: "t1", name: "Lógica de Sistemas", req: 1, desc: "Compreensão de Rust/Go/Python." },
        { id: "t2", name: "Bypass de Segurança", req: 10, desc: "Criação de scripts de automação." }
    ],
    combat: [
        { id: "c1", name: "Propriocepção Avançada", req: 5, desc: "Melhoria no equilíbrio e controle de peso no tatame." },
        { id: "c2", name: "Guarda Impenetrável", req: 15, desc: "Retenção de guarda contra oponentes mais pesados." },
        { id: "c3", name: "Fôlego de Ferro", req: 25, desc: "Cardio para rolar 5 rounds sem descanso." }
    ],
    mental: [
        { id: "m1", name: "Foco Absoluto", req: 3, desc: "Capacidade de ignorar distrações externas." },
        { id: "m2", name: "Mente Blindada", req: 12, desc: "Resiliência espiritual e controle emocional." },
        { id: "m3", name: "Rastreio de Microexpressões", req: 30, desc: "Leitura fria de intenções." }
    ]
};
