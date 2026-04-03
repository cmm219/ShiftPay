import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWorkers, useOpenings } from '../hooks/useData';
import ProfileCard from '../components/ProfileCard';
import FilterSidebar from '../components/FilterSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { ROLE_LIST, CITIES, ROLES } from '../utils/constants';

// ----------------------------------------------------------------
// Local filtering logic
// The existing useFilters hook assumes a different worker shape
// (flat role, availabilities, rate) than the workers data file
// (roles[], availabilityTags[], preferredRateMin/Max), so we
// filter directly here for accuracy.
// ----------------------------------------------------------------
const DEFAULT_FILTERS = {
  role: '',
  city: '',
  servSafeVerified: false,
  availability: [],
  minExperience: '',
  maxRate: '',
};

const DEFAULT_OPENING_FILTERS = {
  role: '',
  city: '',
};

const inputClasses =
  'w-full bg-bg-elevated border border-border-subtle text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors';

const labelClasses =
  'text-text-secondary text-xs uppercase tracking-wider font-medium';

// ----------------------------------------------------------------
// Opening card component (inline — no new file needed)
// ----------------------------------------------------------------
function OpeningCard({ opening }) {
  const {
    role,
    payRange,
    urgency,
    restaurantId,
    restaurantName,
    restaurantPhoto,
    restaurantCity,
    restaurantRating,
    restaurantRatingCount,
  } = opening;

  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle hover:border-accent/30 hover:shadow-lg hover:shadow-accent-glow transition-all duration-300 hover:scale-[1.02] flex flex-col overflow-hidden">
      {/* Restaurant photo */}
      <img
        src={restaurantPhoto}
        alt={restaurantName}
        className="rounded-lg w-full h-48 object-cover"
      />

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Restaurant name */}
        <div>
          <h3 className="font-semibold text-lg text-text-primary">
            {restaurantName}
          </h3>
          <p className="text-text-secondary text-sm">{restaurantCity}</p>
        </div>

        {/* Role */}
        <div className="flex flex-wrap gap-1.5">
          <Badge type="role" value={role} />
          {urgency === 'urgent' && (
            <span className="rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1 bg-danger-soft text-danger">
              Urgent
            </span>
          )}
        </div>

        {/* Pay range */}
        <p className="text-accent text-sm font-semibold">{payRange}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 text-sm">
          <span>&#11088;</span>
          <span className="text-text-primary font-medium">
            {restaurantRating}
          </span>
          <span className="text-text-muted">
            ({restaurantRatingCount} reviews)
          </span>
        </div>

        {/* Action */}
        <div className="mt-auto pt-2">
          <Link to={`/restaurant/${restaurantId}`}>
            <Button variant="secondary" size="sm" className="w-full">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Openings filter sidebar (simplified — role + city + reset)
// ----------------------------------------------------------------
function OpeningsFilterSidebar({ filters, onFilterChange, onReset }) {
  const handleChange = (key, value) => {
    onFilterChange?.({ ...filters, [key]: value });
  };

  return (
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

      {/* Reset */}
      <Button variant="ghost" size="sm" onClick={onReset} className="w-full">
        Reset Filters
      </Button>
    </div>
  );
}

