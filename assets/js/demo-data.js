// ========================================
// DEMO DATA GENERATOR - MAESTRO DI NEGOZIO
// ========================================
// Genera dati fittizi per testare le analytics

/**
 * Genera dati demo realistici per test
 * ATTENZIONE: Sovrascrive i dati esistenti!
 */
function generateDemoData() {
    if (!confirm('⚠️ ATTENZIONE!\n\nQuesta funzione genererà dati DEMO e sovrascriverà tutti i dati esistenti.\n\nUsala SOLO per testare le analytics prima di iniziare a usare il sistema.\n\nVuoi continuare?')) {
        return;
    }

    const demoData = {};
    const today = new Date();
    const allTasksList = getAllTasks();
    
    people.forEach((person, personIdx) => {
        demoData[person] = {
            points: 500,
            history: []
        };
        
        // Genera 20-40 giorni di storico
        const daysOfHistory = 20 + Math.floor(Math.random() * 20);
        
        for (let i = daysOfHistory; i > 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Probabilità di avere errori (varia per persona)
            const errorProbability = [0.3, 0.2, 0.4][personIdx]; // Gemy 30%, Valeria 20%, Riky 40%
            
            if (Math.random() < errorProbability) {
                // Seleziona 1-4 task casuali
                const numTasks = 1 + Math.floor(Math.random() * 3);
                const selectedTasks = [];
                const usedIndices = new Set();
                
                for (let t = 0; t < numTasks; t++) {
                    let taskIdx;
                    do {
                        taskIdx = Math.floor(Math.random() * allTasksList.length);
                    } while (usedIndices.has(taskIdx));
                    usedIndices.add(taskIdx);
                    
                    selectedTasks.push(allTasksList[taskIdx].name);
                }
                
                const penalty = selectedTasks.reduce((sum, taskName) => {
                    const task = allTasksList.find(t => t.name === taskName);
                    return sum + (task ? task.points : 0);
                }, 0);
                
                demoData[person].history.push({
                    date: dateStr,
                    penalty: penalty,
                    incompleteTasks: selectedTasks
                });
            }
        }
        
        // Calcola punti finali
        demoData[person].points = INITIAL_POINTS - 
            demoData[person].history.reduce((sum, h) => sum + h.penalty, 0);
    });
    
    // Salva dati demo
    saveData(demoData);
    
    alert('✅ Dati DEMO generati con successo!\n\n' +
          `Gemy: ${demoData.Gemy.points} punti (${demoData.Gemy.history.length} giorni con errori)\n` +
          `Valeria: ${demoData.Valeria.points} punti (${demoData.Valeria.history.length} giorni con errori)\n` +
          `Riky: ${demoData.Riky.points} punti (${demoData.Riky.history.length} giorni con errori)\n\n` +
          'Vai nel tab Analytics per vedere i grafici!');
    
    // Ricarica pagina per aggiornare tutto
    location.reload();
}

/**
 * Reset ai dati iniziali puliti
 */
function resetToDemoClean() {
    if (!confirm('Vuoi resettare a dati puliti (tutti a 500 punti)?')) return;
    
    const cleanData = {};
    people.forEach(person => {
        cleanData[person] = {
            points: INITIAL_POINTS,
            history: []
        };
    });
    
    saveData(cleanData);
    alert('✅ Dati resettati!');
    location.reload();
}

// Aggiungi pulsante demo in manager.html (solo in sviluppo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.addEventListener('load', () => {
        // Aggiungi pulsante demo nella navbar se siamo in locale
        const header = document.querySelector('.header');
        if (header) {
            const demoButton = document.createElement('button');
            demoButton.className = 'btn btn-secondary';
            demoButton.textContent = '🎲 Genera Dati Demo';
            demoButton.onclick = generateDemoData;
            demoButton.style.marginTop = '10px';
            header.appendChild(demoButton);
        }
    });
}

// Export per uso manuale da console
if (typeof window !== 'undefined') {
    window.generateDemoData = generateDemoData;
    window.resetToDemoClean = resetToDemoClean;
}

console.log('💡 Vuoi testare le analytics? Scrivi nella console: generateDemoData()');
