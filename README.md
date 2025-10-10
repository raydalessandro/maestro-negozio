# 🏆 Maestro di Negozio

Sistema di monitoraggio task con gamification per team retail.

## 📋 Descrizione

**Maestro di Negozio** è un'applicazione web per il monitoraggio delle performance del team attraverso un sistema di punteggio e gamification. Ogni membro parte con 500 punti e perde punti per task non completate. Il sistema include livelli, classifica e statistiche dettagliate.

## ✨ Funzionalità

### 👨‍💼 Vista Manager
- ✅ Gestione penalità giornaliere
- ✅ Selezione persona e data
- ✅ Checklist task complete
- ✅ Riepilogo penalità in tempo reale
- ✅ **Analytics Avanzate** (NEW! 🔥)
  - 🤖 AI Insights automatici
  - 📊 Grafici trend 30 giorni
  - 🔥 Heatmap task problematiche
  - 📅 Pattern temporali
  - 🔮 Previsioni fine mese
  - 💡 Raccomandazioni personalizzate
  - 🏥 Team Health Score
  - 🔗 Analisi correlazioni task
- ✅ Storico completo con filtri
- ✅ Export dati (CSV e JSON)
- ✅ Reset mensile

### 🏆 Vista Team
- ✅ Classifica in tempo reale
- ✅ Sistema a 5 livelli
- ✅ Progress bar visuale
- ✅ Statistiche dettagliate
- ✅ Auto-refresh ogni 30 secondi

## 🚀 Deploy su GitHub Pages

### 1. Crea una repository su GitHub

```bash
# Dalla tua macchina locale
mkdir maestro-negozio
cd maestro-negozio
git init
```

### 2. Crea la struttura cartelle

```
maestro-negozio/
├── index.html
├── team.html
├── manager.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── data.js
│       └── ui.js
└── README.md
```

### 3. Copia i file che ti ho creato

Copia tutti i file negli artifact nelle rispettive cartelle.

### 4. Pubblica su GitHub

```bash
git add .
git commit -m "Initial commit - Maestro di Negozio"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/maestro-negozio.git
git push -u origin main
```

### 5. Attiva GitHub Pages

1. Vai su **Settings** della repository
2. Clicca su **Pages** nel menu laterale
3. In **Source**, seleziona **main** branch
4. Clicca **Save**

**L'app sarà disponibile su:**
```
https://TUO-USERNAME.github.io/maestro-negozio/
```

## 📱 Come Usare

### Per il Manager

1. Apri l'app e clicca su **Manager**
2. Seleziona la **persona** da valutare
3. Seleziona la **data**
4. Spunta le task **NON completate**
5. Clicca **Salva Penalità**

### Per il Team

1. Apri l'app e clicca su **Team**
2. Visualizza la classifica aggiornata
3. La pagina si aggiorna automaticamente ogni 30 secondi

### Link Diretti

**Per condividere solo la classifica al team:**
```
https://TUO-USERNAME.github.io/maestro-negozio/team.html
```

**Per il manager:**
```
https://TUO-USERNAME.github.io/maestro-negozio/manager.html
```

## 🔬 Analytics Avanzate

### Team Health Score
Un punteggio da 0 a 100 che valuta la salute complessiva del team basato su:
- **Performance Media**: Media punti di tutto il team
- **Performance Minima**: Punti del membro con performance più bassa
- **Team Morale**: Percentuale di persone in miglioramento
- **Consistenza**: Quanto sono omogenee le performance

### AI Insights 🤖
Il sistema analizza automaticamente i dati e fornisce insights come:
- 🚨 Alert per persone a rischio (< 200 punti)
- 🎯 Task più problematiche del team
- 📅 Giorni della settimana più difficili
- 🌟 Riconoscimento di chi sta migliorando
- 📉 Segnalazione trend negativi
- 🔮 Previsioni critiche fine mese
- 🔗 Task che vengono saltate insieme

### Grafici Interattivi 📊

**Trend Punti (30 giorni)**
- Mostra l'andamento punti di ogni persona
- Identifica chi migliora e chi peggiora
- Visualizza giorni con errori

**Heatmap Task**
- Top 10 task più problematiche
- Frequenza errori per task
- Identifica aree di formazione necessarie

**Pattern Temporali**
- Errori per giorno della settimana
- Identifica i giorni più critici
- Ottimizza planning e supporto

**Comparazione Settimanale**
- Questa settimana vs settimana scorsa
- Mostra se la situazione migliora o peggiora
- Evidenzia trend positivi/negativi

### Previsioni Fine Mese 🔮
Basato sui trend degli ultimi 14 giorni, il sistema prevede:
- Punti finali previsti per ogni persona
- Livello che raggiungeranno
- Cambio rispetto ai punti attuali
- Livello di confidenza della previsione

### Raccomandazioni Personalizzate 💡
Per ogni persona, il sistema suggerisce:
- **Task su cui concentrarsi**: Le 3 task più problematiche
- **Tipo di intervento**: Formazione, monitoraggio, supporto
- **Azioni concrete**: Step specifici da implementare

### Correlazioni Task 🔗
Identifica quali task vengono spesso saltate insieme:
- Utile per capire problemi sistemici
- Aiuta a pianificare formazione congiunta
- Rivela colli di bottiglia nei processi

## 💡 Come Usare Analytics

