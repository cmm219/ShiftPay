import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useLocalStorageForm
 *
 * Custom hook for multi-step form state persistence via localStorage.
 *
 * @param {string}  storageKey    - The localStorage key used to persist form data.
 * @param {Object}  initialState  - The default shape / values for the form.
 * @returns {[Object, Function, Function, Function, boolean]}
 *   [formData, updateField, updateFields, clearForm, isLoaded]
 *
 * - formData     : current form state object
 * - updateField  : (fieldName, value) => void  — update a single field
 * - updateFields : (partialState)     => void  — merge multiple fields at once
 * - clearForm    : ()                 => void  — reset to initialState and remove from storage
 * - isLoaded     : boolean — true once the stored data has been read;
 *                  prevents a flash of empty / default form values on mount
 */
export default function useLocalStorageForm(storageKey, initialState) {
  const [formData, setFormData] = useState(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep a ref to initialState so clearForm always uses the latest version
  // without needing it in the dependency array.
  const initialStateRef = useRef(initialState);
  initialStateRef.current = initialState;

  // ---- Hydrate from localStorage on mount ----
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with initialState so any new fields added after the user
        // last saved still receive their defaults.
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      // If parsing fails, fall through to the initial state silently.
      console.warn(
        `[useLocalStorageForm] Failed to parse stored data for key "${storageKey}":`,
        err,
      );
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // ---- Persist to localStorage whenever formData changes ----
  useEffect(() => {
    // Don't write until the initial load has completed.
    if (!isLoaded) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (err) {
      console.warn(
        `[useLocalStorageForm] Failed to persist data for key "${storageKey}":`,
        err,
      );
    }
  }, [storageKey, formData, isLoaded]);

  // ---- Public API ----

  /** Update a single field by name. */
  const updateField = useCallback((fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  /** Merge a partial state object into formData. */
  const updateFields = useCallback((partial) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  }, []);

  /** Reset formData to initialState and remove the localStorage entry. */
  const clearForm = useCallback(() => {
    setFormData(initialStateRef.current);
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn(
        `[useLocalStorageForm] Failed to clear stored data for key "${storageKey}":`,
        err,
      );
    }
  }, [storageKey]);

  return [formData, updateField, updateFields, clearForm, isLoaded];
}
