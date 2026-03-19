# Secret To-Do — Deployment & Update Instructions

## Your Setup
- GitHub repo:  immanuelhn/secret-to-do
- Live URL:     https://immanuelhn.github.io/secret-to-do/
- Local dev:    npm run dev → http://localhost:5173

---

## HOW THE BUILD WORKS

This is a React (Vite) app. The key setting is in vite.config.js:
  base: '/secret-to-do/'

This tells Vite to prefix ALL asset paths with /secret-to-do/ so that
GitHub Pages can find them correctly.

If you ever rename your repo, change this base value to match.

---

## FIRST-TIME GITHUB PAGES SETUP (do this once)

1. Go to your GitHub repo → Settings → Pages
2. Under "Source" → select "GitHub Actions"
3. Click Save
4. The .github/workflows/deploy.yml file will handle all future deploys automatically.

---

## HOW TO PUSH AN UPDATE (every time)

### Step 1 — Get the new zip from Claude
Download the zip file Claude provides (e.g. secret-todo-phase4b.zip)

### Step 2 — Extract the zip
Extract it. You get a folder called secret-todo/

### Step 3 — Copy files into your existing repo
IMPORTANT: Do NOT delete your .git folder or GitHub secrets.
Copy EVERYTHING from the extracted secret-todo/ folder INTO your existing repo folder.
On Mac/Linux:
  cp -r secret-todo/* /path/to/your/repo/
  cp -r secret-todo/.github /path/to/your/repo/
  cp secret-todo/.gitignore /path/to/your/repo/

On Windows (File Explorer):
  Open both folders side by side
  Select all files from extracted zip
  Paste into your repo folder → replace all when prompted

### Step 4 — Push to GitHub
Open terminal in your repo folder:
  git add .
  git commit -m "Update: Phase 4B improvements"
  git push origin main

### Step 5 — Wait for deploy
GitHub Actions automatically builds and deploys.
Go to your repo → Actions tab → watch the workflow run.
Takes about 1-2 minutes.
Then visit: https://immanuelhn.github.io/secret-to-do/

---

## USING A CODING AGENT (your current workflow)

If you load the folder into your coding agent (Cursor, Windsurf, etc.):

1. Extract the zip → you get secret-todo/
2. Open that folder in your coding agent
3. If the agent doesn't see the .github/workflows/ folder, manually add it
4. Use git commands or the agent's Git panel to commit + push
5. GitHub Actions auto-deploys on every push to main

The coding agent command to push:
  git add -A
  git commit -m "Update Secret To-Do"
  git push

---

## TROUBLESHOOTING

### Site shows blank page / white screen
Cause: vite.config.js base path doesn't match repo name
Fix: Open vite.config.js, make sure base: '/secret-to-do/' (must match your repo name exactly)

### Assets 404 (JS/CSS not loading)
Cause: Same base path issue
Fix: Same as above

### "Page not found" on GitHub Actions tab
Cause: GitHub Pages source not set to GitHub Actions
Fix: Repo → Settings → Pages → Source → GitHub Actions

### Workflow fails at "Install dependencies"
Cause: package-lock.json conflict
Fix: Delete package-lock.json from the repo, commit, push again

### App works locally but not on GitHub Pages
Cause: Missing .nojekyll file or wrong base path
Fix: Make sure public/.nojekyll exists and vite.config.js has the correct base

### Notifications don't work on GitHub Pages
Cause: Service Worker requires HTTPS — GitHub Pages does use HTTPS so it should work
Fix: Clear site data → Settings → Clear browsing data → for immanuelhn.github.io

---

## LOCAL DEVELOPMENT

cd secret-todo
npm install --legacy-peer-deps
npm run dev
# Opens at http://localhost:5173

Note: On localhost, base path is ignored. App works at http://localhost:5173 directly.

## LOCAL PREVIEW (simulates GitHub Pages exactly)
npm run build
npm run preview
# Opens at http://localhost:4173/secret-to-do/

---

## FILE CHECKLIST FOR EACH UPDATE

Every zip Claude provides should have these key files:
  vite.config.js           ← must have base: '/secret-to-do/'
  .github/workflows/deploy.yml  ← auto-deploy workflow
  public/.nojekyll         ← stops GitHub from treating as Jekyll site
  public/404.html          ← SPA routing fix
  public/sw.js             ← Service Worker
  src/                     ← all React source code
  package.json             ← dependencies

---

## FULL DEPLOY FLOW DIAGRAM

  [You get zip from Claude]
       ↓
  [Extract → Copy to repo]
       ↓
  [git add . && git commit && git push]
       ↓
  [GitHub Actions triggers automatically]
       ↓
  [Workflow: checkout → npm install → npm run build → upload dist/]
       ↓
  [GitHub Pages serves from dist/]
       ↓
  [Live at https://immanuelhn.github.io/secret-to-do/]

Total time from push to live: ~2 minutes
