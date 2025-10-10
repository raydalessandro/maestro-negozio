// ========================================
// UI FUNCTIONS - MAESTRO DI NEGOZIO
// ========================================
// Funzioni per la gestione dell'interfaccia utente

// ========================================
// CLASSIFICA / LEADERBOARD
// ========================================

/**
 * Aggiorna e renderizza la classifica
 */
function updateLeaderboard() {
    const leaderboardDiv = document.getElementById('leaderboard');
    if (!leaderboardDiv) return;

    const rankings = getLeaderboard();
    
    const html = rankings.map((player, idx) => {
        const emoji = levelEmojis[player.level.name] || '🎯';
        const progress = (player.points / INITIAL_POINTS) * 100;
        
        return `
            <div class="player-card">
                <div class="player-rank rank-${idx + 1}">${idx + 1}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-level">
                        <span class="level-badge">${emoji} ${player.level.name}</span>
                        <span>${player.points} / ${INITIAL_POINTS} PP</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="player-stats">
                        <div class="stat">
                            <div class="stat-value">${player.daysWithErrors}</div>
                            <div class="stat-label">Giorni con Errori</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">-${player.totalPenalty}</div>
                            <div class="stat-label">Penalità Totali</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${player.pointsLost}</div>
                            <div class="stat-label">Punti Persi</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    leaderboardDiv.innerHTML = html;
}

// ========================================
// ANIMAZIONI E FEEDBACK
// ========================================

/**
 * Mostra notifica temporanea
 * @param {string} message - Messaggio da mostrare
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 */
function showNotification(message, type = 'info') {
    // Crea elemento notifica
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">✕</button>
    `;
    
    // Aggiungi al body
    document.body.appendChild(notification);
    
    // Animazione entrata
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Rimuovi dopo 5 secondi
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Mostra animazione confetti per achievement
 */
function showConfetti() {
    // Semplice animazione confetti (opzionale)
    const confettiCount = 50;
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#FFD700'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

/**
 * Controlla achievement e mostra notifica se raggiunti
 * @param {string} personName - Nome persona
 * @param {number} oldPoints - Punti precedenti
 * @param {number} newPoints - Nuovi punti
 */
function checkAchievements(personName, oldPoints, newPoints) {
    const oldLevel = getLevel(oldPoints);
    const newLevel = getLevel(newPoints);
    
    // Cambio livello
    if (oldLevel.name !== newLevel.name) {
        if (newLevel.minPoints > oldLevel.minPoints) {
            // Livello aumentato
            showNotification(`🎉 ${personName} è salito a ${newLevel.name}!`, 'success');
            showConfetti();
        } else {
            // Livello diminuito
            showNotification(`⚠️ ${personName} è sceso a ${newLevel.name}`, 'warning');
        }
    }
    
    // Soglie speciali
    if (newPoints === INITIAL_POINTS && oldPoints < INITIAL_POINTS) {
        showNotification(`🌟 ${personName} ha recuperato tutti i punti!`, 'success');
    }
    
    if (newPoints < 100 && oldPoints >= 100) {
        showNotification(`⚠️ ${personName} è sotto i 100 punti!`, 'error');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Formatta data in formato italiano
 * @param {string} dateString - Data in formato YYYY-MM-DD
 * @returns {string} Data formattata
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Ottiene il nome del mese
 * @param {number} month - Numero mese (0-11)
 * @returns {string} Nome del mese
 */
function getMonthName(month) {
    const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                   'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return months[month];
}

/**
 * Genera colore basato su punteggio
 * @param {number} points - Punti
 * @returns {string} Colore esadecimale
 */
function getColorByPoints(points) {
    const percentage = (points / INITIAL_POINTS) * 100;
    
    if (percentage >= 90) return '#00C853'; // Verde
    if (percentage >= 70) return '#64DD17'; // Verde chiaro
    if (percentage >= 50) return '#FFD600'; // Giallo
    if (percentage >= 30) return '#FF6D00'; // Arancione
    return '#D50000'; // Rosso
}

/**
 * Calcola giorni rimanenti nel mese
 * @returns {number} Giorni rimanenti
 */
function getDaysRemainingInMonth() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
}

/**
 * Genera statistiche per dashboard
 * @returns {object} Oggetto con statistiche
 */
function getDashboardStats() {
    const stats = getAggregateStats();
    const daysRemaining = getDaysRemainingInMonth();
    const leaderboard = getLeaderboard();
    
    return {
        ...stats,
        daysRemaining,
        leader: leaderboard[0],
        lastPlace: leaderboard[leaderboard.length - 1],
        averagePerformance: (stats.averagePoints / INITIAL_POINTS) * 100
    };
}

// ========================================
// FILTRI E RICERCA
// ========================================

/**
 * Filtra task per categoria
 * @param {string} category - Nome categoria
 * @returns {array} Array di task
 */
function filterTasksByCategory(category) {
    return tasks[category] || [];
}

/**
 * Cerca task per nome
 * @param {string} searchTerm - Termine di ricerca
 * @returns {array} Array di task trovate
 */
function searchTasks(searchTerm) {
    const allTasks = getAllTasks();
    const term = searchTerm.toLowerCase();
    
    return allTasks.filter(task => 
        task.name.toLowerCase().includes(term)
    );
}

// ========================================
// ESPORTAZIONE E STAMPA
// ========================================

/**
 * Prepara dati per stampa
 * @returns {string} HTML formattato per stampa
 */
function preparePrintView() {
    const leaderboard = getLeaderboard();
    const stats = getDashboardStats();
    
    let html = `
        <html>
        <head>
            <title>Report Maestro di Negozio</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #667eea; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #667eea; color: white; }
                .footer { margin-top: 40px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <h1>📊 Report Maestro di Negozio</h1>
            <p><strong>Data:</strong> ${formatDate(new Date().toISOString().split('T')[0])}</p>
            
            <h2>Classifica Attuale</h2>
            <table>
                <thead>
                    <tr>
                        <th>Posizione</th>
                        <th>Nome</th>
                        <th>Punti</th>
                        <th>Livello</th>
                        <th>Giorni con Errori</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map((player, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${player.name}</td>
                            <td>${player.points}</td>
                            <td>${player.level.name}</td>
                            <td>${player.daysWithErrors}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <h2>Statistiche Generali</h2>
            <ul>
                <li><strong>Media Punti:</strong> ${stats.averagePoints.toFixed(1)}</li>
                <li><strong>Totale Penalità:</strong> ${stats.totalPenalties}</li>
                <li><strong>Giorni Rimanenti nel Mese:</strong> ${stats.daysRemaining}</li>
            </ul>
            
            <div class="footer">
                <p>Report generato automaticamente dal sistema Maestro di Negozio</p>
            </div>
        </body>
        </html>
    `;
    
    return html;
}

/**
 * Apre finestra di stampa
 */
function printReport() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(preparePrintView());
    printWindow.document.close();
    printWindow.print();
}

// ========================================
// VALIDAZIONE
// ========================================

/**
 * Valida data
 * @param {string} dateString - Data da validare
 * @returns {boolean} True se valida
 */
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Valida range di punti
 * @param {number} points - Punti da validare
 * @returns {boolean} True se validi
 */
function isValidPoints(points) {
    return typeof points === 'number' && points >= 0 && points <= INITIAL_POINTS;
}
