# Phase 3 — Run Instructions

## Quick Start
cd secret-todo
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173

---

## What's New in Phase 3

### 1. Browser Notifications
- Go to Settings → Notifications → click "Enable"
- Browser will ask permission — click Allow
- Click "Test" to verify it's working
- Notifications work fully offline — no server needed
- Note: Must be on localhost or HTTPS for notifications to work

### 2. Task Reminders
- When adding a task, set a due date + reminder time
- If the due date is today, the reminder fires at that exact time
- Example: due_date = today, reminder_time = 18:00 → fires at 6PM

### 3. Water Reminder
- Settings → Notifications → toggle Water Reminder ON
- Choose interval: 30 / 60 / 90 / 120 minutes
- Fires "💧 Drink water!" notification at that interval
- Restarts every time you open the app

### 4. Meal Reminders
- Settings → Notifications → toggle Meal Reminders ON
- Customize breakfast/lunch/dinner times
- Fires a notification at each meal time once per day
- Times fire only if they haven't passed yet today

### 5. Evening Planner Panel
- Automatically appears after 8PM (20:00)
- Shows: unfinished tasks from today + tomorrow's agenda
- Dismisses when you click X or "Dismiss"
- Click "Open Planner" to jump to the planner view
- Reappears the next evening (session-based dismiss)

### 6. Stale Task Cleaner
- Shown on the Planner page if stale tasks exist
- Stale = pending task with created_at older than 14 days
- Click "View" to expand and see the list
- "Move to Vault" — marks them complete → they appear in Vault
- "Delete All" — permanently removes them

### 7. Smart Cross-Folder Detection
- Open "New Task" modal, start typing a task title
- If the title contains words that match a folder name, a hint appears
- Shows that folder's existing tasks as a checklist
- Click "Open" to jump to that folder directly

### 8. Data Export & Import (Settings → Data)
- Export: downloads a full JSON backup of all tasks, folders, habits
- Import: loads a JSON backup and adds it to existing data (doesn't overwrite)
- Great for backup before clearing data

---

## Notification Notes
- Notifications require browser permission (one-time request)
- Work on localhost (dev) and any HTTPS deployment
- Do NOT work on plain HTTP URLs
- Each browser tab runs its own reminder timers
- Timers reset when you close and reopen the tab — they re-schedule on mount

---

## Build for Production
npm run build
npm run preview
