// ========================================
// CONFIGURAZIONE GITHUB
// ========================================
const GITHUB_CONFIG = {
owner: 'raydalessandro',
repo: 'maestro-negozio',
branch: 'main',
dataFile: 'data/store-data.json',
token: null,  // NON serve per repo pubbliche
maxRetries: 3,
retryDelay: 1000 // 1 secondo
};
// ========================================
// RETRY HELPER
// ========================================
/**

Esegue un'operazione con retry automatico
*/
async function retryOperation(operation, maxRetries = GITHUB_CONFIG.maxRetries) {
let lastError;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
try {
return await operation();
} catch (error) {
lastError = error;
console.warn(⚠️ Tentativo ${attempt}/${maxRetries} fallito:, error.message);
     if (attempt < maxRetries) {
         // Wait con backoff esponenziale
         const delay = GITHUB_CONFIG.retryDelay * Math.pow(2, attempt - 1);
         console.log(`⏳ Riprovo tra ${delay}ms...`);
         await new Promise(resolve => setTimeout(resolve, delay));
     }
 }
}
throw lastError;
}

// ========================================
// API GITHUB
// ========================================
/**

Carica dati da GitHub (con retry)
*/
async function loadFromGitHub() {
return retryOperation(async () => {
console.log('📥 Caricamento dati da GitHub...');
 const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}?ref=${GITHUB_CONFIG.branch}`;
 
 const headers = {
     'Accept': 'application/vnd.github.v3+json',
     'Cache-Control': 'no-cache' // Forza fresh data
 };
 
 if (GITHUB_CONFIG.token) {
     headers['Authorization'] = `token ${GITHUB_CONFIG.token}`;
 }
 
 const response = await fetch(url, { headers });
 
 if (!response.ok) {
     if (response.status === 404) {
         console.log('📝 File dati non trovato, verrà creato al primo salvataggio');
         return null;
     }
     throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
 }
 
 const result = await response.json();
 
 // Decodifica contenuto Base64
 const content = atob(result.content.replace(/\n/g, ''));
 const data = JSON.parse(content);
 
 console.log('✅ Dati caricati da GitHub');
 console.log('📅 Ultimo aggiornamento:', data.lastUpdate || 'N/A');
 
 return {
     data: data,
     sha: result.sha // Serve per aggiornare il file
 };
});
}

/**

Salva dati su GitHub (con retry)
*/
async function saveToGitHub(data, sha = null) {
return retryOperation(async () => {
console.log('📤 Salvataggio dati su GitHub...');
 const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}`;
 
 // Prepara contenuto (con encoding UTF-8 corretto)
 const jsonString = JSON.stringify(data, null, 2);
 const content = btoa(unescape(encodeURIComponent(jsonString)));
 
 const body = {
     message: `📊 Update store data - ${new Date().toLocaleString('it-IT')}`,
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
});
}

// ========================================
// SINCRONIZZAZIONE
// ========================================
let currentSha = null;
let syncEnabled = false;
/**

GitHub Sync API pubblica
/
const githubSync = {
/*

Carica dati da GitHub
*/
async load() {
try {
const result = await loadFromGitHub();
if (result) {
currentSha = result.sha;
return result;
}
return null;
} catch (error) {
console.error('❌ Errore caricamento GitHub:', error);
throw error;
}
},

/**

Salva dati su GitHub
*/
async save(data) {
try {
const newSha = await saveToGitHub(data, currentSha);
currentSha = newSha;
return newSha;
} catch (error) {
console.error('❌ Errore salvataggio GitHub:', error);
throw error;
}
},

/**

Inizializza connessione GitHub
*/
async init() {
try {
console.log('🔄 Inizializzazione GitHub sync...');
 // Verifica configurazione
 if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.repo) {
     throw new Error('Configurazione GitHub incompleta');
 }
 
 // Prova a caricare dati
 const result = await this.load();
 
 if (result) {
     console.log('✅ GitHub sync inizializzato');
     syncEnabled = true;
     return true;
 } else {
     // File non esiste ancora, verrà creato al primo salvataggio
     console.log('📝 File dati non trovato, verrà creato al primo salvataggio');
     syncEnabled = true;
     return true;
 }
} catch (error) {
console.error('❌ Errore init GitHub:', error);
syncEnabled = false;
throw error;
}
},

/**

Verifica stato sincronizzazione
*/
status() {
console.log('📊 === STATO SINCRONIZZAZIONE ===');
console.log('Sync attiva:', syncEnabled);
console.log('Owner:', GITHUB_CONFIG.owner);
console.log('Repo:', GITHUB_CONFIG.repo);
console.log('File:', GITHUB_CONFIG.dataFile);
console.log('SHA corrente:', currentSha || 'N/A');
console.log('Token configurato:', !!GITHUB_CONFIG.token);
if (!syncEnabled) {
console.log('\n💡 Sincronizzazione non attiva');
console.log('Verifica configurazione e connessione internet');
}
return {
enabled: syncEnabled,
config: GITHUB_CONFIG,
sha: currentSha
};
},

/**

Forza sincronizzazione manuale
*/
async force() {
console.log('🔄 Forzatura sincronizzazione...');
if (!syncEnabled) {
throw new Error('Sincronizzazione non attiva');
}
// Invalida cache e ricarica
if (typeof invalidateCache === 'function') {
invalidateCache();
}
const result = await this.load();
console.log('✅ Sincronizzazione forzata completata');
return result;
}
};



// ========================================
// EXPORT
// ========================================
if (typeof window !== 'undefined') {
window.githubSync = githubSync;
}
console.log('☁️ GitHub Storage module caricato');
