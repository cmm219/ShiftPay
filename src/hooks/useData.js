import { useState, useEffect } from 'react';
import {
  fetchWorkers,
  fetchWorkerById,
  fetchRestaurants,
  fetchRestaurantById,
  fetchShifts,
  fetchShiftById,
} from '../lib/api';

// Mock data fallbacks
import { workers as mockWorkers } from '../data/workers';
import { restaurants as mockRestaurants } from '../data/restaurants';
import { shifts as mockShifts } from '../data/shifts';

// ────────────────────────────────────────────────────────────
// Generic async data hook
// ────────────────────────────────────────────────────────────

function useQuery(queryFn, fallbackData, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    queryFn().then((result) => {
      if (cancelled) return;

      if (result.fromMock || result.error) {
        // Use mock data as fallback
        setData(fallbackData);
        setError(result.error);
      } else if (result.data && (Array.isArray(result.data) ? result.data.length > 0 : true)) {
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

export function useShifts() {
  const { data, loading, error } = useQuery(fetchShifts, mockShifts);
  return { shifts: data || [], loading, error };
}

export function useShift(id) {
  const mockShift = mockShifts.find(
    (s) => String(s.id) === String(id)
  );

  const { data, loading, error } = useQuery(
    () => fetchShiftById(id),
    mockShift || null,
    [id]
  );

  return { shift: data, loading, error };
}
