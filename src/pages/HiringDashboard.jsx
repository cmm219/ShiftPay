import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useShifts,
  useCompanies,
  useWorkers,
  useHiringLifecycleData,
  useShiftPostCount,
  useSubscription,
  useCreateSubscriptionCheckout,
  useRenewOpening,
  useCloseOpening,
  useCloseShift,
  useDismissPostingReminder,
} from '../hooks/useData';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  applyLifecycleOverrides,
  closePosting,
  formatDate as formatLifecycleDate,
  formatRenewedUntil,
  makeRepostParams,
  readLifecycleOverrides,
  renewOpening,
  writeLifecycleOverrides,
} from '../utils/postingLifecycle';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function isFuture(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d >= today;
}

function isThisMonth(dateStr) {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
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
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
}

const statusColors = {
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
  open: 'bg-accent-soft text-accent',
  claimed: 'bg-warning-soft text-warning',
  expired: 'bg-danger-soft text-danger',
  closed: 'bg-bg-elevated text-text-muted',
};

const statusLabelsHiringTeam = {
  open: 'Event posted',
  claimed: 'confirmed',
  completed: 'Event complete',
};

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function OpenShiftCard({ shift }) {
  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge type="role" value={shift.role} />
        <div className="flex items-center gap-2">
          {shift.isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-warning-soft text-warning animate-pulse">
              &#128293; Urgent
            </span>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors.open}`}>
            {statusLabelsHiringTeam.open}
          </span>
        </div>
      </div>
      <div>
        <p className="text-text-primary font-medium">
          {formatDate(shift.date)}
        </p>
        <p className="text-text-secondary text-sm">
          {shift.startTime} - {shift.endTime}
        </p>
      </div>
      <p className="text-accent font-bold text-lg">${shift.payRate}/hr</p>
      <Link to={`/jobs/${shift.id}`} className="mt-auto">
        <Button variant="secondary" size="sm" className="w-full min-h-[44px]">
          View Details
        </Button>
      </Link>
    </div>
  );
}

function ClaimedShiftCard({ shift, workerName, workerRating }) {
  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-text-primary">{workerName || 'Worker'}</span>
          {workerRating > 0 && (
            <span className="text-sm text-text-secondary">
              {'\u2B50'} {workerRating.toFixed(1)}
            </span>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors.claimed}`}>
            {workerName} {statusLabelsHiringTeam.claimed}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge type="role" value={shift.role} />
          <span className="text-text-secondary text-sm">
            {formatDate(shift.date)} &middot; {shift.startTime} - {shift.endTime}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-text-primary font-semibold text-sm">${shift.payRate}/hr</span>
        <span className="rounded-full px-3 py-1 text-xs font-medium bg-accent-soft text-accent">
          Awaiting completion
        </span>
      </div>
    </div>
  );
}

