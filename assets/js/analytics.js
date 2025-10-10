// ========================================
// ANALYTICS ENGINE - MAESTRO DI NEGOZIO
// ========================================
// Sistema avanzato di analisi e insights

// ========================================
// ANALISI TREND
// ========================================

/**
 * Calcola il trend dei punti nel tempo per una persona
 * @param {string} personName - Nome della persona
 * @param {number} days - Numero di giorni da analizzare
 * @returns {object} Dati trend
 */
function calculateTrend(personName, days = 30) {
    const data = getData();
    const personData = data[personName];
    
    // Ordina history per data
    const sortedHistory = [...personData.history].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Calcola punti giornalieri
    const dailyPoints = [];
    let currentPoints = INITIAL_POINTS;
    
    // Ottieni date ultime X giorni
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayRecord = sortedHistory.find(h => h.date === dateStr);
        
        if (dayRecord) {
            currentPoints -= dayRecord.penalty;
        }
        
        dailyPoints.push({
            date: dateStr,
            points: currentPoints,
            hadErrors: !!dayRecord,
            penalty: dayRecord ? dayRecord.penalty : 0
        });
    }
    
    // Calcola trend (regressione lineare semplice)
    const trend = calculateLinearRegression(dailyPoints.map((d, i) => ({ x: i, y: d.points })));
    
    return {
        dailyPoints,
        trend: trend.slope > 0 ? 'improving' : trend.slope < 0 ? 'declining' : 'stable',
        slopePerDay: trend.slope,
        projectedEndMonth: currentPoints + (trend.slope * getDaysRemainingInMonth())
    };
}

/**
 * Regressione lineare semplice
 */
function calculateLinearRegression(points) {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + (p.x * p.y), 0);
    const sumX2 = points.reduce((sum, p) => sum + (p.x * p.x), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
}

// ========================================
// HEATMAP TASK
// ========================================

/**
 * Genera heatmap delle task più problematiche
 * @returns {array} Array di task con frequenza errori
 */
function generateTaskHeatmap() {
    const data = getData();
    const taskErrors = {};
    
    // Conta errori per task
    people.forEach(person => {
        data[person].history.forEach(record => {
            record.incompleteTasks.forEach(task => {
                if (!taskErrors[task]) {
                    taskErrors[task] = {
                        count: 0,
                        people: new Set(),
                        totalPenalty: 0,
                        dates: []
                    };
                }
                taskErrors[task].count++;
                taskErrors[task].people.add(person);
                taskErrors[task].dates.push(record.date);
                
                // Trova penalità per questa task
                const taskInfo = getAllTasks().find(t => t.name === task);
                if (taskInfo) {
                    taskErrors[task].totalPenalty += taskInfo.points;
                }
            });
        });
    });
    
    // Converti in array e ordina
    const heatmapData = Object.entries(taskErrors).map(([task, info]) => ({
        task,
        errorCount: info.count,
        affectedPeople: info.people.size,
        totalPenalty: info.totalPenalty,
        frequency: info.count / people.length,
        lastOccurrence: info.dates.sort().reverse()[0]
    })).sort((a, b) => b.errorCount - a.errorCount);
    
    return heatmapData;
}

// ========================================
// PATTERN TEMPORALI
// ========================================

/**
 * Analizza pattern per giorno della settimana
 * @returns {object} Errori per giorno settimana
 */
function analyzeWeekdayPatterns() {
    const data = getData();
    const weekdayErrors = {
        0: { name: 'Domenica', count: 0, totalPenalty: 0 },
        1: { name: 'Lunedì', count: 0, totalPenalty: 0 },
        2: { name: 'Martedì', count: 0, totalPenalty: 0 },
        3: { name: 'Mercoledì', count: 0, totalPenalty: 0 },
        4: { name: 'Giovedì', count: 0, totalPenalty: 0 },
        5: { name: 'Venerdì', count: 0, totalPenalty: 0 },
        6: { name: 'Sabato', count: 0, totalPenalty: 0 }
    };
    
    people.forEach(person => {
        data[person].history.forEach(record => {
            const date = new Date(record.date);
            const weekday = date.getDay();
            weekdayErrors[weekday].count++;
            weekdayErrors[weekday].totalPenalty += record.penalty;
        });
    });
    
    return Object.values(weekdayErrors);
}

