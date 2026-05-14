---
title: Public Portfolio Showcase Hardening
status: ready
date: 2026-05-14
owner: Codex
product_surface: Public GitHub repo, README, demo deployment, screenshots, sensitive docs hygiene
---

# Public Portfolio Showcase Hardening

## Current State

ShiftPay is currently doing two jobs:

- It is a public recruiter portfolio project that should show polished frontend,
  product, testing, and Supabase-ready engineering work.
- It is becoming detailed enough to possibly become a real product or startup
  asset later.

The current public-facing repo already has strong recruiter signals:

- React 19, Vite 7, React Router 7, Tailwind CSS 4.
- Responsive marketplace UI with worker browse, job browse, company profiles,
  worker dashboard, hiring dashboard, onboarding, posting, lifecycle states, and
  Playwright tests.
- Supabase-ready API adapter, SQL migrations, RLS/RPC patterns, and edge function
  structure.
- A README that explains demo mode, routes, setup, and boundaries.
- PRs showing iterative planning, implementation, QA, and Claude/Codex review
  loops.

The repo also contains or exposes material that is too useful for a future
competitor if ShiftPay becomes launchable:

- Merged PRDs in `docs/prd/`.
- Pending PR branches with additional PRDs/runbooks and implementation notes.
- `CONTROL/` pointer files that expose local notes paths and private workflow
  structure.
- README references to backend/payment/SMS readiness that may be too specific
  for a portfolio showcase.
- Remote branches named around PRDs/runbooks that can keep sensitive docs public
  even after cleanup lands on `master`.

No production deployment, merge, branch deletion, repository visibility change,
or remote cleanup should happen from this PRD alone. Those are implementation
steps that require explicit approval.

## Problem

Recruiters should be able to inspect ShiftPay quickly and trust the engineering
quality without receiving the full product roadmap, operational playbook, or
future backend/payment strategy.

Right now the public repo over-shares the product path. That creates two risks:

- **IP risk**: a public reader can learn not only what exists, but where the
  product is going and how to build it.
- **Recruiter clarity risk**: deep PRDs and internal control files distract from
  the portfolio story and make the repo feel less intentionally packaged.

## Goals

- Make the public ShiftPay repo look like a polished, recruiter-ready showcase.
- Keep enough code public to prove engineering ability.
- Remove or replace documents that reveal launch roadmap, operational sequencing,
  payment/ledger/reconciliation thinking, scheduler/runbook details, or private
  notes paths.
- Add a clear public case-study layer: screenshots, demo flow, engineering
  highlights, boundaries, and verification.
- Keep demo copy truthful: no live workers, live payments, live messaging,
  live emails/SMS, or live scheduler claims.
- Define which cleanup steps are safe code/docs changes and which steps are
  destructive GitHub operations requiring explicit approval.

## Non-Goals

- Do not implement new product features.
- Do not make backend schema changes.
- Do not change payment, Stripe, invoice, payout, ledger, reconciliation, SMS,
  email, or scheduler behavior.
- Do not delete remote branches without explicit approval during implementation.
- Do not change repository visibility without explicit approval.
- Do not rewrite Git history unless the user explicitly chooses that later.
- Do not remove source code that is useful for recruiter review unless the user
  chooses a stricter private-product posture.
- Do not claim the app is production-ready or a live marketplace.
- Do not assume branch deletion removes content from Git history, GitHub caches,
  or forks.

## Product Vocabulary

- **Public Showcase Repo**: The GitHub-visible project recruiters can inspect.
- **Private Product Notes**: PRDs, runbooks, roadmap, operational details, and
  launch strategy kept outside the public repo.
- **Case Study README**: Public README content that explains what the project
  demonstrates without exposing detailed roadmap or operational plans.
- **Sensitive Docs**: Files that reveal future product sequencing, business
  strategy, backend runbooks, payment/ledger/reconciliation thinking, private
  paths, or internal AI workflow state.
- **Showcase Asset**: Screenshot, GIF, demo video, or public deployment link used
  to help recruiters inspect the product quickly.
