// ========================================
// MANAGER CONTROLLER - MAESTRO DI NEGOZIO
// CON ASYNC/AWAIT E LOADING STATES
// ========================================
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
// LOADING STATES
// ========================================
function showLoading(message = 'Caricamento...') {
// Rimuovi loader esistente se presente
hideLoading();
const loader = document.createElement('div');
loader.id = 'app-loader';
loader.innerHTML = `
    <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(5px);
    ">
        <div style="
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        ">
            <div style="font-size: 3em; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
            <div style="font-size: 1.2em; color: white;">${message}</div>
        </div>
    </div>
`;

// Aggiungi animazione spin
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
loader.appendChild(style);

document.body.appendChild(loader);
}
function hideLoading() {
const loader = document.getElementById('app-loader');
if (loader) loader.remove();
}
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
${monthNames[currentMonth]} ${currentYear};
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
async function resetMonth() {
if (!confirm('⚠️ Sei sicuro di voler resettare il mese?\n\nTutti i punti torneranno a 500 e lo storico verrà cancellato.')) return;
showLoading('Reset in corso...');

try {
    const data = await getData();
    people.forEach(person => {
        data[person].points = 500;
        data[person].history = [];
    });
    await saveData(data);
    
    hideLoading();
    alert('✅ Mese resettato! Tutti ripartono da 500 punti.');
    
    renderTasks();
    await updateLeaderboard();
    await loadHistory();
} catch (error) {
    hideLoading();
    alert('❌ Errore durante il reset:\n\n' + error.message);
    console.error(error);
}
}
// ========================================
// BACKUP E RIPRISTINO
// ========================================
async function downloadBackup() {
showLoading('Preparazione backup...');
try {
    const data = await getData();
    if (!data) {
        throw new Error('Nessun dato da esportare');
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
    
    hideLoading();
    alert('✅ Backup scaricato!\n\n💡 Conserva questo file in un posto sicuro.');
} catch (error) {
    hideLoading();
    alert('❌ Errore durante l\'esportazione:\n\n' + error.message);
    console.error(error);
}
}
function uploadBackup() {
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const backup = JSON.parse(event.target.result);
            
            if (!backup.data || typeof backup.data !== 'object') {
                throw new Error('File backup non valido');
            }
            
            if (confirm('⚠️ Sei sicuro?\n\nQuesto sovrascriverà TUTTI i dati attuali con il backup.\n\nData backup: ' + new Date(backup.exportDate).toLocaleString('it-IT'))) {
                showLoading('Ripristino backup...');
                
                await saveData(backup.data);
                
                hideLoading();
                alert('✅ Backup ripristinato con successo!\n\nRicarica la pagina per vedere i dati.');
                location.reload();
            }
        } catch (e) {
            hideLoading();
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
async function loadTasksForDate() {
const date = document.getElementById('taskDate').value;
if (!selectedPerson || !date) return;
try {
    const data = await getData();
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
} catch (error) {
    console.error('Errore caricamento task:', error);
}
}
async function updatePenaltySummary() {
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
    try {
        const data = await getData();
        const currentPoints = data[selectedPerson].points;
        
        const date = document.getElementById('taskDate').value;
        const oldRecord = data[selectedPerson].history.find(h => h.date === date);
        const oldPenalty = oldRecord ? oldRecord.penalty : 0;
        
        const newPoints = currentPoints + oldPenalty - totalPenalty;
        
        summaryDiv.innerHTML = `
            <h3>⚠️ Riepilogo Penalità</h3>
            <p><strong>${taskCount}</strong> task non completate</p>
            <p style="font-size:1.5em; color:#ff6b6b;">Penalità: <strong>-${totalPenalty} PP</strong></p>
            <p>Punti dopo salvataggio: <strong>${newPoints} PP</strong></p>
        `;
    } catch (error) {
        console.error('Errore calcolo penalità:', error);
    }
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
showLoading('Salvataggio in corso...');

try {
    const date = document.getElementById('taskDate').value;
    const checkboxes = document.querySelectorAll('#tasksList input[type="checkbox"]:checked');
    let totalPenalty = 0;
    const incompleteTasks = [];

    checkboxes.forEach(cb => {
        totalPenalty += parseInt(cb.dataset.points);
        incompleteTasks.push(cb.dataset.task);
    });

    const data = await getData();
    
    data[selectedPerson].history = data[selectedPerson].history.filter(h => h.date !== date);
    
    if (totalPenalty > 0) {
        data[selectedPerson].history.push({
            date: date,
            penalty: totalPenalty,
            incompleteTasks: incompleteTasks
        });
    }

    data[selectedPerson].points = 500 - data[selectedPerson].history.reduce((sum, h) => sum + h.penalty, 0);
    
    await saveData(data);
    
    hideLoading();
    
    alert(`✅ Salvato!\n\nPersona: ${selectedPerson}\nData: ${date}\nPenalità: -${totalPenalty} PP\nPunti attuali: ${data[selectedPerson].points} PP`);
    updatePenaltySummary();
    
} catch (error) {
    hideLoading();
    alert('❌ Errore durante il salvataggio:\n\n' + error.message + '\n\nRiprova.');
    console.error(error);
}
}
// ========================================
// STORICO
// ========================================
async function loadHistory() {
showLoading('Caricamento storico...');
try {
    const person = document.getElementById('historyPerson').value;
    const fromDate = document.getElementById('historyFromDate').value;
    const toDate = document.getElementById('historyToDate').value;
    
    const data = await getData();
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

    if (fromDate) allHistory = allHistory.filter(h => h.date >= fromDate);
    if (toDate) allHistory = allHistory.filter(h => h.date <= toDate);

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
    
    hideLoading();
} catch (error) {
    hideLoading();
    alert('❌ Errore caricamento storico:\n\n' + error.message);
    console.error(error);
}
}
// ========================================
// ANALYTICS
// ========================================
async function loadAnalytics() {
showLoading('Caricamento analytics...');
try {
    await loadTeamHealthScore();
    await loadAIInsights();
    await loadTrendChart();
    await loadHeatmapChart();
    await loadWeekdayChart();
    await loadComparisonChart();
    await loadPredictions();
    await loadCorrelations();
    
    hideLoading();
} catch (error) {
    hideLoading();
    alert('❌ Errore caricamento analytics:\n\n' + error.message);
    console.error(error);
}
}
async function loadTeamHealthScore() {
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
async function loadAIInsights() {
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
async function loadTrendChart() {
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
async function loadHeatmapChart() {
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
async function loadWeekdayChart() {
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
async function loadComparisonChart() {
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
async function loadPredictions() {
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
async function loadCorrelations() {
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
// LEADERBOARD
// ========================================
async function updateLeaderboard() {
showLoading('Aggiornamento classifica...');
try {
    const leaderboardDiv = document.getElementById('leaderboard');
    if (!leaderboardDiv) {
        hideLoading();
        return;
    }

    const rankings = await getLeaderboard();
    
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
    hideLoading();
} catch (error) {
    hideLoading();
    alert('❌ Errore aggiornamento classifica:\n\n' + error.message);
    console.error(error);
}
}
// ========================================
// INIZIALIZZAZIONE
// ========================================
document.addEventListener('DOMContentLoaded', async function() {
showLoading('Inizializzazione dashboard...');
try {
    // Verifica e inizializza GitHub sync
    if (!window.githubSync) {
        throw new Error('GitHub sync non disponibile');
    }
    
    await window.githubSync.init();
    
    // Carica dati iniziali
    await getData();
    
    // Setup UI
    updateMonthDisplay();
    setTodayDate();
    await updateLeaderboard();
    
    hideLoading();
    
    console.log('✅ Dashboard inizializzata correttamente');
    
} catch (error) {
    hideLoading();
    
    alert(
        '⚠️ Errore Inizializzazione\n\n' +
        'Impossibile caricare la dashboard.\n' +
        'Verifica la connessione internet e riprova.\n\n' +
        'Dettagli: ' + error.message
    );
    
    console.error('Init error:', error);
}
});