function HistoryShiftCard({ shift, workerName }) {
  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-text-primary">{workerName || 'Worker'}</span>
          <Badge type="role" value={shift.role} />
        </div>
        <p className="text-text-secondary text-sm">
          {formatDate(shift.date)} &middot; {shift.startTime} - {shift.endTime}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-text-primary font-semibold text-sm">${shift.payRate}/hr</span>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors.completed}`}>
          {statusLabelsHiringTeam.completed}
        </span>
        {!shift.feedback && (
          <Link
            to={`/jobs/${shift.id}`}
            className="text-accent text-sm font-medium hover:underline min-h-[44px] flex items-center"
          >
            Leave Review
          </Link>
        )}
      </div>
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

function formatReminderThreshold(threshold) {
  switch (threshold) {
    case '7_day':
      return '7-day in-app reminder';
    case '3_day':
      return '3-day in-app reminder';
    case '24_hour':
      return '24-hour in-app reminder';
    case 'expired':
      return 'Expired in-app reminder';
    default:
      return 'In-app reminder';
  }
}

function AttentionOpeningCard({ opening, reminder, onDismissReminder, onRenew, onClose }) {
  const isExpired = opening.lifecycleStatus === 'expired';
  const isClosed = opening.lifecycleStatus === 'closed';
  const isExpiring = opening.lifecycleStatus === 'expiring_soon';

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge type="role" value={opening.role} />
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              isClosed
                ? statusColors.closed
                : isExpired
                  ? statusColors.expired
                  : isExpiring
                    ? 'bg-warning-soft text-warning'
                    : statusColors.open
            }`}>
              {isClosed ? 'Closed' : isExpired ? 'Expired' : isExpiring ? 'Expiring soon' : 'Active'}
            </span>
          </div>
          <p className="font-semibold text-text-primary">{opening.restaurantName}</p>
          <p className="text-sm text-text-secondary">
            {opening.restaurantCity} &middot; {opening.payRange}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {isExpired || isClosed
              ? `Last visible ${formatLifecycleDate(opening.expiresAt)}`
              : `${opening.expiryLabel}. Renew for 30 days to keep this job visible to workers.`}
          </p>
          {reminder && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-accent/20 bg-accent-soft px-3 py-2 text-xs text-accent">
              <span className="font-semibold">{formatReminderThreshold(reminder.threshold)}</span>
              <span className="text-[#f5d27d]">Stored as durable in-app reminder state.</span>
              <button
                type="button"
                onClick={() => onDismissReminder(reminder)}
                className="ml-auto cursor-pointer font-semibold text-accent underline-offset-2 hover:underline"
              >
                Dismiss reminder
              </button>
            </div>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[150px]">
          {isExpired || isClosed ? (
            <Link to={`/post-job?${makeRepostParams(opening, 'opening')}`}>
              <Button variant="primary" size="sm" className="w-full min-h-[44px]">
                Repost
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="w-full min-h-[44px]"
              onClick={() => onRenew(opening)}
            >
              Renew for 30 days
            </Button>
          )}
          {!isExpired && !isClosed && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full min-h-[44px]"
              onClick={() => onClose(opening)}
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpiredShiftCard({ shift, onClose }) {
  const isClosed = shift.lifecycleStatus === 'closed';

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge type="role" value={shift.role} />
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${isClosed ? statusColors.closed : statusColors.expired}`}>
              {isClosed ? 'Closed' : 'Event shift has passed'}
            </span>
          </div>
          <p className="font-semibold text-text-primary">
            {formatDate(shift.date)} &middot; {shift.startTime} - {shift.endTime}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {shift.city} &middot; ${shift.payRate}/hr
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Repost this event shift with a new future date and time.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[150px]">
          <Link to={`/post-job?${makeRepostParams(shift, 'shift')}`}>
            <Button variant="primary" size="sm" className="w-full min-h-[44px]">
              Repost event shift
            </Button>
          </Link>
          {!isClosed && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full min-h-[44px]"
              onClick={() => onClose(shift)}
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SubscriptionCard({ shiftPostCount, subscription, onUpgrade, upgradeLoading }) {
  const FREE_LIMIT = 3;
  const remaining = Math.max(0, FREE_LIMIT - shiftPostCount);
  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
  const isFree = !isPro;

  return (
    <div className="bg-bg-surface rounded-xl border border-border-subtle p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-text-primary">Subscription</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          isFree ? 'bg-bg-elevated text-text-secondary' : 'bg-accent-soft text-accent'
        }`}>
          {isFree ? 'Free Tier' : 'Pro'}
        </span>
      </div>
      {isFree && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-secondary">Posts this month</span>
              <span className="text-text-primary font-medium">{shiftPostCount}/{FREE_LIMIT}</span>
            </div>
            <div className="w-full bg-bg-elevated rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(100, (shiftPostCount / FREE_LIMIT) * 100)}%` }}
                role="progressbar"
                aria-valuenow={shiftPostCount}
                aria-valuemin={0}
                aria-valuemax={FREE_LIMIT}
                aria-label={`${shiftPostCount} of ${FREE_LIMIT} free posts used`}
              />
            </div>
            <p className="text-text-muted text-xs mt-2">
              {remaining > 0
                ? `${remaining} free post${remaining !== 1 ? 's' : ''} remaining`
                : 'Free posts used up this month'}
            </p>
          </div>
          <div className="border-t border-border-subtle pt-4">
            <p className="text-text-secondary text-sm mb-3">
              Upgrade to Pro &mdash; unlimited posts, $15/fill instead of $30.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="w-full min-h-[44px]"
              onClick={onUpgrade}
              disabled={upgradeLoading}
            >
              {upgradeLoading ? 'Opening Checkout...' : 'Upgrade Plan'}
            </Button>
          </div>
        </>
      )}
      {!isFree && (
        <p className="text-text-secondary text-sm">
          Pro is active. You have unlimited posts and $15 fills.
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export default function HiringDashboard() {
  const { user, profile } = useAuth();
  const { shifts, loading: shiftsLoading } = useShifts();
  const { companies, loading: companiesLoading } = useCompanies();
  const { workers, loading: workersLoading } = useWorkers();
  const { count: shiftPostCount } = useShiftPostCount();
  const { subscription } = useSubscription();
  const subscriptionCheckout = useCreateSubscriptionCheckout();
  const renewOpeningRemote = useRenewOpening();
  const closeOpeningRemote = useCloseOpening();
  const closeShiftRemote = useCloseShift();
  const dismissPostingReminder = useDismissPostingReminder();
  const [lifecycleOverrides, setLifecycleOverrides] = useState(() => readLifecycleOverrides());
  const [lifecycleMessage, setLifecycleMessage] = useState('');
  const [dismissedReminderIds, setDismissedReminderIds] = useState([]);

  // Find current company profile. The underlying schema still uses restaurant ids.
  const currentCompany = useMemo(() => {
    if (!user || !companies.length) return null;
    if (profile?.restaurant_id) {
      return companies.find((r) => String(r.id) === String(profile.restaurant_id)) || null;
    }
    return null;
  }, [user, profile, companies]);

  const {
    openings: hiringOpenings,
    reminders,
    loading: hiringLifecycleLoading,
  } = useHiringLifecycleData(currentCompany?.id);

  const visibleReminders = useMemo(
    () => reminders.filter((reminder) => !dismissedReminderIds.includes(reminder.id)),
    [reminders, dismissedReminderIds]
  );

  const reminderByOpeningId = useMemo(() => {
    const map = {};
    visibleReminders
      .filter((reminder) => reminder.postingType === 'opening')
      .forEach((reminder) => {
        if (!map[reminder.postingId]) map[reminder.postingId] = reminder;
      });
    return map;
  }, [visibleReminders]);

  const lifecycleData = useMemo(
    () => applyLifecycleOverrides(hiringOpenings, shifts, lifecycleOverrides),
    [hiringOpenings, shifts, lifecycleOverrides]
  );

  // Build worker lookup
  const workerMap = useMemo(() => {
    const map = {};
    workers.forEach((w) => { map[w.id] = w; });
    return map;
  }, [workers]);

  // Filter event shifts for the current company profile.
  const myEventShifts = useMemo(() => {
    if (!currentCompany || !lifecycleData.shifts.length) return [];
    return lifecycleData.shifts.filter((s) => s.restaurantId === currentCompany.id);
  }, [currentCompany, lifecycleData.shifts]);

  const myOpenings = useMemo(() => {
    if (!currentCompany || !lifecycleData.openings.length) return [];
    return lifecycleData.openings.filter((o) => o.restaurantId === currentCompany.id);
  }, [currentCompany, lifecycleData.openings]);

  // Split into categories
  const { openShifts, claimedShifts, completedShifts, expiredShifts } = useMemo(() => {
    const open = myEventShifts
      .filter((s) => s.status === 'open' && s.lifecycleStatus === 'active')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const claimed = myEventShifts
      .filter((s) => s.status === 'claimed' && isFuture(s.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const completed = myEventShifts
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const expired = myEventShifts
      .filter((s) => s.status === 'open' && ['expired', 'closed'].includes(s.lifecycleStatus))
      .sort((a, b) => new Date(b.expiresAt || b.date) - new Date(a.expiresAt || a.date));

    return {
      openShifts: open,
      claimedShifts: claimed,
      completedShifts: completed,
      expiredShifts: expired,
    };
  }, [myEventShifts]);

  const { activeOpenings, expiringOpenings, expiredOpenings } = useMemo(() => {
    const active = myOpenings
      .filter((o) => o.lifecycleStatus === 'active')
      .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    const expiring = myOpenings
      .filter((o) => o.lifecycleStatus === 'expiring_soon')
      .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    const expired = myOpenings
      .filter((o) => ['expired', 'closed'].includes(o.lifecycleStatus))
      .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt));
    return {
      activeOpenings: active,
      expiringOpenings: expiring,
      expiredOpenings: expired,
    };
  }, [myOpenings]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthEventShifts = myEventShifts.filter((s) => isThisMonth(s.date));
    const fills = monthEventShifts.filter((s) => s.status === 'completed').length;
    const totalSpend = monthEventShifts
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => {
        const hours = estimateHours(s.startTime, s.endTime);
        return sum + (s.payRate * hours);
      }, 0);

    return { fills, totalSpend };
  }, [myEventShifts]);

  const saveOverrides = (next) => {
    setLifecycleOverrides(next);
    writeLifecycleOverrides(next);
  };

  const handleRenewOpening = async (opening) => {
    if (profile && !profile.is_demo) {
      const updated = await renewOpeningRemote.mutate(opening.id);
      if (!updated) {
        setLifecycleMessage(renewOpeningRemote.error?.message || 'Could not renew this job.');
        return;
      }
    }

    const nextOpening = renewOpening(opening);
    saveOverrides({
      ...lifecycleOverrides,
      openings: {
        ...(lifecycleOverrides.openings || {}),
        [opening.id]: {
          ...(lifecycleOverrides.openings?.[opening.id] || {}),
          ...nextOpening,
        },
      },
    });
    setLifecycleMessage(formatRenewedUntil(nextOpening.expiresAt));
  };

  const handleCloseOpening = async (opening) => {
    if (profile && !profile.is_demo) {
      const updated = await closeOpeningRemote.mutate(opening.id);
      if (!updated) {
        setLifecycleMessage(closeOpeningRemote.error?.message || 'Could not close this job.');
        return;
      }
    }

    saveOverrides({
      ...lifecycleOverrides,
      openings: {
        ...(lifecycleOverrides.openings || {}),
        [opening.id]: {
          ...(lifecycleOverrides.openings?.[opening.id] || {}),
          ...closePosting(),
        },
      },
    });
    setLifecycleMessage(profile?.is_demo ? 'Job closed in this local demo session.' : 'Job closed.');
  };

  const handleCloseShift = async (shift) => {
    if (profile && !profile.is_demo) {
      const updated = await closeShiftRemote.mutate(shift.id);
      if (!updated) {
        setLifecycleMessage(closeShiftRemote.error?.message || 'Could not close this event shift.');
        return;
      }
    }

    saveOverrides({
      ...lifecycleOverrides,
      shifts: {
        ...(lifecycleOverrides.shifts || {}),
        [shift.id]: {
          ...(lifecycleOverrides.shifts?.[shift.id] || {}),
          ...closePosting(),
        },
      },
    });
    setLifecycleMessage(profile?.is_demo ? 'Event shift closed in this local demo session.' : 'Event shift closed.');
  };

  const handleDismissReminder = async (reminder) => {
    if (profile && !profile.is_demo) {
      const dismissed = await dismissPostingReminder.mutate(reminder.id);
      if (!dismissed) {
        setLifecycleMessage(dismissPostingReminder.error?.message || 'Could not dismiss this reminder.');
        return;
      }
    }
    setDismissedReminderIds((ids) => [...ids, reminder.id]);
    setLifecycleMessage('Reminder dismissed.');
  };

  const loading = shiftsLoading || hiringLifecycleLoading || companiesLoading || workersLoading;

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  // ── Empty state: no hiring profile ──
  if (!currentCompany) {
    return (
      <div className="min-h-screen bg-bg-primary font-body">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
          <div className="bg-bg-surface rounded-xl border border-border-subtle p-8 sm:p-12">
            <div className="text-5xl mb-4">&#127869;</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-3">
              Welcome to ShiftPay!
            </h1>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Create your hiring profile to post long-term jobs and optional event shifts.
            </p>
            <Link to="/hiring/signup">
              <Button variant="primary" size="lg" className="min-h-[44px]">
                Complete Hiring Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const attentionCount = expiringOpenings.length + expiredOpenings.length + expiredShifts.length;
  const activeCount = openShifts.length + claimedShifts.length + activeOpenings.length + expiringOpenings.length;

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
              {currentCompany.name}
            </h1>
            <p className="text-text-secondary mt-1">Hiring Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/company/${currentCompany.id}`}>
              <Button variant="secondary" size="sm" className="min-h-[44px]">
                View Company Profile
              </Button>
            </Link>
            <Link to="/post-job">
              <Button variant="primary" size="sm" className="min-h-[44px]">
                Post a Job
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Hero: Active postings summary ── */}
        <section className="mb-8" aria-live="polite">
          {activeCount > 0 ? (
            <div className="bg-bg-surface rounded-xl border border-accent/30 p-6 sm:p-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-accent text-sm font-semibold uppercase tracking-wide mb-2">
                    Active postings
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
                    {activeCount} active posting{activeCount !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-text-secondary mt-1">
                    {activeOpenings.length + expiringOpenings.length} jobs visible &middot; {openShifts.length} event shifts posted &middot; {claimedShifts.length} event shifts claimed
                  </p>
                </div>
                <Link to="/post-job">
                  <Button variant="primary" size="md" className="min-h-[44px]">
                    Post Another Job
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-bg-surface rounded-xl border border-border-subtle p-8 text-center animate-fade-in">
              <div className="text-4xl mb-3">&#128221;</div>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-2">
                Post your first job
              </h2>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Start with a long-term role. Event-shift coverage is available for banquet, catering, or pop-up work.
              </p>
              <Link to="/post-job">
                <Button variant="primary" size="md" className="min-h-[44px]">
                  Post a Job
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* ── Needs attention ── */}
        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Needs attention
              </h2>
              <p className="text-sm text-text-secondary">
                {profile?.is_demo
                  ? 'Local demo reminders appear here when postings are expiring or have passed.'
                  : 'Durable in-app reminders appear here when postings are expiring or have passed.'}
              </p>
            </div>
            {attentionCount > 0 && (
              <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
                {attentionCount} item{attentionCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {lifecycleMessage && (
            <div className="mb-3 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
              {lifecycleMessage}
            </div>
          )}

          {attentionCount > 0 ? (
            <div className="grid gap-3" aria-live="polite">
              {expiringOpenings.map((opening) => (
                <AttentionOpeningCard
                  key={opening.id}
                  opening={opening}
                  reminder={reminderByOpeningId[opening.id]}
                  onDismissReminder={handleDismissReminder}
                  onRenew={handleRenewOpening}
                  onClose={handleCloseOpening}
                />
              ))}
              {expiredOpenings.map((opening) => (
                <AttentionOpeningCard
                  key={opening.id}
                  opening={opening}
                  reminder={reminderByOpeningId[opening.id]}
                  onDismissReminder={handleDismissReminder}
                  onRenew={handleRenewOpening}
                  onClose={handleCloseOpening}
                />
              ))}
              {expiredShifts.map((shift) => (
                <ExpiredShiftCard
                  key={shift.id}
                  shift={shift}
                  onClose={handleCloseShift}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border-subtle bg-bg-surface px-5 py-6 text-sm text-text-muted">
              No postings need attention.
            </div>
          )}
        </section>

        {/* ── Desktop two-column layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column: postings (2/3 width) */}
          <div className="md:col-span-2 space-y-8">
            {/* Long-term Jobs */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                Long-term Jobs
              </h2>
              {activeOpenings.length > 0 ? (
                <div className="grid gap-4" aria-live="polite">
                  {activeOpenings.map((opening) => (
                    <AttentionOpeningCard
                      key={opening.id}
                      opening={opening}
                      reminder={reminderByOpeningId[opening.id]}
                      onDismissReminder={handleDismissReminder}
                      onRenew={handleRenewOpening}
                      onClose={handleCloseOpening}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-bg-surface rounded-xl border border-border-subtle">
                  <EmptySection
                    icon="&#128188;"
                    message="No active long-term jobs. Post one to keep hiring visible."
                    cta="Post a Job"
                    to="/post-job?type=opening"
                  />
                </div>
              )}
            </section>

            {/* Event Shifts */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                Event Shifts
              </h2>
              {openShifts.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2" aria-live="polite">
                  {openShifts.map((shift) => (
                    <OpenShiftCard key={shift.id} shift={shift} />
                  ))}
                </div>
              ) : (
                <div className="bg-bg-surface rounded-xl border border-border-subtle">
                  <EmptySection
                    icon="&#128203;"
                    message="No event shifts posted. Use this for banquet, catering, or pop-up coverage."
                    cta="Post Event Shift"
                    to="/post-job?type=shift"
                  />
                </div>
              )}
            </section>

            {/* Claimed Event Shifts */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                Claimed Event Shifts
              </h2>
              {claimedShifts.length > 0 ? (
                <div className="space-y-3" aria-live="polite">
                  {claimedShifts.map((shift) => {
                    const worker = workerMap[shift.workerId];
                    return (
                      <ClaimedShiftCard
                        key={shift.id}
                        shift={shift}
                        workerName={worker?.name || 'Worker'}
                        workerRating={worker?.ratingAverage || 0}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-bg-surface rounded-xl border border-border-subtle">
                  <EmptySection
                    icon="&#9203;"
                    message="No claimed event shifts yet. Claimed coverage will show up here."
                  />
                </div>
              )}
            </section>

            {/* Event Shift History */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
                Event Shift History
              </h2>
              {completedShifts.length > 0 ? (
                <div className="space-y-3" aria-live="polite">
                  {completedShifts.map((shift) => {
                    const worker = workerMap[shift.workerId];
                    return (
                      <HistoryShiftCard
                        key={shift.id}
                        shift={shift}
                        workerName={worker?.name || 'Worker'}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-bg-surface rounded-xl border border-border-subtle">
                  <EmptySection
                    icon="&#128214;"
                    message="No completed event shifts yet. Your history will appear here."
                  />
                </div>
              )}
            </section>
          </div>

          {/* Right column: Stats + Subscription (1/3 width) */}
          <div className="space-y-8">
            {/* Monthly Stats */}
            <section>
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                This Month
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={'\u2705'} value={monthlyStats.fills} label="Event Fills" />
                <StatCard
                  icon={'\uD83D\uDCB0'}
                  value={`$${monthlyStats.totalSpend.toFixed(0)}`}
                  label="Total Spend"
                />
                <StatCard
                  icon={'\uD83D\uDCCB'}
                  value={openShifts.length + activeOpenings.length + expiringOpenings.length}
                  label="Visible Posts"
                />
                <StatCard
                  icon={'\u2B50'}
                  value={currentCompany.ratingAverage?.toFixed(1) || '0.0'}
                  label={`${currentCompany.ratingCount || 0} Reviews`}
                />
              </div>
            </section>

            {/* Subscription Status */}
            <SubscriptionCard
              shiftPostCount={shiftPostCount}
              subscription={subscription}
              onUpgrade={subscriptionCheckout.mutate}
              upgradeLoading={subscriptionCheckout.loading}
            />

            {/* Post a job CTA (mobile prominence) */}
            <div className="md:hidden">
              <Link to="/post-job">
                <Button variant="primary" size="lg" className="w-full min-h-[44px]">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
