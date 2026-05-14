---
title: Live-Service Readiness for Posting Lifecycle and Reminders
status: ready
date: 2026-05-14
owner: Codex
product_surface: Hiring dashboard, worker browse, posting lifecycle, reminders, backend readiness
---

# Live-Service Readiness for Posting Lifecycle and Reminders

## Current State

ShiftPay is a portfolio MVP with a jobs-first hiring flow:

- Long-term jobs/openings are the primary hiring object.
- One-time event shifts remain supported for banquet, catering, pop-up, and event coverage.
- `/dashboard/hiring` shows local demo lifecycle states for expiring jobs, expired jobs, and expired event shifts.
- `/post-job` supports long-term jobs and event shifts.
- `/browse` hides expired and closed demo postings.
- Demo sign-in uses local seeded data and does not create real users, outreach, reminders, messages, or payments.

The current backend shape is Supabase-ready but not live-service complete:

- Existing tables include `restaurants`, `openings`, `shifts`, `workers`, `profiles`, `reviews`, `subscriptions`, `invoices`, and `sms_send_log`.
- Existing RPCs support shift claiming and shift creation.
- Existing edge functions include Stripe checkout/webhook support and a worker SMS function for matching workers to a posted shift.
- There is no scheduled lifecycle worker.
- There is no durable posting-reminder table.
- There is no email integration.
- There is no in-app notification center.
- The worker SMS function is not a general reminder service and should not be reused blindly for lifecycle notifications.
- The database schema still uses legacy names like `restaurants` and `shifts`; UI copy and route-level internals now use hiring-team/company/job language where possible.

## Problem

The demo now communicates a credible lifecycle concept, but real production behavior needs durable backend rules before ShiftPay can truthfully claim reminders, posting expiration, or renewal outreach.

The next product decision is whether lifecycle behavior should remain demo-only or graduate into live services. If it graduates, the system must support both sides of the marketplace:

- Hiring teams need reminders before jobs or event shifts disappear, plus a clear renew/repost path.
- Workers need stale jobs hidden and, later, optional notifications for saved or matched jobs that are about to close.

## Goals

- Define the minimum backend-backed lifecycle system needed before claiming real reminders.
- Keep the product jobs-first and hiring-team-first, with event shifts as a secondary posting type.
- Cover hiring-team reminder flows and worker-facing freshness rules.
- Identify the exact data, API, scheduler, and delivery capabilities required.
- Preserve demo truthfulness until live delivery is actually implemented.
- Produce a PRD ready to drive future backend and UI implementation without starting that implementation here.

## Non-Goals

- This PRD does not implement migrations, edge functions, cron jobs, UI changes, or provider integrations.
- This PRD does not choose a paid email/SMS vendor contract.
- This PRD does not redesign the app.
- This PRD does not rename existing database tables.
- This PRD does not add production billing rules for renewals.
- This PRD does not add payment ledgers, payout accounting, reconciliation jobs, Stripe subscription enforcement, or money-moving webhook side effects.
- This PRD does not build two-way messaging between workers and hiring teams.
- This PRD does not claim that reminders are live in the current demo.

## Product Vocabulary

- **Posting**: Generic object for either a long-term job/opening or an event shift.
- **Job / Opening**: Long-term hiring post without a single event date. This is the primary product object.
- **Event Shift**: Date-specific short-term work opportunity with start and end time.
- **Hiring Team**: Company, restaurant, venue, caterer, banquet operator, or hospitality group that posts jobs.
- **Worker**: Candidate or hourly hospitality worker browsing or claiming work.
- **Lifecycle State**: Computed or stored state such as active, expiring soon, expired, or closed.
- **Reminder Event**: Durable record that a reminder was queued, skipped, sent, failed, or dismissed.
- **Reminder Recipient**: In Phase 2A and 2B, the owner profile for the hiring-team/company record at the time the reminder is created. Multi-owner company fan-out is out of scope until account/team membership exists.
- **Delivery Channel**: In-app, email, or SMS.
- **Saved Job**: Worker-tracked job interest. Not currently implemented; required before worker-side expiry reminders.
- **Matched Job**: Job that meets a worker's role/city/preferences. Matching exists only conceptually today.

