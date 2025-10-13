// ========================================
// MANAGER CONTROLLER - MAESTRO DI NEGOZIO
// ========================================
// Gestione completa della dashboard manager

// ========================================
// CONTROLLO AUTENTICAZIONE
// ========================================

// Verifica password all'avvio
if (sessionStorage.getItem('managerAuth') !== 'true') {
    alert('⛔ Accesso negato! Devi inserire la password dalla home.');
    window.location.href = 'index.html';
}

// ========================================
// VARIABILI GLOBALI
// ========================================
let selectedPerson = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let charts = {};

// ========================================
// NAVIGAZIONE
// ========================================

function goHome() {
    window.location.href = 'index.html';
}

function logout() {
    if (confirm('🚪 Vuoi uscire dalla dashboard Manager?')) {
        sessionStorage.removeItem('managerAuth');
        window.location.href = 'index.html';
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById('tab-' + tabName).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'leaderboard') updateLeaderboard();
    if (tabName === 'history') loadHistory();
    if (tabName === 'analytics') loadAnalytics();
}

// ========================================
// GESTIONE MESE
// ========================================

function updateMonthDisplay() {
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentMonth]} ${currentYear}`;
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateMonthDisplay();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateMonthDisplay();
}

function resetMonth() {
    if (!confirm('⚠️ Sei sicuro di voler resettare il mese?\n\nTutti i punti torneranno a 500 e lo storico verrà cancellato.')) return;

    const data = getData();
    people.forEach(person => {
        data[person].points = 500;
        data[person].history = [];
    });
    saveData(data);
    
    alert('✅ Mese resettato! Tutti ripartono da 500 punti.');
    renderTasks();
    updateLeaderboard();
    loadHistory();
}

// ========================================
// BACKUP E RIPRISTINO
// ========================================

/**
 * Download backup completo
 */
function downloadBackup() {
    const data = getData();
    if (!data) {
        alert('❌ Nessun dato da esportare!');
        return;
    }
    
    const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: data
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maestro-negozio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert('✅ Backup scaricato!\n\n💡 Conserva questo file in un posto sicuro.');
}

/**
 * Carica backup da file
 */
function uploadBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                
                // Verifica struttura backup
                if (!backup.data || typeof backup.data !== 'object') {
                    throw new Error('File backup non valido');
                }
                
                if (confirm('⚠️ Sei sicuro?\n\nQuesto sovrascriverà TUTTI i dati attuali con il backup.\n\nData backup: ' + new Date(backup.exportDate).toLocaleString('it-IT'))) {
                    saveData(backup.data);
                    alert('✅ Backup ripristinato con successo!\n\nRicarica la pagina per vedere i dati.');
                    location.reload();
                }
            } catch (e) {
                alert('❌ Errore nel caricamento backup:\n\n' + e.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ========================================
// GESTIONE DATE
// ========================================

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDate').value = today;
    
    // Imposta date filtro storico
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('historyFromDate').value = firstDay;
    document.getElementById('historyToDate').value = today;
}

// ========================================
// GESTIONE TASK
// ========================================

function selectPerson(person) {
    selectedPerson = person;
    document.querySelectorAll('.person-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    renderTasks();
}

function renderTasks() {
    if (!selectedPerson) {
        document.getElementById('tasksList').innerHTML = 
            '<div class="card"><p style="text-align:center; font-size:1.2em;">👆 Seleziona una persona per iniziare</p></div>';
        return;
    }

    let html = '';
    for (const [category, taskList] of Object.entries(tasks)) {
        html += `
            <div class="card">
                <div class="task-category">
                    <div class="category-header">${category}</div>
                    ${taskList.map((task, idx) => `
                        <div class="task-item">
                            <input type="checkbox" id="task-${category}-${idx}" 
                                   data-points="${task.points}"
                                   data-task="${task.name}"
                                   onchange="updatePenaltySummary()">
                            <label for="task-${category}-${idx}">${task.name}</label>
                            <span class="task-points">-${task.points} PP</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    document.getElementById('tasksList').innerHTML = html;
    loadTasksForDate();
}

function loadTasksForDate() {
    const date = document.getElementById('taskDate').value;
    if (!selectedPerson || !date) return;

    const data = getData();
    const personData = data[selectedPerson];
    const dayRecord = personData.history.find(h => h.date === date);

    document.querySelectorAll('#tasksList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    if (dayRecord && dayRecord.incompleteTasks) {
        dayRecord.incompleteTasks.forEach(taskName => {
            const checkbox = Array.from(document.querySelectorAll('#tasksList input[type="checkbox"]'))
                .find(cb => cb.dataset.task === taskName);
            if (checkbox) checkbox.checked = true;
        });
    }
    updatePenaltySummary();
}

function updatePenaltySummary() {
    const checkboxes = document.querySelectorAll('#tasksList input[type="checkbox"]:checked');
    let totalPenalty = 0;
    let taskCount = checkboxes.length;

    checkboxes.forEach(cb => {
        totalPenalty += parseInt(cb.dataset.points);
    });

    const summaryDiv = document.getElementById('penaltySummary');
    if (taskCount === 0) {
        summaryDiv.innerHTML = `
            <h3>✅ Nessuna penalità</h3>
            <p>Tutte le task completate!</p>
        `;
    } else {
        const data = getData();
        const currentPoints = data[selectedPerson].points;
        
        // Calcola punti vecchi (prima di questa modifica)
        const date = document.getElementById('taskDate').value;
        const oldRecord = data[selectedPerson].history.find(h => h.date === date);
        const oldPenalty = oldRecord ? oldRecord.penalty : 0;
        
        // Calcola nuovi punti
        const newPoints = currentPoints + oldPenalty - totalPenalty;
        
        summaryDiv.innerHTML = `
            <h3>⚠️ Riepilogo Penalità</h3>
            <p><strong>${taskCount}</strong> task non completate</p>
            <p style="font-size:1.5em; color:#ff6b6b;">Penalità: <strong>-${totalPenalty} PP</strong></p>
            <p>Punti dopo salvataggio: <strong>${newPoints} PP</strong></p>
        `;
    }
}

function clearSelection() {
    document.querySelectorAll('#tasksList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    updatePenaltySummary();
}

async function saveTasksForToday() {
    if (!selectedPerson) {
        alert('❌ Seleziona una persona!');
        return;
    }

    const date = document.getElementById('taskDate').value;
    const checkboxes = document.querySelectorAll('#tasksList input[type="checkbox"]:checked');
    let totalPenalty = 0;
    const incompleteTasks = [];

    checkboxes.forEach(cb => {
        totalPenalty += parseInt(cb.dataset.points);
        incompleteTasks.push(cb.dataset.task);
    });

    const data = getData();
    
    // Rimuovi record precedente per questa data
    data[selectedPerson].history = data[selectedPerson].history.filter(h => h.date !== date);
    
    // Aggiungi nuovo record se c'è penalità
    if (totalPenalty > 0) {
        data[selectedPerson].history.push({
            date: date,
            penalty: totalPenalty,
            incompleteTasks: incompleteTasks
        });
    }

    // Ricalcola punti totali
    data[selectedPerson].points = 500 - data[selectedPerson].history.reduce((sum, h) => sum + h.penalty, 0);
    
    // Salva (con await per GitHub)
    const success = await saveData(data);
    
    if (success) {
        alert(`✅ Salvato su GitHub!\n\nPersona: ${selectedPerson}\nData: ${date}\nPenalità: -${totalPenalty} PP\nPunti attuali: ${data[selectedPerson].points} PP`);
    } else {
        alert(`⚠️ Salvato SOLO in locale!\n\nPersona: ${selectedPerson}\nData: ${date}\nPenalità: -${totalPenalty} PP\nPunti attuali: ${data[selectedPerson].points} PP\n\n❌ GitHub NON disponibile - verifica connessione!`);
    }
    
    updatePenaltySummary();
}

// ========================================
// STORICO
// ========================================

function loadHistory() {
    const person = document.getElementById('historyPerson').value;
    const fromDate = document.getElementById('historyFromDate').value;
    const toDate = document.getElementById('historyToDate').value;
    
    const data = getData();
    let allHistory = [];

    if (person === 'all') {
        people.forEach(p => {
            data[p].history.forEach(h => {
                allHistory.push({ person: p, ...h });
            });
        });
    } else {
        data[person].history.forEach(h => {
            allHistory.push({ person: person, ...h });
        });
    }

    // Filtra per date
    if (fromDate) allHistory = allHistory.filter(h => h.date >= fromDate);
    if (toDate) allHistory = allHistory.filter(h => h.date <= toDate);

    // Ordina per data (più recente prima)
    allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '<div class="history-entries">';
    if (allHistory.length === 0) {
        html += '<p style="text-align:center; padding:20px;">Nessun dato trovato per i filtri selezionati</p>';
    } else {
        allHistory.forEach(entry => {
            html += `
                <div class="history-entry card">
                    <div class="history-header">
                        <strong>${entry.person}</strong>
                        <span>${new Date(entry.date).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div class="history-penalty">Penalità: <strong>-${entry.penalty} PP</strong></div>
                    <div class="history-tasks">
                        <details>
                            <summary>${entry.incompleteTasks.length} task non completate</summary>
                            <ul>
                                ${entry.incompleteTasks.map(t => `<li>${t}</li>`).join('')}
                            </ul>
                        </details>
                    </div>
                </div>
            `;
        });
    }
    html += '</div>';
    document.getElementById('historyList').innerHTML = html;
}

// ========================================
// ANALYTICS
// ========================================

function loadAnalytics() {
    loadTeamHealthScore();
    loadAIInsights();
    loadFeedbackInsights();
    loadTrendChart();
    loadHeatmapChart();
    loadWeekdayChart();
    loadComparisonChart();
    loadPredictions();
    loadCorrelations();
}

function loadTeamHealthScore() {
    const health = calculateTeamHealthScore();
    
    // Aggiorna Team Morale con feedback reale
    const monthMood = getCurrentMonthMood();
    if (monthMood) {
        health.components.teamMorale = (monthMood / 5) * 100;
        // Ricalcola score
        health.score = Math.round(
            health.components.averagePerformance * 0.4 +
            health.components.worstPerformer * 0.3 +
            health.components.teamMorale * 0.2 +
            health.components.consistency * 0.1
        );
        health.rating = health.score >= 80 ? 'Excellent' : 
                       health.score >= 60 ? 'Good' : 
                       health.score >= 40 ? 'Fair' : 'Poor';
    }
    
    const color = health.score >= 80 ? '#00C853' : 
                 health.score >= 60 ? '#FFD600' : 
                 health.score >= 40 ? '#FF6D00' : '#D50000';
    
    document.getElementById('teamHealthScore').innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 5em; font-weight: bold; color: ${color};">${health.score}/100</div>
            <div style="font-size: 1.5em; margin-top: 10px;">${health.rating}</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px;">
                <div class="health-component">
                    <div class="component-value">${Math.round(health.components.averagePerformance)}%</div>
                    <div class="component-label">Performance Media</div>
                </div>
                <div class="health-component">
                    <div class="component-value">${Math.round(health.components.worstPerformer)}%</div>
                    <div class="component-label">Performance Minima</div>
                </div>
                <div class="health-component">
                    <div class="component-value">${Math.round(health.components.teamMorale)}%</div>
                    <div class="component-label">Team Morale ${monthMood ? '(Feedback)' : ''}</div>
                </div>
                <div class="health-component">
                    <div class="component-value">${Math.round(health.components.consistency)}%</div>
                    <div class="component-label">Consistenza</div>
                </div>
            </div>
        </div>
    `;
}

function loadFeedbackInsights() {
    const stats = getFeedbackStats();
    const unread = getUnreadFeedback();
    const recent = getRecentMessages(5);
    
    const container = document.getElementById('feedbackInsights');
    if (!container) return;
    
    let html = '<div class="card" style="margin-top: 20px;">';
    html += '<h2>💭 Feedback Team</h2>';
    
    if (stats.total === 0) {
        html += '<p style="text-align: center; opacity: 0.7; padding: 20px;">Nessun feedback ricevuto ancora.</p>';
    } else {
        // Stats overview
        html += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">
                <div class="health-component">
                    <div class="component-value">${stats.total}</div>
                    <div class="component-label">Feedback Totali</div>
                </div>
                <div class="health-component">
                    <div class="component-value" style="color: ${moodToColor(stats.avgMood)};">${stats.avgMood}/5</div>
                    <div class="component-label">Mood Medio</div>
                </div>
                <div class="health-component">
                    <div class="component-value">${unread.length}</div>
                    <div class="component-label">Non Letti</div>
                </div>
                <div class="health-component">
                    <div class="component-value">${stats.thisWeek}</div>
                    <div class="component-label">Questa Settimana</div>
                </div>
            </div>
        `;
        
        // Unread feedback
        if (unread.length > 0) {
            html += '<div style="background: rgba(255, 214, 0, 0.2); padding: 15px; border-radius: 10px; margin: 20px 0;">';
            html += `<h3>🔔 ${unread.length} Nuovo/i Feedback</h3>`;
            unread.slice(0, 3).forEach(f => {
                const date = new Date(f.timestamp).toLocaleDateString('it-IT');
                html += `
                    <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div>
                                <span style="font-size: 1.5em;">${moodToEmoji(f.mood)}</span>
                                <span style="margin-left: 10px; opacity: 0.8;">${moodToText(f.mood)}</span>
                            </div>
                            <span style="font-size: 0.9em; opacity: 0.7;">${date}</span>
                        </div>
                        ${f.message ? `<div style="opacity: 0.9; font-style: italic;">"${f.message}"</div>` : ''}
                        <div style="margin-top: 8px; font-size: 0.9em; opacity: 0.7;">
                            Categoria: ${f.category}
                        </div>
                    </div>
                `;
            });
            html += '<button class="btn btn-secondary" onclick="markAllFeedbackRead()" style="margin-top: 10px;">✅ Segna Tutti Come Letti</button>';
            html += '</div>';
        }
        
        // Recent messages
        if (recent.length > 0) {
            html += '<div style="margin-top: 20px;">';
            html += '<h3>💬 Ultimi Messaggi</h3>';
            recent.forEach(f => {
                const date = new Date(f.timestamp).toLocaleDateString('it-IT');
                const readStyle = f.read ? 'opacity: 0.6;' : '';
                html += `
                    <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin: 10px 0; ${readStyle}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div>
                                <span style="font-size: 1.3em;">${moodToEmoji(f.mood)}</span>
                                <span style="margin-left: 10px;">${moodToText(f.mood)}</span>
                                ${!f.read ? '<span style="color: #FFD700; margin-left: 10px;">● Nuovo</span>' : ''}
                            </div>
                            <span style="font-size: 0.9em; opacity: 0.7;">${date}</span>
                        </div>
                        <div style="opacity: 0.9; font-style: italic; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 5px;">
                            "${f.message}"
                        </div>
                        <div style="margin-top: 8px; font-size: 0.9em; opacity: 0.7;">
                            📁 ${f.category}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Categories breakdown
        if (Object.keys(stats.categories).length > 0) {
            html += '<div style="margin-top: 20px;">';
            html += '<h3>📊 Feedback per Categoria</h3>';
            html += '<div style="display: grid; gap: 10px; margin-top: 15px;">';
            Object.entries(stats.categories)
                .sort((a, b) => b[1] - a[1])
                .forEach(([cat, count]) => {
                    const percentage = (count / stats.total * 100).toFixed(0);
                    html += `
                        <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between;">
                                <strong>${cat}</strong>
                                <span>${count} (${percentage}%)</span>
                            </div>
                            <div class="progress-bar" style="margin-top: 8px;">
                                <div class="progress-fill" style="width: ${percentage}%;"></div>
                            </div>
                        </div>
                    `;
                });
            html += '</div></div>';
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function markAllFeedbackRead() {
    markAllAsRead();
    loadFeedbackInsights();
    alert('✅ Tutti i feedback segnati come letti!');
}

function loadAIInsights() {
    const insights = generateInsights();
    let html = '';
    
    if (insights.length === 0) {
        html = '<p style="text-align:center; opacity:0.7;">✨ Tutto sotto controllo! Nessun insight critico rilevato.</p>';
    } else {
        insights.forEach(insight => {
            const bgColor = insight.type === 'error' ? 'rgba(213, 0, 0, 0.2)' :
                           insight.type === 'warning' ? 'rgba(255, 214, 0, 0.2)' :
                           insight.type === 'success' ? 'rgba(0, 200, 83, 0.2)' :
                           'rgba(255, 255, 255, 0.1)';
            
            html += `
                <div class="insight-card" style="background: ${bgColor}; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">${insight.icon}</div>
                    <h4 style="margin-bottom: 10px;">${insight.title}</h4>
                    <p>${insight.message}</p>
                </div>
            `;
        });
    }
    
    document.getElementById('aiInsights').innerHTML = html;
}

function loadTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) {
        console.warn('⚠️ Canvas trendChart non trovato');
        return;
    }
    
    if (charts.trend) {
        charts.trend.destroy();
    }
    
    try {
        // Verifica dati sufficienti
        const testTrend = calculateTrend(people[0], 30);
        if (!testTrend.dailyPoints || testTrend.dailyPoints.length === 0) {
            ctx.parentElement.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.7;">📊 Nessun dato ancora. Aggiungi penalità per vedere i grafici!</p>';
            return;
        }
        
        // Prepara datasets
        const datasets = people.map((person, idx) => {
            const trend = calculateTrend(person, 30);
            const colors = ['#667eea', '#f5576c', '#FFD700'];
            
            return {
                label: person,
                data: trend.dailyPoints.map(d => d.points),
                borderColor: colors[idx],
                backgroundColor: colors[idx] + '33',
                tension: 0.4,
                fill: false,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            };
        });
        
        // Labels come stringhe semplici (no date objects)
        const labels = calculateTrend(people[0], 30).dailyPoints.map(d => {
            const date = new Date(d.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        // Crea grafico
        charts.trend = new Chart(ctx, {
            type: 'line',
            data: { 
                labels: labels,
                datasets: datasets 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: { 
                        beginAtZero: false, 
                        max: 500,
                        min: 0,
                        ticks: {
                            color: '#fff',
                            stepSize: 100
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#fff',
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 10
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + ' punti';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Grafico trend caricato con', labels.length, 'punti');
        
    } catch (error) {
        console.error('❌ Errore caricamento grafico trend:', error);
        ctx.parentElement.innerHTML = `
            <div style="text-align:center; padding:40px; color:#ff6b6b;">
                <div style="font-size:2em; margin-bottom:10px;">⚠️</div>
                <div>Errore caricamento grafico</div>
                <div style="font-size:0.9em; opacity:0.7; margin-top:10px;">
                    ${error.message}
                </div>
                <button class="btn btn-secondary" onclick="location.reload()" style="margin-top:20px;">
                    🔄 Ricarica Pagina
                </button>
            </div>
        `;
    }
}

function loadHeatmapChart() {
    const ctx = document.getElementById('heatmapChart');
    if (!ctx) {
        console.warn('⚠️ Canvas heatmapChart non trovato');
        return;
    }
    
    if (charts.heatmap) {
        charts.heatmap.destroy();
    }
    
    try {
        const heatmap = generateTaskHeatmap().slice(0, 10);
        
        if (heatmap.length === 0) {
            ctx.parentElement.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.7;">✅ Nessuna task problematica!</p>';
            return;
        }
        
        charts.heatmap = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: heatmap.map(t => {
                    const name = t.task;
                    return name.length > 30 ? name.substring(0, 30) + '...' : name;
                }),
                datasets: [{
                    label: 'Errori',
                    data: heatmap.map(t => t.errorCount),
                    backgroundColor: 'rgba(245, 87, 108, 0.7)',
                    borderColor: 'rgba(245, 87, 108, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            title: function(items) {
                                const index = items[0].dataIndex;
                                return heatmap[index].task;
                            },
                            label: function(context) {
                                return context.parsed.x + ' errori';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#fff',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: { 
                            color: '#fff',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        console.log('✅ Grafico heatmap caricato con', heatmap.length, 'task');
        
    } catch (error) {
        console.error('❌ Errore caricamento grafico heatmap:', error);
        ctx.parentElement.innerHTML = '<p style="text-align:center; color:#ff6b6b; padding:40px;">⚠️ Errore caricamento grafico</p>';
    }
}

function loadWeekdayChart() {
    const ctx = document.getElementById('weekdayChart');
    if (!ctx) {
        console.warn('⚠️ Canvas weekdayChart non trovato');
        return;
    }
    
    if (charts.weekday) {
        charts.weekday.destroy();
    }
    
    try {
        const weekdayData = analyzeWeekdayPatterns();
        
        if (weekdayData.every(d => d.count === 0)) {
            ctx.parentElement.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.7;">📅 Nessun dato ancora</p>';
            return;
        }
        
        charts.weekday = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekdayData.map(d => d.name),
                datasets: [{
                    label: 'Errori',
                    data: weekdayData.map(d => d.count),
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)'
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#fff'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ticks: { 
                            color: '#fff',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
        
        console.log('✅ Grafico weekday caricato');
        
    } catch (error) {
        console.error('❌ Errore caricamento grafico weekday:', error);
        ctx.parentElement.innerHTML = '<p style="text-align:center; color:#ff6b6b; padding:40px;">⚠️ Errore caricamento grafico</p>';
    }
}

function loadComparisonChart() {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) {
        console.warn('⚠️ Canvas comparisonChart non trovato');
        return;
    }
    
    if (charts.comparison) {
        charts.comparison.destroy();
    }
    
    try {
        const comparison = compareWeekOverWeek();
        
        charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: people,
                datasets: [
                    {
                        label: 'Settimana Scorsa',
                        data: people.map(p => comparison[p].previousWeek.penalty),
                        backgroundColor: 'rgba(200, 200, 200, 0.7)',
                        borderColor: 'rgba(200, 200, 200, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Questa Settimana',
                        data: people.map(p => comparison[p].currentWeek.penalty),
                        backgroundColor: 'rgba(102, 126, 234, 0.7)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': -' + context.parsed.y + ' PP';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#fff'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ticks: { 
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
        
        console.log('✅ Grafico comparison caricato');
        
    } catch (error) {
        console.error('❌ Errore caricamento grafico comparison:', error);
        ctx.parentElement.innerHTML = '<p style="text-align:center; color:#ff6b6b; padding:40px;">⚠️ Errore caricamento grafico</p>';
    }
}

function loadPredictions() {
    const predictions = predictEndOfMonth();
    let html = '<div style="display: grid; gap: 20px;">';
    
    people.forEach(person => {
        const pred = predictions[person];
        const change = pred.change;
        const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
        const color = change > 0 ? '#00C853' : change < 0 ? '#D50000' : '#FFD600';
        
        html += `
            <div class="prediction-card" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <h3>${person}</h3>
                <div style="display: flex; gap: 20px; align-items: center; margin-top: 15px; flex-wrap: wrap;">
                    <div>
                        <div style="font-size: 0.9em; opacity: 0.8;">Ora</div>
                        <div style="font-size: 2em; font-weight: bold;">${pred.current}</div>
                    </div>
                    <div style="font-size: 3em;">${arrow}</div>
                    <div>
                        <div style="font-size: 0.9em; opacity: 0.8;">Fine Mese</div>
                        <div style="font-size: 2em; font-weight: bold; color: ${color};">${pred.predicted}</div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <strong>Livello previsto:</strong> ${pred.level}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('predictions').innerHTML = html;
}

function showRecommendations(person) {
    const recs = generatePersonalRecommendations(person);
    let html = '<div style="margin-top: 20px;">';
    
    if (recs.length === 0) {
        html += '<p style="text-align:center;">✨ Performance ottima! Nessuna raccomandazione specifica.</p>';
    } else {
        recs.forEach(rec => {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                    <h4>${rec.icon} ${rec.title}</h4>
                    <div style="margin-top: 10px;">
                        ${rec.actions.join('<br>')}
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    document.getElementById('recommendations').innerHTML = html;
}

function loadCorrelations() {
    const correlations = findTaskCorrelations();
    const correlationsDiv = document.getElementById('correlations');
    
    if (correlations.length === 0) {
        correlationsDiv.innerHTML = '<p style="text-align:center; opacity:0.7;">Nessuna correlazione significativa trovata</p>';
    } else {
        let html = '<div style="display: grid; gap: 10px;">';
        correlations.forEach(corr => {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                    <strong>"${corr.tasks[0]}"</strong> + <strong>"${corr.tasks[1]}"</strong>
                    <div style="opacity: 0.8; margin-top: 5px;">Saltate insieme ${corr.occurrences} volte</div>
                </div>
            `;
        });
        html += '</div>';
        correlationsDiv.innerHTML = html;
    }
}

// ========================================
// INIZIALIZZAZIONE
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Inizializza Supabase sync
    if (window.supabaseSync && window.supabaseSync.init) {
        window.supabaseSync.init().then(() => {
            console.log('✅ Supabase sync pronta');
        }).catch(err => {
            console.error('❌ Errore Supabase init:', err);
        });
    }
    
    updateMonthDisplay();
    setTodayDate();
    updateLeaderboard();
});