/**
 * Analizza pattern per settimana del mese
 */
function analyzeWeeklyPatterns() {
    const data = getData();
    const weeklyData = [
        { week: 'Settimana 1', count: 0, penalty: 0 },
        { week: 'Settimana 2', count: 0, penalty: 0 },
        { week: 'Settimana 3', count: 0, penalty: 0 },
        { week: 'Settimana 4+', count: 0, penalty: 0 }
    ];
    
    people.forEach(person => {
        data[person].history.forEach(record => {
            const date = new Date(record.date);
            const day = date.getDate();
            const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
            
            weeklyData[weekIndex].count++;
            weeklyData[weekIndex].penalty += record.penalty;
        });
    });
    
    return weeklyData;
}

// ========================================
// CORRELATION ANALYSIS
// ========================================

/**
 * Trova task che vengono sbagliate insieme
 * @returns {array} Coppie di task correlate
 */
function findTaskCorrelations() {
    const data = getData();
    const taskPairs = {};
    
    people.forEach(person => {
        data[person].history.forEach(record => {
            const tasks = record.incompleteTasks;
            
            // Crea coppie di task
            for (let i = 0; i < tasks.length; i++) {
                for (let j = i + 1; j < tasks.length; j++) {
                    const pair = [tasks[i], tasks[j]].sort().join(' + ');
                    taskPairs[pair] = (taskPairs[pair] || 0) + 1;
                }
            }
        });
    });
    
    // Converti in array e ordina
    return Object.entries(taskPairs)
        .map(([pair, count]) => ({
            tasks: pair.split(' + '),
            occurrences: count
        }))
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 10); // Top 10
}

// ========================================
// INSIGHTS AI
// ========================================

/**
 * Genera insights intelligenti automatici
 * @returns {array} Array di insights
 */