1. Vai nella **Vista Manager**
2. Click sul tab **📊 Analytics**
3. Esplora i vari grafici e insights
4. Usa le raccomandazioni per prendere decisioni
5. Monitora il Team Health Score

**Suggerimento**: Controlla Analytics almeno 1 volta a settimana per interventi proattivi!

## 🎯 Sistema di Punteggio

### Punti Iniziali
Ogni persona parte con **500 PP** (Punti Prestazione) all'inizio del mese.

### Penalità

| Categoria | Tipo Task | Penalità |
|-----------|-----------|----------|
| **Routine Quotidiana** | Report giornaliero, Apertura/Chiusura | -40 PP |
| **Task Operativi** | Allestimenti, Inventario, Formazione, ecc. | -70 PP |
| **Obiettivi a Risultato** | KPI giornalieri | -10 PP |

### Sistema a Livelli

| Livello | Punti Richiesti | Benefici |
|---------|----------------|----------|
| 👑 **Maestro di Negozio** | 451-500 PP | Budget extra, menzione organigramma, premio annuale |
| 🎯 **Esperto di Negozio** | 301-450 PP | Mentorship retribuita |
| 🔨 **Artigiano** | 201-300 PP | Priorità ferie |
| ⚡ **Esecutore** | 101-200 PP | Badge digitale |
| 🌱 **Apprendista** | 0-100 PP | Formazione base |

## ⚙️ Personalizzazione

### Modificare Task e Punteggi

Apri `assets/js/config.js` e modifica:

```javascript
const tasks = {
    'Nome Categoria': [
        { name: 'Nome Task', points: 50 },
        // Aggiungi altre task...
    ]
};
```

### Modificare Livelli

```javascript
const levels = [
    {
        name: 'Nuovo Livello',
        minPoints: 100,
        maxPoints: 200,
        benefits: ['Beneficio 1', 'Beneficio 2']
    }
];
```

### Modificare Persone

```javascript
const people = ['Nome1', 'Nome2', 'Nome3'];
```

### Modificare Stili

Apri `assets/css/style.css` e modifica le variabili CSS:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #TUOCOLORE1, #TUOCOLORE2);
    --secondary-gradient: linear-gradient(135deg, #TUOCOLORE3, #TUOCOLORE4);
}
```

## 📊 Export Dati

### CSV
- Click su **Export CSV** nella vista Manager
- Ottieni report completo in formato Excel

### JSON
- Click su **Export JSON** per backup completo
- Usa il file per ripristinare o migrare dati

## 🔄 Reset Mensile

1. Vai alla vista **Manager**
2. Tab **Storico**
3. Click su **Reset Mese**
4. Tutti i punti tornano a 500

## 💾 Salvataggio Dati

- ✅ Dati salvati automaticamente nel browser (localStorage)
- ✅ Nessun server necessario
- ✅ Funziona offline
- ⚠️ I dati sono locali al dispositivo del manager

## 🔮 Passaggio a Firebase (Futuro)

Per sincronizzare i dati tra più dispositivi:

1. Crea un progetto Firebase
2. Aggiungi le credenziali in `config.js`
3. Decommenta il codice Firebase in `data.js`
4. I dati saranno sincronizzati in tempo reale!

## 🐛 Troubleshooting

### La pagina non carica
- Controlla che tutti i file siano nella struttura corretta
- Verifica i percorsi in `<script src="...">` e `<link href="...">`

### I dati non si salvano
- Controlla che localStorage sia abilitato nel browser
- Prova a pulire la cache

### GitHub Pages non funziona
- Aspetta 5-10 minuti dopo l'attivazione
- Verifica che la branch sia corretta (main)
- Controlla che `index.html` sia nella root

## 📞 Supporto

Per modifiche o assistenza, contatta lo sviluppatore o consulta la documentazione ufficiale di:
- [GitHub Pages](https://pages.github.com/)
- [Firebase](https://firebase.google.com/docs) (per sync dati)

## 📚 Guida Interpretazione Analytics

### Come leggere il Team Health Score
- **80-100**: 🟢 Team eccellente, mantieni il corso
- **60-79**: 🟡 Buono, ma c'è margine di miglioramento
- **40-59**: 🟠 Attenzione richiesta, intervieni sulle criticità
- **0-39**: 🔴 Situazione critica, azione immediata necessaria

### Quando agire sugli Insights
- **Priority: Critical** → Intervento entro 24h
- **Priority: High** → Intervento entro 3 giorni
- **Priority: Medium** → Pianifica intervento questa settimana
- **Priority: Low** → Note per il futuro, riconoscimenti

### Best Practices
1. **Lunedì**: Controlla Team Health Score e imposta obiettivi settimanali
2. **Mercoledì**: Rivedi trend e aggiusta strategie se necessario
3. **Venerdì**: Analizza pattern settimanali e pianifica settimana successiva
4. **Fine mese**: Usa previsioni per anticipare problemi

### Red Flags da non ignorare
- 🚨 Team Health Score < 40
- 🚨 Più di una persona sotto 200 punti
- 🚨 Stessa task in top 3 heatmap per 2+ settimane
- 🚨 Trend negativo per 2+ settimane consecutive

## 📄 Licenza

Uso interno. Tutti i diritti riservati.

---

**Made with ❤️ for store excellence**
