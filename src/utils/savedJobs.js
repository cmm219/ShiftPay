import { daysUntil } from './postingLifecycle';

export const SAVED_JOBS_STORAGE_KEY = 'shiftpay-saved-jobs';

function readStore() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(store) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(store));
}

function normalizeWorkerState(state = {}) {
  return {
    savedOpeningIds: Array.isArray(state.savedOpeningIds) ? state.savedOpeningIds.map(String) : [],
    dismissedReminderKeys: Array.isArray(state.dismissedReminderKeys)
      ? state.dismissedReminderKeys.map(String)
      : [],
  };
}

export function getSavedJobsWorkerKey(profile, user) {
  return profile?.id || user?.id || null;
}

export function isSaveableLongTermOpening(opening) {
  return Boolean(opening && !opening.date && !opening.startTime && !opening.endTime);
}

export function readSavedJobsState(workerKey) {
  if (!workerKey) return normalizeWorkerState();
  return normalizeWorkerState(readStore()[workerKey]);
}

export function writeSavedJobsState(workerKey, nextState) {
  if (!workerKey) return;
  const store = readStore();
  store[workerKey] = normalizeWorkerState(nextState);
  writeStore(store);
}

export function addSavedOpening(workerKey, openingId) {
  const state = readSavedJobsState(workerKey);
  const id = String(openingId);
  if (!state.savedOpeningIds.includes(id)) {
    state.savedOpeningIds = [...state.savedOpeningIds, id];
    writeSavedJobsState(workerKey, state);
  }
  return state;
}

export function removeSavedOpening(workerKey, openingId) {
  const id = String(openingId);
  const state = readSavedJobsState(workerKey);
  const next = {
    ...state,
    savedOpeningIds: state.savedOpeningIds.filter((savedId) => savedId !== id),
  };
  writeSavedJobsState(workerKey, next);
  return next;
}

export function toggleSavedOpening(workerKey, openingId) {
  const state = readSavedJobsState(workerKey);
  return state.savedOpeningIds.includes(String(openingId))
    ? removeSavedOpening(workerKey, openingId)
    : addSavedOpening(workerKey, openingId);
}

export function getSavedJobReminder(opening, now = new Date()) {
  const version = opening.lifecycleVersion ?? 1;

  const days = daysUntil(opening.expiresAt, now);

  if (opening.lifecycleStatus === 'expired' || days <= 0) {
    return {
      threshold: 'expired',
      key: `${opening.id}:expired:in_app:${version}`,
      label: 'Saved job no longer active',
      body: 'This saved job expired. Remove it from saved jobs or check for other active roles.',
    };
  }

  if (opening.lifecycleStatus !== 'expiring_soon') return null;

  const threshold = days <= 1 ? '24_hour' : days <= 3 ? '3_day' : '7_day';
  const timing = Number.isFinite(days)
    ? threshold === '24_hour'
      ? 'in 24 hours'
      : `in ${days} days`
    : 'soon';

  return {
    threshold,
    key: `${opening.id}:${threshold}:in_app:${version}`,
    label: 'Saved job expires soon',
    body: `This job may close ${timing}. Review it if you're still interested.`,
  };
}

export function dismissSavedJobReminder(workerKey, reminderKey) {
  const state = readSavedJobsState(workerKey);
  if (!state.dismissedReminderKeys.includes(reminderKey)) {
    state.dismissedReminderKeys = [...state.dismissedReminderKeys, reminderKey];
    writeSavedJobsState(workerKey, state);
  }
  return state;
}
