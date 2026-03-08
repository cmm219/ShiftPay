# CLAUDE.md — ShiftPay

This file provides guidance to Claude Code when working in this project.

## Control Files (Read before ANY work)
@CONTROL/STATE.md
@CONTROL/TASKS.md
@CONTROL/DECISIONS.md
@CONTROL/CONTEXT.md
@CONTROL/LOG.md

## Hard Rules
- CONTROL/ is authoritative — overrides all other docs
- NO refactors without explicit approval
- NO silent edits — show diffs BEFORE changes
- One feature at a time — complete and verify before moving on
- No architecture changes without approval
- **Always launch agents in parallel** when tasks are independent

## Browser Automation
- **Always use OpenChrome (`oc` tools / `mcp__openchrome__*`)** for all browser automation
- NEVER use the built-in "Claude in Chrome" extension tools (`mcp__Claude_in_Chrome__*`)
- OpenChrome supports parallel sessions — other terminals may be using the browser simultaneously

## Tech Stack
- **Build**: Vite 7.3 | **Framework**: React 19 | **Styling**: Tailwind CSS 4
- **Routing**: React Router 7 | **State**: localStorage via custom hooks
- **Data**: Mock JSON arrays (no backend yet)
- **Fonts**: Playfair Display (display), DM Sans (body), JetBrains Mono (mono)
- **Dev server**: localhost:3000

## Tailwind v4 — IMPORTANT
Tailwind v4 does NOT use `tailwind.config.js`. All theme customization lives in `src/index.css` inside the `@theme { }` block. Colors are referenced as `bg-bg-primary`, `text-text-secondary`, `border-border-subtle`, etc.

## Session Workflow
Plan -> Review -> Confirm -> Implement -> Diff -> Log -> Commit

## After Each Session
1. Update CONTROL/STATE.md with current status
2. Update CONTROL/TASKS.md with completed/new items
3. Append session entry to CONTROL/LOG.md
4. Commit with descriptive message

## Quick Reference
- **Run**: `npm run dev` (localhost:3000)
- **Build**: `npm run build`
- **Project root**: `C:\Shiftd`
