# Phase 4B (Improvements) — Run Instructions

## Quick Start
cd secret-todo
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173

---

## New Features in This Update

### 1. AI Voice Task Parser (Floating Bar — Mic Button)
- Press the central mic button in the floating cylinder bar at the bottom
- Speak naturally: "I want to go shopping today at 3pm"
- The app sends your speech to Claude AI, which extracts:
  - Task title, due date, reminder time, priority, energy level
- Task is automatically created and confirmed with a toast message
- Press mic again while listening to cancel
- While AI is parsing you see a spinner and your transcript
- Fallback: if AI is unavailable, uses raw transcript as title

### 2. Floating Cylinder Bar
- Replaces the header Quick/New Task buttons
- Three items in a pill shape at the bottom center:
  - ⚡ Quick — opens quick-add bar
  - 🎤 Mic — AI voice task creation (center, larger button)
  - + New Task — opens full add task modal
- Stays fixed at the bottom on all pages
- Mic button turns red + pulsing ring while listening
- Toast message confirms task was created or shows error

### 3. Photo & Video Attachments
- Open any task's Edit modal → "📎 Attachments" section
- Tap "+ Add photo / video" to pick files from device
- Supports images (jpg/png/gif/webp) and videos
- Images show as 80×80 thumbnails — tap to fullscreen
- Videos tap to open fullscreen player
- All files stored locally in IndexedDB (never leaves device)
- Delete individual attachments with the × button

### 4. Service Worker (Background Notifications)
- App registers a Service Worker on load
- Notifications now work even when the app is in the background
- Notification action buttons: Snooze · Done · + Reschedule

### 5. Smart Notification Actions
- Water, meal, habit, and task reminders now have action buttons:
  - ⏸ Snooze Xm — re-fires after your configured snooze duration
  - ✅ Done — marks the task/habit as complete
  - + Reschedule — opens time picker to set a new time
- Snooze duration: Settings → Snooze Duration (5/10/15/30 min)

### 6. PIN Auto-Lock Timeout
- Settings → Auto-Lock Timeout
- Options: Never / 1 min / 5 min / 15 min / 30 min
- After the timeout of inactivity, app automatically locks
- Any mouse move, touch, or keypress resets the timer
- Requires PIN to be set for this to work
- Also: 5 failed PIN attempts → 30 second lockout

---

## Notes on AI Voice Task Parser
- Uses Claude Sonnet API (api.anthropic.com) — works on localhost
- Fallback to raw transcript if API is unreachable
- Examples that work well:
  - "Buy groceries tomorrow morning"
  - "Call the dentist today at 2pm — urgent"
  - "Weekly team meeting every Monday at 10am"
  - "Read 20 pages tonight — low energy"

## Notes on Service Worker
- SW registered at /sw.js — must be served from root
- Action buttons (Snooze/Done/+) work on Chrome/Edge
- Firefox supports notifications but not action buttons
- On mobile Chrome: notification actions appear as swipe buttons
