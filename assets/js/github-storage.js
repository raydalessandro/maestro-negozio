// ========================================
// GITHUB STORAGE - MAESTRO DI NEGOZIO
// ========================================
// Salva e carica dati da GitHub repository

// ========================================
// CONFIGURAZIONE GITHUB
// ========================================

const GITHUB_CONFIG = {
    owner: 'raydalessandro',
    repo: 'maestro-negozio',
    branch: 'main',
    dataFile: 'data/store-data.json',
    token: null  // NON serve! Lascia null
    // Token GitHub (opzionale per pubbliche)
};

// ========================================
// API GITHUB
// ========================================

/**
 * Carica dati da GitHub
 */
async function loadFromGitHub() {
    try {
        console.log('📥 Caricamento dati da GitHub...');
        
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}?ref=${GITHUB_CONFIG.branch}`;
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (GITHUB_CONFIG.token) {
            headers['Authorization'] = `token ${GITHUB_CONFIG.token}`;
        }
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('📝 File dati non trovato su GitHub, verrà creato al primo salvataggio');
                return null;
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Decodifica contenuto Base64
        const content = atob(result.content.replace(/\n/g, ''));
        const data = JSON.parse(content);
        
        console.log('✅ Dati caricati da GitHub');
        console.log('📊 Ultimo aggiornamento:', new Date(result.commit?.author?.date || Date.now()).toLocaleString('it-IT'));
        
        return {
            data: data,
            sha: result.sha // Serve per aggiornare il file
        };
        
    } catch (error) {
        console.error('❌ Errore caricamento da GitHub:', error);
        return null;
    }
}

/**
 * Salva dati su GitHub
 */
async function saveToGitHub(data, sha = null) {
    try {
        console.log('📤 Salvataggio dati su GitHub...');
        
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}`;
        
        // Prepara contenuto
        const content = btoa(JSON.stringify(data, null, 2));
        
        const body = {
            message: `Update store data - ${new Date().toISOString()}`,
            content: content,
            branch: GITHUB_CONFIG.branch
        };
        
        // Se file esiste, serve il sha
        if (sha) {
            body.sha = sha;
        }
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        if (GITHUB_CONFIG.token) {
            headers['Authorization'] = `token ${GITHUB_CONFIG.token}`;
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message}`);
        }
        
        const result = await response.json();
        
        console.log('✅ Dati salvati su GitHub');
        console.log('📝 Commit:', result.commit.sha.substring(0, 7));
        
        return result.content.sha;
        
    } catch (error) {
        console.error('❌ Errore salvataggio su GitHub:', error);
        return null;
    }
}

// ========================================
// SINCRONIZZAZIONE
// ========================================

let currentSha = null;
let syncEnabled = false;

/**
 * Inizializza sincronizzazione GitHub
 */
async function initGitHubSync() {
    console.log('🔄 Inizializzazione sincronizzazione GitHub...');
    
    // Carica dati da GitHub
    const githubData = await loadFromGitHub();
    
    if (githubData) {
        currentSha = githubData.sha;
        
        // Confronta con localStorage
        const localData = localStorage.getItem('storeData');
        
        if (localData) {
            const local = JSON.parse(localData);
            const localTimestamp = localStorage.getItem('lastSaveTimestamp');
            
            // Se localStorage più recente, usa quello
            if (localTimestamp && new Date(localTimestamp) > new Date()) {
                console.log('📱 localStorage più recente, sincronizzazione con GitHub...');
                await saveToGitHub(local, currentSha);
            } else {
                console.log('☁️ GitHub più recente, aggiornamento localStorage...');
                localStorage.setItem('storeData', JSON.stringify(githubData.data));
            }
        } else {
            console.log('☁️ Primo caricamento da GitHub');
            localStorage.setItem('storeData', JSON.stringify(githubData.data));
        }
        
        syncEnabled = true;
        console.log('✅ Sincronizzazione GitHub attiva');
    } else {
        console.log('⚠️ Sincronizzazione GitHub non disponibile, uso localStorage');
        syncEnabled = false;
    }
}

/**
 * Salva dati con sincronizzazione
 */
async function saveDataSync(data) {
    // Salva sempre in localStorage per fallback
    localStorage.setItem('storeData', JSON.stringify(data));
    localStorage.setItem('lastSaveTimestamp', new Date().toISOString());
    
    // Se sync attiva, salva anche su GitHub
    if (syncEnabled) {
        const newSha = await saveToGitHub(data, currentSha);
        if (newSha) {
            currentSha = newSha;
            return true;
        } else {
            console.warn('⚠️ Fallback a localStorage, GitHub non disponibile');
            return false;
        }
    }
    
    return true;
}

/**
 * Sincronizzazione periodica automatica
 */
function startAutoSync(intervalMinutes = 5) {
    if (!syncEnabled) {
        console.log('⚠️ Auto-sync disabilitato, GitHub non configurato');
        return;
    }
    
    console.log(`🔄 Auto-sync attivo ogni ${intervalMinutes} minuti`);
    
    setInterval(async () => {
        console.log('🔄 Sincronizzazione automatica...');
        const data = getData();
        if (data) {
            await saveDataSync(data);
        }
    }, intervalMinutes * 60 * 1000);
}

/**
 * Forza sincronizzazione manuale
 */
async function forceSyncNow() {
    if (!syncEnabled) {
        alert('⚠️ Sincronizzazione GitHub non attiva.\n\nConfigura GitHub in github-storage.js');
        return;
    }
    
    const data = getData();
    if (!data) {
        alert('❌ Nessun dato da sincronizzare');
        return;
    }
    
    const success = await saveDataSync(data);
    
    if (success) {
        alert('✅ Dati sincronizzati con GitHub!');
    } else {
        alert('❌ Errore sincronizzazione.\n\nVerifica configurazione GitHub.');
    }
}

/**
 * Verifica stato sincronizzazione
 */
function checkSyncStatus() {
    console.log('📊 === STATO SINCRONIZZAZIONE ===');
    console.log('Sync attiva:', syncEnabled);
    console.log('Owner:', GITHUB_CONFIG.owner);
    console.log('Repo:', GITHUB_CONFIG.repo);
    console.log('File:', GITHUB_CONFIG.dataFile);
    console.log('SHA corrente:', currentSha);
    console.log('Token configurato:', !!GITHUB_CONFIG.token);
    
    if (!syncEnabled) {
        console.log('\n💡 Per attivare sincronizzazione:');
        console.log('1. Cambia GITHUB_CONFIG.owner con il tuo username');
        console.log('2. Verifica GITHUB_CONFIG.repo sia corretto');
        console.log('3. Ricarica la pagina');
    }
}

// ========================================
// EXPORT
// ========================================

if (typeof window !== 'undefined') {
    window.githubSync = {
        init: initGitHubSync,
        save: saveDataSync,
        load: loadFromGitHub,
        force: forceSyncNow,
        status: checkSyncStatus,
        startAuto: startAutoSync
    };
}
