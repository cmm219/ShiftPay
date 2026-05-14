import { useState, useEffect } from 'react';
import {
  fetchWorkers,
  fetchWorkerById,
  fetchRestaurants,
  fetchRestaurantById,
  fetchShifts,
  fetchShiftById,
  fetchOpenings,
  fetchHiringOpenings,
  fetchPostingReminders,
  createShift,
  createOpening,
  claimShift,
  renewOpeningById,
  closeOpeningById,
  closeShiftById,
  dismissPostingReminderById,
  getShiftPostCount,
  createReview,
  fetchSubscription,
  fetchInvoices,
  createSubscriptionCheckout,
  createInvoiceCheckout,
} from '../lib/api';

// Mock data fallbacks
import { workers as mockWorkers } from '../data/workers';
import { restaurants as mockRestaurants } from '../data/restaurants';
import { shifts as mockShifts } from '../data/shifts';
import {
  applyLifecycleOverrides,
  buildDemoOpenings,
  prepareDemoShifts,
  readLifecycleOverrides,
} from '../utils/postingLifecycle';

// ────────────────────────────────────────────────────────────
// Generic async data hook
// ────────────────────────────────────────────────────────────

function useQuery(queryFn, fallbackData, deps = [], options = {}) {
  const { fallbackOnEmpty = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      return queryFn();
    }).then((result) => {
      if (cancelled || !result) return;

      if (result.fromMock || result.error) {
        // Use mock data as fallback
        setData(fallbackData);
        setError(result.error);
      } else if (result.data && (Array.isArray(result.data) ? result.data.length > 0 || !fallbackOnEmpty : true)) {
        setData(result.data);
      } else {
        // Empty result from Supabase — fall back to mock
        setData(fallbackData);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// ────────────────────────────────────────────────────────────
// Entity hooks
// ────────────────────────────────────────────────────────────

export function useWorkers() {
  const { data, loading, error } = useQuery(fetchWorkers, mockWorkers);
  return { workers: data || [], loading, error };
}

export function useWorker(id) {
  const mockWorker = mockWorkers.find(
    (w) => String(w.id) === String(id)
  );

  const { data, loading, error } = useQuery(
    () => fetchWorkerById(id),
    mockWorker || null,
    [id]
  );

  return { worker: data, loading, error };
}

export function useRestaurants() {
  const { data, loading, error } = useQuery(fetchRestaurants, mockRestaurants);
  return { restaurants: data || [], loading, error };
}

export function useCompanies() {
  const { restaurants, loading, error } = useRestaurants();
  return { companies: restaurants, loading, error };
}

export function useRestaurant(id) {
  const mockRestaurant = mockRestaurants.find(
    (r) => String(r.id) === String(id)
  );

  const { data, loading, error } = useQuery(
    () => fetchRestaurantById(id),
    mockRestaurant || null,
    [id]
  );

  return { restaurant: data, loading, error };
}

export function useCompany(id) {
  const { restaurant, loading, error } = useRestaurant(id);
  return { company: restaurant, loading, error };
}

export function useShifts() {
  const fallback = applyLifecycleOverrides(
    buildDemoOpenings(mockRestaurants),
    prepareDemoShifts(mockShifts),
    readLifecycleOverrides()
  ).shifts;
  const { data, loading, error } = useQuery(fetchShifts, fallback, [], { fallbackOnEmpty: false });
  // Keep demo close/repost overrides visible across the app when Supabase is not configured.
  const lifecycled = applyLifecycleOverrides([], data || [], readLifecycleOverrides()).shifts;
  return { shifts: lifecycled, loading, error };
}

export function useShift(id) {
  const mockShift = applyLifecycleOverrides(
    buildDemoOpenings(mockRestaurants),
    prepareDemoShifts(mockShifts),
    readLifecycleOverrides()
  ).shifts.find(
    (s) => String(s.id) === String(id)
  );

  const { data, loading, error } = useQuery(
    () => fetchShiftById(id),
    mockShift || null,
    [id]
  );

  return { shift: data, loading, error };
}

export function useOpenings() {
  const fallback = applyLifecycleOverrides(
    buildDemoOpenings(mockRestaurants),
    prepareDemoShifts(mockShifts),
    readLifecycleOverrides()
  ).openings;
  const { data, loading, error } = useQuery(fetchOpenings, fallback, [], { fallbackOnEmpty: false });
  const lifecycled = applyLifecycleOverrides(data || [], [], readLifecycleOverrides()).openings;
  return { openings: lifecycled, loading, error };
}

export function useDemoLifecycleData() {
  const overrides = readLifecycleOverrides();
  return applyLifecycleOverrides(
    buildDemoOpenings(mockRestaurants),
    prepareDemoShifts(mockShifts),
    overrides
  );
}

export function useHiringLifecycleData(restaurantId) {
  const fallbackData = applyLifecycleOverrides(
    buildDemoOpenings(mockRestaurants),
    prepareDemoShifts(mockShifts),
    readLifecycleOverrides()
  );
  const fallbackOpenings = fallbackData.openings.filter(
    (opening) => String(opening.restaurantId) === String(restaurantId)
  );

  const openingsQuery = useQuery(
    () => fetchHiringOpenings(restaurantId),
    fallbackOpenings,
    [restaurantId],
    { fallbackOnEmpty: false }
  );
  const remindersQuery = useQuery(
    () => fetchPostingReminders(restaurantId),
    [],
    [restaurantId],
    { fallbackOnEmpty: false }
  );

  const openings = applyLifecycleOverrides(
    openingsQuery.data || [],
    [],
    readLifecycleOverrides()
  ).openings;

  return {
    openings,
    reminders: remindersQuery.data || [],
    loading: openingsQuery.loading || remindersQuery.loading,
    error: openingsQuery.error || remindersQuery.error,
  };
}

// ────────────────────────────────────────────────────────────
// Mutation hooks
// ────────────────────────────────────────────────────────────

export function useCreateShift() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (shiftData) => {
    setLoading(true);
    setError(null);
    const result = await createShift(shiftData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useCreateOpening() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (openingData) => {
    setLoading(true);
    setError(null);
    const result = await createOpening(openingData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useRenewOpening() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (openingId) => {
    setLoading(true);
    setError(null);
    const result = await renewOpeningById(openingId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useCloseOpening() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (openingId) => {
    setLoading(true);
    setError(null);
    const result = await closeOpeningById(openingId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useCloseShift() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (shiftId) => {
    setLoading(true);
    setError(null);
    const result = await closeShiftById(shiftId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useDismissPostingReminder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (reminderId) => {
    setLoading(true);
    setError(null);
    const result = await dismissPostingReminderById(reminderId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useClaimShift() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (shiftId) => {
    setLoading(true);
    setError(null);
    const result = await claimShift(shiftId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useCreateReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (reviewData) => {
    setLoading(true);
    setError(null);
    const result = await createReview(reviewData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useShiftPostCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShiftPostCount().then(result => {
      setCount(result.data || 0);
      setLoading(false);
    });
  }, []);

  return { count, loading };
}

export function useSubscription() {
  const { data, loading, error } = useQuery(fetchSubscription, null);
  return { subscription: data, loading, error };
}

export function useInvoices() {
  const { data, loading, error } = useQuery(fetchInvoices, []);
  return { invoices: data || [], loading, error };
}

export function useCreateSubscriptionCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async () => {
    setLoading(true);
    setError(null);
    const result = await createSubscriptionCheckout();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}

export function useCreateInvoiceCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (invoiceId) => {
    setLoading(true);
    setError(null);
    const result = await createInvoiceCheckout(invoiceId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  };

  return { mutate, loading, error };
}
