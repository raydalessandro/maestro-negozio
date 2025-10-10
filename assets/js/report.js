// ========================================
// REPORT GENERATOR - MAESTRO DI NEGOZIO
// ========================================
// Genera report visivo stampabile in PDF

/**
 * Genera report settimanale semplice e visivo
 */
function generateWeeklyReport() {
    const health = calculateTeamHealthScore();
    const leaderboard = getLeaderboard();
    const heatmap = generateTaskHeatmap().slice(0, 5); // Top 5
    const insights = generateInsights();
    
    // Prepara dati report
    const atRisk = leaderboard.filter(p => p.points < 300);
    const criticalInsights = insights.filter(i => i.priority === 'critical' || i.priority === 'high').slice(0, 5);
    
    // Crea finestra report
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(generateReportHTML(health, atRisk, heatmap, criticalInsights, leaderboard));
    reportWindow.document.close();
    
    // Auto-print dialog dopo 500ms
    setTimeout(() => {
        reportWindow.print();
    }, 500);
}

/**
 * Genera HTML del report
 */
function generateReportHTML(health, atRisk, heatmap, insights, leaderboard) {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    
    // Determina colore Health Score
    const healthColor = health.score >= 80 ? '#00C853' : 
                       health.score >= 60 ? '#FFD600' : 
                       health.score >= 40 ? '#FF6D00' : '#D50000';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Report Settimanale - Maestro di Negozio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            background: white;
            color: #333;
        }
        
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .report-header {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px 10px 0 0;
            margin-bottom: 30px;
        }
        
        .report-header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        .report-date {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
        }
        
        .section-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #667eea;
        }
        
        .health-score {
            text-align: center;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 10px;
        }
        
        .health-number {
            font-size: 4em;
            font-weight: bold;
            color: ${healthColor};
        }
        
        .health-label {
            font-size: 1.3em;
            color: #666;
            margin-top: 10px;
        }
        
        .person-card {
            padding: 15px;
            margin: 10px 0;
            border-left: 5px solid;
            background: #f9f9f9;
            border-radius: 5px;
        }
        
        .person-card.critical {
            border-color: #D50000;
            background: #ffebee;
        }
        
        .person-card.warning {
            border-color: #FFD600;
            background: #fffde7;
        }
        
        .person-card.good {
            border-color: #00C853;
            background: #e8f5e9;
        }
        
        .person-name {
            font-size: 1.3em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .person-points {
            font-size: 1.1em;
            color: #666;
            margin-bottom: 8px;
        }
        
        .person-action {
            color: #667eea;
            font-weight: 500;
        }
        
        .task-item {
            padding: 12px;
            margin: 8px 0;
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .task-name {
            font-weight: 500;
            flex: 1;
        }
        
        .task-count {
            background: #ff6b6b;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        
        .task-action {
            color: #666;
            font-size: 0.95em;
            margin-top: 5px;
            font-style: italic;
        }
        
        .action-checklist {
            list-style: none;
        }
        
        .action-checklist li {
            padding: 12px;
            margin: 8px 0;
            background: #fff;
            border: 2px solid #667eea;
            border-radius: 5px;
            font-size: 1.1em;
            position: relative;
            padding-left: 40px;
        }
        
        .action-checklist li:before {
            content: '□';
            position: absolute;
            left: 12px;
            font-size: 1.5em;
            color: #667eea;
        }
        
        .no-problems {
            text-align: center;
            padding: 30px;
            color: #00C853;
            font-size: 1.2em;
        }
        
        .report-footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 2px solid #e0e0e0;
            color: #999;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        .summary-card {
            text-align: center;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
        }
        
        .summary-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .summary-label {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <div class="report-header">
            <h1>🏆 Report Settimanale Negozio</h1>
            <div class="report-date">
                Periodo: ${weekStart.toLocaleDateString('it-IT')} - ${today.toLocaleDateString('it-IT')}
            </div>
        </div>
        
        <!-- Health Score -->
        <div class="section">
            <div class="section-title">🏥 Salute Team</div>
            <div class="health-score">
                <div class="health-number">${health.score}/100</div>
                <div class="health-label">${health.rating}</div>
            </div>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-value">${Math.round(health.components.averagePerformance)}%</div>
                    <div class="summary-label">Media Team</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${Math.round(health.components.teamMorale)}%</div>
                    <div class="summary-label">Morale</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${leaderboard[0].points}</div>
                    <div class="summary-label">Top Performer</div>
                </div>
            </div>
        </div>
        
        <!-- Persone a Rischio -->
        <div class="section">
            <div class="section-title">⚠️ Chi Ha Bisogno di Aiuto</div>
            ${atRisk.length === 0 ? 
                '<div class="no-problems">✅ Tutto il team sta andando bene!</div>' :
                atRisk.map(person => {
                    const level = person.points < 200 ? 'critical' : 'warning';
                    const action = person.points < 200 ? 
                        '→ Incontro 1-on-1 URGENTE richiesto' :
                        '→ Monitora attentamente questa settimana';
                    
                    return `
                        <div class="person-card ${level}">
                            <div class="person-name">${person.points < 200 ? '🔴' : '🟡'} ${person.name}</div>
                            <div class="person-points">${person.points} punti - Livello: ${person.level.name}</div>
                            <div class="person-action">${action}</div>
                        </div>
                    `;
                }).join('')
            }
        </div>
        
        <!-- Task Problematiche -->
        <div class="section">
            <div class="section-title">🎯 Task Più Problematiche</div>
            ${heatmap.length === 0 ?
                '<div class="no-problems">✅ Nessuna task particolarmente problematica!</div>' :
                heatmap.map((task, idx) => `
                    <div class="task-item">
                        <div>
                            <div class="task-name">${idx + 1}. ${task.task}</div>
                            <div class="task-action">
                                ${task.errorCount >= 10 ? '→ Formazione urgente necessaria' :
                                  task.errorCount >= 5 ? '→ Rivedi il processo con il team' :
                                  '→ Monitoraggio sufficiente'}
                            </div>
                        </div>
                        <div class="task-count">${task.errorCount} errori</div>
                    </div>
                `).join('')
            }
        </div>
        
        <!-- Azioni da Fare -->
        <div class="section">
            <div class="section-title">✅ Azioni da Fare Questa Settimana</div>
            ${insights.length === 0 ?
                '<div class="no-problems">🎉 Nessuna azione urgente necessaria!</div>' :
                '<ul class="action-checklist">' +
                insights.slice(0, 5).map(insight => `
                    <li>${insight.message.split('.')[0]}</li>
                `).join('') +
                '</ul>'
            }
        </div>
        
        <!-- Classifica Completa -->
        <div class="section">
            <div class="section-title">🏆 Classifica Completa</div>
            ${leaderboard.map((person, idx) => {
                const level = person.points >= 400 ? 'good' : 
                             person.points >= 200 ? 'warning' : 'critical';
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                
                return `
                    <div class="person-card ${level}">
                        <div class="person-name">${medal} ${person.name}</div>
                        <div class="person-points">
                            ${person.points} punti - ${person.level.name} - 
                            ${person.daysWithErrors} giorni con errori
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <!-- Footer -->
        <div class="report-footer">
            <p>Report generato il ${today.toLocaleDateString('it-IT')} alle ${today.toLocaleTimeString('it-IT')}</p>
            <p>Sistema Maestro di Negozio</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Genera report mensile (per fine mese)
 */
function generateMonthlyReport() {
    // Simile a weekly ma con dati dell'intero mese
    const health = calculateTeamHealthScore();
    const leaderboard = getLeaderboard();
    const heatmap = generateTaskHeatmap();
    const stats = getAggregateStats();
    
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(generateMonthlyReportHTML(health, leaderboard, heatmap, stats));
    reportWindow.document.close();
    
    setTimeout(() => {
        reportWindow.print();
    }, 500);
}

function generateMonthlyReportHTML(health, leaderboard, heatmap, stats) {
    // HTML simile a weekly ma con sezione "Riepilogo Mese"
    const today = new Date();
    const monthName = today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Report Mensile - ${monthName}</title>
    <style>
        ${generateReportHTML(health, [], [], [], leaderboard).match(/<style>([\s\S]*?)<\/style>/)[1]}
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1>📊 Report Mensile</h1>
            <div class="report-date">${monthName}</div>
        </div>
        
        <div class="section">
            <div class="section-title">📈 Riepilogo Mese</div>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-value">${stats.totalDaysWithErrors}</div>
                    <div class="summary-label">Giorni Totali con Errori</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${stats.totalPenalties}</div>
                    <div class="summary-label">Penalità Totali</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${Math.round(stats.averagePoints)}</div>
                    <div class="summary-label">Media Punti Team</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">🏆 Classifica Finale</div>
            ${leaderboard.map((person, idx) => `
                <div class="person-card ${person.points >= 400 ? 'good' : person.points >= 200 ? 'warning' : 'critical'}">
                    <div class="person-name">
                        ${idx === 0 ? '👑' : idx + 1}. ${person.name}
                    </div>
                    <div class="person-points">
                        <strong>${person.points}</strong> punti finali - ${person.level.name}<br>
                        ${person.daysWithErrors} giorni con errori - ${person.totalPenalty} penalità totali
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <div class="section-title">🎯 Task Più Problematiche del Mese</div>
            ${heatmap.slice(0, 10).map((task, idx) => `
                <div class="task-item">
                    <div>
                        <div class="task-name">${idx + 1}. ${task.task}</div>
                        <div class="task-action">${task.affectedPeople} persone coinvolte</div>
                    </div>
                    <div class="task-count">${task.errorCount} errori</div>
                </div>
            `).join('')}
        </div>
        
        <div class="report-footer">
            <p>Report Mensile - ${monthName}</p>
            <p>Sistema Maestro di Negozio</p>
        </div>
    </div>
</body>
</html>
    `;
}
