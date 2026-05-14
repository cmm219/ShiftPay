---
title: Worker Saved Jobs and Expiring Job Reminders
status: ready
date: 2026-05-14
owner: Codex
product_surface: Worker browse, job detail, worker dashboard, saved jobs, reminder readiness
---

# Worker Saved Jobs and Expiring Job Reminders

## Current State

ShiftPay is a jobs-first hospitality hiring marketplace portfolio MVP.

Current worker-facing behavior:

- `/browse` lets workers browse active workers and jobs using mock data or Supabase-backed API fallbacks.
- Long-term jobs/openings are the primary worker opportunity surface.
- Event shifts are still supported, but they are secondary and more appropriate for banquet, catering, pop-up, and one-off coverage.
- `/jobs/:id` shows a job/event detail page and currently has stronger claim behavior for event shifts than for long-term job applications.
- `/dashboard/worker` shows profile and work-related demo content, but it does not have a saved-jobs list.
- There is no saved-job table, no saved-job local demo state, and no worker-specific job reminder preference.
- Phase 2A lifecycle work introduced durable hiring-team posting reminders. Worker reminder rows are intentionally blocked until explicit worker intent via saved jobs exists. Generic match-based opt-in is out of scope for this PRD.
- Email, SMS, payment, Stripe, ledger, payout, invoice, and reconciliation work are out of scope for this PRD.

Current product constraint:

Worker-facing reminders must not be created for generic matches. A worker should only receive an expiry reminder for a job they explicitly saved or opted into.

## Problem

Workers need a low-commitment way to keep track of long-term jobs they may want to revisit. Hiring teams already have lifecycle reminders for expiring postings, but workers have no equivalent intent signal.

Without saved jobs, ShiftPay cannot truthfully add worker-side job expiry reminders. Sending reminders for generic matches would feel noisy, untrusted, and unsupported by the current product model.

## Goals

- Add a clear product requirement for workers to save and unsave long-term jobs.
- Make saved long-term jobs visible from the worker dashboard.
- Define in-app expiry reminders for saved jobs only.
- Reuse the existing hiring-team posting reminder thresholds for saved-job expiry.
- Keep the product focused on long-term jobs first, not individual event shifts.
- Preserve truthful demo and backend claims: no external delivery until provider-backed preferences and delivery exist.
- Provide implementation-ready requirements for a later frontend/backend slice without starting that work in this PRD.

## Non-Goals

- Do not implement saved jobs in this PRD.
- Do not add email, SMS, push notifications, or provider delivery.
- Do not send reminders for generic matched jobs.
- Do not implement opt-in match-based worker reminders.
- Do not add applications, interview scheduling, messaging, or hiring-team outreach.
- Do not redesign worker onboarding.
- Do not add payment, subscriptions, posting credits, ledger writes, reconciliation, invoices, payouts, or Stripe behavior.
- Do not make event shifts the primary saved-item flow.
- Do not introduce new reminder thresholds beyond the existing posting lifecycle threshold set.
- Do not replace hiring-team posting lifecycle reminders.

## Product Vocabulary

- **Saved Job**: A long-term job/opening a worker intentionally saves for later.
- **Saved Job Reminder**: An in-app reminder that a saved long-term job is expiring soon or has expired.
- **Worker Intent Signal**: An explicit worker action such as saving a job. This PRD does not treat passive browsing as intent.
- **Long-Term Job / Opening**: Primary hiring object in ShiftPay; not tied to one event date.
- **Event Shift**: Date/time-specific short-term opportunity. Secondary use case and not part of saved-job reminders in the first slice.
- **Unavailable Saved Job**: A saved job that expired, closed, or is no longer active.
- **Reminder Channel**: In this PRD, in-app only. Email/SMS are future phases.
- **Reminder Threshold**: A discrete lifecycle window that produces at most one reminder per saved job, channel, and lifecycle version. Saved-job expiry reuses the hiring-team posting reminder thresholds: `7_day`, `3_day`, `24_hour`, and `expired`.
- **Lifecycle Version**: Integer on an opening that starts at `1` and increments when the hiring team renews that opening. Reminder reads must ignore rows from older lifecycle versions after renewal.

## Product Decision

The first saved-jobs slice should support **long-term jobs only**.

Rationale:

- The main product should target jobs, not individual shifts.
- Long-term jobs benefit from a save-for-later workflow.
- Event shifts are time-sensitive and already have claim/availability dynamics that need separate rules.
- Worker reminder trust depends on explicit saved-job intent.

Event-shift saves may be revisited later, but this PRD should not require them.

## Required Flows

### Flow 1: Worker Saves A Long-Term Job

1. Worker browses active jobs on `/browse` or opens `/jobs/:id`.
2. Worker sees a `Save job` action on long-term job cards and job details.
3. If signed in as a worker, clicking `Save job` stores the saved-job relationship.
4. UI confirms the saved state with copy like `Saved`.
5. The same job now appears in the worker dashboard saved-jobs area.
6. Re-clicking the action unsaves the job after a clear state change.

Guest behavior:

