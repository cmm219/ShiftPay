import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import {
  addSavedOpening,
  dismissSavedJobReminder,
  getSavedJobsWorkerKey,
  readSavedJobsState,
  removeSavedOpening,
  toggleSavedOpening,
} from '../utils/savedJobs';

export function useSavedJobs() {
  const { user, profile } = useAuth();
  const workerKey = getSavedJobsWorkerKey(profile, user);
  const [state, setState] = useState(() => readSavedJobsState(workerKey));

  useEffect(() => {
    setState(readSavedJobsState(workerKey));
  }, [workerKey]);

  const isWorker = profile?.role === 'worker';
  const isHiringTeam = profile?.role === 'restaurant';

  const savedOpeningIds = useMemo(
    () => new Set(state.savedOpeningIds),
    [state.savedOpeningIds]
  );

  return {
    state,
    savedOpeningIds,
    dismissedReminderKeys: new Set(state.dismissedReminderKeys),
    isWorker,
    isHiringTeam,
    canSaveJobs: Boolean(user && isWorker && workerKey),
    isSignedIn: Boolean(user),
    isSaved: (openingId) => savedOpeningIds.has(String(openingId)),
    save: (openingId) => {
      if (!workerKey) return;
      setState(addSavedOpening(workerKey, openingId));
    },
    unsave: (openingId) => {
      if (!workerKey) return;
      setState(removeSavedOpening(workerKey, openingId));
    },
    toggle: (openingId) => {
      if (!workerKey) return;
      setState(toggleSavedOpening(workerKey, openingId));
    },
    dismissReminder: (reminderKey) => {
      if (!workerKey) return;
      setState(dismissSavedJobReminder(workerKey, reminderKey));
    },
  };
}
