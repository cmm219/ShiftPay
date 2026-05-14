---
title: Posting Lifecycle Scheduler Runbook and Dry-Run Operations
status: ready
date: 2026-05-14
owner: Codex
product_surface: Supabase lifecycle scheduler, posting reminders, operations runbook, QA handoff
---

# Posting Lifecycle Scheduler Runbook and Dry-Run Operations

## Current State

ShiftPay now has a merged Phase 2A durable lifecycle baseline:

- `supabase/migrations/009_posting_lifecycle.sql` adds lifecycle fields for `openings` and `shifts`.
- `openings.expires_at`, `renewed_at`, `closed_at`, `reposted_from_id`, and `lifecycle_version` support long-term job lifecycle state.
- `shifts.closed_at` and `reposted_from_id` support event-shift close/repost lineage.
- `posting_reminders` stores durable in-app reminder records for lifecycle events.
- `renew_opening`, `close_opening`, `close_shift`, and `dismiss_posting_reminder` are owner-only RPCs.
- `generate_posting_lifecycle_reminders(p_dry_run boolean default true)` can report or create in-app hiring-team reminder rows.
- Worker-facing Supabase browse queries are active-only.
- The hiring dashboard can read backend management-state postings and durable in-app reminders when Supabase is configured.

What does not exist yet:

- No documented operator runbook for applying migration `009`.
- No documented first-run dry-run/backfill sequence.
- No agreed manual trigger checklist for `generate_posting_lifecycle_reminders`.
- No scheduler deployment choice has been made.
- No test checklist exists for reminder idempotency after renewal.
- No email, SMS, payment, Stripe, invoice, payout, or ledger work is in scope.

## Problem

The lifecycle database support is implemented, but operating it safely requires a small runbook and verification layer before anyone should enable recurring reminder generation.

Without this PRD, a future implementation pass could accidentally:

- run the reminder generator without a dry-run baseline,
- create duplicate or stale reminder rows,
- skip migration/backfill verification,
- make unsupported claims about automated scheduling,
- blur lifecycle reminders into email/SMS or payment work.

## Goals

- Define the minimum operations work needed to make Phase 2A lifecycle reminders safe to run.
- Produce a runbook that a future `prd-ship-loop` can implement without inventing product decisions.
- Keep the first scheduler rollout dry-run and in-app only.
- Add verification around reminder idempotency, lifecycle version behavior, and active-only visibility.
- Preserve portfolio/demo truthfulness until a real scheduled job is configured and verified.

## Non-Goals

- Do not add email delivery.
- Do not add SMS delivery.
- Do not modify payment, Stripe, subscription, invoice, payout, accounting, ledger, or reconciliation behavior.
- Do not add worker saved-job reminders.
- Do not add multi-owner company notification fan-out.
- Do not rename `restaurants`, `openings`, or `shifts`.
- Do not create real users, real hiring outreach, or live marketplace notifications.

## Product Vocabulary

- **Lifecycle Scheduler**: The recurring or manually triggered process that calls `generate_posting_lifecycle_reminders`.
- **Dry Run**: A call with `p_dry_run = true` that reports candidate counts and inserts zero reminder rows.
- **Backfill Run**: The first intentional write run with `p_dry_run = false` after a dry-run report is reviewed.
- **Manual Trigger**: A documented SQL/RPC command an operator can run before recurring scheduling exists.
- **Recurring Schedule**: Future hourly or near-hourly automation using Supabase scheduled functions, `pg_cron`, or an external scheduler.
- **Reminder Candidate**: An active long-term opening whose `expires_at` is within a reminder threshold window.
- **Event Shift Candidate**: Out of scope for this PRD. Phase 2A may close or repost event shifts, but this scheduler/runbook PRD creates reminder rows for long-term openings only.
- **Reminder Row**: A `posting_reminders` record with `channel = in_app`.
- **Active Reminder**: A non-dismissed `posting_reminders` row whose `lifecycle_version` matches the parent opening's current `lifecycle_version`.
- **Ship Token**: The current-turn user instruction that explicitly authorizes shipping or enabling a behavior during `prd-ship-loop`, such as "ship it", "merge when green", or "enable the scheduler". Approval of this PRD alone is not approval to enable production recurring scheduling.

## Required Flows

### Flow 1: Operator Applies Lifecycle Migration

1. Operator confirms local `master` includes PR #5 or later.
2. Operator applies Supabase migrations using the repo's Supabase workflow for the target environment. If no project-specific wrapper exists, the runbook should document the standard command as `npx supabase db push` and require the operator to verify the target project before running it.
3. Operator verifies migration `009_posting_lifecycle.sql` is present in the applied migration history.
4. Operator verifies key database objects exist:
   - `openings.expires_at`
   - `openings.lifecycle_version`
   - `shifts.closed_at`
   - `posting_reminders`
   - `generate_posting_lifecycle_reminders`
