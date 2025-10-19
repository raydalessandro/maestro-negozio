// ========================================
// CONFIGURAZIONE MAESTRO DI NEGOZIO
// ========================================
// Modifica questo file per personalizzare task, punteggi e livelli

// PERSONE DEL TEAM
const people = ['Gemy', 'Valeria', 'Riky'];

// PUNTI INIZIALI
const INITIAL_POINTS = 600;

// TASK E PUNTEGGI
// Struttura: { 'Categoria': [ { name: 'Nome Task', points: Penalità } ] }
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
// PUNTI INIZIALI (600 base, max 730 con tutti i bonus KPI)
const INITIAL_POINTS = 600;

// TASK E PUNTEGGI (PENALITÀ)
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
        { name: 'Raggiungimento KPI giornaliero', points: 50, canBeBonus: true, bonusPoints: 20 }
        // ⚠️ SPECIALE: Se raggiunto = +20, se NON raggiunto = -50
    ],
    'Mystery Client': [
        { name: 'Mystery Client fallito', points: 50 }
        // ⚠️ Se passa = nessuna penalità, se fallisce = -50
    ]
};

// BONUS TASKS (azioni positive extra)
const bonusTasks = [
    { name: 'Cliente recuperato/fidelizzato', points: 40 },
    { name: 'Upselling eccezionale', points: 35 },
    { name: 'Formazione spontanea a collega', points: 25 }
];

// Funzione helper per task piatte
function getTasksList() {
    const allTasks = [];
    Object.keys(tasks).forEach(category => {
        tasks[category].forEach(task => {
            allTasks.push({
                category: category,
                name: task.name,
                points: task.points,
                canBeBonus: task.canBeBonus || false,
                bonusPoints: task.bonusPoints || 0,
                type: 'penalty'
            });
        });
    });
    return allTasks;
}

// Funzione per lista bonus
function getBonusTasksList() {
    return bonusTasks.map(task => ({
        name: task.name,
        points: task.points,
        type: 'bonus'
    }));
}

// Funzione per task KPI (speciale)
function getKPITask() {
    return tasks['Obiettivi a Risultato'][0];
}
};

// SISTEMA A LIVELLI
// Struttura: { name: 'Nome Livello', minPoints: Min, maxPoints: Max, benefits: [] }
const levels = [
    {
        name: 'Apprendista',
        minPoints: 0,
        maxPoints: 100,
        benefits: ['Accesso a risorse base di formazione']
    },
    {
        name: 'Esecutore',
        minPoints: 101,
        maxPoints: 200,
        benefits: ['Badge digitale', 'Menzione interna']
    },
    {
        name: 'Artigiano',
        minPoints: 201,
        maxPoints: 300,
        benefits: ['Priorità nella scelta delle ferie']
    },
    {
        name: 'Esperto di Negozio',
        minPoints: 301,
        maxPoints: 450,
        benefits: ['Opportunità di mentorship retribuita', 'Affiancamento nuovi Store Manager']
    },
    {
        name: 'Maestro di Negozio',
        minPoints: 451,
        maxPoints: 500,
        benefits: ['Budget extra per la gestione', 'Menzione nell\'organigramma aziendale', 'Premio annuale di eccellenza']
    }
];

// EMOJI PER LIVELLI (opzionale, per personalizzazione UI)
const levelEmojis = {
    'Apprendista': '🌱',
    'Esecutore': '⚡',
    'Artigiano': '🔨',
    'Esperto di Negozio': '🎯',
    'Maestro di Negozio': '👑'
};

// ========================================
// FUNZIONI HELPER
// ========================================

/**
 * Ottiene il livello corrispondente ai punti
 * @param {number} points - Punti correnti
 * @returns {object} Oggetto livello
 */
function getLevel(points) {
    return levels.find(level => 
        points >= level.minPoints && points <= level.maxPoints
    ) || levels[0];
}

/**
 * Calcola la percentuale di progresso nel livello corrente
 * @param {number} points - Punti correnti
 * @returns {number} Percentuale (0-100)
 */
function getLevelProgress(points) {
    const level = getLevel(points);
    const range = level.maxPoints - level.minPoints;
    const current = points - level.minPoints;
    return Math.max(0, Math.min(100, (current / range) * 100));
}

/**
 * Ottiene tutte le task come array piatto
 * @returns {array} Array di tutte le task
 */
function getAllTasks() {
    const allTasks = [];
    for (const [category, taskList] of Object.entries(tasks)) {
        taskList.forEach(task => {
            allTasks.push({ ...task, category });
        });
    }
    return allTasks;
}

/**
 * Calcola statistiche per una persona
 * @param {object} personData - Dati della persona
 * @returns {object} Statistiche
 */
function calculateStats(personData) {
    return {
        points: personData.points,
        daysWithErrors: personData.history.length,
        totalPenalty: personData.history.reduce((sum, h) => sum + h.penalty, 0),
        pointsLost: INITIAL_POINTS - personData.points,
        level: getLevel(personData.points),
        progress: getLevelProgress(personData.points)
    };
}
