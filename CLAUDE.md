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

## Tech Stack
- **Build**: Vite 7.3 | **Framework**: React 19 | **Styling**: Tailwind CSS 4
- **Routing**: React Router 7 | **State**: localStorage via custom hooks
- **Data**: Mock JSON arrays (no backend yet)
- **Fonts**: Playfair Display (display), DM Sans (body), JetBrains Mono (mono)
- **Dev server**: localhost:3000

## Tailwind v4 — IMPORTANT
Tailwind v4 does NOT use `tailwind.config.js`. All theme customization lives in `src/index.css` inside the `@theme { }` block. Colors are referenced as `bg-bg-primary`, `text-text-secondary`, `border-border-subtle`, etc.

## Quick Reference
- **Run**: `npm run dev` (localhost:3000)
- **Build**: `npm run build`
- **Project root**: `C:\Shiftd`
