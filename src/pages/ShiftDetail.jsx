import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShift, useClaimShift } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function downloadICS(shift) {
  const start = new Date(`${shift.date}T${shift.startTime}`);
  const end = new Date(`${shift.date}T${shift.endTime}`);
  const formatDate = (d) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShiftPay//Shift//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${shift.role} shift at ${shift.restaurantName}`,
    `DESCRIPTION:Pay: $${shift.payRate}/hr`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shift.ics';
  a.click();
  URL.revokeObjectURL(url);
}

/** Map system status to human-readable label */
function statusLabel(status, role, isOwnShift, workerName) {
  if (role === 'restaurant') {
    const map = {
      open: 'Posted, awaiting claims',
      claimed: isOwnShift ? 'Worker confirmed' : `${workerName || 'Worker'} confirmed`,
      completed: 'Shift complete',
      cancelled: 'Cancelled',
      no_show: 'Worker no-show',
      under_review: 'Under review',
    };
    return map[status] || status;
  }
  // Worker or guest
  const map = {
    open: 'Available',
    claimed: isOwnShift ? "You're confirmed!" : 'Claimed',
    completed: 'Shift complete',
    cancelled: 'Shift cancelled',
    no_show: 'Marked as no-show',
    under_review: 'Under review',
  };
  return map[status] || status;
}

/** Badge color class for shift status */
function statusBadgeClasses(status) {
  const map = {
    open: 'bg-success-soft text-success',
    claimed: 'bg-accent-soft text-accent',
    completed: 'bg-success-soft text-success',
    cancelled: 'bg-danger-soft text-danger',
    no_show: 'bg-danger-soft text-danger',
    under_review: 'bg-warning-soft text-warning',
  };
  return map[status] || 'bg-bg-elevated text-text-secondary';
}

