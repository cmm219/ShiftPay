---
title: Job Posting Lifecycle, Expiration, and Renewal Reminders
status: ready
date: 2026-05-14
owner: Codex
product_surface: Hiring-team posting, browse, hiring dashboard, notification readiness
---

# Job Posting Lifecycle, Expiration, and Renewal Reminders

## Product Direction Update

ShiftPay should be positioned around **jobs and long-term hiring first**.

The primary hiring object is a long-term job/opening posted by a restaurant,
venue, hospitality group, banquet company, caterer, or other hiring team. One-time
event shifts remain supported, but they are a secondary use case for banquet,
catering, pop-up, and event coverage.

Visible product copy should use "job", "open job", "hiring team", or "company"
for the main flow. Use "event shift" only when the posting has a specific date
and time.

## Phase 1 Scope Decision

Phase 1 is a **truthful frontend/demo lifecycle pass** centered on job postings.

It may add deterministic mock/demo lifecycle data, relative seed dates, hiring-dashboard lifecycle states, and local renew/repost/close interactions where they are clearly demo-only. It must not claim live email, SMS, cron, scheduled jobs, or production delivery.

Backend-backed lifecycle, Supabase schema changes, scheduled reminder jobs, email, SMS, and durable reminder event logs are Phase 2+.

## Current State

ShiftPay currently supports two posting concepts:

- **Long-term jobs/openings** from `restaurant.openings` in `src/data/restaurants.js` and the `openings` table/API path. This is the primary product flow.
- **One-time event shifts** from `src/data/shifts.js` and the `shifts` table/API path. This is a secondary event-coverage flow.

Hiring teams can use `/post-shift` to choose either:

- `Long-term Job`: ongoing position, with role, city, pay, and description.
- `Event Shift`: date-specific banquet/catering/pop-up coverage with date, start time, end time, hourly pay, city, description, and urgent flag.

Current limitations:

- There is no expiration policy for one-time shifts or long-term openings.
- There are no renewal controls.
- There are no reminder notifications.
- There is no scheduled job, email delivery, SMS delivery, or in-app notification system wired for posting lifecycle events.
- Public review uses mock-data fallback when Supabase is not configured.
- The current seeded open shifts are dated March 2026. On the current project date, May 14, 2026, those dates are already in the past. Phase 1 must use relative demo dates or explicit lifecycle seed fields before filtering active postings by date.

## Problem

Hiring teams need stale job postings removed or renewed so workers do not browse dead opportunities. They also need advance warning and a low-friction way to renew or repost before a useful job disappears.

For the portfolio demo, ShiftPay needs to show that lifecycle clearly without pretending production notifications or scheduled backend automation exist.

## Goals

- Define clear expiration rules for long-term jobs and secondary event shifts.
- Show hiring teams which postings need attention.
- Provide renew, repost, and close actions in the hiring dashboard.
- Keep worker-facing browse free of expired postings in Phase 1 demo data.
- Preserve demo credibility by labeling lifecycle states as local/demo behavior until backend delivery exists.
- Produce requirements that can drive a design loop and then a Phase 1 frontend implementation.

## Non-Goals

- Phase 1 does not send email, SMS, push notifications, or scheduled background jobs.
- Phase 1 does not add Supabase migrations or production cron jobs.
- Phase 1 does not customize renewal duration. Renewal is fixed at 30 days.
- Phase 1 does not count renewals against billing/free-tier limits.
- Phase 1 does not change payment/subscription rules.
- Phase 1 does not change worker onboarding or worker profile rules.
- Phase 1 does not auto-renew postings.
- Phase 1 does not show expired openings on public restaurant profile pages.

## Product Vocabulary

- **Posting**: Generic term for either a long-term job/opening or event shift.
- **Job / Opening**: Long-term role listing without a single shift date. This is the primary product object.
- **Event Shift**: Date-specific work opportunity with start/end time for banquet, catering, pop-up, or similar coverage.
- **Expires at**: Timestamp when a posting stops appearing as active.
- **Expiring soon**: Single state beginning 7 days before expiration and ending when the posting expires.
- **Expired**: Posting is no longer worker-facing by default.
- **Renew**: Extend an active or expiring job/opening.
- **Repost**: Create a new posting draft from an expired job or event shift.
- **Close**: Hiring team intentionally removes a posting before expiration.
- **Reminder**: A prompt shown to the hiring team. Phase 1 reminders appear in-app only when the hiring dashboard is viewed.

