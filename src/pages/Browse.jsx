import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWorkers, useOpenings } from '../hooks/useData';
import { useSavedJobs } from '../hooks/useSavedJobs';
import LoadingSpinner from '../components/LoadingSpinner';
import { ROLE_LIST, ROLES, CITIES } from '../utils/constants';
import { isActiveOpening } from '../utils/postingLifecycle';
import { isSaveableLongTermOpening } from '../utils/savedJobs';

// ─────────────────────────────────────────────────────────────
// Inline SVG icons — kept local so the page has no extra deps
// ─────────────────────────────────────────────────────────────
function Icon({ name, className = 'h-4 w-4', strokeWidth = 2 }) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (name) {
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'star':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M12 .5l3.6 7.3 8 .9-5.8 5.6 1.5 8L12 18.5l-7.3 3.8 1.5-8L.4 8.7l8-.9L12 .5z" />
        </svg>
      );
    case 'verified':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77l-4.94 2.6L8 11.9 4 8l5.61-1.16L12 2z" />
        </svg>
      );
    case 'info':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case 'sliders':
      return (
        <svg {...props}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case 'cards':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case 'swipe':
      return (
        <svg {...props}>
          <path d="M9 11V6a3 3 0 0 1 6 0v5" />
          <path d="M9 11h6v8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-8z" />
        </svg>
      );
    case 'close':
      return (
        <svg {...props}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    default:
      return null;
  }
}

// Certifications/availability filter options (from seed data)
const CERT_OPTIONS = [
  { id: 'ServSafe', label: 'ServSafe' },
  { id: 'TIPS', label: 'TIPS' },
  { id: 'Food Handler', label: 'Food Handler' },
  { id: 'CPR/First Aid', label: 'CPR / First Aid' },
  { id: 'Alcohol Awareness', label: 'Alcohol Awareness' },
];

const AVAILABILITY_OPTIONS = [
  { id: 'Weekends', label: 'Weekends' },
  { id: 'Full-time', label: 'Full-time' },
  { id: 'Part-time', label: 'Part-time' },
  { id: 'On-call', label: 'On-call' },
];

const RATE_MIN = 15;
const RATE_MAX = 45;

const DEFAULT_FILTERS = {
  search: '',
  roles: [],
  city: '',
  rateMax: RATE_MAX,
  certs: [],
  availability: [],
};

const DEFAULT_OPENING_FILTERS = {
  search: '',
  roles: [],
  city: '',
};

const WORKER_SORTS = [
  { id: 'rating', label: 'Highest rated' },
  { id: 'experience', label: 'Most experienced' },
  { id: 'rateAsc', label: 'Lowest rate' },
  { id: 'rateDesc', label: 'Highest rate' },
  { id: 'reviews', label: 'Most reviewed' },
];

const OPENING_SORTS = [
  { id: 'rating', label: 'Company rating' },
  { id: 'urgency', label: 'Urgent first' },
  { id: 'recent', label: 'Recently posted' },
];

