# Phase 1 — Run Instructions

## Quick Start

cd secret-todo
npm install --legacy-peer-deps
npm run dev
# Open http://localhost:5173

## What to Test

1. THEMES: Sidebar bottom → click Dark / Light / Aesthetic. Each has a completely different color palette.
2. SIDEBAR: Always visible on desktop. Hamburger slides it on mobile.
3. ADD FOLDER: Click + next to "Folders" in sidebar → pick name, color, icon.
4. ADD TASK: Click "New Task" button (top right) → fill form → Enter or click Add Task.
5. PLANNER: Tasks sorted into Overdue / Today / Tomorrow / Upcoming / No Due Date sections.
6. CHECKBOX: Click the checkbox on any task to mark complete. Smooth animation.
7. DASHBOARD: Circular SVG progress ring + stat grid + folder progress bars.
8. HABITS: Add habit → check daily → 🔥 streak increments.
9. SEARCH: Type to instantly search all tasks.
10. VAULT: Completed tasks older than 7 days appear here.
11. SETTINGS: Change theme, water interval, meal times, or clear all data.

## Build for Production
npm run build        # outputs to dist/
npm run preview      # preview at http://localhost:4173

## Mobile Test
Use the Network URL from Vite output (e.g. http://192.168.x.x:5173/) on your phone (same WiFi).

## Troubleshooting
- npm install fails → add --legacy-peer-deps
- Blank screen → F12 > Console for errors
- Fonts not loading → check internet (Google Fonts CDN)
- DB not found → F12 > Application > IndexedDB > SecretTodoDB
