/**
 * StudyQuest - timer.js
 * The "Focus Chamber" Pomodoro Timer.
 * Features 25m Focus and 5m Break modes, smooth SVG circular progress ring,
 * delta-time accuracy (works even if tab is backgrounded), sound alerts,
 * and anti-cheat validation.
 */

class FocusTimer {
  constructor(app) {
    this.app = app;
    this.mode = 'focus'; // 'focus' (25m) or 'break' (5m)
    this.focusDuration = 25 * 60; // 1500 seconds
    this.breakDuration = 5 * 60;  // 300 seconds
    this.totalSeconds = this.focusDuration;
    this.remainingSeconds = this.focusDuration;
    this.isRunning = false;
    this.isPaused = false;
    this.timerInterval = null;
    this.endTime = null;

    // SVG Circle circumference for 2 * Math.PI * 110 ≈ 691.15
    this.circleRadius = 110;
    this.circumference = 2 * Math.PI * this.circleRadius;
  }

  setMode(newMode) {
    if (this.mode === newMode && (this.isRunning || this.isPaused)) return;
    this.reset();
    this.mode = newMode;
    this.totalSeconds = this.mode === 'focus' ? this.focusDuration : this.breakDuration;
    this.remainingSeconds = this.totalSeconds;
    this.render();
  }

  start() {
    if (this.isRunning) return;

    window.SFX.click();
    this.isRunning = true;
    this.isPaused = false;
    this.endTime = Date.now() + this.remainingSeconds * 1000;

    this.timerInterval = setInterval(() => this.tick(), 250);
    this.render();
    this.app.showToast(
      this.mode === 'focus'
        ? '⚔️ Focus Session commenced! Stay concentrated, Hero.'
        : '🛡️ Break mode started. Rest your eyes and recharge.',
      'info'
    );
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;

    window.SFX.click();
    this.isPaused = true;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    // Calculate remaining seconds precisely
    this.remainingSeconds = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
    this.render();
    this.app.showToast('Timer paused.', 'info');
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;

    window.SFX.click();
    this.isPaused = false;
    this.endTime = Date.now() + this.remainingSeconds * 1000;
    this.timerInterval = setInterval(() => this.tick(), 250);
    this.render();
  }

  reset() {
    window.SFX.click();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
    this.isPaused = false;
    this.totalSeconds = this.mode === 'focus' ? this.focusDuration : this.breakDuration;
    this.remainingSeconds = this.totalSeconds;
    this.endTime = null;
    document.title = 'StudyQuest | RPG Study Planner';
    this.render();
  }

  tick() {
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((this.endTime - now) / 1000));
    this.remainingSeconds = remaining;

    // Update document title for background visibility
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const icon = this.mode === 'focus' ? '⚔️' : '🛡️';
    document.title = `(${timeFormatted}) ${icon} StudyQuest`;

    this.render();

    if (this.remainingSeconds <= 0) {
      this.onComplete();
    }
  }

  /**
   * Called strictly when countdown reaches zero
   */
  onComplete() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.isRunning = false;
    this.isPaused = false;
    document.title = 'StudyQuest | RPG Study Planner';

    // Play temple chime
    window.SFX.timerDone();

    if (this.mode === 'focus') {
      // Award session only upon real completion
      const sessionMinutes = Math.floor(this.focusDuration / 60);
      this.app.state.stats.totalFocusSessions = (this.app.state.stats.totalFocusSessions || 0) + 1;
      this.app.state.stats.totalFocusMinutes = (this.app.state.stats.totalFocusMinutes || 0) + sessionMinutes;

      // Award XP for completing focus session
      const focusXP = 15;
      const rewardResult = window.awardXP(
        this.app.state,
        focusXP,
        `Completed ${sessionMinutes}m Focus Session`,
        'focus'
      );

      this.app.saveAndRender();
      this.app.showToast(`🎉 Focus Session Finished! +${focusXP} XP Earned!`, 'xp');

      if (rewardResult.leveledUp) {
        this.app.triggerLevelUpModal(rewardResult);
      }

      this.app.checkAndNotifyAchievements();

      // Offer switch to break
      this.setMode('break');
    } else {
      this.app.saveAndRender();
      this.app.showToast('🛡️ Break complete! Ready for your next focus quest?', 'info');
      this.setMode('focus');
    }
  }

  render() {
    const timeDisplay = document.getElementById('timer-time-display');
    const modeBadge = document.getElementById('timer-mode-badge');
    const ringCircle = document.getElementById('timer-ring-progress');
    const startBtn = document.getElementById('btn-timer-start');
    const pauseBtn = document.getElementById('btn-timer-pause');
    const resumeBtn = document.getElementById('btn-timer-resume');
    const resetBtn = document.getElementById('btn-timer-reset');

    if (!timeDisplay || !ringCircle) return;

    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (modeBadge) {
      modeBadge.textContent = this.mode === 'focus' ? 'Focus Session (25 min)' : 'Short Break (5 min)';
      modeBadge.className = `timer-badge ${this.mode === 'focus' ? 'badge-focus' : 'badge-break'}`;
    }

    // SVG Ring progress
    // As remaining decreases, dashoffset increases
    const progress = (this.totalSeconds - this.remainingSeconds) / this.totalSeconds;
    const offset = this.circumference - (progress * this.circumference);
    ringCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    ringCircle.style.strokeDashoffset = offset;

    // Toggle button visibility
    if (!this.isRunning && !this.isPaused) {
      // Idle
      if (startBtn) startBtn.style.display = 'inline-flex';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (resetBtn) resetBtn.disabled = true;
    } else if (this.isRunning && !this.isPaused) {
      // Running
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (resetBtn) resetBtn.disabled = false;
    } else if (this.isPaused) {
      // Paused
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'inline-flex';
      if (resetBtn) resetBtn.disabled = false;
    }
  }
}

window.FocusTimer = FocusTimer;