/** Check if shift end time has passed */
function isShiftPast(shift) {
  if (!shift?.date || !shift?.endTime) return false;
  try {
    const end = new Date(`${shift.date}T${shift.endTime}`);
    return end < new Date();
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// Inline SVG icons (no extra deps)
// ────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SpinnerSmall = () => (
  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function ShiftDetail() {
  const { id } = useParams();
  const { shift, loading } = useShift(id);
  const { user, profile } = useAuth();
  const claimMutation = useClaimShift();

  const [claimState, setClaimState] = useState('idle'); // idle | claiming | success | error
  const [claimError, setClaimError] = useState(null);

  // Derived auth info
  const userRole = profile?.role; // 'worker' | 'restaurant' | null
  const isWorker = userRole === 'worker';
  const isRestaurant = userRole === 'restaurant';
  const isAuthenticated = !!user;

  // Ownership checks
  const isOwnWorkerShift = isWorker && shift?.workerId && profile?.worker_id && String(shift.workerId) === String(profile.worker_id);
  const isOwnRestaurantShift = isRestaurant && shift?.restaurantId && profile?.restaurant_id && String(shift.restaurantId) === String(profile.restaurant_id);
  const shiftPast = useMemo(() => isShiftPast(shift), [shift]);

  // ── Loading ──
  if (loading) return <LoadingSpinner message="Loading shift details..." />;

  // ── Not found ──
  if (!shift) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center font-body">
        <div className="text-center px-6">
          <h1 className="font-display text-4xl font-bold text-text-primary">Shift not found</h1>
          <p className="mt-3 text-text-secondary text-lg">
            This shift may have been removed or the link is invalid.
          </p>
          <Link
            to="/browse"
            className="mt-6 inline-block text-accent hover:text-accent-hover transition-colors font-medium"
          >
            Browse available shifts
          </Link>
        </div>
      </div>
    );
  }

  const {
    restaurantName,
    role,
    payRate,
    date,
    startTime,
    endTime,
    city,
    description,
    requirements,
    status,
    isUrgent,
    workerId,
    feedback,
  } = shift;

  const displayStatus = statusLabel(status, userRole, isOwnWorkerShift || isOwnRestaurantShift, null);

  // ── Claim handler ──
  const handleClaim = async () => {
    if (claimState === 'claiming') return; // double-click guard
    setClaimState('claiming');
    setClaimError(null);

    const result = await claimMutation.mutate(id);
    if (result) {
      setClaimState('success');
    } else {
      setClaimState('error');
      const errMsg = claimMutation.error?.message || '';
      if (errMsg.toLowerCase().includes('already claimed') || errMsg.toLowerCase().includes('not open')) {
        setClaimError('already_claimed');
      } else if (errMsg.toLowerCase().includes('not a worker') || errMsg.toLowerCase().includes('worker')) {
        setClaimError('not_worker');
      } else {
        setClaimError('network');
      }
    }
  };

  const handleRetry = () => {
    setClaimState('idle');
    setClaimError(null);
  };

  // ── Claim success screen ──
  if (claimState === 'success') {
    return (
      <div className="min-h-screen bg-bg-primary font-body">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="bg-bg-surface rounded-xl border border-success/30 p-8 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-soft mb-6">
              <CheckCircleIcon />
            </div>
            <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
              Shift Claimed!
            </h1>
            <p className="text-text-secondary text-lg mb-8">
              You're confirmed for this shift. Don't forget to show up on time.
            </p>

            {/* Shift summary card */}
            <div className="bg-bg-elevated rounded-lg border border-border-subtle p-6 text-left mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide">Restaurant</p>
                  <p className="text-text-primary font-semibold mt-1">{restaurantName}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide">Role</p>
                  <p className="text-text-primary font-semibold mt-1 capitalize">{role}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide">Date</p>
                  <p className="text-text-primary font-semibold mt-1">{date}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide">Time</p>
                  <p className="text-text-primary font-semibold mt-1">
                    {startTime} - {endTime}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-muted text-xs uppercase tracking-wide">Pay Rate</p>
                  <p className="text-accent text-2xl font-bold mt-1">${payRate}/hr</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 inline-flex items-center justify-center gap-2"
                onClick={() => downloadICS(shift)}
              >
                <CalendarIcon />
                Add to Calendar
              </Button>
              <Link to="/dashboard/worker" className="flex-1">
                <Button variant="primary" size="lg" className="w-full">
                  View Dashboard
                </Button>
              </Link>
            </div>
            <Link
              to="/browse"
              className="inline-block mt-4 text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              Browse more shifts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main detail view ──
  return (
    <div className="min-h-screen bg-bg-primary font-body pb-24 md:pb-0">
      {/* Urgent banner */}
      {isUrgent && status === 'open' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-600/20 via-red-600/20 to-amber-600/20 border-b border-accent/30">
          <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-center gap-3">
            <span className="text-2xl animate-pulse">{'\uD83D\uDD25'}</span>
            <span className="font-display text-xl font-bold text-accent tracking-wide animate-pulse">
              ON THE FLY — URGENT
            </span>
            <span className="text-2xl animate-pulse">{'\uD83D\uDD25'}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Back link */}
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ChevronLeft />
          Back to Browse
        </Link>

        {/* Header: restaurant + role + status badge */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="font-display text-3xl font-bold text-text-primary">
              {restaurantName}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClasses(status)}`}
              aria-live="polite"
            >
              {displayStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge type="role" value={role} />
            <span className="text-text-muted">&middot;</span>
            <span className="text-text-secondary flex items-center gap-1">
              {'\uD83D\uDCCD'} {city}
            </span>
            {isOwnRestaurantShift && (
              <>
                <span className="text-text-muted">&middot;</span>
                <span className="text-accent text-xs font-medium bg-accent-soft rounded-full px-3 py-1">
                  Your posted shift
                </span>
              </>
            )}
          </div>
        </div>

        {/* Key details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="bg-bg-surface rounded-xl border border-border-subtle p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Pay Rate</p>
            <p className="text-accent text-2xl font-bold">${payRate}</p>
            <p className="text-text-muted text-xs">/hr</p>
          </div>
          <div className="bg-bg-surface rounded-xl border border-border-subtle p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Date</p>
            <p className="text-text-primary text-lg font-semibold">{date}</p>
          </div>
          <div className="bg-bg-surface rounded-xl border border-border-subtle p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Start</p>
            <p className="text-text-primary text-lg font-semibold">{startTime}</p>
          </div>
          <div className="bg-bg-surface rounded-xl border border-border-subtle p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">End</p>
            <p className="text-text-primary text-lg font-semibold">{endTime}</p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
              Description
            </h2>
            <p className="text-text-secondary leading-relaxed">{description}</p>
          </section>
        )}

        {/* Requirements */}
        {requirements && requirements.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
              Requirements
            </h2>
            <ul className="space-y-2">
              {requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-text-secondary">
                  <span className="text-accent mt-0.5">{'\u2022'}</span>
                  {req}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ──────────────── Status-specific sections ──────────────── */}

        {/* CANCELLED */}
        {status === 'cancelled' && (
          <section className="mt-10">
            <div className="bg-danger-soft rounded-xl border border-danger/30 p-6 text-center">
              <p className="text-danger font-semibold text-lg">This shift was cancelled</p>
              <p className="text-text-secondary mt-2 text-sm">
                This shift is no longer available.
              </p>
              <Link
                to="/browse"
                className="inline-block mt-4 text-accent hover:text-accent-hover transition-colors font-medium text-sm"
              >
                Browse available shifts
              </Link>
            </div>
          </section>
        )}

        {/* NO SHOW */}
        {status === 'no_show' && (
          <section className="mt-10">
            <div className="bg-danger-soft rounded-xl border border-danger/30 p-6 text-center">
              <p className="text-danger font-semibold text-lg">
                {isRestaurant ? 'Worker no-show' : 'Marked as no-show'}
              </p>
              <p className="text-text-secondary mt-2 text-sm">
                {isRestaurant
                  ? 'The assigned worker did not show up for this shift.'
                  : 'You were marked as a no-show for this shift. If this is incorrect, please contact support.'}
              </p>
              <a
                href="mailto:support@shiftpay.com"
                className="inline-block mt-4 text-accent hover:text-accent-hover transition-colors font-medium text-sm"
              >
                Contact support
              </a>
            </div>
          </section>
        )}

        {/* UNDER REVIEW */}
        {status === 'under_review' && (
          <section className="mt-10">
            <div className="bg-warning-soft rounded-xl border border-warning/30 p-6 text-center">
              <p className="text-warning font-semibold text-lg">Under Review</p>
              <p className="text-text-secondary mt-2 text-sm">
                This shift is being reviewed by our team. We'll notify you when a decision is made.
              </p>
              <a
                href="mailto:support@shiftpay.com"
                className="inline-block mt-4 text-accent hover:text-accent-hover transition-colors font-medium text-sm"
              >
                Contact support
              </a>
            </div>
          </section>
        )}

        {/* CLAIMED — not yours */}
        {status === 'claimed' && !isOwnWorkerShift && !isOwnRestaurantShift && isWorker && (
          <section className="mt-10">
            <div className="bg-bg-surface rounded-xl border border-border-subtle p-6 text-center">
              <p className="text-text-primary font-semibold text-lg">This shift has been claimed</p>
              <p className="text-text-secondary mt-2 text-sm">
                Another worker has already claimed this shift.
              </p>
              <Link
                to="/browse"
                className="inline-block mt-4 text-accent hover:text-accent-hover transition-colors font-medium text-sm"
              >
                Browse available shifts
              </Link>
            </div>
          </section>
        )}

        {/* CLAIMED — own shift (worker or restaurant owner) */}
        {status === 'claimed' && (isOwnWorkerShift || isOwnRestaurantShift) && (
          <section className="mt-10">
            <div className="bg-accent-soft rounded-xl border border-accent/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-accent">
                  <CheckCircleIcon />
                </div>
                <h3 className="font-display text-lg font-semibold text-text-primary">
                  {isOwnWorkerShift ? "You're confirmed for this shift" : 'Worker confirmed for this shift'}
                </h3>
              </div>

              {/* Completion buttons — only show after shift end time */}
              {shiftPast && (
                <div className="mt-6 pt-6 border-t border-border-subtle">
                  <p className="text-text-secondary text-sm mb-4">
                    This shift's scheduled time has passed. Please confirm completion.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="primary" size="lg" className="flex-1" disabled>
                      Confirm Completion
                    </Button>
                    <Button variant="danger" size="lg" className="flex-1" disabled>
                      Report No-Show
                    </Button>
                  </div>
                  <p className="text-text-muted text-xs mt-3 text-center">
                    Completion confirmation coming soon
                  </p>
                </div>
              )}

              {!shiftPast && (
                <p className="text-text-secondary text-sm">
                  Completion and no-show reporting will be available after the shift ends.
                </p>
              )}
            </div>
          </section>
        )}

        {/* COMPLETED — review prompt + contact info */}
        {status === 'completed' && (
          <section className="mt-10 space-y-6">
            {/* Feedback / review */}
            {feedback ? (
              <div className="bg-bg-surface rounded-xl border border-border-subtle p-6">
                <h3 className="font-display text-lg font-semibold text-text-primary mb-3">
                  Shift Review
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-accent text-lg">
                    {'★'.repeat(feedback.workerRating || feedback.restaurantRating || 0)}
                    {'☆'.repeat(5 - (feedback.workerRating || feedback.restaurantRating || 0))}
                  </span>
                  <span className="text-text-muted text-sm">
                    {feedback.workerRating || feedback.restaurantRating}/5
                  </span>
                </div>
                {feedback.comment && (
                  <p className="text-text-secondary italic">"{feedback.comment}"</p>
                )}
              </div>
            ) : (
              <div className="bg-accent-soft rounded-xl border border-accent/30 p-6 text-center">
                <p className="text-text-primary font-semibold text-lg mb-2">
                  How was your experience?
                </p>
                <p className="text-text-secondary text-sm mb-4">
                  Leave a review to help the community.
                </p>
                <Button variant="primary" size="md" disabled>
                  Leave a Review (coming soon)
                </Button>
              </div>
            )}

            {/* Contact info — revealed after completion */}
            <div className="bg-bg-surface rounded-xl border border-success/20 p-6">
              <h3 className="font-display text-lg font-semibold text-text-primary mb-3">
                Contact Information
              </h3>
              <p className="text-text-secondary text-sm">
                Contact info is now available since this shift is complete.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide">Restaurant</p>
                  <p className="text-text-primary font-medium mt-1">{restaurantName}</p>
                </div>
                {workerId && (
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide">Worker</p>
                    <Link
                      to={`/worker/${workerId}`}
                      className="text-accent hover:text-accent-hover transition-colors font-medium mt-1 inline-block"
                    >
                      View worker profile
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Contact info gating message for non-completed shifts */}
        {status !== 'completed' && status !== 'cancelled' && status !== 'no_show' && (
          <section className="mt-8">
            <p className="text-text-muted text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Contact info available after shift completion
            </p>
          </section>
        )}

        {/* ──────────────── Claim CTA (desktop) ──────────────── */}
        {status === 'open' && (
          <div className="mt-10 hidden md:block">
            {/* Error messages */}
            {claimState === 'error' && (
              <div
                className="mb-4 rounded-lg border p-4 text-center"
                role="alert"
                aria-live="polite"
              >
                {claimError === 'already_claimed' && (
                  <div className="border-accent/30 bg-accent-soft">
                    <p className="text-text-primary font-medium">
                      This shift has been claimed by another worker.
                    </p>
                    <Link
                      to="/browse"
                      className="inline-block mt-2 text-accent hover:text-accent-hover transition-colors text-sm font-medium"
                    >
                      Browse other available shifts
                    </Link>
                  </div>
                )}
                {claimError === 'not_worker' && (
                  <div className="border-danger/30 bg-danger-soft">
                    <p className="text-danger font-medium">
                      Only registered workers can claim shifts.
                    </p>
                    <Link
                      to="/worker/signup"
                      className="inline-block mt-2 text-accent hover:text-accent-hover transition-colors text-sm font-medium"
                    >
                      Sign up as a worker
                    </Link>
                  </div>
                )}
                {claimError === 'network' && (
                  <div className="border-danger/30 bg-danger-soft">
                    <p className="text-danger font-medium">Connection failed.</p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 text-accent hover:text-accent-hover transition-colors text-sm font-medium cursor-pointer"
                    >
                      Tap to retry
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated ? (
              <div className="text-center">
                <Link to="/login">
                  <Button variant="primary" size="lg" className="w-full text-xl py-4">
                    Sign in to Claim
                  </Button>
                </Link>
                <p className="text-text-muted text-sm mt-3">
                  You need an account to claim shifts.
                </p>
              </div>
            ) : isWorker ? (
              <div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-xl py-4 animate-pulse-glow inline-flex items-center justify-center gap-3"
                  onClick={handleClaim}
                  disabled={claimState === 'claiming'}
                  aria-label="Claim this shift"
                >
                  {claimState === 'claiming' ? (
                    <>
                      <SpinnerSmall />
                      Claiming...
                    </>
                  ) : (
                    'Claim This Shift'
                  )}
                </Button>
                <p className="text-text-muted text-sm text-center mt-3">
                  First to claim gets the shift. No application needed.
                </p>
              </div>
            ) : isRestaurant ? (
              <div className="text-center">
                <p className="text-text-secondary text-sm">
                  You're viewing this as a restaurant. Only workers can claim shifts.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ──────────────── Sticky mobile CTA ──────────────── */}
      {status === 'open' && isAuthenticated && isWorker && (
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden bg-bg-surface border-t border-border-subtle z-50"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-4 px-4 pt-3">
            <div className="flex-1 min-w-0">
              <p className="text-accent text-xl font-bold">${payRate}/hr</p>
              <p className="text-text-secondary text-sm truncate capitalize">{role}</p>
            </div>

            {/* Error inline on mobile */}
            {claimState === 'error' && (
              <div className="flex-1 text-center" aria-live="polite">
                {claimError === 'already_claimed' && (
                  <p className="text-accent text-xs">Already claimed</p>
                )}
                {claimError === 'not_worker' && (
                  <p className="text-danger text-xs">Workers only</p>
                )}
                {claimError === 'network' && (
                  <button
                    onClick={handleRetry}
                    className="text-danger text-xs underline cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="min-w-[120px] min-h-[44px] inline-flex items-center justify-center gap-2"
              onClick={handleClaim}
              disabled={claimState === 'claiming'}
              aria-label="Claim this shift"
            >
              {claimState === 'claiming' ? (
                <>
                  <SpinnerSmall />
                  <span className="sr-only">Claiming</span>
                </>
              ) : (
                'Claim'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