5. Operator records whether the target environment was local, preview, staging, or production.

### Flow 2: Operator Runs Dry-Run Report

1. Operator runs:
   - `select * from generate_posting_lifecycle_reminders(true);`
2. Operator confirms `inserted_count = 0` for every returned threshold.
3. Operator captures candidate counts by threshold:
   - `7_day`
   - `3_day`
   - `24_hour`
   - `expired`
4. Operator counts existing non-dismissed in-app reminder rows:
   - `select threshold, channel, status, count(*) from posting_reminders where status <> 'dismissed' group by threshold, channel, status order by threshold, channel, status;`
5. Operator does not run the write path if counts are surprising or unexplained.
6. Treat any threshold count above roughly 10% of total active long-term openings, or any unexpectedly large `expired` count, as surprising until explained.

### Flow 3: Operator Runs First Backfill

1. Operator confirms dry-run candidate counts look reasonable.
2. Operator runs:
   - `select * from generate_posting_lifecycle_reminders(false);`
3. Operator verifies inserted counts are less than or equal to dry-run candidate counts.
4. Operator verifies hiring dashboard can read the new in-app reminders.

### Flow 4: Operator Runs Idempotency Probe

1. After the first backfill succeeds, operator reruns:
   - `select * from generate_posting_lifecycle_reminders(false);`
2. The second write run must insert zero additional rows for the same threshold/version set.
3. If additional rows are inserted unexpectedly, operator stops before enabling any recurring schedule.

### Flow 5: Opening Is Renewed After Reminder Creation

1. Hiring team renews an active/expiring opening.
2. `renew_opening` increments `lifecycle_version`.
3. Existing reminder rows for the old lifecycle version remain historical.
4. Future scheduler runs create reminders only for the new lifecycle version when thresholds apply.
5. Old-version queued rows must not appear as active reminders for the renewed posting.
6. Hiring dashboard active reminder reads must filter reminders by `posting_reminders.lifecycle_version = openings.lifecycle_version`.
7. Stale reminder rows remain queryable for audit/debugging but are hidden from the active reminder list.

### Flow 6: Recurring Scheduler Is Documented But Not Enabled By Default

1. PR adds a runbook section for future hourly scheduling.
2. PR names supported scheduling options:
   - Supabase scheduled functions,
   - `pg_cron`,
   - external scheduled job runner.
3. PR does not enable recurring production scheduling unless the current ship token explicitly says to enable it.
4. PR includes a manual trigger path that works before recurring scheduling exists.

## Backend And Operations Requirements

### Runbook Requirements

Create a runbook at one of:

- `docs/runbooks/posting-lifecycle-scheduler.md`
- or `docs/ops/posting-lifecycle-scheduler.md` if an ops folder is introduced.

The runbook must include:

- migration apply checklist,
- dry-run SQL,
- first backfill SQL,
- idempotency verification SQL,
- dashboard smoke checklist,
- rollback/stop guidance for unexpected counts,
- note that email/SMS/payment/ledger work is out of scope.

### Function Reference Requirements

The runbook must define the reminder generator contract instead of requiring readers to inspect SQL:

- Function: `generate_posting_lifecycle_reminders(p_dry_run boolean default true)`
- Return columns:
  - `threshold posting_reminder_threshold`
  - `candidate_count integer`
  - `inserted_count integer`
- Dry-run semantics:
  - `p_dry_run = true` reports candidates and always inserts zero rows.
- Write semantics:
  - `p_dry_run = false` inserts in-app hiring-team reminder rows for active long-term openings only.
  - Duplicate writes are prevented by the existing unique key on `posting_type`, `posting_id`, `recipient_profile_id`, `threshold`, `channel`, and `lifecycle_version`.

### Dashboard Smoke Checklist

The runbook must include this browser smoke checklist:

- Open `/login` and sign in as a hiring team in the target environment.
- Open `/dashboard/hiring`.
- Confirm the dashboard loads without browser console errors.
- Confirm `Needs attention` renders without crashing when reminder rows exist and when no reminders exist.
- Confirm reminder rows are in-app only and no UI says email or SMS was sent.
- Confirm renewed openings do not show stale reminder rows from older lifecycle versions.

### Test Requirements

Add the narrowest tests the repo can support without requiring a live Supabase instance.

Minimum expected coverage:

- SQL migration contains `generate_posting_lifecycle_reminders(p_dry_run BOOLEAN DEFAULT TRUE)`.
- SQL migration keeps client insert/delete policies for `posting_reminders` denied.
- SQL migration keeps the unique reminder key:
  `posting_type`, `posting_id`, `recipient_profile_id`, `threshold`, `channel`, `lifecycle_version`.
