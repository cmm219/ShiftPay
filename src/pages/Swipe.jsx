import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { workers } from '../data/workers';
import Badge from '../components/Badge';

// ----------------------------------------------------------------
// Swipe directions & animation helpers
// ----------------------------------------------------------------
const DIRECTION = { LEFT: 'left', RIGHT: 'right' };

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <span key={i} className="text-accent">
          &#9733;
        </span>,
      );
    } else if (i === full && half) {
      stars.push(
        <span key={i} className="text-accent opacity-60">
          &#9733;
        </span>,
      );
    } else {
      stars.push(
        <span key={i} className="text-text-muted">
          &#9734;
        </span>,
      );
    }
  }

  return <span className="flex gap-0.5 text-lg">{stars}</span>;
}

export default function Swipe() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState(null); // 'left' | 'right'
  const [isAnimating, setIsAnimating] = useState(false);
  const [flashColor, setFlashColor] = useState(null); // 'green' | 'red'

  const total = workers.length;
  const exhausted = currentIndex >= total;
  const current = exhausted ? null : workers[currentIndex];
  const next = currentIndex + 1 < total ? workers[currentIndex + 1] : null;

  // ---- Advance to the next card with animation ----
  const advance = useCallback(
    (direction) => {
      if (isAnimating || exhausted) return;

      setFlashColor(direction === DIRECTION.RIGHT ? 'green' : 'red');
      setExitDirection(direction);
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
        setIsAnimating(false);
        setFlashColor(null);
      }, 350);
    },
    [isAnimating, exhausted],
  );

  const handlePass = useCallback(() => advance(DIRECTION.LEFT), [advance]);
  const handleInterested = useCallback(
    () => advance(DIRECTION.RIGHT),
    [advance],
  );

  // ---- Keyboard navigation ----
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePass();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleInterested();
      } else if (e.key === ' ') {
        e.preventDefault();
        // Navigate to profile — we can't use Link here, so we rely on the
        // browser's navigation. React-Router doesn't expose imperative nav
        // without useNavigate, but we already import what we need.
        if (current) {
          window.location.href = `/worker/${current.id}`;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePass, handleInterested, current]);

  // ---- Card transform for the exit animation ----
  const cardStyle = (() => {
    if (exitDirection === DIRECTION.LEFT) {
      return {
        transform: 'translateX(-120%) rotate(-14deg)',
        opacity: 0,
        transition: 'transform 0.35s ease-in, opacity 0.35s ease-in',
      };
    }
    if (exitDirection === DIRECTION.RIGHT) {
      return {
        transform: 'translateX(120%) rotate(14deg)',
        opacity: 0,
        transition: 'transform 0.35s ease-in, opacity 0.35s ease-in',
      };
    }
    return {
      transform: 'translateX(0) rotate(0)',
      opacity: 1,
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    };
  })();

  // ---- Exhausted state ----
  if (exhausted) {
    return (
      <div className="min-h-screen bg-bg-primary font-body flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in max-w-md">
          <div className="text-6xl mb-6">&#127881;</div>
          <h2 className="font-display text-3xl font-bold text-text-primary">
            You've seen everyone!
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            You've browsed through all {total} workers. Head back to the grid
            to review or adjust your filters.
          </p>
          <Link
            to="/browse"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3.5 text-lg font-semibold text-black transition-colors hover:bg-accent-hover"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary font-body flex flex-col">
      {/* ====== HEADER ====== */}
      <header className="mx-auto w-full max-w-lg px-4 pt-8 pb-2 flex items-center justify-between">
        <Link
          to="/browse"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Grid View
        </Link>

        <span className="text-sm font-medium text-text-muted">
          {currentIndex + 1} of {total}
        </span>
      </header>

      {/* ====== CARD AREA ====== */}
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8">
        <div className="relative w-full max-w-lg" style={{ minHeight: 560 }}>
          {/* Flash overlay */}
          {flashColor && (
            <div
              className={`absolute inset-0 rounded-2xl z-20 pointer-events-none ${
                flashColor === 'green'
                  ? 'bg-success/15 border-2 border-success'
                  : 'bg-danger/15 border-2 border-danger'
              }`}
              style={{ animation: 'flash-fade 0.35s ease-out forwards' }}
            />
          )}

          {/* Next card (behind) */}
          {next && (
            <div
              className="absolute inset-0 rounded-2xl border border-border-subtle bg-bg-surface overflow-hidden"
              style={{
                transform: 'scale(0.95) translateY(16px)',
                opacity: 0.5,
                zIndex: 0,
              }}
            >
              <img
                src={next.photoUrl}
                alt={next.name}
                className="h-80 w-full object-cover"
              />
            </div>
          )}

          {/* Current card */}
          <div
            className="relative z-10 rounded-2xl border border-border-subtle bg-bg-surface overflow-hidden shadow-lg shadow-black/30"
            style={cardStyle}
          >
            {/* Photo */}
            <div className="relative">
              <img
                src={current.photoUrl}
                alt={current.name}
                className="h-80 w-full object-cover"
              />
              {/* Gradient overlay at bottom of photo */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-surface to-transparent" />
            </div>

            {/* Content */}
            <div className="px-6 pb-6 -mt-8 relative z-10 flex flex-col gap-3">
              {/* Name + City */}
              <div>
                <h2 className="font-display text-2xl font-bold text-text-primary">
                  {current.name}
                </h2>
                <p className="text-text-secondary text-sm">{current.city}</p>
              </div>

              {/* Role badges */}
              <div className="flex flex-wrap gap-1.5">
                {current.roles.map((role) => (
                  <Badge key={role} type="role" value={role} />
                ))}
              </div>

              {/* Certification badges */}
              <div className="flex flex-wrap gap-1.5">
                {current.certifications?.map((cert) => (
                  <Badge
                    key={cert.type}
                    type="cert"
                    value={cert.type}
                    certStatus={cert.status}
                  />
                ))}
              </div>

              {/* Bio */}
              <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">
                {current.bio}
              </p>

              {/* Availability tags */}
              <div className="flex flex-wrap gap-1.5">
                {current.availabilityTags?.map((tag) => (
                  <Badge key={tag} type="availability" value={tag} />
                ))}
              </div>

              {/* Rating + count */}
              <div className="flex items-center gap-2">
                <StarRating rating={current.ratingAverage} />
                <span className="text-sm font-medium text-text-primary">
                  {current.ratingAverage}
                </span>
                <span className="text-sm text-text-muted">
                  ({current.ratingCount} reviews)
                </span>
              </div>

              {/* Demand status + Pay range row */}
              <div className="flex items-center justify-between">
                <div>
                  {current.demandStatus && (
                    <Badge type="status" value={current.demandStatus} />
                  )}
                </div>
                <p className="text-text-primary text-sm font-semibold">
                  ${current.preferredRateMin}&ndash;${current.preferredRateMax}
                  /hr
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== ACTION BUTTONS ====== */}
      <div className="mx-auto w-full max-w-lg px-4 pb-10">
        <div className="flex items-center justify-center gap-4">
          {/* Pass */}
          <button
            onClick={handlePass}
            disabled={isAnimating}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-danger text-danger text-2xl transition-all duration-200 hover:bg-danger/10 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Pass (Left arrow)"
          >
            &#10005;
          </button>

          {/* View Profile */}
          <Link
            to={`/worker/${current.id}`}
            className="flex h-12 items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-6 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-bg-surface-hover hover:text-text-primary hover:scale-105 active:scale-95"
            title="View Profile (Space)"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Profile
          </Link>

          {/* Interested */}
          <button
            onClick={handleInterested}
            disabled={isAnimating}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-success text-success text-2xl transition-all duration-200 hover:bg-success/10 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Interested (Right arrow)"
          >
            &#9829;
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="mt-4 text-center text-xs text-text-muted">
          Use{' '}
          <kbd className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 text-text-secondary">
            &#8592;
          </kbd>{' '}
          <kbd className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 text-text-secondary">
            &#8594;
          </kbd>{' '}
          arrow keys to swipe &middot;{' '}
          <kbd className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 text-text-secondary">
            Space
          </kbd>{' '}
          to view profile
        </p>
      </div>

      {/* Flash animation */}
      <style>{`
        @keyframes flash-fade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
