# Posting Lifecycle Scheduler Runbook

Status: manual trigger only. Recurring scheduling is not enabled by default.

This runbook operationalizes the Phase 2A posting lifecycle work from
`supabase/migrations/009_posting_lifecycle.sql`. It is limited to in-app
hiring-team reminders for long-term openings. It does not enable email, SMS,
payments, Stripe, invoices, payouts, ledgers, or reconciliation.

## Scope

In scope:

- Apply and verify migration `009_posting_lifecycle.sql`.
- Run the lifecycle reminder generator in dry-run mode.
- Run the first in-app reminder backfill only after dry-run counts look sane.
- Verify idempotency by rerunning the write command.
- Smoke test the hiring dashboard.
- Document the future recurring scheduler path without enabling it.

Out of scope:

- Recurring production cron without explicit ship approval.
- Event-shift reminder rows.
- Worker saved-job reminders.
- Email/SMS delivery.
- Payment, billing, Stripe, invoice, payout, ledger, or reconciliation changes.

## Function Reference

Function:

```sql
select * from generate_posting_lifecycle_reminders(p_dry_run boolean default true);
```

Return columns:

| Column | Type | Meaning |
|---|---|---|
| `threshold` | `posting_reminder_threshold` | Reminder window: `7_day`, `3_day`, `24_hour`, or `expired`. |
| `candidate_count` | `integer` | Active long-term openings currently eligible for the threshold. |
| `inserted_count` | `integer` | Reminder rows inserted by this run. Always `0` for dry runs. |

Dry-run semantics:

- `p_dry_run = true` reports candidates and inserts zero rows.
- Use dry-run first in every environment.

Write semantics:

- `p_dry_run = false` inserts in-app hiring-team reminder rows for active long-term openings only.
- Duplicate writes are blocked by the reminder uniqueness key:
  `posting_type`, `posting_id`, `recipient_profile_id`, `threshold`, `channel`, `lifecycle_version`.
- Event shifts are intentionally not reminder candidates in this phase.

## Apply Migration

1. Confirm local code is on `master` at PR #5 or later.

2. Confirm the target Supabase project before applying migrations.

3. Apply migrations using the repo's Supabase workflow. If no project-specific
   wrapper exists, use:

```powershell
npx supabase db push
```

4. Verify migration `009_posting_lifecycle.sql` is applied in the target project.

5. Verify lifecycle objects exist:

```sql
select column_name
from information_schema.columns
where table_name = 'openings'
  and column_name in ('expires_at', 'renewed_at', 'closed_at', 'reposted_from_id', 'lifecycle_version')
order by column_name;

select column_name
from information_schema.columns
where table_name = 'shifts'
  and column_name in ('closed_at', 'reposted_from_id')
order by column_name;

select to_regclass('public.posting_reminders') as posting_reminders_table;

select proname
from pg_proc
where proname = 'generate_posting_lifecycle_reminders';
```

Expected:

- `openings` includes all five lifecycle columns.
- `shifts` includes `closed_at` and `reposted_from_id`.
- `posting_reminders_table` is not null.
- The generator function exists.

## Dry Run

Before dry-run or backfill, verify no recurring scheduler has already been
enabled for this generator:

```sql
select extname
from pg_extension
where extname = 'pg_cron';
```

If `pg_cron` is installed, also run:

```sql
select jobid, jobname, schedule, command
from cron.job
where command ilike '%generate_posting_lifecycle_reminders%';
```

Expected: zero scheduler rows for `generate_posting_lifecycle_reminders`.

Run:

```sql
select * from generate_posting_lifecycle_reminders(true);
```

Expected:

- `inserted_count = 0` for every returned row.
- Candidate counts are understandable for the environment.
- Save the dry-run rows plus the active long-term opening count to the PR,
  deployment ticket, or runbook execution note before proceeding.

Also count existing non-dismissed reminders:

```sql
select threshold, channel, status, count(*)
from posting_reminders
where status <> 'dismissed'
group by threshold, channel, status
order by threshold, channel, status;
```