Database table `restaurants` is the current legacy storage table for the hiring-team/company entity. Renaming that storage model is out of scope for this PRD.

For Phase 2A, the reminder recipient is derived from the current `restaurants.profile_id` owner. If a future account model supports multiple company members, that later model must introduce fan-out rules before creating multiple reminder recipients.

## Recommended Product Decision

Move from demo-only lifecycle behavior to backend-backed lifecycle in staged phases:

1. **Phase 2A: Durable lifecycle state, no external delivery.**
   - Add schema fields and API filters so active/expired/closed behavior is true in Supabase.
   - Add an in-app hiring dashboard reminder surface backed by stored reminder events.
   - Do not send email or SMS yet.

2. **Phase 2B: Email reminders for hiring teams.**
   - Add email delivery only after durable lifecycle events exist.
   - Email is the default external channel for hiring-team posting reminders.

3. **Phase 2C: Worker saved-job reminders and optional SMS.**
   - Add worker saved jobs first.
   - Add worker reminders only for saved jobs or explicit opt-in matches.
   - Keep SMS optional and rate-limited because it is high-trust and higher-risk.

This sequencing keeps the portfolio credible and avoids jumping directly into external messaging before the lifecycle source of truth exists.

## Payment, Ledger, and Reconciliation Guardrail

Posting lifecycle is not payment infrastructure. Before any future work touches paid posting limits, subscription enforcement, worker payouts, invoices, payment ledgers, reconciliation, Stripe webhook side effects, or accounting exports, ShiftPay must run a separate money-system PRD and audit pass using the existing local wiki guidance:

- `money-rule-discipline`
- `reconciliation-patterns`
- `stripe-billing-patterns`
- `rule-versioning-pattern`
- `money-paths-map`

That later PRD must establish:

- the canonical money source of truth before any write path ships,
- idempotency keys for provider calls and ledger writes,
- webhook event persistence and dedupe before side effects,
- outbox or retry semantics for external side effects,
- immutable audit records for every balance-affecting action,
- versioned rules for any computed charge, payout, fee, discount, or posting-credit behavior,
- read-only reconciliation before automatic mutation,
- pre/post state capture for any production data correction,
- backend enforcement for billing/payment rules rather than frontend-only checks,
- separate regression tests for every ledger-write site.

Until that PRD exists, lifecycle implementation must remain limited to posting visibility, expiration, renewal, reposting, close actions, and non-financial reminder state. Renewal can extend a posting window, but it must not charge money, consume posting credits, modify subscription state, or create invoice/payment ledger rows.

## Required Flows

### Flow 1: Hiring Team Views Real Lifecycle State

1. Hiring team signs in.
2. Hiring dashboard loads postings from Supabase.
3. API returns active, expiring soon, expired, closed, and historical states from backend data.
4. Dashboard shows:
   - active jobs,
   - expiring jobs,
   - expired jobs requiring repost,
   - event shifts that have passed,
   - closed postings in history or management context.
5. Worker-facing browse excludes expired and closed postings from Supabase queries, not only frontend filters.

### Flow 2: Hiring Team Renews A Job

1. Hiring team sees an expiring active job.
2. Hiring team clicks `Renew for 30 days`.
3. Backend validates that:
   - the caller owns the company profile,
   - the posting is a long-term job/opening,
   - the posting is active or expiring soon,
   - the posting is not closed or deleted.
4. Backend extends `expires_at` from the later of `now()` and current `expires_at`.
5. Backend writes `renewed_at` and a durable reminder/lifecycle event.
6. UI confirms the new expiration date.
7. No email/SMS claim is shown unless delivery is actually implemented.

### Flow 3: Hiring Team Reposts An Expired Posting

