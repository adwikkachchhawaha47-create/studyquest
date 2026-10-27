# ⚔️ StudyQuest: Gamified RPG Study Planner

Welcome to **StudyQuest**! StudyQuest turns your daily school homework, chapter revision, and exam preparation into an engaging Role-Playing Game (RPG). As you conquer study tasks and complete focus sessions, your character earns Experience Points (XP), unlocks achievements, advances in character level, and builds an unbroken study streak!

---

## 🚀 How to Run the App

StudyQuest is built with pure, modern web technologies (HTML5, CSS3, and Vanilla JavaScript). It requires **no server, no backend, no database, no Node.js, and no API keys**.

1. Navigate to the project directory:
   ```
   c:\Users\Administrator\OneDrive\Desktop\Studyquest\
   ```
2. Double-click **`index.html`** to launch it directly in your web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).
3. *Alternative (VS Code / Antigravity Live Server)*: Right-click `index.html` and choose **"Open with Live Server"**.

Everything saves automatically to your browser's **LocalStorage** so your quests, level, and XP persist even if you close the tab or turn off your computer.

---

## 📂 Project Structure & Code Walkthrough

```
StudyQuest/
├── index.html              # The skeleton: semantic HTML structure, tabs, modals & SVG icons
├── css/
│   └── style.css           # The visual armor: dark navy RPG theme, glowing cards & animations
├── js/
│   ├── storage.js          # The save crystal: manages LocalStorage read/write & auto-repair
│   ├── gamification.js     # The game master: XP formula, level tiers, streaks, sound & confetti
│   ├── quests.js           # The quest board: create, edit, filter, delete, and anti-farming locks
│   ├── timer.js            # The chrono shrine: 25-minute Pomodoro timer with audio chimes
│   └── app.js              # The grand coordinator: connects all modules and UI tabs together
└── README.md               # The adventurer's guidebook (this file!)
```

### 🧠 How Each File Works (Beginner-Friendly Explanation)

1. **`index.html`**:
   - Organized into 6 main adventure sections: **Dashboard**, **Quests**, **Focus Chamber**, **Achievements**, **Statistics**, and **Settings**.
   - Includes high-contrast, sharp SVG icons for zero external dependencies.

2. **`css/style.css`**:
   - Uses a dark navy palette (`#0b0f19`) paired with electric violet (`#8b5cf6`), cyber cyan (`#06b6d4`), and gold (`#f59e0b`) accents.
   - Smooth CSS animations, glowing particle backgrounds, and responsive layouts designed for laptops, tablets, and smartphones.

3. **`js/storage.js`**:
   - Acts as your safe save file. Whenever you earn XP, create a quest, or finish a focus session, it serializes your state into JSON and stores it in `localStorage`.
   - Includes data sanitation (`sanitizeState`) so if data is missing or corrupted, the app gracefully falls back to clean default values without crashing.

4. **`js/gamification.js`**:
   - **Level Curve**: Level 1 requires 100 XP to advance. Level 2 requires 150 XP. Each subsequent level requires `100 + (level - 1) * 50` XP.
   - **Web Audio API Synth**: Features an offline retro sound synthesizer. It generates pleasant chimes for quest completion, victory fanfares for leveling up, and temple bells for focus timer completion without needing any MP3 downloads!
   - **Confetti Particle Engine**: A lightweight HTML5 Canvas physics engine that triggers celebratory confetti showers when you level up.

5. **`js/quests.js`**:
   - Manages quest creation, editing, subject color tags, difficulty awards (Easy: 10 XP, Medium: 25 XP, Hard: 40 XP), and filters.
   - **Anti-Farming Security**: Quests record an `xpAwarded: true` flag. If a quest is reopened and checked off again, or edited after completion, it will **not** award duplicate XP.

6. **`js/timer.js`**:
   - The Focus Chamber uses the Pomodoro technique (25 minutes of high focus + 5 minutes of rest).
   - Uses precise delta-time (`Date.now()`) calculation so backgrounding the browser tab will never cause the timer to drift or fail.
   - **Anti-Cheat Validation**: Sessions and rewards (+15 XP) are only granted when the timer legitimately runs down to `00:00`. Pausing or resetting the timer awards nothing.

7. **`js/app.js`**:
   - The conductor of the orchestra. It initializes `QuestManager`, `FocusTimer`, binds the navigation buttons, draws the weekly 7-day SVG activity bar chart, and displays floating toast alerts.

---

## 🎮 Gamification Rules & Formulas

### 1. Difficulty & XP Rewards
- 🟢 **Easy Quest**: `+10 XP` (Quick flashcards, reading a short poem, organizing desk)
- 🟡 **Medium Quest**: `+25 XP` (Solving 5 math problems, writing a short summary, lab diagram)
- 🔴 **Hard Quest**: `+40 XP` (Completing a full practice test, studying a full science chapter)
- ⏱️ **Focus Session (25 min)**: `+15 XP`

### 2. Level Progression Chart
| Level | Title | XP Needed for Tier | Cumulative XP |
| :---: | :---: | :---: | :---: |
| **1** | Novice Apprentice | 100 XP | 0 XP |
| **2** | Curious Explorer | 150 XP | 100 XP |
| **3** | Sage in Training | 200 XP | 250 XP |
| **4** | Lorekeeper | 250 XP | 450 XP |
| **5** | Scholar | 300 XP | 700 XP |
| **6** | Arcane Tactician | 350 XP | 1,000 XP |

### 3. Hall of Achievements
1. ⚔️ **First Quest**: Complete your very first study quest.
2. 📜 **Getting Started**: Complete 5 study quests.
3. ⏳ **Focus Master**: Complete 5 focus sessions.
4. 🔥 **Consistent Learner**: Study on 3 separate calendar days.
5. 🎓 **Scholar**: Reach Character Level 5.
6. 🔮 **Chrono Apprentice**: Complete your first 25-minute focus session.

---

## 🧪 Testing Checklist & Verification Results

| Test Feature | Expected Outcome | Result |
| :--- | :--- | :---: |
| **Quest Creation** | Title length validation ($\ge 3$ characters), subject tag assignment, difficulty selection. | ✅ Passed |
| **XP Integrity & Anti-Farming** | XP is awarded on first completion. Re-opening a completed quest and checking it again prevents duplicate XP. | ✅ Passed |
| **Level-Up Engine** | Earning enough XP triggers the Level Up modal, canvas confetti, and Web Audio victory fanfare. | ✅ Passed |
| **Focus Chamber** | 25:00 countdown ticks down; SVG circle ring updates smoothly; no XP on early reset; +15 XP on completion. | ✅ Passed |
| **Data Persistence** | Closing the browser or refreshing the page retains all quest states, current streaks, and XP totals. | ✅ Passed |
| **Streak Tracker** | Correctly increments streak on consecutive days and tracks active dates array. | ✅ Passed |
| **Responsive Design** | Fluid layouts on desktop, tablet, and mobile with bottom navigation bar. | ✅ Passed |

---

## 🌟 Future Ideas for Version 2 (Expansion Ideas)
- **Item Shop**: Spend excess XP on customizable virtual avatars, pets (e.g. study owl, miniature dragon), or retro theme colors.
- **Quest Export / Backup**: Export quests to a `.json` file to back up or transfer between devices.
- **Sound Effects Volume Slider**: Adjustable master audio slider in Settings.

