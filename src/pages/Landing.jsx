import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useWorkers, useOpenings } from '../hooks/useData';
import { ROLES } from '../utils/constants';
import { isActiveOpening } from '../utils/postingLifecycle';

// ──────────────────────────────────────────────────────────
// Inline SVG icon set — line icons only (no emoji deps)
// ──────────────────────────────────────────────────────────
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
    case 'arrow-right':
      return (
        <svg {...props}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props} strokeWidth={2.5}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'play':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <polygon points="5 3 19 12 5 21 5 3" />
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
    case 'user':
      return (
        <svg {...props}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'building':
      return (
        <svg {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'compass':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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
    case 'cook':
      return (
        <svg {...props} strokeWidth={1.8}>
          <path d="M6 8h12l-1 12H7L6 8z" />
          <path d="M9 8V5a3 3 0 0 1 6 0v3" />
        </svg>
      );
    case 'server':
      return (
        <svg {...props} strokeWidth={1.8}>
          <path d="M3 11h18l-1 9H4z" />
          <path d="M12 11V4" />
          <path d="M9 4h6" />
        </svg>
      );
    case 'bartender':
      return (
        <svg {...props} strokeWidth={1.8}>
          <path d="M4 3h16l-7 9v7h3v2H8v-2h3v-7L4 3z" />
        </svg>
      );
    case 'host':
      return (
        <svg {...props} strokeWidth={1.8}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="12" y2="16" />
        </svg>
      );
    case 'dishwasher':
      return (
        <svg {...props} strokeWidth={1.8}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16M4 12h16" />
        </svg>
      );
    case 'barback':
      return (
        <svg {...props} strokeWidth={1.8}>
          <path d="M5 9l1.5-5h11L19 9" />
          <rect x="3" y="9" width="18" height="11" rx="1" />
        </svg>
      );
    default:
      return null;
  }
}

const ROLE_TILES = [
  { id: 'cook', label: 'Cook', sub: 'Line · prep' },
  { id: 'server', label: 'Server', sub: 'FOH' },
  { id: 'bartender', label: 'Bartender', sub: 'Bar' },
  { id: 'host', label: 'Host', sub: 'FOH' },
  { id: 'dishwasher', label: 'Dishwasher', sub: 'BOH' },
  { id: 'barback', label: 'Barback', sub: 'Bar support' },
];

const BUILT_ITEMS = [
  {
    title: 'Worker & restaurant signup',
    body: 'Multi-step onboarding forms with role, certification, availability, and restaurant profile inputs.',
  },
  {
    title: 'Browse workers + jobs',
    body: 'Filters, sort, search, tabbed marketplace view, detail routes for every card.',
  },
  {
    title: 'Post a job',
    body: 'Restaurant posting flow for role, city, rate, description, and optional event-shift timing.',
  },
  {
    title: 'Worker + restaurant dashboards',
    body: 'Per-role views of activity and seeded shift / opening state.',
  },
  {
    title: 'Swipe + profile detail',
    body: 'Tinder-style discovery view and full worker/restaurant profile pages.',
  },
  {
    title: 'Tailwind v4 design tokens',
    body: 'Single source of truth in index.css — palette, type, motion.',
  },
];

// ──────────────────────────────────────────────────────────
// Preview card — uses real seeded workers
// ──────────────────────────────────────────────────────────
function PreviewWorkerCard({ worker, featured = false, muted = false }) {
  const servSafe = worker.certifications?.some(
    (c) => c.type === 'ServSafe' && c.status === 'verified',
  );
  const roleLabels = (worker.roles || [])
    .map((r) => ROLES[r]?.label || r)
    .join(' · ');

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        featured
          ? 'border-accent/35 bg-gradient-to-b from-accent-soft to-bg-surface-hover'
          : 'border-border-subtle bg-bg-surface-hover'
      } ${muted ? 'opacity-65' : ''}`}
    >
      <div className="flex gap-3.5">
        <img
          src={worker.photoUrl}
          alt={worker.name}
          className="h-14 w-14 shrink-0 rounded-lg border border-border-subtle object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-[15px] font-semibold text-text-primary">
              {worker.name}
            </h4>
            {servSafe && (
              <span className="text-success" title="Verified certifications">
                <Icon name="verified" className="h-3.5 w-3.5" />
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-accent">
              <Icon name="star" className="h-3 w-3" />
              {worker.ratingAverage}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-text-muted">
            <span>{roleLabels}</span>
            <span>{worker.city}, FL</span>
            <span>{worker.experienceYears} yrs</span>
          </div>
          {!muted && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {worker.certifications?.slice(0, 2).map((c) => (
                <span
                  key={c.type}
                  className="rounded border border-accent/25 bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-accent uppercase"
                >
                  {c.type}
                </span>
              ))}
              {worker.restaurantTypes?.slice(0, 1).map((t) => (
                <span
                  key={t}
                  className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-text-secondary uppercase"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {featured && (
        <div className="mt-3.5 flex items-center justify-between border-t border-border-subtle pt-3">
          <div className="font-mono text-[13px]">
            <strong className="font-semibold text-text-primary">
              ${worker.preferredRateMin}–{worker.preferredRateMax}
            </strong>{' '}
            <span className="text-text-muted">/ hr</span>
          </div>
          <Link
            to={`/worker/${worker.id}`}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-black hover:bg-accent-hover"
          >
            View profile
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const { workers } = useWorkers();
  const { openings } = useOpenings();
  const [previewTab, setPreviewTab] = useState('workers');

  const workerCount = workers.length;
  const activeOpenings = openings.filter(isActiveOpening);
  const openingCount = activeOpenings.length;
  const featured = workers[0];
  const secondary = workers[1];
  const tertiary = workers[2];

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      {/* ====== DEMO BANNER ====== */}
      <div className="flex items-center gap-2.5 border-b border-accent/20 bg-accent-soft px-6 py-2.5 text-sm">
        <Icon name="info" className="h-3.5 w-3.5 text-accent" />
        <span className="font-mono text-[11px] tracking-wider text-accent uppercase">
          Demo mode
        </span>
        <span className="text-[#f5d27d]">
          Portfolio MVP. Profiles, ratings, and shifts are seeded mock data — no real
          workers, restaurants, or payments are involved.
        </span>
      </div>

      {/* ====== HERO ====== */}
      <section
        className="border-b border-border-subtle px-6 py-16 md:px-12 md:py-20"
        style={{
          background:
            'radial-gradient(900px 400px at 90% -10%, var(--color-accent-soft), transparent 60%), linear-gradient(180deg, #0c0c0c, var(--color-bg-primary))',
        }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.05fr_1fr] md:gap-14">
          {/* Left: hero copy */}
          <div className="animate-fade-in">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-3 py-1 font-mono text-[11px] text-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Hospitality staffing marketplace · demo build
            </div>
            <h1 className="font-display text-4xl leading-[1.07] font-semibold tracking-tight text-text-primary md:text-[56px]">
              The restaurant hiring flow for operators,{' '}
              <em className="not-italic text-accent">prototyped end&#8209;to&#8209;end.</em>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
              ShiftPay is a marketplace concept for matching restaurants with vetted
              front- and back-of-house workers. The demo lets you browse profiles,
              inspect open jobs, walk through posting a role, and review dashboard states against
              seeded data — every screen is clickable.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
              >
                Open browse demo
                <Icon name="arrow-right" className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/swipe"
                className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-transparent px-5 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-border-strong hover:bg-bg-surface"
              >
                <Icon name="play" className="h-3.5 w-3.5" />
                Try swipe view
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 font-mono text-xs text-text-muted">
              <span className="inline-flex items-center gap-2">
                <Icon name="check" className="h-3.5 w-3.5 text-success" />
                Browse, signup, profile, dashboard routes
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="check" className="h-3.5 w-3.5 text-success" />
                {workerCount} mock workers · {openingCount} active jobs seeded
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="check" className="h-3.5 w-3.5 text-success" />
                Mobile + desktop responsive
              </span>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-2xl shadow-black/40 md:p-5">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="inline-flex gap-0.5 rounded-lg border border-border-subtle bg-bg-surface-hover p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('workers')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition-colors cursor-pointer ${
                      previewTab === 'workers'
                        ? 'bg-bg-elevated text-text-primary'
                        : 'text-text-secondary'
                    }`}
                  >
                    Workers
                    <span className="font-mono text-[10px] text-text-muted">
                      {workerCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('openings')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition-colors cursor-pointer ${
                      previewTab === 'openings'
                        ? 'bg-bg-elevated text-text-primary'
                        : 'text-text-secondary'
                    }`}
                  >
                    Jobs
                    <span className="font-mono text-[10px] text-text-muted">
                      {openingCount}
                    </span>
                  </button>
                </div>
                <span className="font-mono text-[11px] text-text-muted">
                  /browse · live preview
                </span>
              </div>

              {previewTab === 'workers' ? (
                <div className="flex flex-col gap-2.5">
                  {featured && <PreviewWorkerCard worker={featured} featured />}
                  {secondary && <PreviewWorkerCard worker={secondary} />}
                  {tertiary && <PreviewWorkerCard worker={tertiary} muted />}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {activeOpenings.slice(0, 3).map((opening, i) => (
                    <Link
                      key={opening.id || i}
                      to={`/restaurant/${opening.restaurantId}`}
                      className={`block rounded-xl border p-4 transition-colors ${
                        i === 0
                          ? 'border-accent/35 bg-gradient-to-b from-accent-soft to-bg-surface-hover'
                          : 'border-border-subtle bg-bg-surface-hover hover:border-border-strong'
                      } ${i === 2 ? 'opacity-65' : ''}`}
                    >
                      <div className="flex gap-3.5">
                        {opening.restaurantPhoto && (
                          <img
                            src={opening.restaurantPhoto}
                            alt={opening.restaurantName}
                            className="h-14 w-14 shrink-0 rounded-lg border border-border-subtle object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-[15px] font-semibold text-text-primary">
                            {opening.restaurantName}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-text-muted">
                            <span className="capitalize">{opening.role}</span>
                            <span>{opening.restaurantCity}</span>
                            {opening.urgency === 'urgent' && (
                              <span className="font-mono text-[10px] tracking-wider text-danger uppercase">
                                Urgent
                              </span>
                            )}
                          </div>
                          {i === 0 && (
                            <div className="mt-2 font-mono text-[13px] text-accent">
                              {opening.payRange}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====== WORKFLOW ====== */}
      <section className="border-b border-border-subtle px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 max-w-3xl">
            <div className="mb-2.5 font-mono text-[11px] tracking-widest text-accent uppercase">
              How the demo flow works
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
              Three roles, one round-trip you can click through.
            </h2>
            <p className="mt-3 max-w-xl text-text-secondary">
              Sign up as a worker, post as a restaurant, browse the marketplace — every
              step lives on a real route with seeded data and the same state model.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                num: '01 · Worker',
                icon: 'user',
                title: 'Build a profile',
                body: 'Roles, certifications, availability, and preferred rate. Verified certs surface in browse with a tick.',
                foot: '/worker/signup',
                to: '/worker/signup',
              },
              {
                num: '02 · Restaurant',
                icon: 'building',
                title: 'Post a job',
                body: 'Role, city, rate, description, and lifecycle state. Event-shift timing is available for banquet or catering work.',
                foot: '/post-shift',
                to: '/restaurant/signup',
              },
              {
                num: '03 · Explore',
                icon: 'compass',
                title: 'Browse & review',
                body: 'Inspect worker profiles, open restaurant pages, and review dashboard states against seeded data.',
                foot: '/browse · /dashboard',
                to: '/browse',
              },
            ].map((step) => (
              <Link
                key={step.num}
                to={step.to}
                className="group rounded-xl border border-border-subtle bg-bg-surface p-6 transition-colors hover:border-border-strong"
              >
                <div className="mb-4 grid h-9 w-9 place-items-center rounded-lg border border-accent/20 bg-accent-soft text-accent">
                  <Icon name={step.icon} className="h-4 w-4" />
                </div>
                <div className="font-mono text-[11px] tracking-widest text-accent">
                  {step.num}
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {step.body}
                </p>
                <div className="mt-4 flex items-center gap-1.5 border-t border-border-subtle pt-3.5 font-mono text-[11px] text-text-muted">
                  <Icon name="arrow-right" className="h-3 w-3" />
                  {step.foot}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== WHAT'S BUILT ====== */}
      <section className="border-b border-border-subtle px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 max-w-3xl">
            <div className="mb-2.5 font-mono text-[11px] tracking-widest text-accent uppercase">
              What's actually built
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
              Implemented surfaces.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {BUILT_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4"
              >
                <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded bg-success-soft text-success">
                  <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== ROLE TILES ====== */}
      <section className="border-b border-border-subtle px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 max-w-3xl">
            <div className="mb-2.5 font-mono text-[11px] tracking-widest text-accent uppercase">
              Roles in the seed data
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
              Six FOH / BOH role types covered.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
            {ROLE_TILES.map((role) => (
              <div
                key={role.id}
                className="rounded-xl border border-border-subtle bg-bg-surface p-4 text-center transition-colors hover:border-border-strong"
              >
                <div className="mx-auto mb-2 grid h-9 w-9 place-items-center text-accent">
                  <Icon name={role.id} className="h-6 w-6" />
                </div>
                <h5 className="text-sm font-semibold text-text-primary">
                  {role.label}
                </h5>
                <p className="mt-1 font-mono text-[10px] text-text-muted">
                  {role.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-text-muted md:flex-row">
          <span className="font-mono text-[11px]">
            ShiftPay · portfolio demo
          </span>
          <div className="flex gap-5 text-[13px]">
            <Link to="/browse" className="hover:text-text-secondary">
              Browse demo
            </Link>
            <Link to="/swipe" className="hover:text-text-secondary">
              Swipe view
            </Link>
            <span className="font-mono text-[11px]">
              Built with React + Vite
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
