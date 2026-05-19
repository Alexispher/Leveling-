// --- itens.js ---

const codexItems = [
    {
        id: 1,
        name: "Fragmento de Dados",
        rarity: "Common",
        css: "rarity-common",
        chance: 50,
        icon: "💾",
        desc: "Pequeno registro de progresso extraído da rotina diária."
    },
    {
        id: 2,
        name: "Ficha de Disciplina",
        rarity: "Common",
        css: "rarity-common",
        chance: 45,
        icon: "📋",
        desc: "Comprovante simbólico de consistência em tarefas."
    },
    {
        id: 3,
        name: "Cristal de Foco",
        rarity: "Uncommon",
        css: "rarity-uncommon",
        chance: 28,
        icon: "🔷",
        desc: "Artefato de quem conclui tarefas sem distrações."
    },
    {
        id: 4,
        name: "Chave de Rotina",
        rarity: "Uncommon",
        css: "rarity-uncommon",
        chance: 24,
        icon: "🗝️",
        desc: "Item obtido ao manter hábitos organizados."
    },
    {
        id: 5,
        name: "Medalha de Esforço",
        rarity: "Rare",
        css: "rarity-rare",
        chance: 15,
        icon: "🏅",
        desc: "Símbolo de dedicação acima da média."
    },
    {
        id: 6,
        name: "Mapa de Progresso",
        rarity: "Rare",
        css: "rarity-rare",
        chance: 12,
        icon: "🗺️",
        desc: "Revela a evolução acumulada em vários objetivos."
    },
    {
        id: 7,
        name: "Livro de Maestria",
        rarity: "Epic",
        css: "rarity-epic",
        chance: 6,
        icon: "📘",
        desc: "Concedido ao concluir desafios importantes."
    },
    {
        id: 8,
        name: "Núcleo de Energia",
        rarity: "Epic",
        css: "rarity-epic",
        chance: 4,
        icon: "⚡",
        desc: "Fonte simbólica de energia e foco."
    },
    {
        id: 9,
        name: "Selo de Excelência",
        rarity: "Legendary",
        css: "rarity-legendary",
        chance: 1.5,
        icon: "🏆",
        desc: "Recompensa lendária para conquistas relevantes."
    },
    {
        id: 10,
        name: "Batarangue",
        rarity: "Legendary",
        css: "rarity-legendary",
        chance: 0.8,
        icon: "🦇",
        desc: "Um boomerang desconhecido em formato de morcego."
    },    
    {
        id: 11,
        name: "Coroa da Constância",
        rarity: "Mythic",
        css: "rarity-mythic",
        chance: 0.2,
        icon: "👑",
        desc: "Entregue apenas aos mais disciplinados."
    },
    {
        id: 12,
        name: "Relíquia do Propósito",
        rarity: "Mythic",
        css: "rarity-mythic",
        chance: 0.05,
        icon: "🌌",
        desc: "Símbolo máximo de compromisso."
    },

    // O PRÊMIO MÁXIMO DO COLECIONADOR
    {
        id: 998,
        name: "The Traveller",
        rarity: "Mythic",
        css: "rarity-mythic",
        chance: 0,
        icon: "🦋",
        desc: "Colete todas as Briefings do sistema."
    },
    {
        id: 999,
        name: "The Collector",
        rarity: "Mythic",
        css: "rarity-mythic",
        chance: 0,
        icon: "💠",
        desc: "Colete todas as Collections do sistema."
    }
];