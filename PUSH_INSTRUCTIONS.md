# How to Push This Update to GitHub

## What was fixed in this update:
- Recurring task duplication bug (daily task multiplying on every check)
- Overdue recurring tasks now advance to TOMORROW, not yesterday+1
- Checkbox double-tap protection (busy lock prevents multi-fire)  
- Sidebar theme switcher no longer hidden by floating bar on mobile
- Shopping list checkbox now works the same as task view checkbox
- Add Task modal now shows attachment picker AFTER saving the task
- AI voice parser now extracts time/date properly ("3:30pm", "tomorrow", "next week")
- AI voice parser checks your task history to infer missing dates
- Confirmation screen shown before saving any AI-parsed task
- SToDo logo added to sidebar and PIN lock screen

## Files changed:
  src/services/recurService.js     ← recurring bug fix
  src/services/aiTaskParser.js     ← smart date parsing + history lookup
  src/components/TaskCard.jsx      ← double-tap protection
  src/components/Sidebar.jsx       ← logo + mobile scroll fix
  src/components/PinLock.jsx       ← logo update
  src/components/FloatingBar.jsx   ← confirmation modal for AI tasks
  src/components/AddTaskModal.jsx  ← attachment step after save
  src/index.css                    ← sidebar z-index + scroll fix
  public/logo.png                  ← SToDo logo (new file)
  vite.config.js                   ← base: '/secret-to-do/' (GitHub Pages fix)
  .github/workflows/deploy.yml     ← auto-deploy
  public/.nojekyll                 ← GitHub Pages fix
  public/404.html                  ← SPA routing fix

---

## STEP-BY-STEP PUSH

### Step 1 — Extract the zip
Unzip secret-todo-bugfix.zip → you get a folder called secret-todo/

### Step 2 — Copy files into your repo
Copy ALL files from secret-todo/ into your GitHub repo folder.
Replace everything when prompted.
IMPORTANT: Keep your .git/ folder — never delete it.

On Mac terminal:
  cp -r /path/to/extracted/secret-todo/. /path/to/your/repo/

On Windows: Open both folders, select all, paste + replace all.

### Step 3 — Push to GitHub
Open terminal in your repo folder:

  git add -A
  git commit -m "Fix: recurring tasks, AI parser, logo, attachments in add modal"
  git push origin main

### Step 4 — Wait for GitHub Actions
  Repo → Actions tab → watch the workflow → ~2 minutes → live

### Step 5 — Verify
  Visit: https://immanuelhn.github.io/secret-to-do/
  Hard refresh: Ctrl+Shift+R (Android Chrome: menu → refresh)

---

## EVERY FUTURE UPDATE (same steps every time)

1. Download zip from Claude
2. Extract → copy files into repo (replace all)
3. git add -A && git commit -m "Update" && git push
4. Wait 2 min → visit site

That's it. GitHub Actions handles the build automatically every time you push.
