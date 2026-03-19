# Phase 2 — Run Instructions

## Quick Start
cd secret-todo
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173

---

## What's New in Phase 2

### 1. Edit Tasks
- Hover over any task → pencil icon appears top-right of the card
- Click it → Edit Task modal opens with all fields pre-filled
- Change title, description, folder, priority, energy, due date, reminder
- Toggle completion status with the toggle switch
- Delete the task from inside the edit modal (red trash icon in header)

### 2. Edit Folders
- In the sidebar, hover over any folder → pencil + trash icons appear
- Click pencil → Edit Folder modal opens
- Change name, color, icon — preview updates live

### 3. Bulk Selection
- Long-press any task card for 500ms → enters select mode
- Checkbox turns blue/accent color
- Tap more tasks to add to selection
- Floating action bar appears at bottom:
  - ✓ Complete all selected
  - Undo — mark all back to pending
  - Move to… — dropdown to reassign folder
  - 🗑 Delete all selected
  - X to cancel selection

### 4. Sort Tasks
- Every task list (Planner + Folder views) has a Sort dropdown top-right
- Options: Default / By priority / By due date / By energy / Alphabetical
- Your sort choice saves automatically and persists between sessions

### 5. Shopping List Mode
- Open any folder
- In the folder header, toggle between "Task view" and "Shopping list"
- Shopping mode shows checklist-style cards with quantity support
- Double-click any item to rename it inline
- "Clear checked" removes all completed items at once

### 6. Quick-Add Bar
- Press N on your keyboard (when not in an input field)
- OR click the ⚡ Quick button in the header
- Floating bar slides up from the bottom
- Choose priority (low/med/high) + folder
- Press Enter to save instantly
- Press Escape to close

### 7. Energy Filter (Planner)
- Daily Planner now has filter pills below the progress card
- ⚡ All energy / 🔋 Low / ⚡ Medium / 🔥 High
- Filters tasks by energy level across all sections

### 8. Inline Add Row
- Every folder view has an "Add item…" row at the top (no modal needed)
- In shopping mode it adds a qty field too
- Press Enter to save

---

## Keyboard Shortcuts
| Key     | Action             |
|---------|-------------------|
| N       | Open Quick Add bar |
| Enter   | Save quick add     |
| Escape  | Close any panel    |

---

## Build for Production
npm run build
npm run preview