1. Hiring team sees an expired job or event shift.
2. Hiring team chooses `Repost`.
3. UI opens `/post-job` with role, city, pay, and description prefilled.
4. For long-term jobs, backend creates a new active opening with a new expiration window.
5. For event shifts, user must choose a new future date/time.
6. Backend optionally stores `reposted_from_id` for lineage.
7. Original expired posting remains historical.

### Flow 4: Hiring Team Reminder Event Is Created

1. Scheduled lifecycle job runs at least hourly.
2. Job finds active long-term openings where `expires_at` is within reminder threshold windows.
3. Job creates durable reminder events for each threshold once.
4. Recommended thresholds:
   - 7 days before expiration,
   - 3 days before expiration,
   - 24 hours before expiration,
   - at expiration.
5. Reminder events are idempotent by `posting_type`, `posting_id`, `recipient_profile_id`, `threshold`, `channel`, and `lifecycle_version`.
6. Expiring-soon state is computed from timestamp math, not from reminder rows. Reminder rows are delivery/audit records.
7. Phase 2A shows those events in-app only.
8. Phase 2B may deliver email using the same event records.

Event-shift pre-reminders are explicitly deferred. Phase 2A may compute passed/expired event-shift state and show passed event shifts in hiring-team management views, but it does not create 7-day, 3-day, or 24-hour event-shift reminder events.

If a job is created or imported after a threshold has already passed but before expiration, the scheduler should create the nearest still-useful reminder event instead of trying to recreate every missed threshold. On first deploy, the scheduler should run in dry-run/backfill mode first and report how many active postings would receive 7-day, 3-day, 24-hour, or expired reminder events.

### Flow 5: Worker Sees Fresh Jobs Only

1. Worker opens `/browse`.
2. API returns only active jobs and active event shifts.
3. Expired, closed, and passed event shifts are excluded at query level.
4. If all filters remove active jobs, worker sees a no-results state.
5. Worker does not see renewal/repost controls.

### Flow 6: Worker Saved-Job Reminder, Future Phase

1. Worker saves a job.
2. Job enters expiring soon state.
3. System creates an in-app reminder for the saved job.
4. Optional email/SMS is sent only if the worker has opted in.
5. Reminder copy avoids pressure language and clearly says the job may close soon.

This flow is not required before hiring-team lifecycle readiness.

## Backend and Data Requirements

### Schema Additions

For `openings`:

- `created_at timestamptz not null default now()` if not already present.
- `expires_at timestamptz not null`.
- `renewed_at timestamptz null`.
- `closed_at timestamptz null`.
- `reposted_from_id uuid null references openings(id)` optional.
- `lifecycle_version integer not null default 1` for idempotent reminders after renewal.

`lifecycle_version` increments on `renew_opening`. It does not increment on `close_opening`, reminder dismissal, or repost. A repost creates a new posting with `lifecycle_version = 1`. Scheduler and delivery code must ignore queued reminder rows whose lifecycle version is lower than the posting's current lifecycle version.

For `shifts`:

- `closed_at timestamptz null`.
- `reposted_from_id uuid null references shifts(id)` optional.
- Event-shift expiration may be computed from `date` + `end_time`, but production needs timezone handling before that computation is considered reliable.
- Event-shift pre-expiration reminders are not part of Phase 2A.

For `restaurants` or a future company profile table:

- `timezone text null` before production event-shift expiration math.
- Timezone may be defaulted from city for demo imports, but production should allow explicit correction.

For reminders:

- `posting_reminders`
  - `id`
  - `posting_type` enum: `opening`, `shift`
  - `posting_id`
  - `restaurant_id`
  - `recipient_profile_id`
  - `recipient_role` enum: `hiring_team`, `worker`
  - `threshold` enum: `7_day`, `3_day`, `24_hour`, `expired`
  - `channel` enum: `in_app`, `email`, `sms`
  - `status` enum: `queued`, `sent`, `skipped`, `failed`, `dismissed`
  - `scheduled_for`
  - `sent_at`
  - `dismissed_at`
  - `error_message`
  - `lifecycle_version`
  - `created_at`
  - unique key on `posting_type`, `posting_id`, `recipient_profile_id`, `threshold`, `channel`, `lifecycle_version`

