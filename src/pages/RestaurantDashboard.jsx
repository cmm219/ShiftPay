import { Link } from 'react-router-dom';
import { restaurants } from '../data/restaurants';
import { workers } from '../data/workers';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Button from '../components/Button';

const restaurant = restaurants.find((r) => r.id === 1); // Bern's Steak House

const interestedWorkers = [
  workers.find((w) => w.id === 1), // Marcus Johnson
  workers.find((w) => w.id === 6), // Priya Patel
  workers.find((w) => w.id === 3), // James Chen
].filter(Boolean);

const hiredWorkers = [
  {
    id: 8,
    name: 'Jasmine Davis',
    role: 'Bartender',
    photoUrl: workers.find((w) => w.id === 8)?.photoUrl,
    startDate: 'Feb 15, 2026',
    status: 'active',
  },
  {
    id: 5,
    name: 'Diego Martinez',
    role: 'Cook',
    photoUrl: workers.find((w) => w.id === 5)?.photoUrl,
    startDate: 'Mar 1, 2026',
    status: 'active',
  },
  {
    id: 2,
    name: 'Sofia Reyes',
    role: 'Bartender',
    photoUrl: workers.find((w) => w.id === 2)?.photoUrl,
    startDate: 'Jan 20, 2026',
    status: 'active',
  },
];

export default function RestaurantDashboard() {
  return (
    <div className="min-h-screen bg-bg-primary font-body">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              {restaurant.name}
            </h1>
            <p className="text-text-secondary mt-1">Dashboard</p>
          </div>
          <Link to={`/restaurant/${restaurant.id}`}>
            <Button variant="secondary" size="sm">View Public Profile</Button>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={'\uD83D\uDCCB'} value={2} label="Active Posts" />
          <StatCard icon={'\u2728'} value={8} label="New Matches" />
          <StatCard icon={'\u2705'} value={3} label="Hired This Month" />
          <StatCard icon={'\uD83D\uDCAC'} value={5} label="Messages" />
        </div>

        {/* Active Job Posts */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
            Active Job Posts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {restaurant.openings.map((opening, idx) => (
              <div
                key={idx}
                className="bg-bg-surface rounded-xl border border-border-subtle p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <Badge type="role" value={opening.role} />
                  {opening.urgency === 'urgent' && (
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-warning-soft text-warning animate-pulse">
                      {'\uD83D\uDD25'} Urgent
                    </span>
                  )}
                </div>
                <p className="text-text-primary text-lg font-medium">{opening.payRange}</p>
                <p className="text-text-muted text-sm">
                  {opening.urgency === 'urgent' ? '3 applicants' : '7 applicants'}
                </p>
                <div className="flex gap-2 mt-auto">
                  <Button variant="secondary" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Matches */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
            New Matches
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {interestedWorkers.map((w) => (
              <div
                key={w.id}
                className="bg-bg-surface rounded-xl border border-border-subtle p-5 flex flex-col items-center text-center gap-3"
              >
                <img
                  src={w.photoUrl}
                  alt={w.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-text-primary">{w.name}</p>
                  <p className="text-text-muted text-sm">{w.city}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {w.roles.map((role) => (
                    <Badge key={role} type="role" value={role} />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span>{'\u2B50'}</span>
                  <span className="text-text-primary font-medium">{w.ratingAverage}</span>
                  <span className="text-text-muted">({w.ratingCount})</span>
                </div>
                <div className="flex gap-2 w-full mt-auto">
                  <Link to={`/worker/${w.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  <Button variant="primary" size="sm" className="flex-1">
                    Message
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hired Workers */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
            Hired Workers
          </h2>
          <div className="flex flex-col gap-3">
            {hiredWorkers.map((hw) => (
              <div
                key={hw.id}
                className="bg-bg-surface rounded-xl border border-border-subtle p-4 flex items-center gap-4"
              >
                <img
                  src={hw.photoUrl}
                  alt={hw.name}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/worker/${hw.id}`}
                    className="font-semibold text-text-primary hover:text-accent transition-colors truncate block"
                  >
                    {hw.name}
                  </Link>
                  <p className="text-text-muted text-sm">
                    {hw.role} &middot; Since {hw.startDate}
                  </p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-medium bg-success-soft text-success capitalize">
                  {hw.status}
                </span>
                <Button variant="secondary" size="sm" className="shrink-0">
                  Add to Payroll
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Rebook Prompt */}
        <section className="mb-8">
          <div className="bg-bg-surface rounded-xl border border-accent/30 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={workers.find((w) => w.id === 8)?.photoUrl}
                alt="Jasmine Davis"
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">Rebook Jasmine Davis?</h3>
                <p className="text-text-secondary text-sm mt-1">
                  Last shift: Bartender at Rooftop Bar &middot; Mar 5, 2026 &middot; Rated 5/5
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-text-muted text-xs">
                  <span className="bg-bg-elevated rounded-full px-3 py-1">Bartender</span>
                  <span className="bg-bg-elevated rounded-full px-3 py-1">$28/hr</span>
                  <span className="bg-bg-elevated rounded-full px-3 py-1">6:00 PM - 2:00 AM</span>
                </div>
              </div>
              <Button variant="primary" size="md" className="shrink-0">
                Rebook
              </Button>
            </div>
          </div>
        </section>

        {/* Post a Job CTA */}
        <div className="mt-4">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">
            Post a New Shift
          </Button>
        </div>
      </div>
    </div>
  );
}