function generateInsights() {
    const insights = [];
    const data = getData();
    const heatmap = generateTaskHeatmap();
    const weekdayPatterns = analyzeWeekdayPatterns();
    const leaderboard = getLeaderboard();
    
    // Insight 1: Persona a rischio
    const atRisk = leaderboard.filter(p => p.points < 200);
    if (atRisk.length > 0) {
        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Attenzione: Performance Critica',
            message: `${atRisk.map(p => p.name).join(', ')} ${atRisk.length === 1 ? 'ha' : 'hanno'} meno di 200 punti. Considera un incontro 1-on-1 per capire le difficoltà.`,
            priority: 'high'
        });
    }
    
    // Insight 2: Task più problematica
    if (heatmap.length > 0) {
        const topTask = heatmap[0];
        insights.push({
            type: 'info',
            icon: '🎯',
            title: 'Task Più Problematica',
            message: `"${topTask.task}" è stata saltata ${topTask.errorCount} volte da ${topTask.affectedPeople} persone. Considera una formazione specifica su questa attività.`,
            priority: 'medium'
        });
    }
    
    // Insight 3: Giorno peggiore
    const worstDay = weekdayPatterns.reduce((max, day) => 
        day.count > max.count ? day : max
    );
    if (worstDay.count > 0) {
        insights.push({
            type: 'info',
            icon: '📅',
            title: 'Pattern Temporale Rilevato',
            message: `Il ${worstDay.name} è il giorno con più errori (${worstDay.count} errori totali). Pianifica supporto extra in questo giorno.`,
            priority: 'medium'
        });
    }
    
    // Insight 4: Trend positivo
    people.forEach(person => {
        const trend = calculateTrend(person, 14);
        if (trend.trend === 'improving' && trend.slopePerDay > 2) {
            insights.push({
                type: 'success',
                icon: '🌟',
                title: 'Performance in Miglioramento',
                message: `${person} sta migliorando costantemente! (+${Math.round(trend.slopePerDay)} punti/giorno). Riconosci pubblicamente questo progresso.`,
                priority: 'low'
            });
        }
        
        if (trend.trend === 'declining' && trend.slopePerDay < -3) {
            insights.push({
                type: 'warning',
                icon: '📉',
                title: 'Trend Negativo',
                message: `${person} sta perdendo costantemente punti (${Math.round(trend.slopePerDay)} punti/giorno). Intervento necessario.`,
                priority: 'high'
            });
        }
    });
    
    // Insight 5: Previsione fine mese
    leaderboard.forEach(player => {
        const trend = calculateTrend(player.name, 14);
        if (trend.projectedEndMonth < 100) {
            insights.push({
                type: 'error',
                icon: '🚨',
                title: 'Proiezione Fine Mese Critica',
                message: `${player.name} rischia di finire il mese con ${Math.round(trend.projectedEndMonth)} punti. Azione immediata richiesta!`,
                priority: 'critical'
            });
        }
    });
    
    // Insight 6: Correlazioni task
    const correlations = findTaskCorrelations();
    if (correlations.length > 0 && correlations[0].occurrences > 2) {
        insights.push({
            type: 'info',
            icon: '🔗',
            title: 'Task Collegate',
            message: `"${correlations[0].tasks[0]}" e "${correlations[0].tasks[1]}" vengono spesso saltate insieme. Potrebbero avere un problema comune.`,
            priority: 'medium'
        });
    }
    
    // Insight 7: Performance excellence
    const topPerformer = leaderboard[0];
    if (topPerformer.points >= 450) {
        insights.push({
            type: 'success',
            icon: '👑',
            title: 'Performance Eccellente',
            message: `${topPerformer.name} ha ${topPerformer.points} punti! Considera di farlo/a mentore per gli altri.`,
            priority: 'low'
        });
    }
    
    // Ordina per priorità
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return insights;
}

// ========================================
// RACCOMANDAZIONI PERSONALIZZATE
// ========================================

/**
 * Genera raccomandazioni specifiche per persona
 * @param {string} personName - Nome persona
 * @returns {array} Array di raccomandazioni
 */
