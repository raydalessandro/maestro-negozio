// ========================================
// SUPABASE STORAGE - MAESTRO DI NEGOZIO
// ========================================
// Backend SERIO ma SEMPLICE - No problemi token!

// ========================================
// CONFIGURAZIONE SUPABASE
// ========================================

const SUPABASE_CONFIG = {
    url: 'https://TUO-PROJECT-ID.supabase.co', // ← INCOLLA QUI Project URL
    key: 'TUA-ANON-KEY-QUI' // ← INCOLLA QUI anon public key
};

// ========================================
// SUPABASE CLIENT (semplice fetch, no librerie)
// ========================================

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    async query(endpoint, method = 'GET', body = null) {
        const options = {
            method: method,
            headers: this.headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.url}/rest/v1/${endpoint}`, options);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Supabase error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    // Ottieni tutti i dati
    async getAll() {
        return this.query('store_data?select=*');
    }

    // Ottieni dati di una persona
    async getPerson(name) {
        const data = await this.query(`store_data?person=eq.${name}&select=*`);
        return data[0] || null;
    }

    // Aggiorna dati di una persona
    async updatePerson(name, points, history) {
        return this.query(
            `store_data?person=eq.${name}`,
            'PATCH',
            { points, history, updated_at: new Date().toISOString() }
        );
    }

    // Inserisci nuova persona (se non esiste)
    async insertPerson(name, points = 500, history = []) {
        return this.query(
            'store_data',
            'POST',
            { person: name, points, history }
        );
    }

    // Reset tutti i dati
    async resetAll() {
        const people = ['Gemy', 'Valeria', 'Riky'];
        const promises = people.map(person =>
            this.updatePerson(person, 500, [])
        );
        return Promise.all(promises);
    }
}

// Crea istanza client
const supabase = new SupabaseClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// ========================================
// FUNZIONI COMPATIBILI CON CODICE ESISTENTE
// ========================================

/**
 * Carica tutti i dati da Supabase
 * Formato compatibile: { "Gemy": { points, history }, ... }
 */
async function loadFromSupabase() {
    try {
        console.log('📥 Caricamento dati da Supabase...');

        const rows = await supabase.getAll();

        // Converti formato Supabase in formato app
        const data = {};
        rows.forEach(row => {
            data[row.person] = {
                points: row.points,
                history: row.history || []
            };
        });

        console.log('✅ Dati caricati da Supabase');
        console.log('📊 Persone:', Object.keys(data).join(', '));

        return data;

    } catch (error) {
        console.error('❌ Errore caricamento da Supabase:', error.message);
        return null;
    }
}

/**
 * Salva dati su Supabase
 * Accetta formato: { "Gemy": { points, history }, ... }
 */
async function saveToSupabase(data) {
    try {
        console.log('📤 Salvataggio dati su Supabase...');

        const promises = [];

        for (const [person, personData] of Object.entries(data)) {
            promises.push(
                supabase.updatePerson(person, personData.points, personData.history)
            );
        }

        await Promise.all(promises);

        console.log('✅ Dati salvati su Supabase');
        return true;

    } catch (error) {
        console.error('❌ Errore salvataggio su Supabase:', error.message);
        return false;
    }
}

// ========================================
// SISTEMA SINCRONIZZAZIONE
// ========================================

let syncEnabled = false;

async function initSupabaseSync() {
    console.log('🔄 Inizializzazione Supabase...');

    // Verifica configurazione
    if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'https://TUO-PROJECT-ID.supabase.co') {
        console.error('❌ Supabase non configurato! Modifica SUPABASE_CONFIG in supabase-storage.js');
        
        // Fallback: usa localStorage
        const localData = localStorage.getItem('storeData');
        if (!localData) {
            console.log('📦 Inizializzo dati di default in localStorage');
            const defaultData = {
                "Gemy": { "points": 500, "history": [] },
                "Valeria": { "points": 500, "history": [] },
                "Riky": { "points": 500, "history": [] }
            };
            localStorage.setItem('storeData', JSON.stringify(defaultData));
        }
        return;
    }

    try {
        // Carica dati da Supabase
        const supabaseData = await loadFromSupabase();

        if (supabaseData && Object.keys(supabaseData).length > 0) {
            console.log('✅ Dati caricati da Supabase');

            // Salva in localStorage come cache
            localStorage.setItem('storeData', JSON.stringify(supabaseData));
            localStorage.setItem('lastSaveTimestamp', new Date().toISOString());

            syncEnabled = true;
            console.log('✅ Sincronizzazione Supabase attiva');

        } else {
            console.warn('⚠️ Nessun dato su Supabase, uso localStorage');

            const localData = localStorage.getItem('storeData');
            if (localData) {
                console.log('📱 Sincronizzazione dati locali su Supabase...');
                const data = JSON.parse(localData);
                await saveToSupabase(data);
                syncEnabled = true;
            } else {
                console.log('📦 Inizializzo dati di default');
                const defaultData = {
                    "Gemy": { "points": 500, "history": [] },
                    "Valeria": { "points": 500, "history": [] },
                    "Riky": { "points": 500, "history": [] }
                };
                localStorage.setItem('storeData', JSON.stringify(defaultData));
                await saveToSupabase(defaultData);
                syncEnabled = true;
            }
        }

    } catch (error) {
        console.error('❌ Errore inizializzazione Supabase:', error);

        // Fallback localStorage
        const localData = localStorage.getItem('storeData');
        if (!localData) {
            const defaultData = {
                "Gemy": { "points": 500, "history": [] },
                "Valeria": { "points": 500, "history": [] },
                "Riky": { "points": 500, "history": [] }
            };
            localStorage.setItem('storeData', JSON.stringify(defaultData));
        }
    }
}

async function saveDataSync(data) {
    // SEMPRE salva in localStorage
    localStorage.setItem('storeData', JSON.stringify(data));
    localStorage.setItem('lastSaveTimestamp', new Date().toISOString());
    console.log('💾 Salvato in localStorage');

    if (!syncEnabled) {
        console.warn('⚠️ Supabase non attiva - salvato solo in localStorage');
        return false;
    }

    // Salva su Supabase
    try {
        const success = await saveToSupabase(data);
        if (success) {
            console.log('✅ Salvato su Supabase + localStorage');
            return true;
        }
    } catch (error) {
        console.error('❌ Salvataggio Supabase fallito:', error.message);
    }

    console.warn('⚠️ Salvato solo in localStorage');
    return false;
}

function startAutoSync(intervalMinutes = 5) {
    if (!syncEnabled) {
        console.log('⚠️ Auto-sync disabilitato');
        return;
    }

    console.log(`🔄 Auto-sync attivo ogni ${intervalMinutes} minuti`);

    setInterval(async () => {
        console.log('🔄 Sincronizzazione automatica...');
        const dataStr = localStorage.getItem('storeData');
        if (dataStr) {
            await saveDataSync(JSON.parse(dataStr));
        }
    }, intervalMinutes * 60 * 1000);
}

async function forceSyncNow() {
    const dataStr = localStorage.getItem('storeData');
    if (!dataStr) {
        alert('❌ Nessun dato da sincronizzare');
        return;
    }

    const data = JSON.parse(dataStr);
    const success = await saveDataSync(data);

    if (success) {
        alert('✅ Dati sincronizzati con Supabase!');
    } else {
        alert('⚠️ Dati salvati solo in localStorage.\n\nVerifica configurazione Supabase.');
    }
}

async function resetMonth() {
    if (!confirm('⚠️ Sei sicuro di voler resettare il mese?\n\nTutti torneranno a 500 punti.')) {
        return false;
    }

    try {
        if (syncEnabled) {
            await supabase.resetAll();
            console.log('✅ Reset su Supabase');
        }

        const defaultData = {
            "Gemy": { "points": 500, "history": [] },
            "Valeria": { "points": 500, "history": [] },
            "Riky": { "points": 500, "history": [] }
        };

        localStorage.setItem('storeData', JSON.stringify(defaultData));
        console.log('✅ Reset localStorage');

        alert('✅ Mese resettato! Tutti a 500 punti.');
        return true;

    } catch (error) {
        console.error('❌ Errore reset:', error);
        alert('❌ Errore durante il reset');
        return false;
    }
}

function checkSyncStatus() {
    console.log('\n📊 === STATO SINCRONIZZAZIONE SUPABASE ===');
    console.log('Sync attiva:', syncEnabled);
    console.log('URL:', SUPABASE_CONFIG.url);
    console.log('Key configurata:', SUPABASE_CONFIG.key && SUPABASE_CONFIG.key !== 'TUA-ANON-KEY-QUI');

    const localData = localStorage.getItem('storeData');
    if (localData) {
        const data = JSON.parse(localData);
        console.log('\n📱 localStorage:');
        Object.entries(data).forEach(([person, pData]) => {
            console.log(`  ${person}: ${pData.points} punti, ${pData.history.length} giorni con errori`);
        });

        const lastSave = localStorage.getItem('lastSaveTimestamp');
        if (lastSave) {
            console.log('\n📅 Ultimo salvataggio:', new Date(lastSave).toLocaleString('it-IT'));
        }
    } else {
        console.log('\n⚠️ localStorage: VUOTO');
    }

    console.log('\n💡 Comandi utili:');
    console.log('  supabaseSync.force() - forza sincronizzazione');
    console.log('  supabaseSync.load() - ricarica da Supabase');
    console.log('  supabaseSync.reset() - reset mese');
}

// ========================================
// EXPORT
// ========================================

if (typeof window !== 'undefined') {
    window.supabaseSync = {
        init: initSupabaseSync,
        save: saveDataSync,
        load: loadFromSupabase,
        force: forceSyncNow,
        reset: resetMonth,
        status: checkSyncStatus,
        startAuto: startAutoSync
    };
}
