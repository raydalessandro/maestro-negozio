// ========================================
// GESTIONE DATI - MAESTRO DI NEGOZIO
// ========================================
// Questo file gestisce il salvataggio e caricamento dati
// Per passare a Firebase, basta modificare le funzioni qui

// ========================================
// CONFIGURAZIONE STORAGE
// ========================================
const STORAGE_KEY = 'storeData';
const STORAGE_VERSION = '1.0';

// Uncomment per Firebase:
// const FIREBASE_CONFIG = {
//     apiKey: "YOUR_API_KEY",
//     authDomain: "YOUR_PROJECT.firebaseapp.com",
//     databaseURL: "YOUR_DATABASE_URL",
//     projectId: "YOUR_PROJECT_ID"
// };

// ========================================
// INIZIALIZZAZIONE DATI
// ========================================

/**
 * Inizializza i dati se non esistono
 */
function initializeData() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const initialData = {};
        people.forEach(person => {
            initialData[person] = {
                points: INITIAL_POINTS,
                history: []
            };
        });
        saveData(initialData);
        console.log('✅ Dati inizializzati');
    }
}

// ========================================
// FUNZIONI CRUD - localStorage
// ========================================

/**
 * Carica tutti i dati
 * @returns {object} Dati completi di tutte le persone
 */
function getData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('❌ Errore nel caricamento dati:', error);
        return null;
    }
}

/**
 * Salva tutti i dati
 * @param {object} data - Dati da salvare
 * @returns {boolean} True se successo
 */
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('❌ Errore nel salvataggio dati:', error);
        return false;
    }
}

/**
 * Carica dati di una singola persona
 * @param {string} personName - Nome della persona
 * @returns {object} Dati della persona
 */
function getPersonData(personName) {
    const data = getData();
    return data ? data[personName] : null;
}

/**
 * Aggiorna dati di una singola persona
 * @param {string} personName - Nome della persona
 * @param {object} personData - Nuovi dati
 * @returns {boolean} True se successo
 */
function updatePersonData(personName, personData) {
    const data = getData();
    if (!data) return false;
    
    data[personName] = personData;
    return saveData(data);
}

/**
 * Aggiunge un record allo storico
 * @param {string} personName - Nome della persona
 * @param {string} date - Data (YYYY-MM-DD)
 * @param {number} penalty - Penalità totale
 * @param {array} incompleteTasks - Array di task non completate
 * @returns {boolean} True se successo
 */
function addHistoryRecord(personName, date, penalty, incompleteTasks) {
    const data = getData();
    if (!data) return false;

    // Rimuovi eventuali record precedenti per questa data
    data[personName].history = data[personName].history.filter(h => h.date !== date);
    
    // Aggiungi nuovo record se c'è penalità
    if (penalty > 0) {
        data[personName].history.push({
            date: date,
            penalty: penalty,
            incompleteTasks: incompleteTasks
        });
    }

    // Ricalcola punti
    data[personName].points = INITIAL_POINTS - 
        data[personName].history.reduce((sum, h) => sum + h.penalty, 0);

    return saveData(data);
}

/**
 * Ottiene storico filtrato
 * @param {string} personName - Nome persona (null per tutti)
 * @param {string} fromDate - Data inizio (opzionale)
 * @param {string} toDate - Data fine (opzionale)
 * @returns {array} Array di record storici
 */
function getHistory(personName = null, fromDate = null, toDate = null) {
    const data = getData();
    if (!data) return [];

    let history = [];

    if (personName) {
        // Singola persona
        history = data[personName].history.map(h => ({
            person: personName,
            ...h
        }));
    } else {
        // Tutte le persone
        people.forEach(p => {
            data[p].history.forEach(h => {
                history.push({
                    person: p,
                    ...h
                });
            });
        });
    }

    // Filtra per date
    if (fromDate) {
        history = history.filter(h => h.date >= fromDate);
    }
    if (toDate) {
        history = history.filter(h => h.date <= toDate);
    }

    // Ordina per data (più recente prima)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    return history;
}

/**
 * Reset completo del mese
 * @returns {boolean} True se successo
 */
function resetMonth() {
    const data = getData();
    if (!data) return false;

    people.forEach(person => {
        data[person].points = INITIAL_POINTS;
        data[person].history = [];
    });

    return saveData(data);
}

// ========================================
// FUNZIONI STATISTICHE
// ========================================

/**
 * Ottiene classifica ordinata
 * @returns {array} Array di oggetti { name, points, stats }
 */
function getLeaderboard() {
    const data = getData();
    if (!data) return [];

    return people
        .map(person => ({
            name: person,
            ...calculateStats(data[person])
        }))
        .sort((a, b) => b.points - a.points);
}

/**
 * Ottiene statistiche aggregate
 * @returns {object} Statistiche complessive
 */
function getAggregateStats() {
    const data = getData();
    if (!data) return null;

    const totalPenalties = people.reduce((sum, p) => 
        sum + data[p].history.reduce((s, h) => s + h.penalty, 0), 0
    );

    const totalDaysWithErrors = people.reduce((sum, p) => 
        sum + data[p].history.length, 0
    );

    const averagePoints = people.reduce((sum, p) => 
        sum + data[p].points, 0
    ) / people.length;

    return {
        totalPenalties,
        totalDaysWithErrors,
        averagePoints,
        topPerformer: getLeaderboard()[0],
        needsImprovement: getLeaderboard()[people.length - 1]
    };
}

// ========================================
// EXPORT/IMPORT
// ========================================

/**
 * Esporta dati in formato CSV
 * @returns {string} Stringa CSV
 */
function exportToCSV() {
    const data = getData();
    if (!data) return '';

    let csv = 'Persona,Punti Attuali,Livello,Giorni con Errori,Penalità Totale\n';
    
    people.forEach(person => {
        const stats = calculateStats(data[person]);
        csv += `${person},${stats.points},${stats.level.name},${stats.daysWithErrors},${stats.totalPenalty}\n`;
    });

    csv += '\n\nDettaglio Storico:\n';
    csv += 'Persona,Data,Task Non Completate,Penalità\n';
    
    const history = getHistory();
    history.forEach(record => {
        csv += `${record.person},${record.date},"${record.incompleteTasks.join('; ')}",${record.penalty}\n`;
    });

    return csv;
}

/**
 * Esporta dati in formato JSON
 * @returns {string} Stringa JSON
 */
function exportToJSON() {
    const data = getData();
    return JSON.stringify(data, null, 2);
}

/**
 * Importa dati da JSON
 * @param {string} jsonString - Stringa JSON
 * @returns {boolean} True se successo
 */
function importFromJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        return saveData(data);
    } catch (error) {
        console.error('❌ Errore nell\'import:', error);
        return false;
    }
}

// ========================================
// AUTO-INIZIALIZZAZIONE
// ========================================
initializeData();

// ========================================
// ESEMPIO PER FIREBASE (da decommentare)
// ========================================
/*
// Importa Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update } from "firebase/database";

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

// Sostituisci le funzioni sopra con queste:

async function getData() {
    const snapshot = await get(ref(db, 'storeData'));
    return snapshot.val();
}

async function saveData(data) {
    await set(ref(db, 'storeData'), data);
    return true;
}

async function updatePersonData(personName, personData) {
    await update(ref(db, `storeData/${personName}`), personData);
    return true;
}

// ... e così via per le altre funzioni
*/