- **Destructive Remote Operation**: GitHub branch deletion, visibility change, or
  history rewrite. These require explicit approval.
- **Safe Stub**: A public replacement for a private doc. It keeps the original
  filename, stays under 10 lines, describes only the public demo purpose, and
  says fuller planning notes are private without naming paths or future roadmap.

## Product Decision

ShiftPay should keep a public showcase, but the public surface should be
sanitized.

Recommended posture:

- Public repo: polished frontend/demo code, tests, setup docs, screenshots,
  Supabase-ready code/migrations, and high-level architecture notes.
- Private notes/repo: PRDs, runbooks, roadmap sequencing, money-system planning,
  scheduler/backfill details, launch strategy, and raw control files.

If ShiftPay later becomes a real product, the public repo can remain a portfolio
artifact while the production product continues in a private repo.

## Required Flows

### Flow 1: Recruiter Opens GitHub

1. Recruiter lands on the repo.
2. README immediately communicates:
   - what ShiftPay is,
   - what the demo proves,
   - how to run it,
   - how to inspect the main flows,
   - what is mock/demo-only.
3. Screenshots or GIFs show the polished UI without requiring local setup.
4. Engineering highlights call out concrete skills:
   - React/Vite app structure,
   - Tailwind v4 theme tokens,
   - Supabase adapter with mock fallback,
   - RLS/RPC-ready backend shape,
   - Playwright coverage,
   - demo-safe auth and local state boundaries.
5. README avoids long internal route compatibility notes and future-product
   implementation details.

### Flow 2: Recruiter Runs Demo Locally

1. Recruiter follows `npm install`, `.env.example`, and `npm run dev`.
2. App runs with mock data by default or with a clearly documented mock-data
   setting.
3. Demo worker and demo hiring-team flows are obvious.
4. No real accounts, payments, messages, emails, SMS, or hiring outreach are
   created.
5. Verification commands are easy to find.

### Flow 3: Recruiter Clicks Deployed Demo

1. README includes one public demo link if deployment is already available and
   returns HTTP 200.
2. Demo uses static/mock-only demo mode by default.
3. Demo requires no credentials beyond obvious demo buttons.
4. Demo copy does not imply live marketplace activity.
5. If no deployment exists yet, README says "Local demo available" rather than
   presenting a dead or placeholder link.

### Flow 4: Owner Keeps Product Strategy Private

1. Sensitive PRDs/runbooks/control files are moved out of the public repo or
   replaced with safe stubs.
2. Public README may include shipped engineering highlights only, such as
   lifecycle states already visible in the demo, Playwright coverage, and the
   Supabase adapter pattern.
3. Public docs do not include:
   - scheduler dry-run/backfill procedure,
   - reminder idempotency keys,
   - payment/ledger/reconciliation rules,
   - future phase sequencing,
   - detailed database designs for unlaunched features,
   - private notes paths.
4. Private notes preserve the removed details.

### Flow 5: GitHub Remote Cleanup

1. Implementation identifies remote branches with commits touching `docs/prd/`,
   `docs/runbooks/`, `CONTROL/`, or diffs containing private local paths.
2. Implementation prepares a cleanup report for the user listing branch name,
   sensitivity reason, merge state, and recommended action.
3. The cleanup report is not committed to the public repo.
4. Branch cleanup is listed for explicit approval.
5. Branches are deleted only after the user explicitly approves deletion.
6. If branch deletion is approved, implementation records which branches were
   deleted in the final response and confirms the remaining public branch list.
7. No force-push, history rewrite, cache purge request, or visibility change
   happens unless the user explicitly requests that more aggressive cleanup.

Important caveat:

Deleting a branch does not remove content from Git history, GitHub caches, or
forks. Historical commits may remain fetchable by SHA. Full historical removal is
a separate explicit-approval task involving history rewrite, GitHub support/cache
purge requests, and fork/audit review.

## Public / Private Content Policy

### Keep Public

