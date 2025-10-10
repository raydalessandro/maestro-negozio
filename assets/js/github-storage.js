// ========================================
// GITHUB STORAGE - MAESTRO DI NEGOZIO
// ========================================
// Versione con CORS fix e debug esteso

const GITHUB_CONFIG = {
    owner: 'raydalessandro',
    repo: 'maestro-negozio',
    branch: 'main',
    dataFile: 'data/store-data.json',
    token: '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' // Sostituisci con il nuovo token
};

// ========================================
// API GITHUB (con debug esteso)
// ========================================

/**
 * Carica dati da GitHub
 */
async function loadFromGitHub() {
    try {
        console.log('📥 Caricamento dati da GitHub...');
        console.log('🔗 URL:', `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}`);
        
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}?ref=${GITHUB_CONFIG.branch}`;
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        
        if (GITHUB_CONFIG.token) {
            headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
            console.log('🔐 Token presente:', GITHUB_CONFIG.token.substring(0, 10) + '...');
        } else {
            console.warn('⚠️ Nessun token configurato!');
        }
        
        console.log('📤 Headers:', JSON.stringify(headers, null, 2));
        
        const response = await fetch(url, { 
            method: 'GET',
            headers: headers,
            mode: 'cors',
            cache: 'no-cache'
        });
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response body:', errorText);
            
            if (response.status === 404) {
                console.log('📝 File dati non trovato su GitHub, verrà creato al primo salvataggio');
                return null;
            }
            
            if (response.status === 401) {
                console.error('❌ 401 Unauthorized - Token non valido o mancante');
                console.error('Possibili cause:');
                console.error('1. Token scaduto o revocato');
                console.error('2. Token senza permessi sufficienti (serve scope "repo" o "Contents: Read and write")');
                console.error('3. Token per repository sbagliata');
                
                // Verifica token
                console.log('🔍 Verifica token...');
                const testResponse = await fetch('https://api.github.com/user', {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (testResponse.ok) {
                    const user = await testResponse.json();
                    console.log('✅ Token valido per utente:', user.login);
                    console.error('❌ Ma NON ha permessi su questa repository!');
                    console.error('Verifica che il token sia per raydalessandro e abbia scope "repo"');
                } else {
                    console.error('❌ Token completamente non valido');
                }
            }
            
            if (response.status === 403) {
                console.error('❌ 403 Forbidden - Rate limit o permessi insufficienti');
                const remaining = response.headers.get('X-RateLimit-Remaining');
                const reset = response.headers.get('X-RateLimit-Reset');
                console.log('Rate limit remaining:', remaining);
                if (reset) {
                    const resetDate = new Date(parseInt(reset) * 1000);
                    console.log('Rate limit reset:', resetDate.toLocaleString('it-IT'));
                }
            }
            
            throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        // Decodifica contenuto Base64
        const content = atob(result.content.replace(/\n/g, ''));
        const data = JSON.parse(content);
        
        console.log('✅ Dati caricati da GitHub');
        console.log('📊 SHA:', result.sha);
        
        return {
            data: data,
            sha: result.sha
        };
        
    } catch (error) {
        console.error('❌ Errore caricamento da GitHub:', error);
        console.error('Stack trace:', error.stack);
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
        
        if (sha) {
            body.sha = sha;
            console.log('📝 Aggiornamento file esistente (SHA:', sha.substring(0, 7) + ')');
        } else {
            console.log('📝 Creazione nuovo file');
        }
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        
        if (GITHUB_CONFIG.token) {
            headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
        }
        
        console.log('📤 Request body:', JSON.stringify(body, null, 2).substring(0, 200) + '...');
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body),
            mode: 'cors',
            cache: 'no-cache'
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response body:', errorText);
            
            if (response.status === 401) {
                console.error('❌ Token non valido per scrittura');
                console.error('Verifica che il token abbia scope "repo" o "Contents: Read and write"');
            }
            
            if (response.status === 409) {
                console.error('❌ Conflitto: il file è stato modificato da qualcun altro');
                console.error('Ricarica la pagina per ottenere la versione più recente');
            }
            
            throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        console.log('✅ Dati salvati su GitHub');
        console.log('📝 Nuovo SHA:', result.content.sha.substring(0, 7));
        
        return result.content.sha;
        
    } catch (error) {
        console.error('❌ Errore salvataggio su GitHub:', error);
        console.error('Stack trace:', error.stack);
        return null;
    }
}

// ========================================
// SINCRONIZZAZIONE
// ========================================

let currentSha = null;
let syncEnabled = false;

async function initGitHubSync() {
    console.log('🔄 Inizializzazione sincronizzazione GitHub...');
    console.log('📋 Config:', {
        owner: GITHUB_CONFIG.owner,
        repo: GITHUB_CONFIG.repo,
        branch: GITHUB_CONFIG.branch,
        file: GITHUB_CONFIG.dataFile,
        hasToken: !!GITHUB_CONFIG.token
    });
    
    const githubData = await loadFromGitHub();
    
    if (githubData) {
        currentSha = githubData.sha;
        
        const localData = localStorage.getItem('storeData');
        
        if (localData) {
            const local = JSON.parse(localData);
            const localTimestamp = localStorage.getItem('lastSaveTimestamp');
            
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

async function saveDataSync(data) {
    if (!syncEnabled) {
        console.warn('⚠️ GitHub sync non attiva');
        return false;
    }
    
    const newSha = await saveToGitHub(data, currentSha);
    if (newSha) {
        currentSha = newSha;
        localStorage.setItem('storeData', JSON.stringify(data));
        localStorage.setItem('lastSaveTimestamp', new Date().toISOString());
        return true;
    } else {
        console.error('❌ Fallimento salvataggio GitHub');
        return false;
    }
}

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

function checkSyncStatus() {
    console.log('📊 === STATO SINCRONIZZAZIONE ===');
    console.log('Sync attiva:', syncEnabled);
    console.log('Owner:', GITHUB_CONFIG.owner);
    console.log('Repo:', GITHUB_CONFIG.repo);
    console.log('File:', GITHUB_CONFIG.dataFile);
    console.log('Branch:', GITHUB_CONFIG.branch);
    console.log('SHA corrente:', currentSha);
    console.log('Token configurato:', !!GITHUB_CONFIG.token);
    
    if (GITHUB_CONFIG.token) {
        console.log('Token preview:', GITHUB_CONFIG.token.substring(0, 10) + '...');
    }
    
    if (!syncEnabled) {
        console.log('\n💡 Per risolvere:');
        console.log('1. Verifica che il token sia valido');
        console.log('2. Verifica che il token abbia scope "repo"');
        console.log('3. Verifica owner/repo/branch corretti');
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
