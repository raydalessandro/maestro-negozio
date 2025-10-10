// ========================================
// GITHUB STORAGE - MAESTRO DI NEGOZIO
// ========================================
// Versione SEMPLIFICATA per repository PUBBLICA
// NON serve token per leggere, serve solo per scrivere

const GITHUB_CONFIG = {
    owner: 'raydalessandro',
    repo: 'maestro-negozio',
    branch: 'main',
    dataFile: 'data/store-data.json',
    token: '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'
};

// ========================================
// API GITHUB
// ========================================

/**
 * Carica dati da GitHub (NO AUTH per repo pubbliche)
 */
async function loadFromGitHub() {
    try {
        console.log('📥 Caricamento dati da GitHub...');
        
        // URL diretto al file RAW (più affidabile)
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.dataFile}`;
        
        console.log('🔗 URL:', rawUrl);
        
        // Prova prima con URL RAW (no auth needed)
        let response = await fetch(rawUrl, {
            method: 'GET',
            cache: 'no-cache'
        });
        
        console.log('📥 Response status (RAW):', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Dati caricati da GitHub (RAW URL)');
            console.log('📊 Dati:', Object.keys(data));
            
            // Ottieni SHA per aggiornamenti futuri
            const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}?ref=${GITHUB_CONFIG.branch}`;
            
            try {
                const apiResponse = await fetch(apiUrl, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (apiResponse.ok) {
                    const apiResult = await apiResponse.json();
                    return {
                        data: data,
                        sha: apiResult.sha
                    };
                }
            } catch (e) {
                console.warn('⚠️ Non riesco a ottenere SHA, ma dati OK');
            }
            
            return {
                data: data,
                sha: null
            };
        }
        
        // Se RAW fallisce, prova API (con auth se disponibile)
        console.log('⚠️ RAW URL fallito, provo API...');
        
        const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}?ref=${GITHUB_CONFIG.branch}`;
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        // Aggiungi auth solo se disponibile
        if (GITHUB_CONFIG.token) {
            headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
            console.log('🔐 Uso token per API');
        }
        
        response = await fetch(apiUrl, { headers });
        
        console.log('📥 Response status (API):', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ GitHub API error:', response.status, errorText);
            
            if (response.status === 404) {
                console.log('📝 File non trovato');
                return null;
            }
            
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const result = await response.json();
        const content = atob(result.content.replace(/\n/g, ''));
        const data = JSON.parse(content);
        
        console.log('✅ Dati caricati da GitHub (API)');
        console.log('📊 SHA:', result.sha);
        
        return {
            data: data,
            sha: result.sha
        };
        
    } catch (error) {
        console.error('❌ Errore caricamento da GitHub:', error);
        return null;
    }
}

/**
 * Salva dati su GitHub (SERVE TOKEN)
 */
async function saveToGitHub(data, sha = null) {
    try {
        console.log('📤 Salvataggio dati su GitHub...');
        
        if (!GITHUB_CONFIG.token) {
            throw new Error('Token GitHub richiesto per salvare');
        }
        
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}`;
        
        const content = btoa(JSON.stringify(data, null, 2));
        
        const body = {
            message: `Update store data - ${new Date().toISOString()}`,
            content: content,
            branch: GITHUB_CONFIG.branch
        };
        
        if (sha) {
            body.sha = sha;
            console.log('📝 Aggiornamento file esistente');
        } else {
            console.log('📝 Creazione nuovo file');
        }
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GITHUB_CONFIG.token}`
        };
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ GitHub API error:', errorText);
            
            if (response.status === 401 || response.status === 403) {
                throw new Error('Token non valido o permessi insufficienti');
            }
            
            if (response.status === 409) {
                throw new Error('Conflitto: file modificato da qualcun altro');
            }
            
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('✅ Dati salvati su GitHub');
        console.log('📝 Commit:', result.commit.sha.substring(0, 7));
        
        return result.content.sha;
        
    } catch (error) {
        console.error('❌ Errore salvataggio su GitHub:', error);
        throw error;
    }
}

// ========================================
// SINCRONIZZAZIONE
// ========================================

let currentSha = null;
let syncEnabled = false;

async function initGitHubSync() {
    console.log('🔄 Inizializzazione sincronizzazione GitHub...');
    
    try {
        const githubData = await loadFromGitHub();
        
        if (githubData && githubData.data) {
            currentSha = githubData.sha;
            
            console.log('✅ Dati GitHub caricati:', Object.keys(githubData.data));
            
            // Salva in localStorage come cache
            localStorage.setItem('storeData', JSON.stringify(githubData.data));
            localStorage.setItem('lastSaveTimestamp', new Date().toISOString());
            
            syncEnabled = true;
            console.log('✅ Sincronizzazione GitHub attiva');
        } else {
            console.warn('⚠️ Nessun dato su GitHub, inizializzo locale');
            
            // Inizializza dati di default
            const defaultData = {
                "Gemy": { "points": 500, "history": [] },
                "Valeria": { "points": 500, "history": [] },
                "Riky": { "points": 500, "history": [] }
            };
            
            localStorage.setItem('storeData', JSON.stringify(defaultData));
            
            // Prova a salvare su GitHub
            if (GITHUB_CONFIG.token) {
                console.log('📤 Salvo dati di default su GitHub...');
                const sha = await saveToGitHub(defaultData, null);
                if (sha) {
                    currentSha = sha;
                    syncEnabled = true;
                    console.log('✅ Dati iniziali salvati su GitHub');
                }
            } else {
                console.warn('⚠️ Nessun token, solo localStorage');
                syncEnabled = false;
            }
        }
    } catch (error) {
        console.error('❌ Errore inizializzazione GitHub:', error);
        
        // Fallback: usa localStorage o inizializza
        let localData = localStorage.getItem('storeData');
        if (!localData) {
            console.log('📦 Inizializzo dati di default in localStorage');
            const defaultData = {
                "Gemy": { "points": 500, "history": [] },
                "Valeria": { "points": 500, "history": [] },
                "Riky": { "points": 500, "history": [] }
            };
            localStorage.setItem('storeData', JSON.stringify(defaultData));
        } else {
            console.log('📱 Uso dati da localStorage');
        }
        
        syncEnabled = false;
    }
}

async function saveDataSync(data) {
    // SEMPRE salva in localStorage (cache)
    localStorage.setItem('storeData', JSON.stringify(data));
    localStorage.setItem('lastSaveTimestamp', new Date().toISOString());
    
    if (!syncEnabled || !GITHUB_CONFIG.token) {
        console.warn('⚠️ GitHub sync non attiva, salvato solo in localStorage');
        return false;
    }
    
    try {
        const newSha = await saveToGitHub(data, currentSha);
        if (newSha) {
            currentSha = newSha;
            console.log('✅ Salvato su GitHub + localStorage');
            return true;
        }
    } catch (error) {
        console.error('❌ Errore salvataggio GitHub:', error);
    }
    
    console.warn('⚠️ Salvato solo in localStorage (GitHub fallito)');
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
            const data = JSON.parse(dataStr);
            await saveDataSync(data);
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
        alert('✅ Dati sincronizzati con GitHub!');
    } else {
        alert('⚠️ Dati salvati solo in localStorage.\n\nGitHub sync non disponibile.');
    }
}

function checkSyncStatus() {
    console.log('📊 === STATO SINCRONIZZAZIONE ===');
    console.log('Sync attiva:', syncEnabled);
    console.log('Owner:', GITHUB_CONFIG.owner);
    console.log('Repo:', GITHUB_CONFIG.repo);
    console.log('File:', GITHUB_CONFIG.dataFile);
    console.log('SHA corrente:', currentSha);
    console.log('Token configurato:', !!GITHUB_CONFIG.token);
    
    const localData = localStorage.getItem('storeData');
    console.log('localStorage:', localData ? 'OK' : 'VUOTO');
    
    if (localData) {
        const data = JSON.parse(localData);
        console.log('Persone in localStorage:', Object.keys(data));
    }
}

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