## Required Flows

### Flow 1: Event Shift Expiration

1. Hiring team posts an event shift with date, start time, and end time.
2. Event shift remains active while status is `open` and the scheduled end time has not passed.
3. After scheduled end time passes:
   - `open` shifts become expired and should not appear in worker-facing active browse results.
   - `claimed` shifts remain in the existing claimed/awaiting-completion UI. Completion/no-show adjudication is out of scope for this PRD.
   - `completed` and `cancelled` shifts remain historical.
4. Hiring dashboard shows expired open event shifts in a management context, not as active opportunities.
5. Hiring team can choose `Repost event shift`, which opens `/post-shift` with the old role, city, pay, and description prefilled, but requires a new future date/time.
6. Original expired event shifts remain historical. Phase 2 may add `reposted_from_id` lineage; Phase 1 can keep lineage local/demo-only.

### Flow 2: Long-Term Job Expiration

1. Hiring team posts a long-term job/opening.
2. Job receives an `expiresAt` timestamp, defaulting to 30 days after creation.
3. Job is active while `isActive === true` and `expiresAt` is in the future.
4. Job enters `expiring soon` state when `expiresAt` is 7 days or fewer away.
5. Expiring soon has three display thresholds:
   - `Expires in 7 days`
   - `Expires in 3 days`
   - `Expires in 24 hours`
6. Job expires when `expiresAt` passes.
7. Expired jobs are removed from worker-facing active browse results.
8. Hiring dashboard shows expired jobs with `Repost`.
9. Hiring team can renew an active or expiring job for another 30 days.
10. Renewal extends from the later of `now` and current `expiresAt`, so renewing early does not shorten the current active window.
11. Expired jobs cannot be renewed in Phase 1. They must be reposted.

### Flow 3: In-App Reminder States

1. Restaurant dashboard shows an attention area when openings are expiring soon or postings are expired.
2. In-app reminders render only when the restaurant visits the dashboard. They are not push notifications and are not scheduled delivery in Phase 1.
3. Reminder copy should say what will happen and when:
   - "This opening expires in 3 days."
   - "Renew for 30 days to keep it visible to workers."
4. Phase 1 must not show email/SMS toggles, sent states, delivery status, or message history.

### Flow 4: Demo-Safe Seed Behavior

1. Phase 1 must not silently remove all seeded opportunities because fixed demo dates drift into the past.
2. Chosen approach: generate relative demo lifecycle dates from a stable base at runtime or via a mock-data helper.
3. Seed data should include a mix of:
   - active shifts/openings,
   - expiring openings,
   - expired openings,
   - expired open shifts that can be reposted.
4. Demo UI may show lifecycle badges such as `Expires in 6 days` only when backed by explicit seed fields or deterministic relative calculations.

### Flow 5: Restaurant-Initiated Close

1. Restaurant can close an active shift or opening from the dashboard.
2. Closed postings stop appearing in worker-facing browse immediately.
3. Closed postings remain visible in the restaurant dashboard history/management context.
4. Closed openings can be reposted but not renewed.
5. Phase 1 close behavior may be local/demo-only and must not imply durable backend persistence.

## Active Filtering Rules

Worker-facing active browse should use these rules:

- Active shift: `status === "open"` and scheduled end time is in the future.
- Active opening: `isActive !== false`, not closed, and `expiresAt` is in the future.
- Expired and closed postings are hidden from worker-facing browse.
- Restaurant dashboard may show active, expiring, expired, and closed postings in separate management contexts.

## Backend, Data, and API Requirements

### Phase 1 Demo Data Shape

Phase 1 can add frontend/mock fields or computed properties:

For shifts:

- `expiresAt`: computed from relative date + end time for demo display/filtering.
- `closedAt`: local/demo-only nullable timestamp.
- `lifecycleStatus`: computed as `active`, `expired`, or `closed`.

For openings:

- `createdAt`: deterministic relative date or explicit seed value.
- `expiresAt`: deterministic relative date or explicit seed value.
- `renewedAt`: nullable timestamp of most recent renewal.
- `closedAt`: local/demo-only nullable timestamp.
- `lifecycleStatus`: computed as `active`, `expiring_soon`, `expired`, or `closed`.

### Phase 2 Backend Shape

