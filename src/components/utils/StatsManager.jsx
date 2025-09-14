export class StatsManager {
  static dayKey(ts = Date.now()) {
    return new Date(ts).toISOString().split('T')[0];
  }

  static countAttemptsForDay(attempts, dayKey = this.dayKey()) {
    return attempts.filter(a => 
      a.created_date && a.created_date.startsWith(dayKey)
    ).length;
  }

  static recalcStats(attempts, prefs) {
    const dailyGoal = prefs?.dailyGoal || 20;
    const todayKey = this.dayKey();
    
    const attemptsToday = this.countAttemptsForDay(attempts, todayKey);
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.correct).length;
    
    return {
      dailyGoal,
      attemptsToday,
      totalAttempts,
      correctAttempts,
      accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
    };
  }

  static isYesterday(dateStr) {
    if (!dateStr) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === yesterday.toISOString().split('T')[0];
  }
}