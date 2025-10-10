# 🚀 Setup GitHub Storage

> Guida completa per configurare il salvataggio dati su GitHub

---

## 📋 **Prerequisiti**

- ✅ Account GitHub
- ✅ Repository GitHub Pages attiva
- ✅ File già caricati su GitHub

---

## ⚙️ **Setup (5 minuti)**

### **Step 1: Crea Cartella Dati**

Nella tua repository GitHub:

```
maestro-negozio/
├── index.html
├── team.html
├── manager.html
├── assets/
└── data/              ← CREA QUESTA CARTELLA
    └── store-data.json  ← File che verrà creato automaticamente
```

**Come fare:**
1. Vai su GitHub → tua repository
2. Click "Add file" → "Create new file"
3. Nome file: `data/store-data.json`
4. Contenuto:
```json
{
  "Gemy": {
    "points": 500,
    "history": []
  },
  "Valeria": {
    "points": 500,
    "history": []
  },
  "Riky": {
    "points": 500,
    "history": []
  }
}
```
5. Click "Commit new file"

---

### **Step 2: Configura github-storage.js**

Apri `assets/js/github-storage.js` e modifica:

```javascript
const GITHUB_CONFIG = {
    owner: 'TUO-USERNAME',           // ← CAMBIA QUI con il tuo username
    repo: 'maestro-negozio',         // ← Nome della tua repo
    branch: 'main',                  // O 'master' se usi quello
    dataFile: 'data/store-data.json',
    token: null                      // Lascia null per repo pubbliche
};
```

**Esempio:**
```javascript
const GITHUB_CONFIG = {
    owner: 'mariobianchi',           // Il tuo username
    repo: 'maestro-negozio',
    branch: 'main',
    dataFile: 'data/store-data.json',
    token: null
};
```

---

### **Step 3: Carica su GitHub**

```bash
git add .
git commit -m "Add GitHub storage"
git push
```

---

### **Step 4: Test**

1. Apri l'app: `https://tuousername.github.io/maestro-negozio/`
2. Apri Console (F12)
3. Dovresti vedere:
```
🔄 Inizializzazione sincronizzazione GitHub...
📥 Caricamento dati da GitHub...
✅ Dati caricati da GitHub
✅ Sincronizzazione GitHub attiva
```

4. Vai su Manager → Salva una penalità
5. Console dovrebbe dire:
```
📤 Salvataggio dati su GitHub...
✅ Dati salvati su GitHub
```

6. Vai su GitHub → Refresh repository
7. Dovresti vedere nuovo commit su `data/store-data.json`

---

## ✅ **Verifica Funzionamento**

### **Test Multi-Device:**

1. **Da PC Chrome** → Salva penalità
2. **Da telefono Safari** → Ricarica app
3. ✅ Vedi dati aggiornati!

### **Test Console:**

```javascript
// Verifica config
githubSync.status()

// Forza sincronizzazione
githubSync.force()

// Carica da GitHub
githubSync.load()
```

---

## 🔒 **Opzionale: Token GitHub (Repo Private)**

Se la tua repo è **privata**, serve un token:

### **1. Crea Personal Access Token**

1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token (classic)
4. Nome: "Maestro Negozio"
5. Scopes: Seleziona solo `repo`
6. Generate token
7. **COPIA IL TOKEN** (non lo vedrai più!)

### **2. Aggiungi Token al Codice**

In `github-storage.js`:

```javascript
const GITHUB_CONFIG = {
    owner: 'tuousername',
    repo: 'maestro-negozio',
    branch: 'main',
    dataFile: 'data/store-data.json',
    token: 'ghp_tuoTokenQui123456789'  // ← INCOLLA QUI
};
```

⚠️ **ATTENZIONE:** 
- Il token è visibile nel codice JavaScript
- Chiunque veda il codice può usare il token
- Usa solo per repository personali
- Meglio lasciare repo pubblica e token null

---

## 🎯 **Come Funziona**

### **Salvataggio:**
```
Manager salva penalità
    ↓
saveData() chiamata
    ↓
Salva in localStorage (fallback)
    ↓
Salva su GitHub via API
    ↓
GitHub crea commit automatico
    ↓
✅ Sincronizzato!
```

### **Caricamento:**
```
App si apre
    ↓
Carica da GitHub
    ↓
Confronta con localStorage
    ↓
Usa versione più recente
    ↓
✅ Dati aggiornati!
```

---

## 🔄 **Sincronizzazione Automatica**

Di default l'app sincronizza:
- ✅ Ad ogni salvataggio
- ✅ All'apertura app
- ✅ Ogni 5 minuti (auto-sync)

Per cambiare intervallo, in console:
```javascript
githubSync.startAuto(10) // Ogni 10 minuti
```

---

## 🐛 **Troubleshooting**

### **❌ "GitHub API error: 404"**
- Verifica che `data/store-data.json` esista
- Controlla owner e repo in GITHUB_CONFIG
- Aspetta 1-2 minuti dopo creazione file

### **❌ "GitHub API error: 403"**
- Rate limit API GitHub (60 request/ora senza token)
- Aspetta 1 ora
- Oppure aggiungi token (5000 request/ora)

### **❌ "Sync non attiva"**
- Console: `githubSync.status()`
- Verifica configurazione
- Controlla errori in console

### **❌ "Dati non sincronizzati"**
- Console: `githubSync.force()`
- Verifica connessione internet
- Controlla commit su GitHub

---

## 📊 **Comandi Console Utili**

```javascript
// Info sincronizzazione
githubSync.status()

// Forza sync manuale
githubSync.force()

// Carica da GitHub
githubSync.load()

// Avvia auto-sync
githubSync.startAuto(5) // ogni 5 min
```

---

## 🎓 **Best Practices**

### **✅ Fai:**
- Testa su 2 dispositivi diversi
- Controlla commit su GitHub periodicamente
- Usa branch 'main' o 'gh-pages'
- Lascia repo pubblica se possibile

### **❌ Non Fare:**
- Mettere token in repo pubbliche
- Cancellare cartella `data/`
- Modificare manualmente `store-data.json` su GitHub (usa l'app)
- Fare commit manuali mentre l'app è aperta

---

## 📈 **Vantaggi GitHub Storage**

- ✅ **Multi-device** - Funziona su tutti i dispositivi
- ✅ **Storico Git** - Ogni salvataggio è un commit
- ✅ **Backup automatico** - GitHub fa backup
- ✅ **Gratis** - Zero costi
- ✅ **Facile** - 5 minuti setup
- ✅ **Affidabile** - Uptime 99.9%

---

## 🔮 **Prossimi Step (Opzionali)**

### **Passare a Firebase (se serve real-time)**
- Sync istantaneo (< 1 sec)
- Più richieste/ora
- Dashboard admin

### **Aggiungere Webhook**
- Notifiche Slack/Discord
- Email quando qualcuno scende sotto soglia
- Alert automatici

---

**✅ Setup completato! Ora i dati sono sincronizzati su GitHub!** 🎉

Per domande o problemi, controlla la console o apri issue su GitHub.