- `src/` application code.
- `tests/` Playwright specs that demonstrate quality.
- `supabase/migrations/` and `supabase/functions/` as engineering evidence.
  Default for this PRD: keep them public, then audit comments/copy for
  overclaims.
- `README.md`, `CONTRIBUTING.md`, `.env.example`, `.gitignore`, package/build
  config files.
- Safe screenshots/GIFs under a public assets folder.
- High-level architecture notes that describe patterns without exposing future
  launch strategy.

### Move Private Or Replace With Safe Stub

- `docs/prd/*.md`.
- `docs/runbooks/*.md`.
- `CONTROL/*.md` pointer files. Default action: delete the committed pointer
  files from the public tree and add `CONTROL/` to `.gitignore`.
- Any docs that reference private Obsidian paths, local AI-control state,
  payment/ledger/reconciliation wiki guidance, scheduler/backfill operations,
  or unshipped roadmap sequencing.

### Explicit Approval Required

- Deleting remote branches.
- Making the repository private.
- Creating a separate public showcase repo.
- Rewriting Git history.
- Removing Supabase migrations or edge functions from the public repo.
- Publishing a live demo.

## README Requirements

The public README should include:

- Short product summary.
- Screenshot or GIF section.
- Demo flow with exact routes and demo buttons.
- "What this demonstrates" engineering highlights.
- Tech stack.
- Local setup.
- Verification commands.
- Clear demo boundaries.
- Optional deployed demo link.
- License/status note.

Forbidden public README phrases unless they are strictly scoped to demo-safe
truth:

