// ========================================
// CONFIGURAZIONE
// ========================================
const STORAGE_VERSION = '1.0';
// Cache in memoria (solo per sessione corrente)
let dataCache = null;
let lastFetch = null;
const CACHE_TTL = 30000; // 30 secondi
// ========================================
// FUNZIONI CRUD - GITHUB ONLY
// ========================================
/**

Carica dati sempre da GitHub (con cache in memoria)
*/
async function getData() {
// Se cache valida (< 30 sec), usa quella
if (dataCache && lastFetch && (Date.now() - lastFetch < CACHE_TTL)) {
console.log('📦 Uso cache in memoria');
return dataCache;
}
try {
console.log('☁️ Caricamento da GitHub...');
 if (!window.githubSync) {
     throw new Error('GitHub sync non inizializzato');
 }
 
 const result = await window.githubSync.load();
 
 if (!result || !result.data) {
     throw new Error('Nessun dato ricevuto da GitHub');
 }
 
 // Aggiorna cache
 dataCache = result.data;
 lastFetch = Date.now();
 
 console.log('✅ Dati caricati da GitHub');
 return dataCache;
} catch (error) {
console.error('❌ Errore caricamento da GitHub:', error);
 // Fallback a cache vecchia se esiste
 if (dataCache) {
     console.warn('⚠️ Uso cache vecchia come fallback');
     return dataCache;
 }
 
 // Ultima risorsa: dati iniziali
 console.warn('⚠️ Inizializzo dati di default');
 return initializeDefaultData();
}
}

/**

Salva dati su GitHub
*/
async function saveData(data) {
try {
// Verifica integrità
if (!verifyDataIntegrity(data)) {
throw new Error('Dati non validi');
}
 console.log('💾 Salvataggio su GitHub...');
 
 if (!window.githubSync) {
     throw new Error('GitHub sync non inizializzato');
 }
 
 // Aggiungi timestamp
 const dataWithTimestamp = {
     ...data,
     lastUpdate: new Date().toISOString()
 };
 
 await window.githubSync.save(dataWithTimestamp);
 
 // Aggiorna cache locale
 dataCache = dataWithTimestamp;
 lastFetch = Date.now();
 
 console.log('✅ Salvato su GitHub');
 
 // Notifica UI
 if (typeof showNotification === 'function') {
     showNotification('✅ Dati salvati con successo', 'success');
 }
 
 return true;
} catch (error) {
console.error('❌ Errore salvataggio:', error);
 // Notifica errore
 if (typeof showNotification === 'function') {
     showNotification('❌ Errore salvataggio. Riprova.', 'error');
 }
 
 throw error; // Propaga errore per gestione in UI
}
}

/**

Invalida cache (forza reload da GitHub)
*/
function invalidateCache() {
dataCache = null;
lastFetch = null;
console.log('🔄 Cache invalidata');
}

/**

Dati iniziali di default
*/
function initializeDefaultData() {
const data = {};
people.forEach(person => {
data[person] = {
points: INITIAL_POINTS,
history: []
};
});
data.lastUpdate = new Date().toISOString();
data.version = STORAGE_VERSION;
return data;
}

/**

Verifica integrità dati
*/
function verifyDataIntegrity(data) {
if (!data || typeof data !== 'object') return false;
for (const person of people) {
if (!data[person] ||
!data[person].hasOwnProperty('points') ||
!Array.isArray(data[person].history)) {
return false;
}
}
return true;
}

// ========================================
// FUNZIONI HELPER - Mantengono stessa interfaccia
// ========================================
/**

Carica dati di una singola persona
*/
async function getPersonData(personName) {
const data = await getData();
return data ? data[personName] : null;
}

/**

Aggiorna dati di una singola persona
*/
async function updatePersonData(personName, personData) {
const data = await getData();
if (!data) return false;
data[personName] = personData;
return await saveData(data);
}

/**

Aggiunge un record allo storico
*/
async function addHistoryRecord(personName, date, penalty, incompleteTasks) {
const data = await getData();
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

Ottiene storico filtrato
*/
async function getHistory(personName = null, fromDate = null, toDate = null) {
const data = await getData();
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

Reset completo del mese
*/
async function resetMonth() {
const data = await getData();
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

Ottiene classifica ordinata
*/
async function getLeaderboard() {
const data = await getData();
if (!data) return [];
return people
.map(person => ({
name: person,
...calculateStats(data[person])
}))
.sort((a, b) => b.points - a.points);
}

/**

Ottiene statistiche aggregate
*/
async function getAggregateStats() {
const data = await getData();
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
const leaderboard = await getLeaderboard();
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

Esporta dati in formato JSON
*/
async function exportToJSON() {
const data = await getData();
return JSON.stringify(data, null, 2);
}

/**

Importa dati da JSON
*/
async function importFromJSON(jsonString) {
try {
const data = JSON.parse(jsonString);
 if (!verifyDataIntegrity(data)) {
     throw new Error('Dati non validi nel backup');
 }
 
 return await saveData(data);
} catch (error) {
console.error('❌ Errore nell'import:', error);
throw error;
}
}

// ========================================
// INIZIALIZZAZIONE
// ========================================
/**

Inizializza GitHub sync e carica dati
*/
async function initializeApp() {
try {
console.log('🚀 Inizializzazione app...');
 // Verifica GitHub sync disponibile
 if (!window.githubSync) {
     throw new Error('GitHub sync non disponibile');
 }
 
 // Inizializza connessione
 const success = await window.githubSync.init();
 
 if (!success) {
     throw new Error('Impossibile connettersi a GitHub');
 }
 
 // Carica dati iniziali in cache
 await getData();
 
 console.log('✅ App inizializzata correttamente');
 return true;
} catch (error) {
console.error('❌ Errore inizializzazione:', error);
throw error;
}
}

// ========================================
// COMPATIBILITÀ BACKWARDS
// ========================================
// Per mantenere compatibilità con codice esistente che usa getData() in modo sincrono
// Aggiungiamo versioni sync che usano la cache (se disponibile)
function getDataSync() {
if (!dataCache) {
console.warn('⚠️ Cache non disponibile, usa await getData()');
return initializeDefaultData();
}
return dataCache;
}
console.log('📦 Data module caricato (GitHub-only mode)');
