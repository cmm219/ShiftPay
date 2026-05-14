import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterActivePostingReminders } from '../src/utils/postingReminders.js';

const root = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test.describe('Posting lifecycle scheduler runbook contract', () => {
  test('migration keeps the dry-run reminder generator contract', () => {
    const sql = read('supabase/migrations/009_posting_lifecycle.sql');

    expect(sql).toContain('generate_posting_lifecycle_reminders(p_dry_run BOOLEAN DEFAULT TRUE)');
    expect(sql).toContain('threshold posting_reminder_threshold');
    expect(sql).toContain('candidate_count INTEGER');
    expect(sql).toContain('inserted_count INTEGER');
    expect(sql).toContain('WHERE p_dry_run = FALSE');
  });

  test('migration keeps client writes denied and reminder uniqueness intact', () => {
    const sql = read('supabase/migrations/009_posting_lifecycle.sql');

    expect(sql).toContain('CREATE POLICY "Posting reminders: clients cannot insert"');
    expect(sql).toContain('WITH CHECK (FALSE)');
    expect(sql).toContain('CREATE POLICY "Posting reminders: clients cannot delete"');
    expect(sql).toContain('USING (FALSE)');
    expect(sql).toContain('UNIQUE (posting_type, posting_id, recipient_profile_id, threshold, channel, lifecycle_version)');
  });

  test('runbook documents dry-run, backfill, idempotency, and smoke checks', () => {
    const runbook = read('docs/runbooks/posting-lifecycle-scheduler.md');

    expect(runbook).toContain('select * from generate_posting_lifecycle_reminders(true);');
    expect(runbook).toContain('select * from generate_posting_lifecycle_reminders(false);');
    expect(runbook).toContain('## Idempotency Probe');
    expect(runbook).toContain('inserted_count = 0');
    expect(runbook).toContain('## Dashboard Smoke Checklist');
    expect(runbook).toContain('no UI says email or SMS was sent');
  });

  test('active reminder reads are filtered by current lifecycle version', () => {
    const hook = read('src/hooks/useData.js');
    const utility = read('src/utils/postingReminders.js');
    const runbook = read('docs/runbooks/posting-lifecycle-scheduler.md');

    expect(hook).toContain('filterActivePostingReminders');
    expect(utility).toContain('reminder.lifecycleVersion');
    expect(utility).toContain('opening.lifecycleVersion');
    expect(runbook).toContain('posting_reminders.lifecycle_version = openings.lifecycle_version');
  });

  test('active reminder filter drops stale, non-opening, and unknown-opening reminders', () => {
    const reminders = [
      { id: 'current', postingType: 'opening', postingId: 'opening-1', lifecycleVersion: 2 },
      { id: 'stale', postingType: 'opening', postingId: 'opening-1', lifecycleVersion: 1 },
      { id: 'shift', postingType: 'shift', postingId: 'opening-1', lifecycleVersion: 2 },
      { id: 'missing-opening', postingType: 'opening', postingId: 'opening-2', lifecycleVersion: 1 },
    ];
    const openings = [
      { id: 'opening-1', lifecycleVersion: 2 },
    ];

    expect(filterActivePostingReminders(reminders, openings)).toEqual([
      reminders[0],
    ]);
  });
});