// ----------------------------------------------------------------
// Main Browse page
// ----------------------------------------------------------------
export default function Browse() {
  const { workers, loading: workersLoading } = useWorkers();
  const { openings, loading: openingsLoading } = useOpenings();

  const [activeTab, setActiveTab] = useState('workers');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [openingFilters, setOpeningFilters] = useState({ ...DEFAULT_OPENING_FILTERS });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ---- Workers filtered list ----
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (filters.role && !w.roles.includes(filters.role)) return false;
      if (filters.city && w.city !== filters.city) return false;
      if (filters.servSafeVerified) {
        const ok = w.certifications?.some(
          (c) => c.type === 'ServSafe' && c.status === 'verified',
        );
        if (!ok) return false;
      }
      if (filters.availability?.length > 0) {
        const has = filters.availability.some((a) =>
          w.availabilityTags?.includes(a),
        );
        if (!has) return false;
      }
      if (
        filters.minExperience !== '' &&
        Number(filters.minExperience) > 0 &&
        (w.experienceYears == null ||
          w.experienceYears < Number(filters.minExperience))
      ) {
        return false;
      }
      if (
        filters.maxRate !== '' &&
        Number(filters.maxRate) > 0 &&
        w.preferredRateMin != null &&
        w.preferredRateMin > Number(filters.maxRate)
      ) {
        return false;
      }
      return true;
    });
  }, [filters, workers]);

  // ---- Openings filtered list ----
  const filteredOpenings = useMemo(() => {
    return openings.filter((o) => {
      if (openingFilters.role && o.role !== openingFilters.role) return false;
      if (openingFilters.city && o.restaurantCity !== openingFilters.city) return false;
      return true;
    });
  }, [openingFilters, openings]);

  const handleFilterChange = (next) => setFilters(next);
  const handleReset = () => setFilters({ ...DEFAULT_FILTERS });
  const handleOpeningFilterChange = (next) => setOpeningFilters(next);
  const handleOpeningReset = () => setOpeningFilters({ ...DEFAULT_OPENING_FILTERS });

  // ---- Sidebar content based on active tab ----
  const sidebarContent =
    activeTab === 'workers' ? (
      <FilterSidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        embedded
      />
    ) : (
      <OpeningsFilterSidebar
        filters={openingFilters}
        onFilterChange={handleOpeningFilterChange}
        onReset={handleOpeningReset}
      />
    );

  const loading = activeTab === 'workers' ? workersLoading : openingsLoading;

  if (loading) {
    return (
      <LoadingSpinner
        message={activeTab === 'workers' ? 'Loading workers...' : 'Loading openings...'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      {/* ====== PAGE HEADER ====== */}
      <header className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
              {activeTab === 'workers' ? 'Browse Workers' : 'Browse Openings'}
            </h1>
            <p className="mt-1 text-text-secondary">
              {activeTab === 'workers'
                ? 'Find your next great hire'
                : 'Find your next long-term role'}
            </p>
          </div>

          {/* View toggle (only show on workers tab) */}
          {activeTab === 'workers' && (
            <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-surface p-1">
              <button
                className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer bg-accent text-black"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Grid
              </button>

              <Link
                to="/swipe"
                className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors text-text-secondary hover:text-text-primary"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Card
              </Link>
            </div>
          )}
        </div>

        {/* ====== TAB TOGGLE ====== */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setActiveTab('workers')}
            className={`flex-1 sm:flex-none rounded-lg px-6 py-2 text-sm transition-colors cursor-pointer ${
              activeTab === 'workers'
                ? 'bg-accent text-bg-primary font-semibold'
                : 'bg-bg-surface text-text-secondary border border-border-subtle hover:text-text-primary'
            }`}
          >
            Workers
          </button>
          <button
            onClick={() => setActiveTab('openings')}
            className={`flex-1 sm:flex-none rounded-lg px-6 py-2 text-sm transition-colors cursor-pointer ${
              activeTab === 'openings'
                ? 'bg-accent text-bg-primary font-semibold'
                : 'bg-bg-surface text-text-secondary border border-border-subtle hover:text-text-primary'
            }`}
          >
            Openings
          </button>
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Mobile filter button */}
        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent bg-transparent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft cursor-pointer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* ----- Desktop sidebar ----- */}
          <div className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-20 rounded-xl border border-border-subtle bg-bg-surface p-5">
              {sidebarContent}
            </div>
          </div>

          {/* ----- Results grid ----- */}
          <div className="flex-1 min-w-0">
            {/* ===== WORKERS TAB ===== */}
            {activeTab === 'workers' && (
              <>
                <p className="mb-4 text-sm text-text-secondary">
                  Showing{' '}
                  <span className="font-semibold text-text-primary">
                    {filteredWorkers.length}
                  </span>{' '}
                  worker{filteredWorkers.length !== 1 ? 's' : ''}
                </p>

                {filteredWorkers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredWorkers.map((worker, index) => (
                      <div
                        key={worker.id}
                        className="animate-fade-in"
                        style={{
                          animationDelay: `${index * 0.07}s`,
                          opacity: 0,
                        }}
                      >
                        <ProfileCard worker={worker} onViewProfile={() => {}} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface py-20 px-6 text-center">
                    <div className="text-5xl mb-4">&#128269;</div>
                    <h3 className="font-display text-xl font-semibold text-text-primary">
                      No workers match your filters
                    </h3>
                    <p className="mt-2 max-w-sm text-text-secondary">
                      Try adjusting your filters or resetting them to see all
                      available workers.
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-6 rounded-lg border border-accent bg-transparent px-6 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ===== OPENINGS TAB ===== */}
            {activeTab === 'openings' && (
              <>
                <p className="mb-4 text-sm text-text-secondary">
                  Showing{' '}
                  <span className="font-semibold text-text-primary">
                    {filteredOpenings.length}
                  </span>{' '}
                  opening{filteredOpenings.length !== 1 ? 's' : ''}
                </p>

                {openings.length === 0 ? (
                  /* No openings at all */
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface py-20 px-6 text-center">
                    <div className="text-5xl mb-4">&#128188;</div>
                    <h3 className="font-display text-xl font-semibold text-text-primary">
                      No long-term openings available right now
                    </h3>
                    <p className="mt-2 max-w-sm text-text-secondary">
                      Check back soon or browse available shifts.
                    </p>
                  </div>
                ) : filteredOpenings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredOpenings.map((opening, index) => (
                      <div
                        key={opening.id}
                        className="animate-fade-in"
                        style={{
                          animationDelay: `${index * 0.07}s`,
                          opacity: 0,
                        }}
                      >
                        <OpeningCard opening={opening} />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Filters produced no results */
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface py-20 px-6 text-center">
                    <div className="text-5xl mb-4">&#128269;</div>
                    <h3 className="font-display text-xl font-semibold text-text-primary">
                      No openings match your filters
                    </h3>
                    <p className="mt-2 max-w-sm text-text-secondary">
                      Try broadening your search.
                    </p>
                    <button
                      onClick={handleOpeningReset}
                      className="mt-6 rounded-lg border border-accent bg-transparent px-6 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ====== MOBILE FILTER DRAWER (SLIDE-OVER) ====== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div
            className="absolute inset-y-0 left-0 w-full max-w-sm overflow-y-auto border-r border-border-subtle bg-bg-surface shadow-2xl"
            style={{ animation: 'slide-in-left 0.25s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Filters
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary cursor-pointer"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5">{sidebarContent}</div>
          </div>
        </div>
      )}

      {/* Drawer slide animation */}
      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
