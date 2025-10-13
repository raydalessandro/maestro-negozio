// ========================================
// FEEDBACK SYSTEM - MAESTRO DI NEGOZIO
// ========================================
// Sistema feedback anonimo per il team

const FEEDBACK_STORAGE_KEY = 'teamFeedback';

// ========================================
// SALVATAGGIO FEEDBACK
// ========================================

/**
 * Salva un nuovo feedback
 * @param {number} mood - Valutazione 1-5
 * @param {string} message - Messaggio opzionale
 * @param {string} category - Categoria
 */
function saveFeedback(mood, message = '', category = 'generale') {
    const feedback = getFeedbackData();
    
    const newFeedback = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        mood: mood,
        message: message.trim(),
        category: category,
        read: false
    };
    
    feedback.push(newFeedback);
    
    // Salva in localStorage
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
    
    console.log('✅ Feedback salvato:', newFeedback);
}

/**
 * Ottieni tutti i feedback
 * @returns {array} Array di feedback
 */
function getFeedbackData() {
    try {
        const data = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('❌ Errore caricamento feedback:', e);
        return [];
    }
}

// ========================================
// LETTURA FEEDBACK
// ========================================

/**
 * Segna un feedback come letto
 * @param {number} feedbackId - ID del feedback
 */
function markAsRead(feedbackId) {
    const feedback = getFeedbackData();
    const item = feedback.find(f => f.id === feedbackId);
    if (item) {
        item.read = true;
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
    }
}

/**
 * Segna tutti i feedback come letti
 */
function markAllAsRead() {
    const feedback = getFeedbackData();
    feedback.forEach(f => f.read = true);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
    console.log('✅ Tutti i feedback segnati come letti');
}

/**
 * Ottieni feedback non letti
 * @returns {array} Array di feedback non letti
 */
function getUnreadFeedback() {
    return getFeedbackData().filter(f => !f.read);
}

/**
 * Ottieni ultimi N messaggi
 * @param {number} n - Numero di messaggi
 * @returns {array} Array di feedback recenti
 */
function getRecentMessages(n = 5) {
    const feedback = getFeedbackData();
    return feedback
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, n);
}

// ========================================
// STATISTICHE
// ========================================

/**
 * Calcola statistiche feedback
 * @returns {object} Statistiche
 */
function getFeedbackStats() {
    const feedback = getFeedbackData();
    
    if (feedback.length === 0) {
        return {
            total: 0,
            avgMood: 0,
            thisWeek: 0,
            thisMonth: 0,
            categories: {}
        };
    }
    
    // Media mood
    const avgMood = (feedback.reduce((sum, f) => sum + f.mood, 0) / feedback.length).toFixed(1);
    
    // Feedback questa settimana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = feedback.filter(f => new Date(f.timestamp) >= oneWeekAgo).length;
    
    // Feedback questo mese
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const thisMonth = feedback.filter(f => new Date(f.timestamp) >= oneMonthAgo).length;
    
    // Categorie
    const categories = {};
    feedback.forEach(f => {
        categories[f.category] = (categories[f.category] || 0) + 1;
    });
    
    return {
        total: feedback.length,
        avgMood: parseFloat(avgMood),
        thisWeek: thisWeek,
        thisMonth: thisMonth,
        categories: categories
    };
}

/**
 * Ottieni mood medio settimana corrente
 * @returns {number|null} Mood medio (1-5) o null
 */
function getCurrentWeekMood() {
    const feedback = getFeedbackData();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeekFeedback = feedback.filter(f => new Date(f.timestamp) >= oneWeekAgo);
    
    if (thisWeekFeedback.length === 0) return null;
    
    const avg = thisWeekFeedback.reduce((sum, f) => sum + f.mood, 0) / thisWeekFeedback.length;
    return parseFloat(avg.toFixed(1));
}

/**
 * Ottieni mood medio mese corrente
 * @returns {number|null} Mood medio (1-5) o null
 */
function getCurrentMonthMood() {
    const feedback = getFeedbackData();
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const thisMonthFeedback = feedback.filter(f => new Date(f.timestamp) >= oneMonthAgo);
    
    if (thisMonthFeedback.length === 0) return null;
    
    const avg = thisMonthFeedback.reduce((sum, f) => sum + f.mood, 0) / thisMonthFeedback.length;
    return parseFloat(avg.toFixed(1));
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Converti mood in emoji
 * @param {number} mood - Valutazione 1-5
 * @returns {string} Emoji
 */
function moodToEmoji(mood) {
    const emojis = {
        1: '😞',
        2: '😕',
        3: '😐',
        4: '🙂',
        5: '😃'
    };
    return emojis[mood] || '😐';
}

/**
 * Converti mood in testo
 * @param {number} mood - Valutazione 1-5
 * @returns {string} Descrizione
 */
function moodToText(mood) {
    const texts = {
        1: 'Molto Male',
        2: 'Male',
        3: 'Ok',
        4: 'Bene',
        5: 'Molto Bene'
    };
    return texts[mood] || 'Sconosciuto';
}

/**
 * Converti mood in colore
 * @param {number} mood - Valutazione 1-5
 * @returns {string} Colore hex
 */
function moodToColor(mood) {
    if (mood >= 4.5) return '#00C853'; // Verde scuro
    if (mood >= 3.5) return '#64DD17'; // Verde chiaro
    if (mood >= 2.5) return '#FFD600'; // Giallo
    if (mood >= 1.5) return '#FF6D00'; // Arancione
    return '#D50000'; // Rosso
}

/**
 * Cancella tutti i feedback (per test)
 */
function clearAllFeedback() {
    if (confirm('⚠️ Sei sicuro di voler cancellare TUTTI i feedback?')) {
        localStorage.removeItem(FEEDBACK_STORAGE_KEY);
        console.log('🗑️ Tutti i feedback cancellati');
        return true;
    }
    return false;
}

// ========================================
// EXPORT FUNZIONI
// ========================================

// Rendi funzioni disponibili globalmente
if (typeof window !== 'undefined') {
    window.saveFeedback = saveFeedback;
    window.getFeedbackData = getFeedbackData;
    window.getFeedbackStats = getFeedbackStats;
    window.getUnreadFeedback = getUnreadFeedback;
    window.getRecentMessages = getRecentMessages;
    window.getCurrentWeekMood = getCurrentWeekMood;
    window.getCurrentMonthMood = getCurrentMonthMood;
    window.markAsRead = markAsRead;
    window.markAllAsRead = markAllAsRead;
    window.moodToEmoji = moodToEmoji;
    window.moodToText = moodToText;
    window.moodToColor = moodToColor;
    window.clearAllFeedback = clearAllFeedback;
}

console.log('✅ Feedback system caricato');
