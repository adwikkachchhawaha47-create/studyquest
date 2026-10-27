/**
 * StudyQuest - quests.js
 * Handles Quest CRUD (Create, Read, Update, Delete), anti-farming XP locks,
 * subject color tags, validation, and filtering.
 */

const SUBJECT_COLORS = {
  'Mathematics': { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#93c5fd' },
  'Science': { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#6ee7b7' },
  'English': { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899', text: '#f472b6' },
  'Social Science': { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', text: '#fcd34d' },
  'Computer': { bg: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6', text: '#c4b5fd' },
  'Other': { bg: 'rgba(100, 116, 139, 0.2)', border: '#64748b', text: '#cbd5e1' }
};

const DIFFICULTY_XP = {
  'Easy': 10,
  'Medium': 25,
  'Hard': 40
};

class QuestManager {
  constructor(app) {
    this.app = app;
    this.filterStatus = 'all'; // 'all', 'active', 'completed'
    this.filterSubject = 'all';
    this.searchQuery = '';
    this.editingQuestId = null;
    this.deletingQuestId = null;
  }

  /**
   * Returns quests matching the active filters
   */
  getFilteredQuests() {
    const quests = this.app.state.quests || [];
    return quests.filter(q => {
      // Status filter
      if (this.filterStatus === 'active' && q.completed) return false;
      if (this.filterStatus === 'completed' && !q.completed) return false;

      // Subject filter
      if (this.filterSubject !== 'all' && q.subject !== this.filterSubject) return false;

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesNotes = (q.notes || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes) return false;
      }

      return true;
    });
  }

  /**
   * Add a new quest with input validation
   */
  addQuest({ title, subject, difficulty, dueDate, notes }) {
    const cleanTitle = String(title || '').trim();
    if (cleanTitle.length < 3) {
      this.app.showToast('Quest title must be at least 3 characters long!', 'warning');
      return false;
    }

    const xpReward = DIFFICULTY_XP[difficulty] || 25;
    const finalDate = dueDate || window.getTodayDateString();

    const newQuest = {
      id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: cleanTitle,
      subject: SUBJECT_COLORS[subject] ? subject : 'Other',
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium',
      xp: xpReward,
      dueDate: finalDate,
      notes: String(notes || '').trim(),
      completed: false,
      xpAwarded: false, // Prevents duplicate XP exploits
      createdAt: new Date().toISOString()
    };

    this.app.state.quests.unshift(newQuest);
    this.app.saveAndRender();
    this.app.showToast(`New Quest Added: "${newQuest.title}" (+${xpReward} XP upon completion)`, 'success');
    return true;
  }

  /**
   * Updates an existing quest
   */
  updateQuest(questId, { title, subject, difficulty, dueDate, notes }) {
    const quest = this.app.state.quests.find(q => q.id === questId);
    if (!quest) return false;

    const cleanTitle = String(title || '').trim();
    if (cleanTitle.length < 3) {
      this.app.showToast('Quest title must be at least 3 characters long!', 'warning');
      return false;
    }

    quest.title = cleanTitle;
    quest.subject = SUBJECT_COLORS[subject] ? subject : 'Other';
    quest.difficulty = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';
    // If not completed yet, update the XP reward to match the new difficulty
    if (!quest.xpAwarded) {
      quest.xp = DIFFICULTY_XP[quest.difficulty] || 25;
    }
    quest.dueDate = dueDate || window.getTodayDateString();
    quest.notes = String(notes || '').trim();

    this.app.saveAndRender();
    this.app.showToast('Quest updated successfully!', 'success');
    return true;
  }

  /**
   * Toggle completion state of a quest with strict anti-farming check
   */
  toggleQuest(questId) {
    const quest = this.app.state.quests.find(q => q.id === questId);
    if (!quest) return;

    if (!quest.completed) {
      // Mark as completed
      quest.completed = true;

      // ANTI-FARMING CHECK:
      // XP is awarded ONLY if it has never been awarded for this quest before!
      if (!quest.xpAwarded) {
        quest.xpAwarded = true;
        this.app.state.stats.totalQuestsCompleted = (this.app.state.stats.totalQuestsCompleted || 0) + 1;

        // Play upbeat sound
        window.SFX.questComplete();

        // Award XP & trigger level-up check
        const rewardResult = window.awardXP(
          this.app.state,
          quest.xp,
          `Completed quest: ${quest.title}`,
          'quest'
        );

        this.app.showToast(`+${quest.xp} XP! Quest Completed!`, 'xp');

        if (rewardResult.leveledUp) {
          this.app.triggerLevelUpModal(rewardResult);
        }

        // Check achievements
        this.app.checkAndNotifyAchievements();
      } else {
        // Quest was reopened and completed again: no XP granted
        window.SFX.click();
        this.app.showToast('Quest completed (XP already claimed previously).', 'info');
      }
    } else {
      // Mark as incomplete / reopen
      quest.completed = false;
      window.SFX.click();
      this.app.showToast('Quest reopened.', 'info');
    }

    this.app.saveAndRender();
  }

  /**
   * Delete a quest with safety confirmation
   */
  deleteQuest(questId) {
    const index = this.app.state.quests.findIndex(q => q.id === questId);
    if (index === -1) return false;

    const removed = this.app.state.quests.splice(index, 1)[0];
    this.app.saveAndRender();
    this.app.showToast(`Deleted quest: "${removed.title}"`, 'info');
    return true;
  }
}

window.QuestManager = QuestManager;
window.SUBJECT_COLORS = SUBJECT_COLORS;
window.DIFFICULTY_XP = DIFFICULTY_XP;

