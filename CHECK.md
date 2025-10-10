# ✅ Checklist Verifica Setup

> Usa questa checklist per verificare che tutto sia configurato correttamente

---

## 📁 1. Struttura File

Verifica che la struttura sia esattamente così:

```
maestro-negozio/
├── 📄 index.html
├── 📄 team.html
├── 📄 manager.html
├── 📄 README.md
├── 📄 QUICK_START.md
└── 📁 assets/
    ├── 📁 css/
    │   └── 📄 style.css
    └── 📁 js/
        ├── 📄 config.js
        ├── 📄 data.js
        ├── 📄 ui.js
        ├── 📄 analytics.js
        ├── 📄 report.js
        └── 📄 manager.js
```

**Totale file necessari**: 12

---

## 🔍 2. Test Rapido Browser

### Test 1: index.html
1. Apri `index.html` nel browser
2. ✅ Vedi 2 card: "Manager" e "Team"
3. ✅ Nessun errore in console (F12)

### Test 1b: Password Manager
1. Click su "Manager"
2. ✅ Appare prompt password
3. Inserisci password sbagliata
4. ✅ Vedi alert "Password errata"
5. Click "Manager" di nuovo
6. Inserisci **`oakself`**
7. ✅ Vai a manager.html

### Test 2: team.html  
1. Click su "Team" da index
2. ✅ Vedi messaggio "Tutti a 500 punti"
3. ✅ Click "Aggiorna Ora" funziona
4. ✅ Nessun errore console

### Test 3: manager.html
1. Click su "Manager" da index
2. ✅ Vedi 4 tab in alto
3. ✅ Puoi selezionare una persona
4. ✅ Puoi selezionare data
5. ✅ Vedi lista task
6. ✅ Nessun errore console

### Test 4: Analytics
1. In manager.html, click tab "📊 Analytics"
2. ✅ Vedi "Team Health Score: 100/100"
3. ✅ Vedi "Tutto sotto controllo" (nessun dato)
4. ✅ Grafici si caricano (anche se vuoti)
5. ✅ Nessun errore console

### Test 5: Salva Dati
1. Tab "📋 Gestione Task"
2. Seleziona persona
3. Spunta 2-3 task
4. Click "💾 Salva Penalità"
5. ✅ Vedi alert "Salvato"
6. Tab "🏆 Classifica"
7. ✅ Vedi punti aggiornati

### Test 6: Report PDF
1. Tab "📂 Storico"
2. Click "📄 Report Settimanale"
3. ✅ Si apre nuova finestra
4. ✅ Vedi report formattato
5. Ctrl+P per stampare
6. ✅ Puoi salvare come PDF

---

## 🐛 3. Verifica Errori Console

Apri Console (F12) e cerca questi errori comuni:

### ❌ Errore: "Cannot read property..."
**Causa**: Script non caricati nell'ordine corretto  
**Soluzione**: Verifica ordine script in HTML:
1. config.js
2. data.js
3. ui.js
4. analytics.js
5. report.js
6. manager.js

### ❌ Errore: "updateLeaderboard is not defined"
**Causa**: ui.js non caricato  
**Soluzione**: Verifica path `assets/js/ui.js`

### ❌ Errore: "localStorage is not defined"
**Causa**: Normale negli artifact Claude  
**Soluzione**: Scarica file e apri in locale

### ❌ Errore: "Chart is not defined"
**Causa**: Chart.js non caricato  
**Soluzione**: Verifica connessione internet e CDN Chart.js in `<head>`

### ❌ Errore: "date adapter not implemented"
**Causa**: Adapter Chart.js mancante  
**Soluzione**: Aggiungi in `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
```

---

## 📊 4. Test con Dati

### Crea Dati Test
1. Apri Console (F12) in manager.html
2. Scrivi: `generateDemoData()` (se hai demo-data.js)
3. OPPURE manualmente:
   - Seleziona persona
   - Spunta 2-3 task
   - Salva
   - Ripeti per 5-6 giorni diversi
   - Ripeti per tutte e 3 le persone

### Verifica Analytics con Dati
1. Tab Analytics
2. ✅ Health Score < 100
3. ✅ Insights mostrano problemi
4. ✅ Grafici popolati con linee/barre
5. ✅ Previsioni mostrano cambiamenti

---

## 🚀 5. Test GitHub Pages

Se hai deployato su GitHub Pages:

### Test Remoto
1. Vai su `https://tuousername.github.io/maestro-negozio/`
2. ✅ Pagina si carica
3. ✅ Stili applicati correttamente
4. ✅ Navigazione funziona
5. ✅ Salvataggio dati funziona
6. ✅ Report PDF funzionano

### Test Mobile
1. Apri da smartphone
2. ✅ Layout responsive
3. ✅ Bottoni cliccabili
4. ✅ Tutto leggibile

---

## 🎯 6. Test Completo Workflow

Simula un uso reale:

### Giorno 1
1. Manager → Seleziona Gemy
2. Spunta "Report giornaliero"
3. Salva → ✅ 460 punti

### Giorno 2  
1. Manager → Seleziona Valeria
2. Spunta "Inventario" + "Chiusure"
3. Salva → ✅ 360 punti

### Giorno 3
1. Manager → Seleziona Riky
2. Spunta 3 task operative
3. Salva → ✅ 290 punti

### Verifica
1. Tab Classifica → ✅ Ordine corretto
2. Tab Analytics → ✅ Insights compaiono
3. Genera Report → ✅ Mostra problemi reali

---

## ✅ 7. Checklist Finale

Prima del deploy:

- [ ] Tutti i 12 file presenti
- [ ] Struttura cartelle corretta
- [ ] Nessun errore console su index.html
- [ ] Nessun errore console su team.html
- [ ] Nessun errore console su manager.html
- [ ] Salvataggio dati funziona
- [ ] Analytics si carica
- [ ] Report PDF si genera
- [ ] Classifica si aggiorna
- [ ] Responsive su mobile
- [ ] GitHub Pages attivo (se applicabile)

---

## 🆘 Se Qualcosa Non Funziona

1. **Ricarica hard** (Ctrl+Shift+R)
2. **Pulisci localStorage**: Console → `localStorage.clear()`
3. **Verifica ordine script** in HTML
4. **Controlla path file** (maiuscole/minuscole)
5. **Prova browser diverso** (Chrome/Firefox)
6. **Controlla connessione** (per CDN Chart.js)

---

## 📞 Debug Console

Comandi utili in console:

```javascript
// Verifica dati salvati
localStorage.getItem('storeData')

// Verifica funzioni caricate
typeof updateLeaderboard  // deve dire "function"
typeof calculateTrend     // deve dire "function"
typeof generateWeeklyReport // deve dire "function"

// Reset completo
localStorage.clear()
location.reload()
```

---

**Se tutti i test ✅ → Sei pronto! 🎉**
