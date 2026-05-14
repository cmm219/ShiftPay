import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useShifts, useWorkers } from '../hooks/useData';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPay(rate, startTime, endTime) {
  if (!rate) return '$0';
  // Rough estimate: calculate hours from time strings
  const hours = estimateHours(startTime, endTime);
  if (hours > 0) return `$${(rate * hours).toFixed(0)}`;
  return `$${rate}/hr`;
}

function estimateHours(start, end) {
  if (!start || !end) return 0;
  const toMinutes = (t) => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  let diff = toMinutes(end) - toMinutes(start);
  if (diff <= 0) diff += 24 * 60; // crosses midnight
  return diff / 60;
}

function isToday(dateStr) {
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return d.toDateString() === today.toDateString();
}

function isFuture(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d >= today;
}

const statusColors = {
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
  open: 'bg-accent-soft text-accent',
  claimed: 'bg-success-soft text-success',
};

const statusLabels = {
  open: 'Available',
  claimed: "You're confirmed!",
  completed: 'Shift complete',
};

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function ShiftCard({ shift, showReviewLink = false }) {
  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text-primary truncate">{shift.restaurantName}</span>
          <Badge type="role" value={shift.role} />
        </div>
        <p className="text-text-secondary text-sm mt-1">
          {formatDate(shift.date)} &middot; {shift.startTime} - {shift.endTime}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-text-primary font-semibold text-sm">
          ${shift.payRate}/hr
          <span className="text-text-muted font-normal ml-1">
            ({formatPay(shift.payRate, shift.startTime, shift.endTime)})
          </span>
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            statusColors[shift.status] || 'bg-bg-elevated text-text-secondary'
          }`}
        >
          {statusLabels[shift.status] || shift.status}
        </span>
      </div>
      {showReviewLink && shift.status === 'completed' && !shift.feedback && (
        <Link
          to={`/jobs/${shift.id}`}
          className="text-accent text-sm font-medium hover:underline shrink-0 min-h-[44px] flex items-center"
        >
          Leave Review
        </Link>
      )}
    </div>
  );
}

function ReliabilityGauge({ completed, noShows }) {
  if (completed === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3 opacity-50">&#128200;</div>
        <p className="text-text-secondary text-sm">
          Complete your first shift to build your reliability score.
        </p>
      </div>
    );
  }

  const score = Math.round(((completed - noShows) / completed) * 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#22C55E' : score >= 70 ? '#EAB308' : '#EF4444';

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e1e1e" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-display text-text-primary">{score}%</span>
        </div>
      </div>
      <p className="text-text-secondary text-sm mt-3">
        {completed} completed &middot; {noShows} no-show{noShows !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function ProfileCompleteness({ worker }) {
  const checks = [
    { label: 'Name', done: !!worker?.name },
    { label: 'Profile photo', done: !!worker?.photoUrl },
    { label: 'Roles selected', done: worker?.roles?.length > 0 },
    { label: 'Certifications added', done: worker?.certifications?.length > 0 },
    { label: 'Availability set', done: worker?.availabilityTags?.length > 0 },
    { label: 'Bio written', done: !!worker?.bio },
  ];
  const completed = checks.filter((c) => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-semibold text-text-primary">Profile Completeness</h3>
        <span className="text-accent font-bold text-lg">{pct}%</span>
      </div>
      <div className="w-full bg-bg-elevated rounded-full h-3 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Profile ${pct}% complete`}
        />
      </div>
      <ul className="space-y-2">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2 text-sm">
            <span className={check.done ? 'text-success' : 'text-text-muted'}>
              {check.done ? '\u2705' : '\u2B1C'}
            </span>
            <span className={check.done ? 'text-text-secondary line-through' : 'text-text-primary'}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
      {pct < 100 && (
        <p className="text-text-muted text-xs mt-3">
          Complete your profile to get priority matching with hiring teams.
        </p>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < review.rating ? 'text-accent' : 'text-text-muted'}>
      {'\u2605'}
    </span>
  ));

  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-text-primary text-sm">{review.restaurantName}</span>
        <span className="text-text-muted text-xs">{review.date}</span>
      </div>
      <div className="flex items-center gap-1 mb-2 text-sm">{stars}</div>
      {review.comment && (
        <p className="text-text-secondary text-sm leading-relaxed">"{review.comment}"</p>
      )}
    </div>
  );
}

