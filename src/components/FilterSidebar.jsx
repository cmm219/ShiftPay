import { useState } from 'react';
import Button from './Button';
import { ROLE_LIST, CITIES, AVAILABILITY_LIST } from '../utils/constants';

const inputClasses =
  'w-full bg-bg-elevated border border-border-subtle text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors';

const labelClasses =
  'text-text-secondary text-xs uppercase tracking-wider font-medium';

export default function FilterSidebar({ filters, onFilterChange, onReset, embedded = false }) {
  const [open, setOpen] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange?.({ ...filters, [key]: value });
  };

  const handleAvailabilityToggle = (label) => {
    const current = filters.availability || [];
    const next = current.includes(label)
      ? current.filter((a) => a !== label)
      : [...current, label];
    handleChange('availability', next);
  };

  const sidebar = (
    <div className="flex flex-col gap-6">
      {/* Role */}
      <div className="flex flex-col gap-2">
        <label className={labelClasses}>Role</label>
        <select
          className={inputClasses}
          value={filters.role || ''}
          onChange={(e) => handleChange('role', e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLE_LIST.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="flex flex-col gap-2">
        <label className={labelClasses}>City</label>
        <select
          className={inputClasses}
          value={filters.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
        >
          <option value="">All Cities</option>
          {CITIES.map((city) => (
            <option key={city.id} value={city.label}>
              {city.label}
            </option>
          ))}
        </select>
      </div>

      {/* ServSafe Verified */}
      <div className="flex flex-col gap-2">
        <label className={labelClasses}>ServSafe Verified</label>
        <button
          type="button"
          role="switch"
          aria-checked={!!filters.servSafeVerified}
          onClick={() =>
            handleChange('servSafeVerified', !filters.servSafeVerified)
          }
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
            filters.servSafeVerified ? 'bg-accent' : 'bg-bg-elevated'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              filters.servSafeVerified ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Availability */}
      <div className="flex flex-col gap-2">
        <label className={labelClasses}>Availability</label>
        <div className="flex flex-col gap-2">
          {AVAILABILITY_LIST.map((avail) => (
            <label
              key={avail.id}
              className="flex items-center gap-2 text-sm text-text-primary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={(filters.availability || []).includes(avail.label)}
                onChange={() => handleAvailabilityToggle(avail.label)}
                className="accent-accent h-4 w-4 rounded"
              />
              {avail.label}
            </label>
          ))}
        </div>
      </div>

      {/* Min Experience */}
      <div className="flex flex-col gap-2">
        <label className={labelClasses}>Min Experience (years)</label>
        <input
          type="number"
          min={0}
          className={inputClasses}
          value={filters.minExperience ?? ''}
          onChange={(e) =>
            handleChange(
              'minExperience',
              e.target.value === '' ? '' : Number(e.target.value)
            )
          }
          placeholder="0"
        />
      </div>

      {/* Max Rate */}
      <div className="flex flex-col gap-2">
        <label className={labelClasses}>Max Rate ($/hr)</label>
        <input
          type="number"
          min={0}
          className={inputClasses}
          value={filters.maxRate ?? ''}
          onChange={(e) =>
            handleChange(
              'maxRate',
              e.target.value === '' ? '' : Number(e.target.value)
            )
          }
          placeholder="45"
        />
      </div>

      {/* Reset */}
      <Button variant="ghost" size="sm" onClick={onReset} className="w-full">
        Reset Filters
      </Button>
    </div>
  );

  // When embedded, render only the form content without mobile/desktop wrappers.
  // Useful when a parent component (e.g. Browse page) controls its own layout.
  if (embedded) return sidebar;

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full"
        >
          {open ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Mobile collapsible */}
      {open && (
        <div className="lg:hidden bg-bg-surface rounded-xl border border-border-subtle p-5 mb-6">
          {sidebar}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block bg-bg-surface rounded-xl border border-border-subtle p-5 sticky top-20">
        {sidebar}
      </aside>
    </>
  );
}
