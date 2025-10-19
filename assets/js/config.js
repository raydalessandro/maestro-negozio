// ========================================
// CONFIGURAZIONE MAESTRO DI NEGOZIO
// ========================================

const people = ['Gemy', 'Valeria', 'Riky'];
const INITIAL_POINTS = 600;

const tasks = {
    'Routine Quotidiana': [
        { name: 'Controllo e invio report giornaliero', points: 40 },
        { name: 'Verifica apertura/chiusura', points: 40 }
    ],
    'Task Operativi': [
        { name: 'Completamento corretto allestimenti vetrine', points: 70 },
        { name: 'Gestione inventario/differenze inventariali', points: 70 },
        { name: 'Chiusure fine mese', points: 70 },
        { name: 'Gestione turnistica', points: 70 },
        { name: 'Check Formazione', points: 70 },
        { name: 'Gestione Mail ritardi/malattie/cambio turno', points: 70 },
        { name: 'Gestione reclami', points: 70 },
        { name: 'Call di formazione', points: 70 },
        { name: 'Recensioni', points: 70 }
    ],
    'Obiettivi a Risultato': [
        { name: 'Raggiungimento KPI settimanale', points: 50 }
    ],
    'Mystery Client': [
        { name: 'Mystery Client fallito', points: 50 }
    ]
};

const bonusTasks = [
    { name: 'Cliente recuperato/fidelizzato', points: 40 },
    { name: 'Upselling eccezionale', points: 35 },
    { name: 'Formazione spontanea a collega', points: 25 }
];

const levels = [
    { name: 'Apprendista', minPoints: 0, maxPoints: 100, benefits: ['Accesso a risorse base di formazione'] },
    { name: 'Esecutore', minPoints: 101, maxPoints: 200, benefits: ['Badge digitale', 'Menzione interna'] },
    { name: 'Artigiano', minPoints: 201, maxPoints: 300, benefits: ['Priorità nella scelta delle ferie'] },
    { name: 'Esperto di Negozio', minPoints: 301, maxPoints: 450, benefits: ['Opportunità di mentorship retribuita'] },
    { name: 'Maestro di Negozio', minPoints: 451, maxPoints: 600, benefits: ['Budget extra', 'Premio annuale'] }
];

const levelEmojis = {
    'Apprendista': '🌱',
    'Esecutore': '⚡',
    'Artigiano': '🔨',
    'Esperto di Negozio': '🎯',
    'Maestro di Negozio': '👑'
};

function getLevel(points) {
    return levels.find(level => points >= level.minPoints && points <= level.maxPoints) || levels[0];
}

function getLevelProgress(points) {
    const level = getLevel(points);
    const range = level.maxPoints - level.minPoints;
    const current = points - level.minPoints;
    return Math.max(0, Math.min(100, (current / range) * 100));
}

function getAllTasks() {
    const allTasks = [];
    for (const [category, taskList] of Object.entries(tasks)) {
        taskList.forEach(task => {
            allTasks.push({ ...task, category });
        });
    }
    return allTasks;
}

function getTasksList() {
    const allTasks = [];
    Object.keys(tasks).forEach(category => {
        tasks[category].forEach(task => {
            allTasks.push({
                category: category,
                name: task.name,
                points: task.points,
                type: 'penalty'
            });
        });
    });
    return allTasks;
}

function getBonusTasksList() {
    return bonusTasks.map(task => ({
        name: task.name,
        points: task.points,
        type: 'bonus'
    }));
}

function calculateStats(personData) {
    return {
        points: personData.points,
        daysWithErrors: personData.history.length,
        totalPenalty: personData.history.reduce((sum, h) => sum + (h.penalty || 0), 0),
        totalBonus: personData.history.reduce((sum, h) => sum + (h.bonus || 0), 0),
        totalKpi: personData.history.reduce((sum, h) => sum + (h.kpi || 0), 0),
        pointsLost: INITIAL_POINTS - personData.points,
        level: getLevel(personData.points),
        progress: getLevelProgress(personData.points)
    };
}

if (typeof window !== 'undefined') {
    window.tasks = tasks;
    window.bonusTasks = bonusTasks;
    window.people = people;
    window.INITIAL_POINTS = INITIAL_POINTS;
    window.levels = levels;
    window.levelEmojis = levelEmojis;
    window.getTasksList = getTasksList;
    window.getBonusTasksList = getBonusTasksList;
    window.getLevel = getLevel;
    window.getLevelProgress = getLevelProgress;
    window.getAllTasks = getAllTasks;
    window.calculateStats = calculateStats;
}

console.log('✅ Config caricato:', Object.keys(tasks).length, 'categorie');