Stop before writing if:

- Any dry-run row has `inserted_count > 0`.
- A threshold count is above roughly 10% of total active long-term openings and that is not expected.
- `expired` candidates are unexpectedly high.
- Existing reminder counts are surprising or unexplained.

Useful context query:

```sql
select count(*) as active_long_term_openings
from openings
where is_active = true
  and closed_at is null;
```

## First Backfill

Only run this after the dry-run report is reviewed.

```sql
select * from generate_posting_lifecycle_reminders(false);
```

Expected:

- `inserted_count` is less than or equal to the matching dry-run `candidate_count`.
- Inserted rows are in-app hiring-team reminders.

Verify rows:

```sql
select posting_type, threshold, channel, status, lifecycle_version, count(*)
from posting_reminders
where recipient_role = 'hiring_team'
group by posting_type, threshold, channel, status, lifecycle_version
order by threshold, channel, lifecycle_version;
```

Expected:

- `posting_type = 'opening'`.
- `channel = 'in_app'`.
- No email or SMS rows are created.

## Idempotency Probe

Immediately after a clean first backfill, rerun the write command:

```sql
select * from generate_posting_lifecycle_reminders(false);
```

Expected:

- `inserted_count = 0` for every returned row.

If the second write inserts additional rows for the same threshold/version set,
stop and do not enable recurring scheduling.

## Active Reminder Filtering

Hiring dashboard active reminder reads must hide stale reminder rows from older
opening lifecycle versions.

Implementation rule:

```text
posting_reminders.lifecycle_version = openings.lifecycle_version
```

Current frontend filtering is applied by `useHiringLifecycleData()` in
`src/hooks/useData.js` through `filterActivePostingReminders()` in
`src/utils/postingReminders.js`. Stale rows remain available in the database for
audit and debugging, but they should not render as active reminders.

Verification query:

```sql
select pr.id,
       pr.posting_id,
       pr.lifecycle_version as reminder_version,
       o.lifecycle_version as opening_version,
       pr.status
from posting_reminders pr
join openings o on o.id = pr.posting_id
where pr.posting_type = 'opening'
  and pr.status <> 'dismissed'
order by pr.created_at desc;
```

Rows where `reminder_version <> opening_version` are historical/stale and should
not show in the active dashboard reminder list.

## Dashboard Smoke Checklist

Run this after a dry-run/backfill test or any frontend copy change.

1. Open `/login`.
2. Sign in as a hiring team.
3. Open `/dashboard/hiring`.
4. Confirm the dashboard loads without browser console errors.
5. Confirm `Needs attention` renders when reminder rows exist.
6. Confirm `Needs attention` also renders safely when no reminder rows exist.
7. Confirm reminder copy is in-app only.
8. Confirm no UI says email or SMS was sent.
9. Renew an opening with existing reminders, if data allows.
10. Confirm stale reminder rows from the old `lifecycle_version` do not render as active reminders.

## Future Recurring Scheduler

Recurring scheduling is documented but not enabled by this runbook.

Supported future options:

- Supabase scheduled functions.
- `pg_cron`.
- External scheduled job runner.

Rules before enabling recurring scheduling:

- Dry-run result is documented.
- First backfill is clean.
- Idempotency probe inserts zero duplicates.
- Dashboard smoke passes.
- A current ship token explicitly authorizes enabling recurring scheduling.

Recommended cadence when a later PR enables it: hourly or near-hourly.

## Rollback And Stop Guidance

Stop before writing if dry-run counts are surprising.

Stop after first write if:

- Inserted rows are not `channel = 'in_app'`.
- Inserted rows are not `recipient_role = 'hiring_team'`.
- Inserted rows include event shifts.
- The idempotency probe inserts duplicates.
- The hiring dashboard crashes or displays stale reminders as active.

Do not delete reminder rows casually. If rows need correction, prefer marking
them `dismissed`, `skipped`, or otherwise documenting the correction in a
follow-up task after review.