- Guests see the save action, but clicking it routes to `/login` with a return target for the job.
- After successful sign-in as a worker, the save should complete automatically and return the worker to the job detail or saved state.
- Guest saves do not silently create durable saved-job records.

Hiring-team behavior:

- Hiring-team accounts should not be able to save jobs as workers from the hiring account context.
- Dual-role users, if supported later, see the save action only while acting in worker context. In hiring-team context, the save action is hidden.

### Flow 2: Worker Reviews Saved Jobs

1. Worker signs in.
2. Worker opens `/dashboard/worker`.
3. Dashboard shows a `Saved jobs` section.
4. Saved jobs are grouped or labeled by state:
   - active,
   - expiring soon,
   - unavailable.
5. Each saved job card shows:
   - role,
   - company,
   - city,
   - pay range or hourly rate when available,
   - expiration state when relevant,
   - primary action to view the job,
   - secondary action to remove from saved jobs.
6. Empty state says the worker has not saved jobs yet and links back to browsing jobs.

### Flow 3: Saved Job Becomes Expiring Soon

1. A saved long-term job enters an expiring-soon lifecycle state.
2. Worker dashboard shows an in-app saved-job reminder.
3. Reminder copy is informational, not pressure-based:
   - `Saved job expires soon`
   - `This job may close in 3 days. Review it if you're still interested.`
4. Reminder links to the job detail page if the job is still active.
5. Reminder appears inline on the affected saved-job card inside the worker dashboard `Saved jobs` section.
6. Reminder is materialized as a row keyed by worker, opening, threshold, channel, and lifecycle version.
7. Dismissal sets dismissed state on that row.
8. Dismissing one threshold does not suppress later thresholds. For example, dismissing `7_day` still allows `3_day`, `24_hour`, and `expired` reminders.
9. Dismissing a reminder does not unsave the job.

### Flow 4: Saved Job Expires Or Closes

1. A saved long-term job expires or is closed by the hiring team.
2. Worker dashboard moves it to an unavailable state.
3. Job detail clearly says the job is no longer active.
4. Worker can remove it from saved jobs.
5. Worker is not promised that the company will repost or contact them.
6. If a matching replacement or repost lineage exists in a later phase, the UI may suggest it, but that is not required here.

### Flow 5: Backend Creates Worker Reminder Rows, Future Live-Service Slice

1. Scheduler or backend reminder generator identifies saved active long-term jobs within threshold windows.
2. Thresholds reuse the existing posting lifecycle values: `7_day`, `3_day`, `24_hour`, and `expired`.
3. It creates in-app worker reminder rows only where an active `saved_jobs` relationship exists.
4. It does not create worker rows for generic browse matches or opt-in matching.
5. Reminder uniqueness includes worker, posting, threshold, channel, and lifecycle version.
6. Existing stale reminder rows from older lifecycle versions are ignored in active dashboard reads.
7. When a hiring-team renewal increments the opening lifecycle version, saved-job reminders may be created again for the new lifecycle version as thresholds apply.
8. Email/SMS delivery remains disabled unless a later PRD implements preferences and provider-backed delivery.

## Backend And Data Requirements

### Demo/Frontend Slice

A demo-first implementation may use local state before backend persistence if copy is truthful.

Allowed demo state:

- saved opening IDs keyed by demo worker profile,
- dismissed saved-job reminder IDs or keys,
- computed lifecycle state from existing opening lifecycle helpers.

Demo copy must not imply:

- saves are visible to hiring teams,
- reminders are sent externally,
- unavailable jobs create automatic contact,
- backend scheduling is live.

### Future Supabase Shape

For saved jobs:

- `saved_jobs`
  - `id uuid primary key`
  - `worker_profile_id uuid not null`
  - `opening_id uuid not null`
  - `created_at timestamptz not null default now()`
  - `removed_at timestamptz null` if soft-delete history is needed
  - unique active key on `worker_profile_id`, `opening_id`

For worker saved-job reminders:

- Reuse or extend `posting_reminders` only if it can safely represent worker recipients.
- Add or require a reminder type that distinguishes saved-job expiry from hiring-team posting expiry:
  - `reminder_type = 'saved_job_expiry'` for worker saved-job reminders.
  - Existing hiring-team posting lifecycle rows remain separate as posting-expiry reminders.
- Worker saved-job reminder rows use:
  - `recipient_role = 'worker'`
  - `posting_type = 'opening'`
  - `posting_id = opening_id`
  - `recipient_profile_id = worker_profile_id`
  - `channel = 'in_app'`
  - `reminder_type = 'saved_job_expiry'`
  - `lifecycle_version` must match the opening lifecycle version

Worker reminder rows must not be generated until saved jobs exist.

### API / RPC Requirements

Future backend implementation should provide:

- `save_opening(opening_id)`
  - worker-only,
  - active long-term openings only, using the active opening rules from the live-service lifecycle PRD,
  - idempotent if already saved.
  - returns a clear error if the opening is expired, closed, or not saveable.
- `unsave_opening(opening_id)`
  - worker-only,
  - removes or soft-removes the saved job.
- `list_saved_openings()`
  - worker-only,
  - returns saved jobs with current lifecycle state.
