import { useParams, Link } from 'react-router-dom';
import { shifts } from '../data/shifts';
import Badge from '../components/Badge';
import Button from '../components/Button';

export default function ShiftDetail() {
  const { id } = useParams();
  const shift = shifts.find(
    (s) => s.id === Number(id) && s.isUrgent && s.status === 'open'
  );

  if (!shift) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center font-body">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-text-primary">404</h1>
          <p className="mt-2 text-text-secondary text-lg">
            Shift not found or no longer available.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block text-accent hover:text-accent-hover transition-colors"
          >
            Back to Home
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
  } = shift;

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      {/* Urgent banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600/20 via-red-600/20 to-amber-600/20 border-b border-accent/30">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-center gap-3">
          <span className="text-2xl animate-pulse">{'\uD83D\uDD25'}</span>
          <span className="font-display text-xl font-bold text-accent tracking-wide animate-pulse">
            ON THE FLY — URGENT
          </span>
          <span className="text-2xl animate-pulse">{'\uD83D\uDD25'}</span>
        </div>
        {/* Animated shimmer effect */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.3) 50%, transparent 100%)',
            animation: 'shimmer 2s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes depleting {
          from { width: 65%; }
          to { width: 0%; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.3); }
          50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.6), 0 0 50px rgba(245, 158, 11, 0.2); }
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Restaurant + role */}
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-3xl font-bold text-text-primary">
            {restaurantName}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <Badge type="role" value={role} />
            <span className="text-text-muted">&middot;</span>
            <span className="text-text-secondary flex items-center gap-1">
              {'\uD83D\uDCCD'} {city}
            </span>
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
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Description
          </h2>
          <p className="text-text-secondary leading-relaxed">{description}</p>
        </section>

        {/* Requirements */}
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

        {/* Countdown Timer */}
        <section className="mt-10">
          <div className="bg-bg-surface rounded-xl border border-accent/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-text-primary">
                Time Remaining
              </h3>
              <span className="text-accent text-2xl font-bold font-display">2h 34m</span>
            </div>
            <div className="w-full bg-bg-elevated rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-amber-500"
                style={{
                  width: '65%',
                  animation: 'depleting 9000s linear forwards',
                }}
              />
            </div>
            <p className="text-text-muted text-sm mt-2">
              This shift will expire if not claimed.
            </p>
          </div>
        </section>

        {/* Claim Now CTA */}
        <div className="mt-10">
          <button
            className="w-full rounded-lg bg-accent px-8 py-4 text-xl font-bold text-black transition-all duration-200 hover:bg-accent-hover cursor-pointer"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
          >
            Claim Now
          </button>
          <p className="text-text-muted text-sm text-center mt-3">
            First to claim gets the shift. No application needed.
          </p>
        </div>
      </div>
    </div>
  );
}
