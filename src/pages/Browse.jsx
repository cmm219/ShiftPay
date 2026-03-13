import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWorkers } from '../hooks/useData';
import ProfileCard from '../components/ProfileCard';
import FilterSidebar from '../components/FilterSidebar';
import LoadingSpinner from '../components/LoadingSpinner';

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

export default function Browse() {
  const { workers, loading } = useWorkers();
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ---- Derived filtered list ----
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      // Role
      if (filters.role && !w.roles.includes(filters.role)) return false;

      // City (FilterSidebar sends the city label, e.g. "Tampa")
      if (filters.city && w.city !== filters.city) return false;

      // ServSafe verified
      if (filters.servSafeVerified) {
        const ok = w.certifications?.some(
          (c) => c.type === 'ServSafe' && c.status === 'verified',
        );
        if (!ok) return false;
      }

      // Availability (match ANY selected tag)
      if (filters.availability?.length > 0) {
        const has = filters.availability.some((a) =>
          w.availabilityTags?.includes(a),
        );
        if (!has) return false;
      }

      // Min experience
      if (
        filters.minExperience !== '' &&
        Number(filters.minExperience) > 0 &&
        (w.experienceYears == null ||
          w.experienceYears < Number(filters.minExperience))
      ) {
        return false;
      }

      // Max rate (exclude if their minimum ask is above the cap)
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

  const handleFilterChange = (next) => setFilters(next);
  const handleReset = () => setFilters({ ...DEFAULT_FILTERS });

  // ---- Shared sidebar content — use embedded mode so Browse controls
  //      the mobile/desktop layout instead of FilterSidebar ----
  const sidebarContent = (
    <FilterSidebar
      filters={filters}
      onFilterChange={handleFilterChange}
      onReset={handleReset}
      embedded
    />
  );

  if (loading) return <LoadingSpinner message="Loading workers..." />;

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      {/* ====== PAGE HEADER ====== */}
      <header className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
              Browse Workers
            </h1>
            <p className="mt-1 text-text-secondary">
              Find your next great hire
            </p>
          </div>

          {/* View toggle */}
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
            {/* Result count */}
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
              /* Empty state */
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