`posting_id` is intentionally polymorphic because `posting_type` selects either `openings` or `shifts`. There is no single foreign key. RPCs and scheduled functions that write reminders must enforce ownership and referential integrity.

For Phase 2A, reminder rows must only be created for `recipient_role = hiring_team`. Worker reminder rows must not be created until saved jobs or explicit opt-in matching exists.

For Phase 2B email preferences:

- `notification_preferences`
  - `profile_id`
  - `channel` enum: `email`, `sms`
  - `reminder_type` enum: `posting_lifecycle`, `saved_job_expiry`
  - `enabled boolean`
  - `updated_at`

Email delivery must not ship until preference storage and unsubscribe/preference handling exists.

For future worker saved jobs:

- `saved_jobs`
  - `worker_id`
  - `opening_id`
  - `created_at`
  - unique key on `worker_id`, `opening_id`

### API / RPC Requirements

- `renew_opening(opening_id)`:
  - owner-only,
  - extends expiration by 30 days,
  - increments lifecycle version,
  - does not delete reminder rows,
  - causes scheduler and delivery code to skip stale queued reminders whose version is older than the posting's current version.
- `close_opening(opening_id)`:
  - owner-only,
  - sets `closed_at`,
  - prevents active browse visibility.
- `close_shift(shift_id)`:
  - owner-only,
  - sets `closed_at` for open event shifts.
- `repost_opening(opening_id, payload)`:
  - owner-only,
  - creates a new opening from the user's submitted `/post-job` payload,
  - stores `reposted_from_id` when lineage is enabled,
  - starts the new posting at `lifecycle_version = 1`.
- `list_active_postings(filters)`:
  - returns worker-facing active postings only.
- `list_hiring_dashboard_postings()`:
  - returns active, expiring, expired, closed, and historical management states for the signed-in hiring team.

### Scheduler Requirements

- Use Supabase scheduled functions, pg_cron, or an external scheduled job runner.
- The scheduler must be idempotent.
- It must support a dry-run/log-only mode before external delivery is enabled.
- It must avoid duplicate reminders after renewal by checking `lifecycle_version`.
- It must record skipped events, including missing recipient contact, opt-out, and rate-limit reasons.
- The cadence must be at least hourly to support the 24-hour threshold.
- Thresholds should be windows rather than exact moments, so small cron drift does not skip reminders.
- Idempotency key must match the reminder table uniqueness: `posting_type`, `posting_id`, `recipient_profile_id`, `threshold`, `channel`, and `lifecycle_version`.
- First production run must support dry-run/backfill reporting before writing or delivering reminder events.

### Delivery Requirements

#### In-App

- Required for Phase 2A.
- Reads from `posting_reminders`.
- Supports dismissed state.
- Does not require external provider credentials.

#### Email

- Phase 2B.
- Required before claiming "we email hiring teams before jobs expire."
- Must include unsubscribe or preference handling if used for recurring reminders.
- Must distinguish product reminder email from marketing email.

#### SMS

- Phase 2C or later.
- Must be opt-in.
- Must reuse or replace existing SMS rate-limit strategy.
- Must not send worker reminders for generic matches until matching quality and opt-in rules exist.
- Current `notify-workers` edge function is not sufficient for posting lifecycle reminders without redesign.

## UX Requirements

### Hiring Dashboard

- Continue showing `Needs attention`.
- Source should switch from localStorage demo lifecycle to backend data when Supabase is configured.
- In demo/mock mode, frontend lifecycle filtering may remain the active guard. In Supabase mode, backend query filters must be the active guard.
- Show clear reminder state:
  - `Expires in 7 days`
  - `Expires in 3 days`
  - `Expires in 24 hours`
  - `Expired`
- Primary actions:
  - active/expiring job: `Renew for 30 days`
  - expired job: `Repost`
  - passed event shift: `Repost event shift`
