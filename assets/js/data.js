// ========================================
// GESTIONE DATI - MAESTRO DI NEGOZIO
// ========================================
// Versione COMPLETA con Supabase

// ========================================
// CONFIGURAZIONE STORAGE
// ========================================
const STORAGE_KEY = 'storeData';
const STORAGE_VERSION = '1.0';
const BACKUP_KEY = 'storeDataBackup';
const LAST_SAVE_KEY = 'lastSaveTimestamp';

// ========================================
// SISTEMA BACKUP AUTOMATICO
// ========================================

/**
 * Salva backup automatico
 */
function saveBackup(data) {
    try {
        const backup = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: data
        };
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
        localStorage.setItem(LAST_SAVE_KEY, backup.timestamp);
        console.log('💾 Backup salvato:', backup.timestamp);
    } catch (e) {
        console.error('❌ Errore salvataggio backup:', e);
    }
}

/**
 * Recupera backup se dati principali sono persi
 */
function restoreFromBackup() {
    try {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
            const parsed = JSON.parse(backup);
            console.log('🔄 Backup trovato del:', parsed.timestamp);
            return parsed.data;
        }
    } catch (e) {
        console.error('❌ Errore recupero backup:', e);
    }
    return null;
}

/**
 * Verifica integrità dati
 */
function verifyDataIntegrity(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Verifica che abbia le persone corrette
    for (const person of people) {
        if (!data[person] || !data[person].hasOwnProperty('points') || !Array.isArray(data[person].history)) {
            return false;
        }
    }
    
    return true;
}

// ========================================
// INIZIALIZZAZIONE DATI
// ========================================

/**
 * Inizializza i dati se non esistono
 */
function initializeData() {
    let data = localStorage.getItem(STORAGE_KEY);
    
    if (!data) {
        console.log('📦 Nessun dato trovato, controllo backup...');
        
        // Prova a recuperare da backup
        const backup = restoreFromBackup();
        if (backup && verifyDataIntegrity(backup)) {
            console.log('✅ Dati recuperati da backup!');
            saveData(backup);
            return;
        }
        
        // Crea nuovi dati
        console.log('🆕 Inizializzazione nuovi dati...');
        const initialData = {};
        people.forEach(person => {
            initialData[person] = {
                points: INITIAL_POINTS,
                history: []
            };
        });
        saveData(initialData);
        console.log('✅ Dati inizializzati');
    } else {
        // Verifica integrità dati esistenti
        try {
            const parsed = JSON.parse(data);
            if (!verifyDataIntegrity(parsed)) {
                console.warn('⚠️ Dati corrotti, tentativo recupero backup...');
                const backup = restoreFromBackup();
                if (backup && verifyDataIntegrity(backup)) {
                    saveData(backup);
                    console.log('✅ Dati recuperati da backup');
                } else {
                    throw new Error('Backup non disponibile');
                }
            }
        } catch (e) {
            console.error('❌ Errore verifica dati:', e);
        }
    }
    
    // Log ultima modifica
    const lastSave = localStorage.getItem(LAST_SAVE_KEY);
    if (lastSave) {
        console.log('📅 Ultimo salvataggio:', new Date(lastSave).toLocaleString('it-IT'));
    }
}

// ========================================
// FUNZIONI CRUD
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
 * Salva tutti i dati (con sincronizzazione Supabase)
 * @param {object} data - Dati da salvare
 * @returns {boolean} True se successo
 */
async function saveData(data) {
    try {
        // Verifica integrità prima di salvare
        if (!verifyDataIntegrity(data)) {
            console.error('❌ Tentativo di salvare dati non validi!');
            return false;
        }
        
        // PRIORITÀ: Salva su Supabase
        if (window.supabaseSync && typeof window.supabaseSync.save === 'function') {
            console.log('💾 Salvataggio su Supabase...');
            const success = await window.supabaseSync.save(data);
            
            if (success) {
                console.log('✅ Dati salvati su Supabase');
                // Salva anche in localStorage come cache
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem(LAST_SAVE_KEY, new Date().toISOString());
                saveBackup(data);
                return true;
            } else {
                console.error('❌ Errore salvataggio Supabase!');
                alert('⚠️ ERRORE SALVATAGGIO!\n\nI dati NON sono stati salvati su Supabase.\nVerifica connessione internet e configurazione Supabase.\n\nI dati rimarranno solo su questo browser.');
                
                // Fallback localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem(LAST_SAVE_KEY, new Date().toISOString());
                saveBackup(data);
                return false;
            }
        } else {
            // Supabase non configurato
            console.warn('⚠️ Supabase Storage non configurato!');
            alert('⚠️ ATTENZIONE!\n\nSupabase Storage NON è configurato.\nI dati verranno salvati SOLO su questo browser.\n\nConfigura Supabase seguendo le istruzioni.');
            
            // Fallback localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(LAST_SAVE_KEY, new Date().toISOString());
            saveBackup(data);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Errore nel salvataggio dati:', error);
        alert('❌ ERRORE GRAVE!\n\nImpossibile salvare i dati.\n\n' + error.message);
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
async function updatePersonData(personName, personData) {
    const data = getData();
    if (!data) return false;
    
    data[personName] = personData;
    return await saveData(data);
}

/**
 * Aggiunge un record allo storico
 * @param {string} personName - Nome della persona
 * @param {string} date - Data (YYYY-MM-DD)
 * @param {number} penalty - Penalità totale
 * @param {array} incompleteTasks - Array di task non completate
 * @returns {boolean} True se successo
 */
async function addHistoryRecord(personName, date, penalty, incompleteTasks) {
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

    return await saveData(data);
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
async function resetMonth() {
    const data = getData();
    if (!data) return false;

    people.forEach(person => {
        data[person].points = INITIAL_POINTS;
        data[person].history = [];
    });

    return await saveData(data);
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

    const leaderboard = getLeaderboard();

    return {
        totalPenalties,
        totalDaysWithErrors,
        averagePoints,
        topPerformer: leaderboard[0],
        needsImprovement: leaderboard[people.length - 1]
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
async function importFromJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (!verifyDataIntegrity(data)) {
            throw new Error('Dati non validi o corrotti');
        }
        return await saveData(data);
    } catch (error) {
        console.error('❌ Errore nell\'import:', error);
        return false;
    }
}

/**
 * Download backup completo
 */
function downloadBackupFile() {
    const data = getData();
    if (!data) {
        alert('❌ Nessun dato da esportare!');
        return;
    }
    
    const backup = {
        version: STORAGE_VERSION,
        exportDate: new Date().toISOString(),
        data: data
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maestro-negozio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Backup scaricato');
}

/**
 * Carica backup da file
 */
function uploadBackupFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                
                // Verifica struttura backup
                if (!backup.data || !verifyDataIntegrity(backup.data)) {
                    throw new Error('File backup non valido');
                }
                
                if (confirm('⚠️ Sei sicuro?\n\nQuesto sovrascriverà TUTTI i dati attuali con il backup.\n\nData backup: ' + new Date(backup.exportDate).toLocaleString('it-IT'))) {
                    await saveData(backup.data);
                    alert('✅ Backup ripristinato con successo!\n\nRicarica la pagina per vedere i dati.');
                    location.reload();
                }
            } catch (e) {
                alert('❌ Errore nel caricamento backup:\n\n' + e.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ========================================
// AUTO-INIZIALIZZAZIONE
// ========================================
initializeData();