- `production-ready`
- `live marketplace`
- `scheduled reminders are live`
- `email sent`
- `SMS sent`
- `Stripe integration` as a live feature claim
- `reconciliation`
- `backfill`
- `idempotency keys`
- private local paths such as `C:\Users\`

The public README should remove or reduce:

- Internal compatibility route lists.
- Deep future backend roadmap.
- Claims that sound like production operations.
- Payment/SMS readiness language that appears more complete than it is.

## Screenshot / Demo Asset Requirements

Minimum asset set:

- `docs/assets/landing.png` or `docs/assets/browse-jobs.png`.
- `docs/assets/hiring-dashboard.png`.
- `docs/assets/worker-dashboard.png`.
- Optional short GIF or video of browse -> demo login -> dashboard.

Assets should:

- use seeded/mock data only,
- avoid showing private paths, terminal output, API keys, or real accounts,
- keep individual PNGs under 300 KB when practical,
- keep total committed showcase image assets under 1 MB unless the user approves
  larger assets,
- be referenced from README with relative paths.

## License / Visibility Requirements

The public repo should add `LICENSE` with all-rights-reserved portfolio review
language. A standard open-source license is out of scope unless the user
explicitly chooses it later.

Repository visibility decision:

- If the owner wants maximum recruiter convenience, keep a sanitized public repo.
- If launch risk becomes more important, make the full repo private and create a
  separate public case-study repo or portfolio page.

## UX States

This PRD is mostly repo/docs work, but implementation should define these
states for the public-facing showcase:

- **No deployed demo yet**: README points to local setup only.
- **Screenshots unavailable**: README can ship without images, but the PR should
  list screenshots as a follow-up rather than using broken image links.
- **Sensitive docs moved**: README uses safe stubs or shipped engineering
  highlights, not future roadmap language.
- **Remote branches still public**: final report lists branches that still need
  explicit deletion approval.
- **License file**: implementation adds an all-rights-reserved portfolio review
  license unless the user explicitly chooses an open-source license.

## Safe Stub Format

When replacing sensitive public docs with stubs:

- Keep the original filename when links may exist.
- Keep the stub under 10 lines.
- Include only:
  - public title,
  - one short paragraph explaining the demo-safe purpose,
  - one sentence that detailed planning notes are kept privately.
- Do not include:
  - roadmap sequencing,
  - scheduler/backfill instructions,
  - idempotency keys,
  - payment/ledger/reconciliation rules,
  - private notes paths,
  - future feature names not already visible in the demo UI.

`docs/prd/public-portfolio-hardening.md` should not remain in full form in the
final public repo. Default implementation choice: replace this PRD with a safe
stub or move it private in the same hardening PR.

## Verification Requirements

Implementation should verify:

- `npm run lint` passes.
- `npm run build` passes.
- `npm run test:e2e` passes unless changes are docs/assets only and the reason
  is recorded.
- README image links render locally or through GitHub-compatible relative paths.
- If README includes a deployed demo URL, the URL returns HTTP 200.
- Tracked files do not contain private local paths:
  - search for `C:\Users\`,
  - search for `Obsidian`,
  - search for `CONTROL/`,
  - search for known private note pointer names.
- Search hits are review prompts, not automatic failures. The implementation
  should remove true private-path/control-note leaks and explain any benign hits.
- `.env.example` contains placeholder values only.
- `LICENSE` exists.
- Total committed showcase image assets are under the agreed limit or the final
  report calls out the exception.

## Acceptance Criteria

- PRD identifies public, private, and explicit-approval content classes.
- PRD does not require new app features.
- PRD does not require backend, scheduler, email/SMS, payment, ledger,
  reconciliation, or schema changes.
- Implementation can be done as a public-showcase docs cleanup PR.
- README requirements are specific enough to implement without inventing product
  direction.
- Sensitive docs policy covers merged PRDs, pending PRDs/runbooks, `CONTROL/`,
  and public remote branches.
- Destructive GitHub operations are explicitly separated from normal file edits.
- Public demo claims remain truthful and demo-safe.
- Supabase migrations/functions stay public by default unless the user approves
  a stricter private-product posture.
- Sensitive docs are deleted, moved private, or replaced with safe stubs.
- `CONTROL/` pointer files are removed from the public tree and `CONTROL/` is
  added to `.gitignore`.
- `LICENSE` exists with all-rights-reserved portfolio review language unless the
  user explicitly chooses another license.
- README includes no broken image links and no dead deployed-demo URL.
- Tracked files contain no private local path references such as `C:\Users\`.
- The hardening PRD itself is not left public in full form after implementation.

## Success Metrics

Portfolio outcomes:

- A recruiter can understand the project in under two minutes from the README.
- README includes at least three visual assets or a clearly tracked follow-up if
  screenshots are deferred.
- The repo no longer exposes detailed future-product PRDs or runbooks on the
  default public branch.
- Public copy clearly says demo/mock mode creates no real accounts, payments,
  messages, emails, SMS, or hiring outreach.

Risk reduction outcomes:

- No private local paths remain in committed public docs.
- No detailed payment/ledger/reconciliation strategy remains in public docs.
- No scheduler/backfill operational runbook remains in public docs.
- Public remote branches with sensitive PRDs are identified and gated for
  explicit cleanup approval.

## Open Questions

- Should the repo remain public after sanitization, or should the public surface
  become a separate case-study repo/page?
- Which screenshots should be the canonical public assets?
- Is there an existing deployed demo URL, or should deployment be a later PR?

These questions do not block drafting the public hardening plan. Implementation
must stop before actions that require the answers.

## Review Score

Self-score before Claude review:

| Dimension | Score |
|---|---:|
| Problem clarity | 9 |
| Goal clarity | 9 |
| User flows | 9 |
| Acceptance criteria | 9 |
| Implementation readiness | 9 |
| Design-loop readiness | 9 |
| Backend truthfulness | 9 |
| Non-technical user friendliness | 9 |
| Scope discipline | 9 |
| **Overall** | 9.1 |

Claude read-only second review passed on 2026-05-14 with no blocking findings.
Minor non-blocking notes covered search-term noise, screenshot fallback, and
final cleanup reporting.

Ready status: passes the PRD gate with no category below 8, no blocking open
questions for a public-showcase cleanup PR, and no unsupported backend,
payment, scheduler, email/SMS, or destructive GitHub operation claims.
