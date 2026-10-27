/**
 * StudyQuest - storage.js
 * Handles saving, loading, validating, and resetting data using the browser's LocalStorage.
 * Beginner-friendly: All functions are well-commented and safe from crashes.
 */

const STORAGE_KEY = 'studyquest_save_data_v1';

// Default starter data schema for a new adventurer
const DEFAULT_STATE = {
  profile: {
    name: 'Young Scholar',
    title: 'Novice Apprentice',
    grade: 'Class 9',
    dailyGoal: 3, // Target quests per day
    avatar: 'mage' // Default avatar archetype
  },
  stats: {
    xp: 0,
    level: 1,
    totalQuestsCompleted: 0,
    totalFocusSessions: 0,
    totalFocusMinutes: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastActiveDate: null, // format: "YYYY-MM-DD"
    activeDates: [] // Array of unique "YYYY-MM-DD" strings
  },
  quests: [
    {
      id: 'quest_starter_1',
      title: 'Review Chapter 1 of Science (Matter in Our Surroundings)',
      subject: 'Science',
      difficulty: 'Medium', // 25 XP
      xp: 25,
      dueDate: getTodayDateString(),
      notes: 'Make bullet notes for solid, liquid, and gas state properties.',
      completed: false,
      xpAwarded: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'quest_starter_2',
      title: 'Solve 5 Algebra Problems on Polynomials',
      subject: 'Mathematics',
      difficulty: 'Hard', // 40 XP
      xp: 40,
      dueDate: getTodayDateString(),
      notes: 'Practice remainder theorem and factor theorem exercises.',
      completed: false,
      xpAwarded: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'quest_starter_3',
      title: 'Read English Literature: The Fun They Had',
      subject: 'English',
      difficulty: 'Easy', // 10 XP
      xp: 10,
      dueDate: getTodayDateString(),
      notes: 'Underline 3 new vocabulary words and check their meanings.',
      completed: false,
      xpAwarded: false,
      createdAt: new Date().toISOString()
    }
  ],
  xpHistory: [
    {
      id: 'xph_welcome',
      date: new Date().toISOString(),
      amount: 0,
      title: 'Joined the Adventurer Academy',
      type: 'system'
    }
  ],
  unlockedAchievements: [], // list of achievement ids, e.g. ['first_quest']
  settings: {
    soundEnabled: true,
    notificationsEnabled: false
  }
};

/**
 * Helper to get current local date as "YYYY-MM-DD" string
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates and merges loaded data with the default structure
 * This prevents crashes if old data or missing fields are loaded.
 */
function sanitizeState(loaded) {
  if (!loaded || typeof loaded !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  const clean = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Merge profile
  if (loaded.profile && typeof loaded.profile === 'object') {
    clean.profile.name = String(loaded.profile.name || clean.profile.name).trim().slice(0, 30);
    clean.profile.title = String(loaded.profile.title || clean.profile.title);
    clean.profile.grade = String(loaded.profile.grade || clean.profile.grade);
    clean.profile.dailyGoal = Number(loaded.profile.dailyGoal) || 3;
    clean.profile.avatar = loaded.profile.avatar || 'mage';
  }

  // Merge stats
  if (loaded.stats && typeof loaded.stats === 'object') {
    clean.stats.xp = Math.max(0, Number(loaded.stats.xp) || 0);
    clean.stats.level = Math.max(1, Number(loaded.stats.level) || 1);
    clean.stats.totalQuestsCompleted = Math.max(0, Number(loaded.stats.totalQuestsCompleted) || 0);
    clean.stats.totalFocusSessions = Math.max(0, Number(loaded.stats.totalFocusSessions) || 0);
    clean.stats.totalFocusMinutes = Math.max(0, Number(loaded.stats.totalFocusMinutes) || 0);
    clean.stats.currentStreak = Math.max(0, Number(loaded.stats.currentStreak) || 0);
    clean.stats.bestStreak = Math.max(0, Number(loaded.stats.bestStreak) || 0);
    clean.stats.lastActiveDate = loaded.stats.lastActiveDate || null;
    clean.stats.activeDates = Array.isArray(loaded.stats.activeDates) ? loaded.stats.activeDates : [];
  }

  // Merge quests
  if (Array.isArray(loaded.quests)) {
    clean.quests = loaded.quests.map((q, index) => ({
      id: q.id || `quest_${Date.now()}_${index}`,
      title: String(q.title || 'Untitled Quest').trim().slice(0, 100),
      subject: q.subject || 'Other',
      difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
      xp: Number(q.xp) || (q.difficulty === 'Easy' ? 10 : q.difficulty === 'Hard' ? 40 : 25),
      dueDate: q.dueDate || getTodayDateString(),
      notes: String(q.notes || '').slice(0, 500),
      completed: Boolean(q.completed),
      xpAwarded: Boolean(q.xpAwarded),
      createdAt: q.createdAt || new Date().toISOString()
    }));
  }

  // Merge XP history
  if (Array.isArray(loaded.xpHistory)) {
    clean.xpHistory = loaded.xpHistory.slice(-100); // keep last 100 logs
  }

  // Merge achievements
  if (Array.isArray(loaded.unlockedAchievements)) {
    clean.unlockedAchievements = [...new Set(loaded.unlockedAchievements)];
  }

  // Merge settings
  if (loaded.settings && typeof loaded.settings === 'object') {
    clean.settings.soundEnabled = loaded.settings.soundEnabled !== false;
    clean.settings.notificationsEnabled = Boolean(loaded.settings.notificationsEnabled);
  }

  return clean;
}

/**
 * Storage Manager Object
 * Exports safe methods to read, write, and wipe application data.
 */
const StorageManager = {
  /**
   * Load current state from localStorage, or return default starter state.
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.save(fresh);
        return fresh;
      }
      const parsed = JSON.parse(raw);
      return sanitizeState(parsed);
    } catch (err) {
      console.warn('[StudyQuest Storage] Error reading localStorage, using defaults:', err);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  },

  /**
   * Save the state object to localStorage with error handling.
   */
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error('[StudyQuest Storage] Failed to save state to localStorage:', err);
      return false;
    }
  },

  /**
   * Reset all data to clean initial state.
   */
  reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.save(fresh);
      return fresh;
    } catch (err) {
      console.error('[StudyQuest Storage] Failed to reset state:', err);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }
};

// Make available globally
window.StorageManager = StorageManager;
window.getTodayDateString = getTodayDateString;

