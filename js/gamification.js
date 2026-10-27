/**
 * StudyQuest - gamification.js
 * Handles Level progression, XP calculations, Streaks, Achievements,
 * Web Audio synthesizers (100% offline), and Canvas Particle Confetti.
 */

// Progression curve:
// Level 1: 0 - 99 XP (100 needed)
// Level 2: 100 - 249 XP (150 needed)
// Level 3: 250 - 449 XP (200 needed)
// Level 4: 450 - 699 XP (250 needed)
// Level 5: 700 - 999 XP (300 needed)
// Level N: (100 + (N-1)*50) needed to advance
function getXPNeededForLevel(level) {
  return 100 + (level - 1) * 50;
}

function getCumulativeXPForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPNeededForLevel(i);
  }
  return total;
}

const LEVEL_TITLES = [
  'Novice Apprentice',   // Level 1
  'Curious Explorer',    // Level 2
  'Sage in Training',    // Level 3
  'Lorekeeper',          // Level 4
  'Scholar',             // Level 5
  'Arcane Tactician',    // Level 6
  'Grand Scholar',       // Level 7
  'Master of Knowledge', // Level 8
  'Archmage of Study',   // Level 9
  'Legendary Polymath'   // Level 10+
];

function getTitleForLevel(level) {
  const index = Math.min(level - 1, LEVEL_TITLES.length - 1);
  return LEVEL_TITLES[index];
}

/**
 * Calculates current level details given total accumulated XP
 */
function calculateLevelData(totalXP) {
  let level = 1;
  let remainingXP = Math.max(0, totalXP);

  while (true) {
    const needed = getXPNeededForLevel(level);
    if (remainingXP < needed) {
      break;
    }
    remainingXP -= needed;
    level++;
  }

  const currentLevelNeeded = getXPNeededForLevel(level);
  const progressPercent = Math.min(100, Math.floor((remainingXP / currentLevelNeeded) * 100));

  return {
    level,
    title: getTitleForLevel(level),
    currentLevelXP: remainingXP,
    xpToNextLevel: currentLevelNeeded - remainingXP,
    neededForThisLevel: currentLevelNeeded,
    progressPercent,
    totalXP
  };
}

/**
 * Built-in Achievement Definitions
 */
const ACHIEVEMENTS = [
  {
    id: 'first_quest',
    title: 'First Quest',
    icon: '⚔️',
    description: 'Complete your very first study quest.',
    category: 'Quests',
    check: (state) => (state.stats.totalQuestsCompleted || 0) >= 1,
    progress: (state) => ({
      current: Math.min(1, state.stats.totalQuestsCompleted || 0),
      target: 1
    })
  },
  {
    id: 'getting_started',
    title: 'Getting Started',
    icon: '📜',
    description: 'Complete 5 study quests.',
    category: 'Quests',
    check: (state) => (state.stats.totalQuestsCompleted || 0) >= 5,
    progress: (state) => ({
      current: Math.min(5, state.stats.totalQuestsCompleted || 0),
      target: 5
    })
  },
  {
    id: 'focus_master',
    title: 'Focus Master',
    icon: '⏳',
    description: 'Complete 5 focus sessions in the Focus Chamber.',
    category: 'Focus',
    check: (state) => (state.stats.totalFocusSessions || 0) >= 5,
    progress: (state) => ({
      current: Math.min(5, state.stats.totalFocusSessions || 0),
      target: 5
    })
  },
  {
    id: 'consistent_learner',
    title: 'Consistent Learner',
    icon: '🔥',
    description: 'Log active study on 3 separate days.',
    category: 'Streaks',
    check: (state) => (state.stats.activeDates && state.stats.activeDates.length >= 3),
    progress: (state) => ({
      current: Math.min(3, state.stats.activeDates ? state.stats.activeDates.length : 0),
      target: 3
    })
  },
  {
    id: 'scholar',
    title: 'Scholar',
    icon: '🎓',
    description: 'Advance your character to Level 5.',
    category: 'Mastery',
    check: (state) => {
      const { level } = calculateLevelData(state.stats.xp);
      return level >= 5;
    },
    progress: (state) => {
      const { level } = calculateLevelData(state.stats.xp);
      return {
        current: Math.min(5, level),
        target: 5
      };
    }
  },
  {
    id: 'deep_focus',
    title: 'Chrono Apprentice',
    icon: '🔮',
    description: 'Complete your first 25-minute focus session.',
    category: 'Focus',
    check: (state) => (state.stats.totalFocusSessions || 0) >= 1,
    progress: (state) => ({
      current: Math.min(1, state.stats.totalFocusSessions || 0),
      target: 1
    })
  }
];