function generatePersonalRecommendations(personName) {
    const data = getData();
    const personData = data[personName];
    const recommendations = [];
    
    // Analizza task più problematiche per questa persona
    const taskCounts = {};
    personData.history.forEach(record => {
        record.incompleteTasks.forEach(task => {
            taskCounts[task] = (taskCounts[task] || 0) + 1;
        });
    });
    
    const sortedTasks = Object.entries(taskCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    if (sortedTasks.length > 0) {
        recommendations.push({
            icon: '🎯',
            title: 'Focus su Task Specifiche',
            actions: sortedTasks.map(([task, count]) => 
                `• ${task} (${count} errori) - Fornisci formazione mirata`
            )
        });
    }
    
    // Analizza frequenza errori
    const errorFrequency = personData.history.length;
    const daysActive = Math.max(...personData.history.map(h => 
        Math.ceil((new Date() - new Date(h.date)) / (1000 * 60 * 60 * 24))
    ));
    
    if (errorFrequency / daysActive > 0.3) {
        recommendations.push({
            icon: '📋',
            title: 'Aumenta Monitoraggio',
            actions: [
                '• Check giornaliero delle attività',
                '• Promemoria prima delle task critiche',
                '• Affiancamento temporaneo'
            ]
        });
    }
    
    // Raccomandazioni basate su trend
    const trend = calculateTrend(personName, 14);
    if (trend.trend === 'declining') {
        recommendations.push({
            icon: '💬',
            title: 'Intervento Relazionale',
            actions: [
                '• Organizza un 1-on-1 per capire difficoltà',
                '• Verifica carico di lavoro e stress',
                '• Offri supporto e risorse aggiuntive'
            ]
        });
    } else if (trend.trend === 'improving') {
        recommendations.push({
            icon: '🎖️',
            title: 'Rinforzo Positivo',
            actions: [
                '• Riconosci pubblicamente i miglioramenti',
                '• Condividi best practices con il team',
                '• Considera reward o incentivi'
            ]
        });
    }
    
    return recommendations;
}

// ========================================
// COMPARISON ANALYSIS
// ========================================

/**
 * Confronta performance settimana corrente vs precedente
 * @returns {object} Dati comparativi
 */
function compareWeekOverWeek() {
    const data = getData();
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const comparison = {};
    
    people.forEach(person => {
        const currentWeek = data[person].history.filter(h => 
            new Date(h.date) >= weekAgo
        );
        const previousWeek = data[person].history.filter(h => {
            const date = new Date(h.date);
            return date >= twoWeeksAgo && date < weekAgo;
        });
        
        const currentPenalty = currentWeek.reduce((sum, h) => sum + h.penalty, 0);
        const previousPenalty = previousWeek.reduce((sum, h) => sum + h.penalty, 0);
        const change = currentPenalty - previousPenalty;
        
        comparison[person] = {
            currentWeek: {
                errors: currentWeek.length,
                penalty: currentPenalty
            },
            previousWeek: {
                errors: previousWeek.length,
                penalty: previousPenalty
            },
            change: change,
            trend: change < 0 ? 'improving' : change > 0 ? 'worsening' : 'stable'
        };
    });
    
    return comparison;
}

// ========================================
// PREDICTIVE ANALYSIS
// ========================================

/**
 * Predice punti finali a fine mese per tutti
 * @returns {object} Previsioni
 */
function predictEndOfMonth() {
    const predictions = {};
    
    people.forEach(person => {
        const trend = calculateTrend(person, 14);
        const data = getData();
        const currentPoints = data[person].points;
        const daysRemaining = getDaysRemainingInMonth();
        
        // Previsione basata su trend
        const predicted = Math.max(0, Math.round(currentPoints + (trend.slopePerDay * daysRemaining)));
        const confidence = trend.dailyPoints.length >= 7 ? 'high' : 'medium';
        
        predictions[person] = {
            current: currentPoints,
            predicted: predicted,
            change: predicted - currentPoints,
            confidence: confidence,
            level: getLevel(predicted).name,
            daysRemaining: daysRemaining
        };
    });
    
    return predictions;
}

// ========================================
// TEAM HEALTH SCORE
// ========================================

/**
 * Calcola un "health score" del team (0-100)
 * @returns {object} Score e componenti
 */
function calculateTeamHealthScore() {
    const leaderboard = getLeaderboard();
    const avgPoints = leaderboard.reduce((sum, p) => sum + p.points, 0) / people.length;
    const minPoints = Math.min(...leaderboard.map(p => p.points));
    const trends = people.map(p => calculateTrend(p, 7));
    const improvingCount = trends.filter(t => t.trend === 'improving').length;
    
    // Componenti del score
    const components = {
        averagePerformance: (avgPoints / INITIAL_POINTS) * 100,
        worstPerformer: (minPoints / INITIAL_POINTS) * 100,
        teamMorale: (improvingCount / people.length) * 100,
        consistency: 100 - (leaderboard[0].points - leaderboard[people.length - 1].points) / 5
    };
    
    // Score totale (media pesata)
    const totalScore = (
        components.averagePerformance * 0.4 +
        components.worstPerformer * 0.3 +
        components.teamMorale * 0.2 +
        components.consistency * 0.1
    );
    
    return {
        score: Math.round(totalScore),
        components: components,
        rating: totalScore >= 80 ? 'Excellent' : 
                totalScore >= 60 ? 'Good' : 
                totalScore >= 40 ? 'Fair' : 'Poor'
    };
}