For a future Supabase-backed pass:

For shifts:

- Prefer computing `expires_at` from stored date/time and restaurant timezone at query time unless a migration explicitly stores it.
- Add restaurant timezone before production expiration math. City alone is not enough.
- Add nullable `expired_at`, `closed_at`, and optional `reposted_from_id` if lineage is needed.

For openings:

- Add `created_at`, `expires_at`, `renewed_at`, `closed_at`, and `is_active`.
- `renewed_at` means most recent renewal timestamp.
- Renewal history/event table is optional Phase 2+ if analytics are needed.

For reminders:

- A `posting_reminders` event table is Phase 2+.
- Reminder enums and delivery channels are TBD in the backend PRD.

## UX Requirements

### Worker Browse

- Active browse must not show expired or closed postings.
- Empty state should explain when there are no active postings.
- No worker-facing expired/renew/repost CTA is needed in the active marketplace.

### Restaurant Dashboard

- Add a `Needs attention` area when there are expiring or expired postings.
- Sort order:
  1. soonest expiring active openings,
  2. expired postings, newest expiration first,
  3. closed postings only if the dashboard has a history section.
- If there are no attention items, show a compact empty state: "No postings need attention."
- Each expiring opening card should show:
  - role and city,
  - expiration date or relative time,
  - primary action: `Renew for 30 days`,
  - secondary action: `Close`.
- Each expired posting card should show:
  - role and city,
  - expired date,
  - primary action: `Repost`,
  - secondary action: `View details`.

### Post Shift / Opening

- Repost should prefill prior role, city, pay, and description.
- Reposting a one-time shift must require a new future date/time.
- Reposting a long-term opening creates a new 30-day expiration window.

### Copy Guidelines

- Use "expires" and "renew" for long-term openings.
- Use "shift has passed" and "repost" for one-time shifts.
- Do not use "email sent", "SMS sent", "notification delivered", or similar copy in Phase 1.

## UX States

- **Loading**: existing dashboard loading state is acceptable.
- **Empty**: "No postings need attention."
- **Success**: "Opening renewed until [date]."
- **Error**: "Could not renew this opening. Try again."
- **No-results**: Browse explains that no active openings match current filters.
- **Expired**: Worker-facing browse hides the posting; restaurant dashboard shows expired posting in a management context.

## Mobile Requirements

- Follow existing dashboard responsive patterns.
- Attention cards stack in a single column below the dashboard header.
- Renewal/repost actions must remain visible without horizontal scrolling.
- Long labels like `Renew for 30 days` must fit inside buttons at 375px width.

## Product Acceptance Criteria

- One-time shifts and long-term openings have distinct lifecycle rules.
- Worker-facing browse excludes expired and closed postings in Phase 1 demo data.
- Restaurant dashboard shows expiring openings and expired postings in a `Needs attention` area.
- Renewing an active/expiring opening extends `expiresAt` for 30 days from the later of `now` and current `expiresAt`.
- Expired openings require reposting instead of renewal.
- Reposting a shift requires a new future date/time.
- Closing a posting removes it from worker-facing browse.
- Demo seed behavior uses relative dates or deterministic lifecycle seed fields so active demo content remains visible.
- UI copy does not claim email, SMS, push, cron, or durable backend persistence in Phase 1.

## Definition of Done

- PRD passes review gate: overall >= 9, no category below 8.
- Phase 1 implementation passes `npm run build`, `npm run lint`, and relevant Playwright/browser checks.
- Any later backend implementation has separate migration/API tests and does not rely on city-only timezone math.

## Success Metrics

For production later:

- Directional: fewer active postings with dates in the past after lifecycle rules are live.
- Directional: more useful long-term openings renewed before expiration.
- Directional: fewer worker clicks into stale opportunities.

For demo/portfolio:

- Reviewers can understand lifecycle behavior from seeded states without backend setup.
- No UI copy implies live reminders unless implemented.

## Deferred Questions

- Should renewals count against billing/free-tier limits? Deferred to pricing/billing PRD.
- Should production restaurants choose 7/14/30-day renewal windows? Deferred to v2.
- Should expired openings appear publicly on restaurant profiles as historical context? No for Phase 1; revisit later.

## Review Score

Second-pass Claude read-only review passed on 2026-05-14 with no blocking or high-severity findings.

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
| Scope discipline | 10 |
| **Overall** | 9.2 |