- Secondary actions:
  - `Close`
  - `Dismiss reminder` for in-app reminder cards, if a durable reminder exists.
- Dismissing a reminder suppresses only that threshold for that posting, channel, recipient, and lifecycle version. Later thresholds still appear.

### Worker Browse

- Worker-facing results must be active-only.
- If backend filtering is enabled, frontend filters should not be the sole expiration guard.
- No expired postings should appear in the default job list.

### Notification Preferences

- Hiring teams should start with in-app reminders enabled.
- Email reminders should be explicitly visible in settings before any email is sent.
- SMS should be off by default unless the user has opted in and provided a verified phone number.

### Copy Guidelines

- Use "job", "posting", "company", and "hiring team" for the primary flow.
- Use "event shift" only for date/time-specific work.
- Do not say "email sent" or "SMS sent" unless the provider returned success and a durable event was written.
- Do not show inactive controls for channels not configured.

## UX States

- **Loading**: dashboard and browse use existing loading states.
- **Empty**: hiring dashboard says "No postings need attention."
- **No Results**: browse says no active jobs match filters.
- **Success**: renewal confirms the new date.
- **Error**: failed renew/repost/close actions show retryable messages.
- **Delivery Disabled**: settings or reminder surfaces say "Email reminders are not enabled for this demo" if needed.
- **Provider Failure**: reminder event persists as `failed`; UI does not imply delivery succeeded.
- **Stale Renewal Click**: if a posting expires before the user clicks renew, show a recoverable message such as "This job just expired. Repost it to create a fresh listing."

## Acceptance Criteria

- PRD separates durable lifecycle state from external delivery.
- Phase 2A can ship without email or SMS and still improves truthfulness.
- Backend filtering, not frontend filtering alone, excludes expired/closed postings when Supabase is configured.
- Hiring teams can renew active/expiring long-term jobs from persisted data.
- Hiring teams can close jobs and event shifts from persisted data.
- Expired long-term jobs require reposting instead of renewal.
- Event shifts require timezone-safe expiration before production automation.
- Reminder events are idempotent and durable.
- The same posting can be renewed multiple times without producing duplicate reminders for older lifecycle versions.
- Dismissing a 7-day reminder does not suppress the 3-day or 24-hour reminder for the same posting.
- Event-shift reminder events are explicitly deferred from Phase 2A.
- Worker reminder rows are not created until saved jobs or explicit opt-in matching exists.
- Email/SMS copy and UI are hidden or clearly disabled until provider-backed delivery exists.
- Worker-side expiry reminders are deferred until saved jobs or explicit opt-in matching exists.

## Success Metrics

For product readiness:

- Expired-posting leak rate in backend active browse queries stays at zero.
- Duplicate reminder event rate for the same posting, threshold, channel, recipient, and lifecycle version stays at zero.
- Hiring teams can understand whether reminders are in-app only, email, or SMS.

For later production:

- Percentage of expiring jobs renewed before expiration.
- Percentage of expired jobs reposted.
- Reminder delivery success/failure rates by channel.
- Worker clicks on expired or unavailable postings should trend toward zero.

## Open Questions

- Which provider should send hiring-team email reminders?
- Should hiring-team email reminders be enabled by default after account creation, or require explicit opt-in?
- Should renewal count against free-tier posting limits? Route this through the payment/ledger guardrail before implementation.
- Should the database table names eventually move from `restaurants` to a broader company/hiring-team model?
- Should SMS ever be used for hiring-team reminders, or only for worker opt-in alerts?
- Should future company accounts support one canonical notification owner or multiple reminder recipients per company?
- Should event-shift pre-reminders use 24-hour/day-of thresholds in a later phase?

None of these block Phase 2A durable lifecycle state.

## Review Score

Claude read-only review passed after revisions on 2026-05-14. The final clarifications cover owner-profile recipient derivation, threshold/backfill behavior, and first-run dry-run reporting.

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

Ready status: passes the PRD gate with no category below 8, no blocking open questions for Phase 2A, and no unsupported email/SMS/live-service claims.