function EmptySection({ icon, message, cta, to }) {
  return (
    <div className="text-center py-8">
      <div className="text-3xl mb-3 opacity-50">{icon}</div>
      <p className="text-text-muted text-sm mb-4">{message}</p>
      {cta && to && (
        <Link to={to}>
          <Button variant="secondary" size="sm" className="min-h-[44px]">{cta}</Button>
        </Link>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export default function WorkerDashboard() {
  const { user, profile } = useAuth();
  const { shifts, loading: shiftsLoading } = useShifts();
  const { workers, loading: workersLoading } = useWorkers();

  // Find current worker record by matching auth user ID or profile
  const currentWorker = useMemo(() => {
    if (!user || !workers.length) return null;
    if (profile?.worker_id) {
      return workers.find((w) => String(w.id) === String(profile.worker_id)) || null;
    }
    return workers.find((w) => w.email === user.email) || null;
  }, [user, profile, workers]);

  // Filter shifts for current worker
  const myShifts = useMemo(() => {
    if (!currentWorker || !shifts.length) return [];
    return shifts.filter((s) => s.workerId === currentWorker.id);
  }, [currentWorker, shifts]);

  // Split shifts into categories
  const { nextShift, upcomingShifts, shiftHistory } = useMemo(() => {
    const upcoming = myShifts
      .filter((s) => (s.status === 'claimed' || s.status === 'open') && isFuture(s.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const history = myShifts
      .filter((s) => s.status === 'completed' || s.status === 'cancelled')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      nextShift: upcoming[0] || null,
      upcomingShifts: upcoming.slice(1),
      shiftHistory: history,
    };
  }, [myShifts]);

  // Reliability score
  const { completedCount, noShowCount } = useMemo(() => {
    const completed = myShifts.filter((s) => s.status === 'completed').length;
    const noShows = myShifts.filter((s) => s.status === 'no_show').length;
    return { completedCount: completed, noShowCount: noShows };
  }, [myShifts]);

  // Reviews from worker data
  const reviews = currentWorker?.reviews || [];

  const loading = shiftsLoading || workersLoading;

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  // ── Empty state: no worker profile yet ──
  if (!currentWorker) {
    return (
      <div className="min-h-screen bg-bg-primary font-body">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
          <div className="bg-bg-surface rounded-xl border border-border-subtle p-8 sm:p-12">
            <div className="text-5xl mb-4">&#128075;</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-3">
              Welcome to ShiftPay
            </h1>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Complete your profile to start getting job matches and connect with hiring teams.
            </p>
            <Link to="/worker/signup">
              <Button variant="primary" size="lg" className="min-h-[44px]">
                Complete Your Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstName = currentWorker.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
              Welcome back, {firstName}
            </h1>
            <p className="text-text-secondary mt-1">Here's your shift overview.</p>
          </div>
          <Link to={`/worker/${currentWorker.id}`}>
            <Button variant="secondary" size="sm" className="min-h-[44px]">
              View My Profile
            </Button>
          </Link>
        </div>

        {/* ── Hero: Next Shift ── */}
        <section className="mb-8" aria-live="polite">
          {nextShift ? (
            <div className="bg-bg-surface rounded-xl border border-accent/30 p-6 sm:p-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-accent text-sm font-semibold uppercase tracking-wide">
                  {isToday(nextShift.date) ? 'Today' : 'Next Shift'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[nextShift.status]}`}>
                  {statusLabels[nextShift.status]}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-1">
                    {nextShift.restaurantName}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge type="role" value={nextShift.role} />
                    <span className="text-text-secondary text-sm">
                      {formatDate(nextShift.date)}
                    </span>
                  </div>
                  <p className="text-text-secondary">
                    {nextShift.startTime} - {nextShift.endTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-bold font-display text-accent">
                    ${nextShift.payRate}/hr
                  </p>
                  <p className="text-text-muted text-sm">
                    ~{formatPay(nextShift.payRate, nextShift.startTime, nextShift.endTime)} total
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <Link to={`/jobs/${nextShift.id}`}>
                  <Button variant="secondary" size="sm" className="min-h-[44px]">
                    View Shift Details
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-bg-surface rounded-xl border border-border-subtle p-8 text-center animate-fade-in">
              <div className="text-4xl mb-3">&#128197;</div>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-2">
                No upcoming shifts
              </h2>
              <p className="text-text-secondary mb-6">Browse available shifts and find your next gig.</p>
              <Link to="/browse">
                <Button variant="primary" size="md" className="min-h-[44px]">
                  Browse Available Shifts
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* ── Desktop two-column layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column: Shifts (2/3 width) */}
          <div className="md:col-span-2 space-y-8">
            {/* Upcoming Shifts */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                Upcoming Shifts
              </h2>
              {upcomingShifts.length > 0 ? (
                <div className="space-y-3" aria-live="polite">
                  {upcomingShifts.map((shift) => (
                    <ShiftCard key={shift.id} shift={shift} />
                  ))}
                </div>
              ) : (
                <div className="bg-bg-surface rounded-xl border border-border-subtle">
                  <EmptySection
                    icon="&#128197;"
                    message="No additional upcoming shifts."
                    cta="Browse Shifts"
                    to="/browse"
                  />
                </div>
              )}
            </section>

            {/* Shift History */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                Shift History
              </h2>
              {shiftHistory.length > 0 ? (
                <div className="space-y-3" aria-live="polite">
                  {shiftHistory.map((shift) => (
                    <ShiftCard key={shift.id} shift={shift} showReviewLink />
                  ))}
                </div>
              ) : (
                <div className="bg-bg-surface rounded-xl border border-border-subtle">
                  <EmptySection
                    icon="&#128214;"
                    message="No completed shifts yet. Your history will appear here."
                  />
                </div>
              )}
            </section>
          </div>

          {/* Right column: Stats + Reviews (1/3 width) */}
          <div className="space-y-8">
            {/* Reliability Score */}
            <section className="bg-bg-surface rounded-xl border border-border-subtle p-6">
              <h2 className="font-display text-lg font-semibold text-text-primary mb-2">
                Reliability Score
              </h2>
              <ReliabilityGauge completed={completedCount} noShows={noShowCount} />
            </section>

            {/* Profile Completeness */}
            <section className="bg-bg-surface rounded-xl border border-border-subtle p-6">
              <ProfileCompleteness worker={currentWorker} />
            </section>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={'\u2705'} value={completedCount} label="Shifts Done" />
              <StatCard
                icon={'\u2B50'}
                value={currentWorker.ratingAverage?.toFixed(1) || '0.0'}
                label={`${currentWorker.ratingCount || 0} Reviews`}
              />
            </div>

            {/* Reviews Received */}
            <section>
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                Reviews Received
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-3" aria-live="polite">
                  {reviews.map((review, idx) => (
                    <ReviewCard key={idx} review={review} />
                  ))}
                </div>
              ) : (
                <div className="bg-bg-surface rounded-xl border border-border-subtle">
                  <EmptySection
                    icon="&#128172;"
                    message="No reviews yet. Complete shifts to start building your reputation."
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