// ─────────────────────────────────────────────────────────────
// Worker card — matches approved design (photo top, hierarchy)
// ─────────────────────────────────────────────────────────────
function WorkerBrowseCard({ worker }) {
  const servSafe = worker.certifications?.some(
    (c) => c.type === 'ServSafe' && c.status === 'verified',
  );
  return (
    <article className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex gap-3.5">
        <img
          src={worker.photoUrl}
          alt={worker.name}
          className="h-16 w-16 shrink-0 rounded-xl border border-border-subtle object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-text-primary">
            <span className="truncate">{worker.name}</span>
            {servSafe && (
              <span className="text-success" title="Verified ServSafe">
                <Icon name="verified" className="h-3.5 w-3.5" />
              </span>
            )}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-text-muted">
            <span>
              {worker.city}, FL
            </span>
            <span>
              {worker.experienceYears} yrs
            </span>
          </div>
          <span className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-accent">
            <Icon name="star" className="h-3 w-3" />
            {worker.ratingAverage}{' '}
            <span className="text-text-muted">({worker.ratingCount})</span>
          </span>
        </div>
      </div>

      {worker.bio && (
        <p className="my-3.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-text-secondary">
          {worker.bio}
        </p>
      )}

      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {worker.roles?.map((r) => (
          <span
            key={r}
            className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-text-secondary uppercase"
          >
            {ROLES[r]?.label || r}
          </span>
        ))}
        {worker.certifications
          ?.filter((c) => c.status === 'verified')
          .slice(0, 3)
          .map((c) => (
            <span
              key={c.type}
              className="rounded border border-accent/25 bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-accent uppercase"
            >
              {c.type}
            </span>
          ))}
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle pt-3.5">
        <div className="font-mono text-[13px]">
          <strong className="font-semibold text-text-primary">
            ${worker.preferredRateMin}–{worker.preferredRateMax}
          </strong>{' '}
          <span className="text-text-muted">/ hr</span>
        </div>
        <Link
          to={`/worker/${worker.id}`}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-accent-hover"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Opening card — matches approved design
// ─────────────────────────────────────────────────────────────
function OpeningCard({ opening, savedJobs, onSaveClick }) {
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
    expiryLabel,
    lifecycleStatus,
  } = opening;

  const saved = savedJobs.isSaved(opening.id);

  return (
    <article className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex gap-3.5">
        <img
          src={restaurantPhoto}
          alt={restaurantName}
          className="h-16 w-16 shrink-0 rounded-xl border border-border-subtle object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-text-primary">
            {restaurantName}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-text-muted">
            <span>{restaurantCity}</span>
            {restaurantRating != null && (
              <span className="inline-flex items-center gap-1 font-mono text-accent">
                <Icon name="star" className="h-3 w-3" />
                {restaurantRating}{' '}
                <span className="text-text-muted">
                  ({restaurantRatingCount})
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="my-3.5 flex flex-1 flex-wrap gap-1.5">
        <span className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-text-secondary uppercase">
          {ROLES[role]?.label || role}
        </span>
        {urgency === 'urgent' && (
          <span className="rounded border border-danger/30 bg-danger-soft px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-danger uppercase">
            Urgent
          </span>
        )}
        {lifecycleStatus === 'expiring_soon' && (
          <span className="rounded border border-warning/30 bg-warning-soft px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-warning uppercase">
            Expiring soon
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle pt-3.5">
        <div className="font-mono text-[13px] font-semibold text-accent">
          {payRange}
          {expiryLabel && (
            <div className="mt-0.5 text-[10px] font-medium text-text-muted">
              {expiryLabel}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!savedJobs.isHiringTeam && isSaveableLongTermOpening(opening) && (
            <button
              type="button"
              onClick={() => onSaveClick(opening)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                saved
                  ? 'border-success/35 bg-success-soft text-success'
                  : 'border-border-subtle bg-transparent text-text-primary hover:border-border-strong hover:bg-bg-surface-hover'
              }`}
              aria-label={saved ? `Unsave ${restaurantName} ${role} job` : `Save ${restaurantName} ${role} job`}
            >
              {saved ? 'Saved' : 'Save job'}
            </button>
          )}
          <Link
            to={`/company/${restaurantId}`}
            className="rounded-md border border-border-subtle bg-transparent px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:border-border-strong hover:bg-bg-surface-hover"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter rail
// ─────────────────────────────────────────────────────────────
function FilterRail({
  filters,
  setFilters,
  openingFilters,
  setOpeningFilters,
  activeTab,
  onReset,
}) {
  const isWorkers = activeTab === 'workers';
  const state = isWorkers ? filters : openingFilters;
  const setState = isWorkers ? setFilters : setOpeningFilters;

  const toggleArrayValue = (key, value) => {
    const current = state[key] || [];
    setState({
      ...state,
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <div className="mb-2 font-mono text-[10px] tracking-widest text-text-muted uppercase">
          Search
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface-hover px-3 py-2">
          <Icon name="search" className="h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            value={state.search || ''}
            onChange={(e) => setState({ ...state, search: e.target.value })}
            placeholder={isWorkers ? 'Name, city, role…' : 'Company, role…'}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Role chips (multi-select) */}
      <div>
        <div className="mb-2 font-mono text-[10px] tracking-widest text-text-muted uppercase">
          Role
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_LIST.map((role) => {
            const active = (state.roles || []).includes(role.id);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleArrayValue('roles', role.id)}
                className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? 'border-accent/35 bg-accent-soft text-accent'
                    : 'border-border-subtle bg-bg-surface-hover text-text-secondary hover:border-border-strong'
                }`}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* City */}
      <div>
        <div className="mb-2 font-mono text-[10px] tracking-widest text-text-muted uppercase">
          City
        </div>
        <select
          value={state.city || ''}
          onChange={(e) => setState({ ...state, city: e.target.value })}
          className="w-full cursor-pointer rounded-lg border border-border-subtle bg-bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none transition-colors hover:border-border-strong focus:border-accent"
        >
          <option value="">All Florida cities</option>
          {CITIES.map((c) => (
            <option key={c.id} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Workers-only sections */}
      {isWorkers && (
        <>
          {/* Hourly rate slider */}
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Max hourly rate
            </div>
            <input
              type="range"
              min={RATE_MIN}
              max={RATE_MAX}
              step={1}
              value={state.rateMax}
              onChange={(e) =>
                setFilters({ ...filters, rateMax: Number(e.target.value) })
              }
              className="w-full accent-accent"
            />
            <div className="mt-1 flex justify-between font-mono text-[11px] text-text-muted">
              <span>${RATE_MIN}</span>
              <span className="text-accent">${state.rateMax}</span>
              <span>${RATE_MAX}+</span>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Certifications
            </div>
            <div className="flex flex-col gap-1.5">
              {CERT_OPTIONS.map((cert) => (
                <label
                  key={cert.id}
                  className="flex cursor-pointer items-center justify-between text-sm text-text-secondary"
                >
                  <span>{cert.label}</span>
                  <input
                    type="checkbox"
                    checked={(state.certs || []).includes(cert.id)}
                    onChange={() => toggleArrayValue('certs', cert.id)}
                    className="h-4 w-4 cursor-pointer accent-accent"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Availability
            </div>
            <div className="flex flex-col gap-1.5">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center justify-between text-sm text-text-secondary"
                >
                  <span>{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={(state.availability || []).includes(opt.id)}
                    onChange={() => toggleArrayValue('availability', opt.id)}
                    className="h-4 w-4 cursor-pointer accent-accent"
                  />
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onReset}
        className="w-full cursor-pointer rounded-lg border border-border-subtle bg-transparent px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
      >
        Reset filters
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Browse page
// ─────────────────────────────────────────────────────────────
export default function Browse() {
  const { workers, loading: workersLoading } = useWorkers();
  const { openings, loading: openingsLoading } = useOpenings();
  const savedJobs = useSavedJobs();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('workers');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [openingFilters, setOpeningFilters] = useState({
    ...DEFAULT_OPENING_FILTERS,
  });
  const [workerSort, setWorkerSort] = useState('rating');
  const [openingSort, setOpeningSort] = useState('urgency');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ─── Workers filter + sort ───────────────────────────────
  const filteredWorkers = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    let list = workers.filter((w) => {
      if (term) {
        const haystack = [
          w.name,
          w.city,
          ...(w.roles || []).map((r) => ROLES[r]?.label || r),
          ...(w.roles || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (filters.roles.length > 0) {
        const matchesRole = filters.roles.some((r) => w.roles?.includes(r));
        if (!matchesRole) return false;
      }
      if (filters.city && w.city !== filters.city) return false;
      if (
        filters.rateMax < RATE_MAX &&
        w.preferredRateMin != null &&
        w.preferredRateMin > filters.rateMax
      ) {
        return false;
      }
      if (filters.certs.length > 0) {
        const verifiedCerts = (w.certifications || [])
          .filter((c) => c.status === 'verified')
          .map((c) => c.type);
        const hasAll = filters.certs.every((c) => verifiedCerts.includes(c));
        if (!hasAll) return false;
      }
      if (filters.availability.length > 0) {
        const has = filters.availability.some((a) =>
          (w.availabilityTags || []).includes(a),
        );
        if (!has) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (workerSort) {
        case 'experience':
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        case 'rateAsc':
          return (a.preferredRateMin || 0) - (b.preferredRateMin || 0);
        case 'rateDesc':
          return (b.preferredRateMin || 0) - (a.preferredRateMin || 0);
        case 'reviews':
          return (b.ratingCount || 0) - (a.ratingCount || 0);
        case 'rating':
        default:
          return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      }
    });

    return list;
  }, [workers, filters, workerSort]);

  // ─── Openings filter + sort ──────────────────────────────
  const filteredOpenings = useMemo(() => {
    const term = openingFilters.search.trim().toLowerCase();
    let list = openings.filter((o) => {
      if (!isActiveOpening(o)) return false;
      if (term) {
        const haystack = [
          o.restaurantName,
          o.restaurantCity,
          ROLES[o.role]?.label || o.role,
          o.role,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (
        openingFilters.roles.length > 0 &&
        !openingFilters.roles.includes(o.role)
      ) {
        return false;
      }
      if (openingFilters.city && o.restaurantCity !== openingFilters.city)
        return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (openingSort) {
        case 'urgency': {
          const urgencyScore = (u) => (u === 'urgent' ? 1 : 0);
          return urgencyScore(b.urgency) - urgencyScore(a.urgency);
        }
        case 'recent':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'rating':
        default:
          return (b.restaurantRating || 0) - (a.restaurantRating || 0);
      }
    });
    return list;
  }, [openings, openingFilters, openingSort]);

  const handleReset = () => {
    if (activeTab === 'workers') {
      setFilters({ ...DEFAULT_FILTERS });
    } else {
      setOpeningFilters({ ...DEFAULT_OPENING_FILTERS });
    }
  };

  const handleSaveJob = (opening) => {
    if (savedJobs.canSaveJobs) {
      if (!isSaveableLongTermOpening(opening)) return;
      savedJobs.toggle(opening.id);
      return;
    }

    if (savedJobs.isHiringTeam) return;

    const params = new URLSearchParams({
      saveJob: String(opening.id),
      returnTo: `${location.pathname}${location.search}`,
    });
    navigate(`/login?${params.toString()}`);
  };

  const loading = activeTab === 'workers' ? workersLoading : openingsLoading;

  // Summary of active worker filters for the page subtitle
  const activeFilterSummary = useMemo(() => {
    if (activeTab !== 'workers') return null;
    const parts = [];
    if (filters.roles.length > 0) {
      parts.push(
        filters.roles.map((r) => ROLES[r]?.label || r).join(', '),
      );
    } else {
      parts.push('All roles');
    }
    parts.push(filters.city || 'All Florida cities');
    if (filters.certs.length > 0) {
      parts.push(`${filters.certs.join(' + ')} verified`);
    }
    if (filters.rateMax < RATE_MAX) {
      parts.push(`≤ $${filters.rateMax}/hr`);
    }
    return parts.join(' · ');
  }, [filters, activeTab]);

  const rail = (
    <FilterRail
      filters={filters}
      setFilters={setFilters}
      openingFilters={openingFilters}
      setOpeningFilters={setOpeningFilters}
      activeTab={activeTab}
      onReset={handleReset}
    />
  );

  if (loading) {
    return (
      <LoadingSpinner
        message={
          activeTab === 'workers'
            ? 'Loading workers...'
            : 'Loading jobs...'
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      {/* Demo banner */}
      <div className="flex items-center gap-2.5 border-b border-accent/20 bg-accent-soft px-6 py-2.5 text-sm">
        <Icon name="info" className="h-3.5 w-3.5 text-accent" />
        <span className="font-mono text-[11px] tracking-wider text-accent uppercase">
          Demo data
        </span>
        <span className="text-[#f5d27d]">
          Browsing {workers.length} seeded workers and {openings.filter(isActiveOpening).length} active jobs.
          Search, sort, and filters are local client-side demo controls — no live
          applications are sent.
        </span>
      </div>

      {/* Browse shell */}
      <div className="grid lg:grid-cols-[260px_1fr]">
        {/* ===== Desktop filter rail ===== */}
        <aside className="hidden border-r border-border-subtle bg-bg-surface/40 px-6 py-7 lg:block">
          <div className="sticky top-20">{rail}</div>
        </aside>

        {/* ===== Main column ===== */}
        <main className="px-5 py-6 md:px-8">
          {/* Crumbs + quick search */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-[11px] text-text-muted">
              / <span className="text-text-secondary">Browse</span> · marketplace
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 sm:flex sm:w-[320px]">
              <Icon name="search" className="h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                value={
                  activeTab === 'workers'
                    ? filters.search
                    : openingFilters.search
                }
                onChange={(e) => {
                  if (activeTab === 'workers')
                    setFilters({ ...filters, search: e.target.value });
                  else
                    setOpeningFilters({
                      ...openingFilters,
                      search: e.target.value,
                    });
                }}
                placeholder="Quick search this view…"
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Page heading */}
          <div className="mb-5">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
              {activeTab === 'workers' ? 'Workers near you' : 'Open jobs'}
            </h1>
            <p className="mt-1 text-xs text-text-muted">
              {activeTab === 'workers'
                ? `Filtered by ${activeFilterSummary}`
                : `${openings.filter(isActiveOpening).length} active long-term jobs across seeded hiring teams`}
            </p>
          </div>

          {/* Tab switch + sort */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-border-subtle bg-bg-surface p-1">
              <button
                type="button"
                onClick={() => setActiveTab('workers')}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-sm transition-colors ${
                  activeTab === 'workers'
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon name="cards" className="h-3.5 w-3.5" />
                Workers
                <span
                  className={`rounded bg-bg-surface-hover px-1.5 py-0.5 font-mono text-[10px] ${
                    activeTab === 'workers' ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  {filteredWorkers.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('openings')}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-sm transition-colors ${
                  activeTab === 'openings'
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Jobs
                <span
                  className={`rounded bg-bg-surface-hover px-1.5 py-0.5 font-mono text-[10px] ${
                    activeTab === 'openings' ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  {filteredOpenings.length}
                </span>
              </button>
              <Link
                to="/swipe"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                <Icon name="swipe" className="h-3.5 w-3.5" />
                Swipe view
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm text-text-secondary hover:border-border-strong hover:text-text-primary lg:hidden"
              >
                <Icon name="sliders" className="h-3.5 w-3.5" />
                Filters
              </button>
              <span className="hidden font-mono text-[11px] tracking-widest text-text-muted uppercase sm:inline">
                Sort
              </span>
              {activeTab === 'workers' ? (
                <select
                  value={workerSort}
                  onChange={(e) => setWorkerSort(e.target.value)}
                  className="cursor-pointer rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm text-text-secondary outline-none transition-colors hover:border-border-strong focus:border-accent"
                >
                  {WORKER_SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={openingSort}
                  onChange={(e) => setOpeningSort(e.target.value)}
                  className="cursor-pointer rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm text-text-secondary outline-none transition-colors hover:border-border-strong focus:border-accent"
                >
                  {OPENING_SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Grid */}
          {activeTab === 'workers' ? (
            filteredWorkers.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {filteredWorkers.map((worker, index) => (
                  <div
                    key={worker.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.04}s`, opacity: 0 }}
                  >
                    <WorkerBrowseCard worker={worker} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No workers match your filters"
                body="Try clearing role chips, raising the rate cap, or removing a cert requirement."
                onReset={handleReset}
              />
            )
          ) : filteredOpenings.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {filteredOpenings.map((opening, index) => (
                <div
                  key={opening.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.04}s`, opacity: 0 }}
                >
                  <OpeningCard
                    opening={opening}
                    savedJobs={savedJobs}
                    onSaveClick={handleSaveJob}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No jobs match your filters"
              body="Try broadening the search or clearing the city filter."
              onReset={handleReset}
            />
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-full max-w-sm overflow-y-auto border-r border-border-subtle bg-bg-surface shadow-2xl"
            style={{ animation: 'slide-in-left 0.25s ease-out' }}
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{rail}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ title, body, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface px-6 py-16 text-center">
      <div className="mb-3 text-text-muted">
        <Icon name="search" className="h-8 w-8" />
      </div>
      <h3 className="font-display text-lg font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">{body}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 cursor-pointer rounded-lg border border-accent bg-transparent px-5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
      >
        Reset filters
      </button>
    </div>
  );
}
