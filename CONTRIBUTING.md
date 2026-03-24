# ShiftPay — Getting Started (For Contributors)

Welcome to the ShiftPay project. This guide covers everything you need to set up, make changes, and submit them safely.

---

## First-Time Setup

### 1. Install Prerequisites

You need these installed on your computer:

- **Git** — https://git-scm.com/downloads
- **Node.js** (v18 or higher) — https://nodejs.org
- **A code editor** — VS Code recommended (https://code.visualstudio.com)

### 2. Clone the Project

Open a terminal and run:

```bash
git clone https://github.com/cmm219/ShiftPay.git
cd ShiftPay
npm install
```

### 3. Run the Project Locally

```bash
npm run dev
```

This starts the app at **http://localhost:3000**. Open that in your browser and you should see the ShiftPay landing page.

---

## How We Work (READ THIS CAREFULLY)

### The Golden Rule

**You never edit the `master` branch directly.** Master is the "real" version of the app. It's protected — even if you try to push to it, GitHub will reject it.

Every change goes through this process:

1. You make a **branch** (your own copy to work on)
2. You make your changes on that branch
3. You **push** your branch to GitHub
4. You open a **Pull Request** (PR) — this is a request to merge your changes
5. Your partner **reviews** the PR
6. If it looks good, it gets **merged** into master
7. If something's wrong, you get feedback and fix it first

This means the main project CANNOT be messed up. Your changes stay on your branch until they're approved.

---

## Step-By-Step Workflow

### Every time you start working:

```bash
# 1. Make sure you're on master and have the latest code
git checkout master
git pull

# 2. Create a new branch for what you're working on
#    Name it something descriptive
git checkout -b your-branch-name
```

Good branch names:
- `fix-login-page`
- `add-404-page`
- `update-navbar-links`

Bad branch names:
- `my-changes`
- `stuff`
- `test123`

### While you're working:

Save your files normally in your editor. When you're ready to save your progress to git:

```bash
# See what files you changed
git status

# Add the specific files you changed
git add src/pages/Login.jsx
git add src/components/Navbar.jsx

# Commit with a message explaining WHAT you did and WHY
git commit -m "Fix login page layout on mobile"
```

Commit tips:
- Commit often — small, frequent saves are better than one giant one
- Write clear messages — your partner needs to understand what changed
- Only add files you actually meant to change

### When you're done and ready for review:

```bash
# Push your branch to GitHub
git push -u origin your-branch-name
```

Then go to https://github.com/cmm219/ShiftPay — GitHub will show a banner saying "your-branch-name had recent pushes" with a green **"Compare & pull request"** button. Click it.

Fill in:
- **Title**: Short description (e.g., "Fix login page layout on mobile")
- **Description**: What you changed and why. Be specific.

Click **"Create pull request"**. Your partner will review it and either approve or leave comments.

---

## Common Situations

### "I messed up my branch"

No worries — your branch is YOUR copy. Master is safe. Options:

```bash
# Option 1: Undo your last commit (keeps the files changed)
git reset --soft HEAD~1

# Option 2: Abandon the branch and start fresh
git checkout master
git pull
git checkout -b new-branch-name
```

### "My branch is behind master"

If your partner merged other changes to master while you were working:

```bash
git checkout master
git pull
git checkout your-branch-name
git merge master
```

If there are conflicts, ask your partner for help.

### "I accidentally made changes on master"

```bash
# Move your changes to a new branch (nothing is lost)
git stash
git checkout -b my-new-branch
git stash pop
```

### "I don't know what I changed"

```bash
# See which files changed
git status

# See the actual line-by-line changes
git diff
```

---

## What NOT to Do

- **NEVER** run `git push --force` (this can destroy history)
- **NEVER** run `git reset --hard` on master
- **NEVER** commit `.env` files or passwords
- **NEVER** commit `node_modules/` (it's already in .gitignore)
- **DON'T** push directly to master — it will be rejected anyway
- **DON'T** merge your own PRs without your partner's approval

---

## Project Structure (Quick Reference)

```
ShiftPay/
├── src/
│   ├── components/    ← Reusable UI pieces (Navbar, Button, etc.)
│   ├── pages/         ← One file per page (Landing, Browse, etc.)
│   ├── data/          ← Mock data (workers, restaurants, shifts)
│   ├── hooks/         ← Custom React hooks
│   ├── utils/         ← Helper constants
│   ├── App.jsx        ← Main router
│   ├── main.jsx       ← Entry point
│   └── index.css      ← Styles and design tokens
├── CONTROL/           ← Project docs (read these to understand the project)
├── package.json       ← Dependencies
└── vite.config.js     ← Build config
```

## Running Commands

| Command | What it does |
|---------|-------------|
| `npm install` | Install dependencies (first time or after pulling new packages) |
| `npm run dev` | Start the dev server at localhost:3000 |
| `npm run build` | Build for production (to check for errors) |

---

## Questions?

If you're stuck or unsure about something, **ask before you act**. It's always better to ask a question than to accidentally break something.