- `dismiss_saved_job_reminder(reminder_id)`
  - worker-only,
  - dismisses only that reminder row for that worker.

Security requirements:

- A worker can only read and mutate their own saved jobs.
- Hiring teams cannot read a worker's saved jobs unless a later product decision explicitly exposes interest signals.
- Public APIs must not leak who saved a job.

## UX Requirements

### Browse

- Long-term job cards show a save/unsave control.
- The control is visually secondary to the primary job exploration action.
- Saved state should be obvious without making the card feel like a completed application.
- Event shift cards do not need save controls in the first slice.

### Job Detail

- Long-term jobs show a `Save job` / `Saved` action.
- On expired or closed jobs, the save control is replaced with a non-interactive `No longer active` label.
- If an already-saved job later becomes unavailable, detail page shows unavailable state and lets the worker remove it.

### Worker Dashboard

- Add a `Saved jobs` section.
- The section should work with zero saved jobs, one saved job, and many saved jobs.
- Saved-job expiry reminders appear inline on the relevant saved-job card, not in a separate notification center.
- Expiring saved jobs should be easy to scan without looking like emergency alerts.
- Unavailable saved jobs should be clearly separated from active saved jobs.

### Copy Guidelines

- Use `job`, `saved job`, `expires`, and `no longer active`.
- Do not use `shift` for the primary saved-job flow.
- Do not use `applied`, `application sent`, `message sent`, or `company notified` unless those systems exist.
- Do not say `email sent`, `SMS sent`, or `notification delivered` unless external delivery is implemented and verified.

## UX States

- **Loading**: saved jobs section uses existing dashboard loading patterns.
- **Empty**: `No saved jobs yet. Browse jobs to keep track of roles you want to revisit.`
- **Saved Success**: `Job saved.`
- **Unsaved Success**: `Removed from saved jobs.`
- **Already Unavailable**: `This saved job is no longer active.`
- **Save Error**: `Could not save this job. Try again.`
- **No Auth**: `Sign in as a worker to save jobs.`
- **Wrong Role**: `Only worker accounts can save jobs.`

## Mobile Requirements

- Save controls must fit job cards at 375px width.
- Saved jobs dashboard cards stack in one column on mobile.
- Long role/company names must wrap without overlapping buttons.
- The saved/unsaved control must remain reachable by touch without horizontal scrolling.

## Acceptance Criteria

- PRD keeps long-term jobs/openings as the first saved-item target.
- Event-shift saves are explicitly out of scope for the first slice.
- Worker reminders require saved-job intent and are not created for generic matches.
- Opt-in match-based worker reminders are explicitly deferred to a future PRD.
- Saved-job reminder thresholds reuse `7_day`, `3_day`, `24_hour`, and `expired`.
- Reminder dismissal is per worker, opening, threshold, channel, and lifecycle version.
- Dismissing one threshold does not suppress later thresholds for the same saved job.
- Guest save attempts route through sign-in and resume the save after successful worker auth.
- Dual-role users only see the save control in worker context.
- Saved jobs are private to the worker by default.
- Worker dashboard has defined active, expiring, unavailable, loading, empty, and error states.
- Demo implementation may use local state only if copy is truthful.
- Backend implementation defines worker-only save/unsave/list/dismiss capabilities.
- Reminder rows for workers are blocked until saved jobs exist.
- Email/SMS delivery remains out of scope and hidden unless a later PRD implements preferences and providers.
- No payment, ledger, reconciliation, Stripe, invoice, payout, or subscription behavior is changed.

## Success Metrics

Portfolio/demo:

- Reviewers can understand how workers track long-term jobs without backend setup.
- Demo copy does not imply external reminders or hiring-team contact.
- Saved jobs make the worker dashboard feel more complete and credible.

Future production:

- Percentage of signed-in workers saving at least one long-term job.
- Return visits to saved jobs before expiration.
- Worker clicks on unavailable jobs trend down after expiry labeling is added.
- Dismissed saved-job reminders do not reappear for the same threshold/lifecycle version.

## Open Questions

- Should saved jobs ever be visible to hiring teams as an interest signal?
- Should event shifts get a separate `watch shift` concept later, or should they stay claim-first?
- Should workers be able to add notes to saved jobs?
- Should saved jobs survive if a worker changes city/role preferences?
- Should email reminders for saved jobs be opt-in per worker, per channel, or per reminder type?
- Should a prior dismissal survive an unsave/resave cycle for the same opening and lifecycle version, or reset on resave?

None of these block a first saved-jobs PRD or a demo-only implementation.

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
| Backend truthfulness | 10 |
| Non-technical user friendliness | 9 |
| Scope discipline | 9 |
| **Overall** | 9.2 |

Claude read-only second review passed on 2026-05-14 with no blocking findings.
Minor non-blocking notes covered renewal re-arming, resave-after-dismissal,
future quota limits, and demo key shape.

Ready status: passes the PRD gate with no category below 8, no blocking open
questions for the first saved-jobs slice, and no unsupported email/SMS/payment
or generic-match reminder claims.
