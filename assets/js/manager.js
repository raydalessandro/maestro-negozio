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

function saveTasksForToday() {
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
    
    saveData(data);
    
    alert(`✅ Salvato!\n\nPersona: ${selectedPerson}\nData: ${date}\nPenalità: -${totalPenalty} PP\nPunti attuali: ${data[selectedPerson].points} PP`);
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
    loadTrendChart();
    loadHeatmapChart();
    loadWeekdayChart();
    loadComparisonChart();
    loadPredictions();
    loadCorrelations();
}

function loadTeamHealthScore() {
    const health = calculateTeamHealthScore();
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
                    <div class="component-label">Team Morale</div>
                </div>
                <div class="health-component">
                    <div class="component-value">${Math.round(health.components.consistency)}%</div>
                    <div class="component-label">Consistenza</div>
                </div>
            </div>
        </div>
    `;
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
    if (charts.trend) charts.trend.destroy();
    
    const datasets = people.map((person, idx) => {
        const trend = calculateTrend(person, 30);
        const colors = ['#667eea', '#f5576c', '#FFD700'];
        
        return {
            label: person,
            data: trend.dailyPoints.map(d => d.points),
            borderColor: colors[idx],
            backgroundColor: colors[idx] + '33',
            tension: 0.4
        };
    });
    
    // Usa le date come labels
    const labels = calculateTrend(people[0], 30).dailyPoints.map(d => 
        new Date(d.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
    );
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: labels,
            datasets: datasets 
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: false, 
                    max: 500,
                    min: 0
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            }
        }
    });
}

function loadHeatmapChart() {
    const ctx = document.getElementById('heatmapChart');
    if (charts.heatmap) charts.heatmap.destroy();
    
    const heatmap = generateTaskHeatmap().slice(0, 10);
    
    charts.heatmap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: heatmap.map(t => t.task.substring(0, 30) + (t.task.length > 30 ? '...' : '')),
            datasets: [{
                label: 'Errori',
                data: heatmap.map(t => t.errorCount),
                backgroundColor: 'rgba(245, 87, 108, 0.7)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#fff' }
                },
                y: {
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

function loadWeekdayChart() {
    const ctx = document.getElementById('weekdayChart');
    if (charts.weekday) charts.weekday.destroy();
    
    const weekdayData = analyzeWeekdayPatterns();
    
    charts.weekday = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekdayData.map(d => d.name),
            datasets: [{
                label: 'Errori',
                data: weekdayData.map(d => d.count),
                backgroundColor: 'rgba(102, 126, 234, 0.7)'
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#fff' }
                },
                y: {
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

function loadComparisonChart() {
    const ctx = document.getElementById('comparisonChart');
    if (charts.comparison) charts.comparison.destroy();
    
    const comparison = compareWeekOverWeek();
    
    charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: people,
            datasets: [
                {
                    label: 'Settimana Scorsa',
                    data: people.map(p => comparison[p].previousWeek.penalty),
                    backgroundColor: 'rgba(200, 200, 200, 0.7)'
                },
                {
                    label: 'Questa Settimana',
                    data: people.map(p => comparison[p].currentWeek.penalty),
                    backgroundColor: 'rgba(102, 126, 234, 0.7)'
                }
            ]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#fff' }
                },
                y: {
                    ticks: { color: '#fff' }
                }
            }
        }
    });
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
    updateMonthDisplay();
    setTodayDate();
    updateLeaderboard();
});
