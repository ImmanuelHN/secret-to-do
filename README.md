# Secret To-Do — README

> Handoff doc. New chat: paste this + zip and say "Continue Secret To-Do. Phase 4 complete. Start Phase 5 (APK)."

---

## App Summary
Local-first, offline-ready, private to-do app. No cloud, no login, no cost.

## Tech Stack
React 18 + Vite · Tailwind CSS v4 · Zustand · Dexie.js v2 (schema v2) · dexie-react-hooks · lucide-react
Fonts: Bricolage Grotesque + Geist

## Theme System
DARK:      #0e0e0e · gradient(#1A1A1A→#5E4B43) cards · #c6a27a accent
LIGHT:     #FFF4E8 · gradient(#2C0901→#5a2a1f) cards · cream text on cards
AESTHETIC: gradient(#f3e8ff→#e0f2fe→#ffe4e6→#fff1c1) body · rotating pastel card pairs · glass

## DB Schema (Dexie v2)
folders:  id, name, color, icon, created_at
tasks:    id, title, description, folder_id, priority, due_date, reminder_time, completed(0|1), energy_level, recur(null|daily|weekly|monthly), created_at
habits:   id, name, time, streak_count, last_completed_date
settings: key(PK), value
  keys: theme, task_sort, water_reminder_interval, water_enabled, meal_enabled, meal_times, pin_enabled

PIN stored in localStorage('app_pin') — 4-digit string, never in DB.

## Full File Structure
src/
  components/
    Sidebar.jsx             Nav (now includes Charts) + folders + theme
    Header.jsx              Title + Quick + New Task
    TaskCard.jsx            Checkbox + recur badge + bulk select + edit
    AddTaskModal.jsx        Form + VoiceInput + SmartFolderHint + Repeat field
    AddFolderModal.jsx      Folder creation
    EditTaskModal.jsx       Edit all fields + completion toggle
    EditFolderModal.jsx     Edit folder
    QuickAdd.jsx            Floating quick-add (N shortcut)
    SortBar.jsx             Sort dropdown
    BulkActionBar.jsx       Bulk actions
    PredictivePlan.jsx      Evening panel (20:00+)
    StaleTaskBanner.jsx     14-day stale tasks banner
    SmartFolderHint.jsx     Folder match hint in AddTaskModal
    VoiceInput.jsx          Microphone button (Web Speech API)            [NEW P4]
    PinLock.jsx             Full-screen 4-digit PIN keypad                [NEW P4]
    PinSetupModal.jsx       Set / Change / Disable PIN modal              [NEW P4]
  pages/
    PlannerPage.jsx         Planner + energy filter + sort + stale banner
    FolderPage.jsx          Task/shopping modes + inline add + sort + bulk
    DashboardPage.jsx       Stats overview
    ChartsPage.jsx          Full analytics: bar charts, donut, trend, leaderboard [NEW P4]
    SearchPage.jsx          Real-time search
    HabitsPage.jsx          Habit tracker
    VaultPage.jsx           Old completed tasks
    SettingsPage.jsx        Theme + notifications + PIN section + data export/import
  services/
    notificationService.js  Browser Notification API wrapper
    reminderService.js      Water/meal/task reminder scheduling
    staleTaskService.js     14-day stale detection
    recurService.js         Recurring task auto-spawn on completion       [NEW P4]
  store/  appStore.js       Zustand (added pinSetupModal state)
  db/     database.js       Dexie v2 (added recur field to tasks)
  utils/  sortTasks.js      Sort helper
  index.css                 Full design system

## Phase Status

P1 DONE — Foundation + Premium Themed UI
P2 DONE — Edit tasks/folders, bulk, sort, shopping list, quick-add, energy filter
P3 DONE — Notifications, water/meal reminders, evening planner, stale cleaner, smart hint, export/import
P4 DONE — Voice input, PIN lock, Charts page, recurring tasks

P4 Features:
  [x] Voice Input (VoiceInput.jsx) — mic button in AddTaskModal title + description fields
      Uses window.SpeechRecognition / webkitSpeechRecognition. Chrome/Edge support.
  [x] PIN Lock Screen (PinLock.jsx) — 4-digit keypad, keyboard support, shake animation on wrong
  [x] PIN Setup Modal (PinSetupModal.jsx) — set/change/disable with verify flow
  [x] PIN persisted in localStorage('app_pin') — checked on every app load
  [x] Settings PIN section — toggle + Change PIN button
  [x] Charts Page (ChartsPage.jsx):
        - Donut chart: overall completion %
        - Bar chart: daily (7 days) or weekly (4 weeks) trend toggle
        - Priority distribution donut + breakdown bars
        - Energy distribution bar chart
        - Folder leaderboard with ranked progress bars
        - Habit streaks sorted by streak count
        - Stat cards: completion %, best streak, pending, done today
  [x] Recurring Tasks — recur field: null | daily | weekly | monthly
        - Shown as chip on task card
        - On completion → recurService.js auto-spawns next occurrence
        - Edit task modal includes recur field

P5 NEXT — APK Conversion
  [ ] npm install @capacitor/core @capacitor/cli @capacitor/android
  [ ] npx cap init "Secret To-Do" com.secrettodo.app
  [ ] npx cap add android
  [ ] npm run build && npx cap sync
  [ ] npx cap open android (Android Studio → Run/Build APK)
  [ ] @capacitor/local-notifications for native push on mobile
  [ ] App icon 512x512 + splash screen

## Quick Start
cd secret-todo
npm install --legacy-peer-deps
npm run dev  →  http://localhost:5173

## Key Notes
- Voice input: Chrome/Edge only (webkit prefix). Show nothing if unsupported.
- PIN: stored localStorage, not IndexedDB. Cleared if user clears browser data.
- Charts: uses pure SVG + CSS bars, no chart library needed.
- Dexie v2 upgrade runs automatically on first open after update.
- completed = 0|1 integer for Dexie indexing.
