# Phase 4 — Run Instructions

## Quick Start
cd secret-todo
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173

---

## What's New in Phase 4

### 1. Voice Input
- Open "New Task" modal → microphone button appears next to the title field
- Click the mic → speak your task title → it auto-fills
- Also available on the description field
- Works on Chrome and Edge (webkit SpeechRecognition)
- Button hidden automatically on unsupported browsers (Firefox, Safari)

### 2. PIN Lock Screen
- Go to Settings → PIN Lock section
- Toggle ON → "Set PIN" modal opens
- Enter a 4-digit PIN, confirm it → saved securely
- Next time you open the app → full-screen PIN keypad appears
- Number pad + keyboard support (type digits directly)
- Wrong PIN → red dots + shake animation
- To change: Settings → "Change PIN" button
- To disable: Settings → toggle OFF → verify current PIN

### 3. Charts Page (new nav item in sidebar)
- 4 stat cards: completion %, best habit streak, pending tasks, done today
- Completion donut chart with live percentage
- Trend bar chart → toggle Week (7 days) or Month (4 weeks)
- Priority distribution: donut + horizontal progress bars
- Energy distribution bar chart (low/med/high of pending tasks)
- Folder leaderboard: ranked by completion %, colored progress bars
- Habit streaks: sorted by longest streak

### 4. Recurring Tasks
- New "Repeat" field in Add Task modal: None / Daily / Weekly / Monthly
- When you complete a recurring task → next occurrence auto-creates
  - Daily: +1 day from due date
  - Weekly: +7 days
  - Monthly: +1 month
- Recurring badge shown on task card (repeat icon + frequency)
- Edit task also has the Repeat field

---

## All Features Summary (All Phases)

| Feature                | Phase |
|------------------------|-------|
| Daily Planner          | P1    |
| 3 Themes               | P1    |
| Folder system          | P1    |
| Task CRUD              | P1    |
| Habit tracker          | P1    |
| Dashboard stats        | P1    |
| Search                 | P1    |
| Vault                  | P1    |
| Edit tasks/folders     | P2    |
| Bulk actions           | P2    |
| Sort tasks             | P2    |
| Shopping list mode     | P2    |
| Quick-add bar (N key)  | P2    |
| Energy filter          | P2    |
| Inline add             | P2    |
| Browser notifications  | P3    |
| Water reminders        | P3    |
| Meal reminders         | P3    |
| Evening planner panel  | P3    |
| Stale task cleaner     | P3    |
| Smart folder hint      | P3    |
| Data export/import     | P3    |
| Voice input            | P4    |
| PIN lock               | P4    |
| Charts & analytics     | P4    |
| Recurring tasks        | P4    |

---

## Build for Production
npm run build
npm run preview

## Important Notes
- Voice input: Chrome/Edge only. Hidden on other browsers.
- PIN: stored in localStorage. If user clears browser storage, PIN resets.
- Charts use pure SVG — no external chart library needed.
- DB auto-upgrades on first launch (Dexie v1 → v2, adds recur field).
