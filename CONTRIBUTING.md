# Contributing

ShiftPay is maintained as a portfolio MVP. Contributions should keep the app reviewable, documented, and easy to run locally.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs on `http://localhost:3000`.

Supabase credentials are optional for UI review. Without them, public read flows fall back to mock data.

## Development Workflow

1. Create a branch from `master`.
2. Keep changes focused and small enough to review.
3. Run verification before opening a pull request.
4. Include notes for schema, environment, or edge-function changes.

```bash
npm run lint
npm run build
npm run test:e2e
```

## Code Standards

- Keep route-level behavior in `src/pages`.
- Put reusable UI in `src/components`.
- Keep Supabase reads/writes in `src/lib/api.js` or a focused helper.
- Prefer database RPCs for state transitions that need authorization or locking.
- Do not commit `.env*`, logs, browser traces, generated build output, or local AI/tooling state.

## Database Changes

Add new SQL files under `supabase/migrations` using the next numeric prefix. Migration files should include:

- Table/function/policy changes.
- RLS policies for new tables.
- Indexes for expected query paths.
- A short comment describing the purpose of the migration.

## Pull Request Checklist

- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Relevant Playwright tests pass or the gap is explained.
- [ ] README or setup notes are updated when behavior changes.
- [ ] No secrets or local-only artifacts are committed.
