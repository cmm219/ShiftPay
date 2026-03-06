import { useState, useMemo, useCallback } from 'react';

/**
 * Default filter state for the browse page.
 */
const DEFAULT_FILTERS = {
  role: '',            // Role id string (e.g. 'server', 'bartender') or '' for all
  city: '',            // City id string (e.g. 'tampa') or '' for all
  servsafeOnly: false, // When true, only show workers with a ServSafe certification
  availabilities: [],  // Array of availability id strings the worker must match (any)
  experienceMin: 0,    // Minimum years of experience
  rateMax: 0,          // Maximum hourly rate (0 = no cap)
};

/**
 * useFilters
 *
 * Custom hook for the browse / search page.
 * Accepts an array of worker objects and returns filter state plus a
 * derived, filtered list.  All active filters are applied combinatorially
 * (AND logic across different filter categories).
 *
 * Expected worker shape (relevant fields):
 *   {
 *     role:           string,        // matches ROLES id
 *     city:           string,        // matches CITIES id
 *     certifications: string[],      // array of certification ids
 *     availabilities: string[],      // array of availability ids
 *     experience:     number,        // years
 *     rate:           number,        // $/hr
 *   }
 *
 * @param {Array} workers - The full unfiltered list of workers.
 * @returns {{ filters: Object, setFilter: Function, resetFilters: Function, filteredWorkers: Array }}
 */
export default function useFilters(workers = []) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  /**
   * Update a single filter field.
   * @param {string} name  - Filter key (e.g. 'role', 'city').
   * @param {*}      value - New value for that filter.
   */
  const setFilter = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Reset every filter back to its default value.
   */
  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  /**
   * Derive the filtered worker list.
   * Memoised so downstream components only re-render when inputs change.
   */
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      // --- Role ---
      if (filters.role && worker.role !== filters.role) {
        return false;
      }

      // --- City ---
      if (filters.city && worker.city !== filters.city) {
        return false;
      }

      // --- ServSafe Only ---
      if (filters.servsafeOnly) {
        const certs = Array.isArray(worker.certifications)
          ? worker.certifications
          : [];
        if (!certs.includes('servsafe')) {
          return false;
        }
      }

      // --- Availabilities (match ANY selected) ---
      if (filters.availabilities.length > 0) {
        const workerAvail = Array.isArray(worker.availabilities)
          ? worker.availabilities
          : [];
        const hasOverlap = filters.availabilities.some((a) =>
          workerAvail.includes(a),
        );
        if (!hasOverlap) {
          return false;
        }
      }

      // --- Minimum Experience ---
      if (
        filters.experienceMin > 0 &&
        (worker.experience == null || worker.experience < filters.experienceMin)
      ) {
        return false;
      }

      // --- Maximum Rate ---
      if (
        filters.rateMax > 0 &&
        worker.rate != null &&
        worker.rate > filters.rateMax
      ) {
        return false;
      }

      return true;
    });
  }, [workers, filters]);

  return { filters, setFilter, resetFilters, filteredWorkers };
}
