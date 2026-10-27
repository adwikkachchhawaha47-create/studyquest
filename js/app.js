/**
 * StudyQuest - app.js
 * Main coordinator connecting UI, Quests, Timer, Gamification, and Storage.
 */

class StudyQuestApp {
  constructor() {
    this.state = null;
    this.questManager = null;
    this.timer = null;
    this.activeTab = 'dashboard';
    this.toastTimeout = null;
  }

  init() {
    // 1. Load state from localStorage
    this.state = window.StorageManager.load();

    // 2. Initialize sub-managers
    this.questManager = new window.QuestManager(this);
    this.timer = new window.FocusTimer(this);

    // 3. Setup event listeners
    this.setupNavigation();
    this.setupQuestForm();
    this.setupModals();
    this.setupSettingsForm();
    this.setupTimerControls();

    // 4. Initial evaluation of achievements
    this.checkAndNotifyAchievements(false);

    // 5. Render entire interface
    this.render();

    console.log('[StudyQuest] App initialized successfully. Welcome Hero!');
  }

  saveAndRender() {
    window.StorageManager.save(this.state);
    this.render();
  }

  /**
   * Tab Navigation Logic
   */
  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn, .mobile-nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = btn.getAttribute('data-tab');
        if (targetTab) {
          this.switchTab(targetTab);
        }
      });
    });

    // Quick action buttons (e.g. from dashboard cards)
    document.querySelectorAll('[data-action="goto-quests"]').forEach(el => {
      el.addEventListener('click', () => this.switchTab('quests'));
    });
    document.querySelectorAll('[data-action="goto-timer"]').forEach(el => {
      el.addEventListener('click', () => this.switchTab('timer'));
    });
    document.querySelectorAll('[data-action="goto-achievements"]').forEach(el => {
      el.addEventListener('click', () => this.switchTab('achievements'));
    });
  }

  switchTab(tabId) {
    window.SFX.click();
    this.activeTab = tabId;

    // Update active state in nav buttons
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Show active tab section, hide others
    document.querySelectorAll('.tab-content').forEach(section => {
      if (section.id === `tab-${tabId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Render fresh data for that tab
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Quest Form (Add & Edit) Wiring
   */
  setupQuestForm() {
    const addBtn = document.getElementById('btn-open-add-quest');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        window.SFX.click();
        this.openQuestModal();
      });
    }

    const questForm = document.getElementById('quest-modal-form');
    if (questForm) {
      questForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const modal = document.getElementById('quest-modal');
        const questId = modal.getAttribute('data-editing-id');

        const title = document.getElementById('quest-input-title').value;
        const subject = document.getElementById('quest-input-subject').value;
        const difficulty = document.getElementById('quest-input-difficulty').value;
        const dueDate = document.getElementById('quest-input-duedate').value;
        const notes = document.getElementById('quest-input-notes').value;

        let success = false;
        if (questId) {
          // Editing existing quest
          success = this.questManager.updateQuest(questId, { title, subject, difficulty, dueDate, notes });
        } else {
          // Creating new quest
          success = this.questManager.addQuest({ title, subject, difficulty, dueDate, notes });
        }

        if (success) {
          this.closeQuestModal();
        }
      });
    }

    // Filter events
    const statusFilters = document.querySelectorAll('.quest-filter-status');
    statusFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        statusFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.questManager.filterStatus = btn.getAttribute('data-status');
        this.renderQuestsList();
      });
    });

    const subjectFilter = document.getElementById('quest-subject-filter');
    if (subjectFilter) {
      subjectFilter.addEventListener('change', (e) => {
        this.questManager.filterSubject = e.target.value;
        this.renderQuestsList();
      });
    }

    const searchInput = document.getElementById('quest-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.questManager.searchQuery = e.target.value;
        this.renderQuestsList();
      });
    }
  }

  /**
   * Timer controls wiring
   */
  setupTimerControls() {
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnResume = document.getElementById('btn-timer-resume');
    const btnReset = document.getElementById('btn-timer-reset');
    const tabFocus = document.getElementById('timer-tab-focus');
    const tabBreak = document.getElementById('timer-tab-break');

    if (btnStart) btnStart.addEventListener('click', () => this.timer.start());
    if (btnPause) btnPause.addEventListener('click', () => this.timer.pause());
    if (btnResume) btnResume.addEventListener('click', () => this.timer.resume());
    if (btnReset) btnReset.addEventListener('click', () => this.timer.reset());

    if (tabFocus) {
      tabFocus.addEventListener('click', () => {
        tabFocus.classList.add('active');
        tabBreak.classList.remove('active');
        this.timer.setMode('focus');
      });
    }
    if (tabBreak) {
      tabBreak.addEventListener('click', () => {
        tabBreak.classList.add('active');
        tabFocus.classList.remove('active');
        this.timer.setMode('break');
      });
    }
  }

  /**
   * Settings and Reset Controls
   */
  setupSettingsForm() {
    const settingsForm = document.getElementById('settings-profile-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const heroName = document.getElementById('settings-input-name').value.trim();
        const grade = document.getElementById('settings-input-grade').value.trim();
        const dailyGoal = parseInt(document.getElementById('settings-input-goal').value, 10);

        if (heroName) this.state.profile.name = heroName;
        if (grade) this.state.profile.grade = grade;
        if (dailyGoal > 0) this.state.profile.dailyGoal = dailyGoal;

        this.saveAndRender();
        this.showToast('Adventurer Profile updated successfully!', 'success');
      });
    }

    // Reset Data button
    const btnResetData = document.getElementById('btn-reset-data');
    if (btnResetData) {
      btnResetData.addEventListener('click', () => {
        this.openConfirmModal(
          'Reset All Adventure Progress?',
          'This will permanently erase your quests, XP, level, and study statistics. This action CANNOT be undone!',
          'Yes, Wipe All Data',
          () => {
            this.state = window.StorageManager.reset();
            this.timer.reset();
            this.saveAndRender();
            this.showToast('Character profile has been reset to Level 1.', 'info');
          }
        );
      });
    }

    // Seed Sample Quests button for testing
    const btnSeedQuests = document.getElementById('btn-seed-quests');
    if (btnSeedQuests) {
      btnSeedQuests.addEventListener('click', () => {
        this.questManager.addQuest({
          title: 'Class 9 Math: Solve Exercise 2.4 Polynomials',
          subject: 'Mathematics',
          difficulty: 'Hard',
          notes: 'Focus on factorizing cubic polynomials with trial method.'
        });
        this.questManager.addQuest({
          title: 'Class 9 Science: Draw Animal and Plant Cell Diagram',
          subject: 'Science',
          difficulty: 'Medium',
          notes: 'Label Mitochondria, Golgi Apparatus, and Nucleus clearly.'
        });
        this.questManager.addQuest({
          title: 'English: Write a diary entry as Margie from The Fun They Had',
          subject: 'English',
          difficulty: 'Easy',
          notes: 'Reflect on how modern telebooks feel compared to old printed books.'
        });
      });
    }
  }

  /**
   * Generic Modal Handlers
   */
  setupModals() {
    // Close modal on backdrop click or close button
    document.querySelectorAll('.modal-backdrop, .btn-modal-close').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          this.closeAllModals();
        }
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Level up modal dismiss button
    const btnDismissLevelUp = document.getElementById('btn-levelup-dismiss');
    if (btnDismissLevelUp) {
      btnDismissLevelUp.addEventListener('click', () => {
        const modal = document.getElementById('modal-levelup');
        if (modal) modal.classList.remove('open');
      });
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
  }

  openQuestModal(quest = null) {
    const modal = document.getElementById('quest-modal');
    const modalTitle = document.getElementById('quest-modal-title');
    const form = document.getElementById('quest-modal-form');
    if (!modal) return;

    if (quest) {
      modal.setAttribute('data-editing-id', quest.id);
      modalTitle.textContent = 'Edit Quest Details';
      document.getElementById('quest-input-title').value = quest.title;
      document.getElementById('quest-input-subject').value = quest.subject;
      document.getElementById('quest-input-difficulty').value = quest.difficulty;
      document.getElementById('quest-input-duedate').value = quest.dueDate;
      document.getElementById('quest-input-notes').value = quest.notes || '';
    } else {
      modal.removeAttribute('data-editing-id');
      modalTitle.textContent = 'Forge New Study Quest';
      form.reset();
      document.getElementById('quest-input-duedate').value = window.getTodayDateString();
      document.getElementById('quest-input-difficulty').value = 'Medium';
      document.getElementById('quest-input-subject').value = 'Science';
    }

    modal.classList.add('open');
    document.getElementById('quest-input-title').focus();
  }

  closeQuestModal() {
    const modal = document.getElementById('quest-modal');
    if (modal) modal.classList.remove('open');
  }

  openConfirmModal(title, message, confirmText, onConfirmCallback) {
    const modal = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const btnAction = document.getElementById('btn-confirm-action');
    const btnCancel = document.getElementById('btn-confirm-cancel');

    if (!modal) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
    btnAction.textContent = confirmText || 'Confirm';

    // Remove existing event listeners by cloning
    const newBtnAction = btnAction.cloneNode(true);
    btnAction.parentNode.replaceChild(newBtnAction, btnAction);

    newBtnAction.addEventListener('click', () => {
      window.SFX.click();
      modal.classList.remove('open');
      if (typeof onConfirmCallback === 'function') {
        onConfirmCallback();
      }
    });

    btnCancel.onclick = () => {
      window.SFX.click();
      modal.classList.remove('open');
    };

    modal.classList.add('open');
  }

  triggerLevelUpModal(rewardResult) {
    // Play grand fanfare
    window.SFX.levelUp();
    // Burst confetti particles!
    window.Confetti.burst(120);

    const modal = document.getElementById('modal-levelup');
    if (!modal) return;

    const levelNumEl = document.getElementById('levelup-number');
    const titleEl = document.getElementById('levelup-title');

    if (levelNumEl) levelNumEl.textContent = rewardResult.newLevel;
    if (titleEl) titleEl.textContent = rewardResult.newTitle;

    modal.classList.add('open');
  }

  checkAndNotifyAchievements(playSound = true) {
    const newUnlocks = window.evaluateAchievements(this.state);
    if (newUnlocks.length > 0) {
      window.StorageManager.save(this.state);
      newUnlocks.forEach((ach, index) => {
        setTimeout(() => {
          if (playSound) window.SFX.achievement();
          this.showToast(`🏆 Achievement Unlocked: ${ach.title}!`, 'achievement');
        }, index * 800);
      });
      this.renderAchievements();
    }
  }

  /**
   * Toast notification system
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'xp') icon = '⚡';
    if (type === 'warning') icon = '⚠️';
    if (type === 'achievement') icon = '🏆';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Main Render Coordinator
   */
  render() {
    this.renderHeaderAndProfile();
    this.renderDashboard();
    this.renderQuestsList();
    this.renderAchievements();
    this.renderStatistics();
    this.renderSettingsValues();
    this.timer.render();
  }

  renderHeaderAndProfile() {
    const levelData = window.calculateLevelData(this.state.stats.xp);

    // Sync state
    this.state.stats.level = levelData.level;
    this.state.profile.title = levelData.title;

    // Header updates
    document.querySelectorAll('.player-name-display').forEach(el => el.textContent = this.state.profile.name);
    document.querySelectorAll('.player-title-display').forEach(el => el.textContent = levelData.title);
    document.querySelectorAll('.player-level-display').forEach(el => el.textContent = `Lvl ${levelData.level}`);
    document.querySelectorAll('.player-xp-display').forEach(el => el.textContent = `${levelData.totalXP} XP`);

    // Top progress bar
    const xpProgressBars = document.querySelectorAll('.header-xp-bar-fill');
    xpProgressBars.forEach(bar => {
      bar.style.width = `${levelData.progressPercent}%`;
    });

    const xpDetailTexts = document.querySelectorAll('.header-xp-details');
    xpDetailTexts.forEach(el => {
      el.textContent = `${levelData.currentLevelXP} / ${levelData.neededForThisLevel} XP (${levelData.xpToNextLevel} to next level)`;
    });

    // Streak badge in header
    const streakEl = document.getElementById('header-streak-count');
    if (streakEl) {
      streakEl.textContent = this.state.stats.currentStreak || 0;
    }
  }

  renderDashboard() {
    const levelData = window.calculateLevelData(this.state.stats.xp);

    // Welcome banner
    const welcomeName = document.getElementById('dash-hero-name');
    if (welcomeName) welcomeName.textContent = this.state.profile.name;

    const welcomeTitle = document.getElementById('dash-hero-title');
    if (welcomeTitle) welcomeTitle.textContent = `${levelData.title} • ${this.state.profile.grade}`;

    // Big stats cards
    const statLevel = document.getElementById('dash-stat-level');
    if (statLevel) statLevel.textContent = levelData.level;

    const statXP = document.getElementById('dash-stat-xp');
    if (statXP) statXP.textContent = levelData.totalXP;

    const statStreak = document.getElementById('dash-stat-streak');
    if (statStreak) statStreak.textContent = `${this.state.stats.currentStreak || 0} Days`;

    const statQuests = document.getElementById('dash-stat-completed');
    if (statQuests) statQuests.textContent = this.state.stats.totalQuestsCompleted || 0;

    // Daily Goal progress
    const today = window.getTodayDateString();
    const todayCompleted = this.state.quests.filter(q => q.completed && q.dueDate === today).length;
    const goalTarget = this.state.profile.dailyGoal || 3;
    const goalPercent = Math.min(100, Math.round((todayCompleted / goalTarget) * 100));

    const goalBar = document.getElementById('dash-goal-bar-fill');
    if (goalBar) goalBar.style.width = `${goalPercent}%`;

    const goalText = document.getElementById('dash-goal-text');
    if (goalText) goalText.textContent = `${todayCompleted} of ${goalTarget} quests completed today (${goalPercent}%)`;

    // Daily active quests preview (top 3 active)
    const activeQuests = this.state.quests.filter(q => !q.completed).slice(0, 3);
    const dashQuestsList = document.getElementById('dash-active-quests-list');

    if (dashQuestsList) {
      if (activeQuests.length === 0) {
        dashQuestsList.innerHTML = `
          <div class="empty-state-mini">
            <span class="empty-icon">🛡️</span>
            <p>No active quests! You have conquered all your tasks.</p>
            <button class="btn btn-secondary btn-sm" data-action="goto-quests">Open Quest Log</button>
          </div>
        `;
        const gotoBtn = dashQuestsList.querySelector('[data-action="goto-quests"]');
        if (gotoBtn) gotoBtn.addEventListener('click', () => this.switchTab('quests'));
      } else {
        dashQuestsList.innerHTML = activeQuests.map(q => {
          const colorObj = window.SUBJECT_COLORS[q.subject] || window.SUBJECT_COLORS['Other'];
          return `
            <div class="dash-quest-row" data-id="${q.id}">
              <div class="dash-quest-info">
                <span class="subject-tag" style="background:${colorObj.bg}; border-color:${colorObj.border}; color:${colorObj.text}">${q.subject}</span>
                <span class="dash-quest-title">${escapeHTML(q.title)}</span>
              </div>
              <div class="dash-quest-meta">
                <span class="difficulty-badge diff-${q.difficulty.toLowerCase()}">+${q.xp} XP</span>
                <button class="btn-check-action" title="Complete Quest">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
              </div>
            </div>
          `;
        }).join('');

        // Wire check buttons in dashboard
        dashQuestsList.querySelectorAll('.dash-quest-row').forEach(row => {
          const id = row.getAttribute('data-id');
          const checkBtn = row.querySelector('.btn-check-action');
          if (checkBtn) {
            checkBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.questManager.toggleQuest(id);
            });
          }
        });
      }
    }

    // Recent XP Activity Log preview
    const dashXpList = document.getElementById('dash-recent-xp-log');
    if (dashXpList) {
      const recentLogs = (this.state.xpHistory || []).slice(0, 4);
      if (recentLogs.length === 0) {
        dashXpList.innerHTML = `<div class="empty-state-mini"><p>No study activity recorded yet.</p></div>`;
      } else {
        dashXpList.innerHTML = recentLogs.map(log => {
          const dateStr = new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const isGain = log.amount > 0;
          return `
            <div class="xp-log-item">
              <div class="xp-log-icon">${log.type === 'focus' ? '⏳' : log.type === 'quest' ? '⚔️' : '✨'}</div>
              <div class="xp-log-details">
                <div class="xp-log-title">${escapeHTML(log.title)}</div>
                <div class="xp-log-date">${dateStr}</div>
              </div>
              <div class="xp-log-amount ${isGain ? 'positive' : ''}">${isGain ? `+${log.amount}` : log.amount} XP</div>
            </div>
          `;
        }).join('');
      }
    }
  }

  renderQuestsList() {
    const container = document.getElementById('quests-cards-container');
    const countBadge = document.getElementById('quests-count-badge');
    if (!container) return;

    const filtered = this.questManager.getFilteredQuests();
    if (countBadge) {
      countBadge.textContent = `${filtered.length} Quests`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-art">📜</div>
          <h3>No Quests Found</h3>
          <p>There are no study quests matching your current filters. Add a new quest or adjust filters to resume your adventure!</p>
          <button class="btn btn-primary" id="btn-empty-add-quest">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Forge a Quest
          </button>
        </div>
      `;
      const btnEmptyAdd = document.getElementById('btn-empty-add-quest');
      if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => this.openQuestModal());
      return;
    }

    container.innerHTML = filtered.map(quest => {
      const colorObj = window.SUBJECT_COLORS[quest.subject] || window.SUBJECT_COLORS['Other'];
      const isCompleted = quest.completed;
      const isDueToday = quest.dueDate === window.getTodayDateString();

      return `
        <div class="quest-card ${isCompleted ? 'is-completed' : ''}" data-id="${quest.id}">
          <div class="quest-card-header">
            <div class="quest-card-tags">
              <span class="subject-tag" style="background:${colorObj.bg}; border-color:${colorObj.border}; color:${colorObj.text}">
                ${quest.subject}
              </span>
              <span class="difficulty-badge diff-${quest.difficulty.toLowerCase()}">
                ${quest.difficulty} (${quest.xp} XP)
              </span>
              ${quest.xpAwarded ? '<span class="xp-claimed-badge">⚡ XP Claimed</span>' : ''}
            </div>
            <div class="quest-card-actions">
              <button class="btn-icon btn-edit-quest" title="Edit Quest" aria-label="Edit Quest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button class="btn-icon btn-delete-quest text-danger" title="Delete Quest" aria-label="Delete Quest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>

          <div class="quest-card-body">
            <label class="quest-checkbox-label">
              <input type="checkbox" class="quest-checkbox" ${isCompleted ? 'checked' : ''}>
              <span class="custom-checkbox"></span>
              <span class="quest-title-text">${escapeHTML(quest.title)}</span>
            </label>
            ${quest.notes ? `<p class="quest-notes">${escapeHTML(quest.notes)}</p>` : ''}
          </div>

          <div class="quest-card-footer">
            <span class="quest-due-date ${isDueToday ? 'due-today' : ''}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Due: ${quest.dueDate} ${isDueToday ? ' (Today)' : ''}
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Wire actions for rendered quest cards
    container.querySelectorAll('.quest-card').forEach(card => {
      const id = card.getAttribute('data-id');

      // Checkbox toggle
      const checkbox = card.querySelector('.quest-checkbox');
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          this.questManager.toggleQuest(id);
        });
      }

      // Edit button
      const editBtn = card.querySelector('.btn-edit-quest');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const q = this.state.quests.find(item => item.id === id);
          if (q) this.openQuestModal(q);
        });
      }

      // Delete button
      const deleteBtn = card.querySelector('.btn-delete-quest');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const q = this.state.quests.find(item => item.id === id);
          if (!q) return;

          this.openConfirmModal(
            'Abandon Study Quest?',
            `Are you sure you want to delete "${q.title}"? This cannot be undone.`,
            'Yes, Delete Quest',
            () => this.questManager.deleteQuest(id)
          );
        });
      }
    });
  }

  renderAchievements() {
    const container = document.getElementById('achievements-grid-container');
    if (!container) return;

    const unlocked = this.state.unlockedAchievements || [];

    container.innerHTML = window.ACHIEVEMENTS.map(ach => {
      const isUnlocked = unlocked.includes(ach.id);
      const prog = ach.progress(this.state);
      const percent = Math.min(100, Math.round((prog.current / prog.target) * 100));

      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="ach-icon-wrapper">
            <span class="ach-icon">${ach.icon}</span>
            ${isUnlocked ? '<span class="ach-check-pill">✓ Unlocked</span>' : '<span class="ach-lock-pill">🔒 Locked</span>'}
          </div>
          <div class="ach-content">
            <div class="ach-header">
              <h4 class="ach-title">${ach.title}</h4>
              <span class="ach-category-tag">${ach.category}</span>
            </div>
            <p class="ach-desc">${ach.description}</p>
            <div class="ach-progress-bar-wrap">
              <div class="ach-progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="ach-progress-label">
              <span>Progress: ${prog.current} / ${prog.target}</span>
              <span>${percent}%</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderStatistics() {
    // Current streak & Best streak
    const curStreak = document.getElementById('stats-cur-streak');
    if (curStreak) curStreak.textContent = `${this.state.stats.currentStreak || 0} Days`;

    const bestStreak = document.getElementById('stats-best-streak');
    if (bestStreak) bestStreak.textContent = `${this.state.stats.bestStreak || 0} Days`;

    // Quests completed
    const questsDone = document.getElementById('stats-total-quests');
    if (questsDone) questsDone.textContent = this.state.stats.totalQuestsCompleted || 0;

    // Focus sessions & minutes
    const sessionsDone = document.getElementById('stats-total-sessions');
    if (sessionsDone) sessionsDone.textContent = this.state.stats.totalFocusSessions || 0;

    const focusMins = document.getElementById('stats-total-minutes');
    if (focusMins) focusMins.textContent = `${this.state.stats.totalFocusMinutes || 0} min`;

    // Active Study Days count
    const totalDays = document.getElementById('stats-total-study-days');
    if (totalDays) totalDays.textContent = `${(this.state.stats.activeDates || []).length} Days`;

    // Render 7-day SVG/CSS Activity Chart
    this.renderWeeklyChart();

    // Render XP History log table/cards
    this.renderFullXPLog();
  }

  renderWeeklyChart() {
    const chartContainer = document.getElementById('stats-weekly-chart');
    if (!chartContainer) return;

    // Generate past 7 days dates: [day-6, day-5, ..., today]
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${dayNum}`;
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      days.push({ iso, dayName });
    }

    // Count XP earned per day from xpHistory
    const activityMap = {};
    days.forEach(d => activityMap[d.iso] = 0);

    (this.state.xpHistory || []).forEach(item => {
      const itemDate = item.date.split('T')[0];
      if (activityMap[itemDate] !== undefined) {
        activityMap[itemDate] += (item.amount || 0);
      }
    });

    const maxVal = Math.max(50, ...Object.values(activityMap));

    chartContainer.innerHTML = days.map(d => {
      const amount = activityMap[d.iso] || 0;
      const heightPercent = Math.max(12, Math.round((amount / maxVal) * 100));
      const isToday = d.iso === window.getTodayDateString();

      return `
        <div class="chart-col ${isToday ? 'is-today' : ''}" title="${d.iso}: ${amount} XP">
          <div class="chart-bar-wrap">
            <span class="chart-value-label">${amount > 0 ? `${amount}` : ''}</span>
            <div class="chart-bar" style="height: ${heightPercent}%;">
              <div class="chart-bar-glow"></div>
            </div>
          </div>
          <span class="chart-col-label">${d.dayName}</span>
        </div>
      `;
    }).join('');
  }

  renderFullXPLog() {
    const container = document.getElementById('stats-xp-full-log');
    if (!container) return;

    const logs = this.state.xpHistory || [];
    if (logs.length === 0) {
      container.innerHTML = `<div class="empty-state-mini"><p>No XP events recorded yet.</p></div>`;
      return;
    }

    container.innerHTML = logs.map(item => {
      const dateStr = new Date(item.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const isPositive = item.amount > 0;

      return `
        <div class="xp-log-row">
          <div class="xp-log-type-icon">${item.type === 'focus' ? '⏳' : item.type === 'quest' ? '⚔️' : '✨'}</div>
          <div class="xp-log-info">
            <div class="xp-log-title">${escapeHTML(item.title)}</div>
            <div class="xp-log-meta">${dateStr}</div>
          </div>
          <div class="xp-log-reward ${isPositive ? 'positive' : ''}">${isPositive ? `+${item.amount}` : item.amount} XP</div>
        </div>
      `;
    }).join('');
  }

  renderSettingsValues() {
    const inputName = document.getElementById('settings-input-name');
    const inputGrade = document.getElementById('settings-input-grade');
    const inputGoal = document.getElementById('settings-input-goal');

    if (inputName) inputName.value = this.state.profile.name || '';
    if (inputGrade) inputGrade.value = this.state.profile.grade || 'Class 9';
    if (inputGoal) inputGoal.value = this.state.profile.dailyGoal || 3;
  }
}

/**
 * Helper to escape HTML characters to prevent XSS injection
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StudyQuestApp();
  window.app.init();
});