- Active reminder reads filter stale reminders by current opening `lifecycle_version`, or the runbook explicitly documents the query/view that does so.
- Frontend/dashboard copy does not claim email/SMS reminders are live.
- Existing lifecycle E2E still passes, especially `tests/posting-lifecycle.spec.js` coverage for hiring-team attention items, renewal, and expired event-shift repost prefills.

If a local Supabase test harness exists later, add integration checks for:

- dry run inserts zero rows,
- write run is idempotent,
- renewal increments `lifecycle_version`,
- old-version reminders do not duplicate new-version reminders.

### Scheduler Requirements

This PRD recommends manual trigger and runbook first.

Recurring scheduling may be documented but should remain disabled unless explicitly approved during the shipping loop. If enabled in a later PR, the schedule should be at least hourly and must run the same idempotent function.

Do not deploy or enable production cron without a documented dry-run result, a clean first backfill, a clean idempotency probe, and an explicit ship token for enabling recurring scheduling.

### Truthfulness Constraints

- The app can say lifecycle reminder records exist only when Supabase mode has migration `009` applied.
- The app cannot say "scheduled reminders are live" until recurring scheduling is actually enabled and smoke-tested.
- The app cannot say "email sent" or "SMS sent" in this scope.
- Demo mode remains seeded/local and must not imply real outreach.

## UX Requirements

This PRD is primarily operational. No major UI redesign is required.

Allowed UI/copy changes:

- Small hiring-dashboard copy clarifying that reminders are in-app only.
- Developer-facing or README copy explaining how to run a dry-run.
- Optional admin/developer-only command documentation.

Not allowed:

- New visible email/SMS preference controls.
- New billing/payment controls.
- New worker saved-job UI.
- Marketing copy claiming live scheduled outreach.

## UX States

- **Dry-run clean**: operator sees threshold rows with candidate counts and zero inserted rows.
- **Backfill clean**: first write inserts expected rows and the separate idempotency probe inserts zero duplicates.
- **Unexpected counts**: operator stops and investigates before writing.
- **Dashboard smoke pass**: hiring dashboard loads and shows in-app reminders without console errors.
- **No candidates**: dry-run returns no rows or zero counts; operator documents that no reminders were due.
- **Recurring disabled**: runbook clearly states manual trigger is the current operational path.

## Acceptance Criteria

- PRD clearly scopes the next implementation to scheduler/runbook operations only.
- Runbook location and content requirements are defined.
- Reminder generator return shape and dry-run/write semantics are defined.
- First-run dry-run and backfill sequence is explicit.
- Idempotency verification is explicit.
- Active reminder filtering by current `lifecycle_version` is explicit.
- Renewal/lifecycle-version behavior is verified or covered by a clear follow-up test path.
- Recurring scheduler is documented but not enabled without explicit ship approval.
- No email/SMS/payment/ledger/Stripe behavior is added.
- Existing lifecycle E2E remains required.
- Dashboard browser smoke remains required for any frontend copy change.
- The resulting PR can be shipped by `prd-ship-loop` without needing new product decisions.

## Success Metrics

- Operators can apply migration `009` and run a dry-run from the runbook without asking for missing commands.
- Dry-run reports insert zero rows.
- Immediate rerun after first backfill inserts zero duplicate rows.
- No user-facing copy claims unsupported external delivery.

## Open Questions

- Should the first implementation PR include only docs/tests, or also a small npm script that prints the dry-run SQL? Recommended answer: docs/tests only unless the ship loop finds an existing script pattern.
- Should disabled recurring-scheduler SQL be documented in the runbook or added as a commented example? Recommended answer: document only; leave enabling recurring scheduling to a separate PR with an explicit ship token.

These do not block the runbook-first PR as long as recurring scheduling remains disabled.

## Review Score

Claude read-only review failed the first draft at 7.5 overall because active reminder filtering, function return shape, migration apply commands, event-shift scope, and the dashboard smoke checklist were under-specified. The revised PRD addressed those gaps and passed second review.

| Dimension | Score |
|---|---:|
| Problem clarity | 9 |
| Goal clarity | 9 |
| User flows | 9 |
| Acceptance criteria | 9 |
| Implementation readiness | 9 |
| Design-loop readiness | 8 |
| Backend truthfulness | 10 |
| Non-technical user friendliness | 8 |
| Scope discipline | 10 |
| **Overall** | 9 |

Ready status: passes the PRD gate with no category below 8, no blocking open questions for the runbook-first PR, and no unsupported email/SMS/payment/ledger claims. Ready for `prd-ship-loop`.
