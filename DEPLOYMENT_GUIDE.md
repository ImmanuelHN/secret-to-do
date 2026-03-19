# Secret To-Do — Complete Deployment Guide

## Your Setup
- **Repo:** `immanuelhn/secret-to-do`
- **Live URL:** `https://immanuelhn.github.io/secret-to-do/`
- **Branch:** `main`
- **Deploy method:** GitHub Actions (auto-builds on every push to main)

---

## HOW IT WORKS (Understanding the Flow)

```
You push code → GitHub Actions runs → builds with `npm run build` → deploys dist/ to GitHub Pages
```

You **never** push `dist/` manually. GitHub Actions builds it automatically.

---

## ONE-TIME GITHUB SETUP (Do this once, never again)

### Step 1 — Set GitHub Pages to use GitHub Actions

1. Go to: `https://github.com/immanuelhn/secret-to-do/settings/pages`
2. Under **"Source"**, select **"GitHub Actions"** (NOT "Deploy from a branch")
3. Click **Save**

> ⚠️ This is the most common mistake. If Pages is set to "Deploy from a branch",
> it will serve the raw source code (which shows just "secret-todo") instead of the built app.

### Step 2 — Verify workflow permissions

1. Go to: `https://github.com/immanuelhn/secret-to-do/settings/actions`
2. Under **"Workflow permissions"**, select **"Read and write permissions"**
3. Click **Save**

---

## HOW TO PUSH UPDATES (Every time you update the app)

### What your coding agent should do:

```bash
# 1. Navigate into the project folder
cd secret-todo

# 2. Check status (optional but good habit)
git status

# 3. Stage all changes
git add .

# 4. Commit with a message
git commit -m "Update: describe what changed"

# 5. Push to main
git push origin main
```

### That's it. GitHub Actions does the rest automatically.

---

## WHAT HAPPENS AFTER YOU PUSH

1. GitHub receives the push
2. GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers
3. It runs:
   - `npm install --legacy-peer-deps`
   - `npm run build` → creates `dist/` folder
   - Uploads `dist/` to GitHub Pages
4. Site is live in ~2-3 minutes

**Watch the build:** `https://github.com/immanuelhn/secret-to-do/actions`

---

## HOW TO UPDATE WITH A NEW ZIP FROM THIS CHAT

When you get a new zip (like `secret-todo-phase4b.zip`):

```bash
# Step 1: Extract the zip
unzip secret-todo-phase4b.zip
# This gives you a folder called: secret-todo/

# Step 2: Copy files into your existing git repo
# Option A: Replace everything (recommended)
cp -r secret-todo/. /path/to/your/existing/repo/

# Option B: Using your coding agent
# Just load the unzipped folder into your coding agent
# and let it handle copying + committing

# Step 3: Push
cd /path/to/your/existing/repo
git add .
git commit -m "Update: Phase 4B improvements"
git push origin main
```

> ⚠️ IMPORTANT: Do NOT delete the `.git` folder when copying.
> Your existing repo's `.git` folder contains your git history.
> Just overwrite everything except `.git`.

---

## FOLDER STRUCTURE THAT MUST BE IN YOUR REPO

```
secret-to-do/          ← your GitHub repo root
├── .github/
│   └── workflows/
│       └── deploy.yml ← GitHub Actions workflow (MUST be here)
├── public/
│   ├── 404.html       ← SPA routing fix for GitHub Pages
│   ├── favicon.svg
│   └── sw.js          ← Service Worker
├── src/               ← all React source code
├── index.html
├── vite.config.js     ← has base: '/secret-to-do/'
├── package.json
└── package-lock.json
```

> ❌ `dist/` should NOT be in the repo (it's in .gitignore)
> ❌ `node_modules/` should NOT be in the repo (it's in .gitignore)

---

## TROUBLESHOOTING

### Problem: Site shows "secret-todo" text instead of the app
**Fix:** GitHub Pages is set to "Deploy from branch" instead of "GitHub Actions"
- Go to Settings → Pages → Source → change to "GitHub Actions"

### Problem: Site shows 404
**Fix:** Check the base URL. Your vite.config.js must have:
```js
base: '/secret-to-do/',
```
The repo name in the URL must match exactly (case-sensitive).

### Problem: Build fails in GitHub Actions
**Fix:** Check the Actions tab for error details.
Common causes:
- Wrong Node version (should be 20+)
- Missing package → run `npm install --legacy-peer-deps` locally first
- Syntax error in the code

### Problem: App loads but is blank / white screen
**Fix:** Open browser DevTools (F12) → Console → look for red errors.
Usually means a JavaScript import is broken or an API call failed.

### Problem: Old version still showing after push
**Fix:** Hard refresh the page: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
GitHub Pages can be cached — wait 1-2 min then hard refresh.

### Problem: Notifications not working on GitHub Pages
**Fix:** Notifications require HTTPS. GitHub Pages uses HTTPS automatically.
Make sure you click "Allow" when the browser asks for notification permission.

---

## KEY FILES EXPLAINED

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | Tells GitHub Actions how to build and deploy |
| `vite.config.js` | `base: '/secret-to-do/'` tells Vite the URL path prefix |
| `public/404.html` | Redirects 404s back to the SPA (needed for page refresh) |
| `public/sw.js` | Service Worker for background notifications |
| `.gitignore` | Excludes `node_modules/` and `dist/` from git |

---

## QUICK REFERENCE — EVERY UPDATE

```bash
# Get new zip → extract → copy into repo → then:
git add .
git commit -m "Update: your description here"
git push origin main
# Wait ~2 min → check https://immanuelhn.github.io/secret-to-do/
```

---

## CHECKING IF DEPLOY WORKED

1. Go to: `https://github.com/immanuelhn/secret-to-do/actions`
2. You should see a green ✅ checkmark on the latest workflow run
3. If red ❌ — click it to see what failed