/**
 * Sound Synthesizer using Web Audio API
 * Generates retro RPG sound effects without external audio files!
 */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, delay = 0, gainVal = 0.15) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type; // 'sine', 'square', 'triangle', 'sawtooth'
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  questComplete() {
    // Upbeat two-note chime (G5 -> C6)
    this.playTone(784, 'triangle', 0.15, 0, 0.2);
    this.playTone(1046.5, 'sine', 0.35, 0.12, 0.25);
  }

  levelUp() {
    // Grand 4-note victory arpeggio: C5, E5, G5, C6 with harmonized sparkle
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.35, idx * 0.12, 0.25);
      this.playTone(freq * 1.5, 'sine', 0.2, idx * 0.12 + 0.05, 0.1);
    });
  }

  achievement() {
    // Brassy triumphant flourish
    this.playTone(440, 'triangle', 0.15, 0, 0.2);
    this.playTone(554.37, 'triangle', 0.15, 0.1, 0.2);
    this.playTone(659.25, 'triangle', 0.15, 0.2, 0.2);
    this.playTone(880, 'sine', 0.5, 0.3, 0.3);
  }

  timerDone() {
    // Calm resonant temple bell chime
    this.playTone(587.33, 'sine', 0.8, 0, 0.3);
    this.playTone(880, 'triangle', 0.6, 0.05, 0.2);
    this.playTone(1174.66, 'sine', 1.0, 0.15, 0.2);
  }

  click() {
    this.playTone(600, 'sine', 0.04, 0, 0.05);
  }
}

const SFX = new SoundEffects();

/**
 * Canvas Confetti Particle Engine
 * Fully self-contained, light, and beautiful level celebration
 */
class ConfettiEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
  }

  init() {
    if (this.canvas) return;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'celebration-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 80) {
    this.init();
    this.resize();
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#ffffff'];

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 4;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.01
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.rotation += p.rotSpeed;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

const Confetti = new ConfettiEngine();

/**
 * Updates streak based on daily activity date tracking
 */
function updateDailyStreak(state) {
  const today = window.getTodayDateString ? window.getTodayDateString() : new Date().toISOString().split('T')[0];
  const lastActive = state.stats.lastActiveDate;

  // Initialize activeDates array if missing
  if (!Array.isArray(state.stats.activeDates)) {
    state.stats.activeDates = [];
  }

  // Already marked active for today?
  if (lastActive === today) {
    if (!state.stats.activeDates.includes(today)) {
      state.stats.activeDates.push(today);
    }
    return false; // Streak didn't increment today, already counted
  }

  // Compute difference in calendar days
  if (!lastActive) {
    // First ever activity!
    state.stats.currentStreak = 1;
  } else {
    const todayDate = new Date(today + 'T00:00:00');
    const lastDate = new Date(lastActive + 'T00:00:00');
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day!
      state.stats.currentStreak = (state.stats.currentStreak || 0) + 1;
    } else if (diffDays > 1) {
      // Streak broken, restart at 1
      state.stats.currentStreak = 1;
    }
    // If diffDays <= 0, keep same
  }

  state.stats.lastActiveDate = today;
  if (!state.stats.activeDates.includes(today)) {
    state.stats.activeDates.push(today);
  }

  // Update best streak
  if (state.stats.currentStreak > (state.stats.bestStreak || 0)) {
    state.stats.bestStreak = state.stats.currentStreak;
  }

  return true;
}

/**
 * Awards XP safely, logs it to history, checks for Level Up,
 * and updates achievements.
 */
function awardXP(state, amount, reason, type = 'quest') {
  if (amount <= 0) return { leveledUp: false, newLevel: state.stats.level };

  const prevLevelData = calculateLevelData(state.stats.xp);
  state.stats.xp += amount;
  const newLevelData = calculateLevelData(state.stats.xp);
  state.stats.level = newLevelData.level;
  state.profile.title = newLevelData.title;

  // Record in XP log
  state.xpHistory.unshift({
    id: `xph_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    date: new Date().toISOString(),
    amount: amount,
    title: reason,
    type: type
  });

  // Limit log size to prevent unbounded growth
  if (state.xpHistory.length > 80) {
    state.xpHistory.pop();
  }

  // Also update daily activity streak
  updateDailyStreak(state);

  const leveledUp = newLevelData.level > prevLevelData.level;

  return {
    leveledUp,
    oldLevel: prevLevelData.level,
    newLevel: newLevelData.level,
    newTitle: newLevelData.title,
    levelData: newLevelData
  };
}

/**
 * Check all achievements and return newly unlocked ones
 */
function evaluateAchievements(state) {
  const newlyUnlocked = [];
  if (!Array.isArray(state.unlockedAchievements)) {
    state.unlockedAchievements = [];
  }

  ACHIEVEMENTS.forEach(ach => {
    if (!state.unlockedAchievements.includes(ach.id)) {
      if (ach.check(state)) {
        state.unlockedAchievements.push(ach.id);
        newlyUnlocked.push(ach);
      }
    }
  });

  return newlyUnlocked;
}

// Global exports
window.calculateLevelData = calculateLevelData;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.SFX = SFX;
window.Confetti = Confetti;
window.updateDailyStreak = updateDailyStreak;
window.awardXP = awardXP;
window.evaluateAchievements = evaluateAchievements;

