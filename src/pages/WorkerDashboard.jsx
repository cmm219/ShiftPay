import { Link } from 'react-router-dom';
import { workers } from '../data/workers';
import { restaurants } from '../data/restaurants';
import { shifts } from '../data/shifts';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Button from '../components/Button';

const currentWorker = workers.find((w) => w.id === 8); // Jasmine Davis

const favoriteRestaurantIds = [4, 1, 2]; // The Birchwood, Bern's, Swan
const favoriteRestaurants = restaurants.filter((r) =>
  favoriteRestaurantIds.includes(r.id)
);

const recentShifts = [
  {
    id: 3,
    restaurant: "The Birchwood",
    role: "Bartender",
    date: "Mar 5, 2026",
    status: "completed",
    pay: "$224",
  },
  {
    id: 101,
    restaurant: "Cassis",
    role: "Server",
    date: "Mar 2, 2026",
    status: "completed",
    pay: "$186",
  },
  {
    id: 102,
    restaurant: "The Birchwood",
    role: "Host",
    date: "Feb 28, 2026",
    status: "completed",
    pay: "$140",
  },
  {
    id: 103,
    restaurant: "Swan Miami",
    role: "Bartender",
    date: "Feb 24, 2026",
    status: "cancelled",
    pay: "$0",
  },
];

const statusColors = {
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
  upcoming: 'bg-accent-soft text-accent',
  claimed: 'bg-warning-soft text-warning',
};

export default function WorkerDashboard() {
  const profileCompleteness = 85;

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Welcome back, Jasmine
            </h1>
            <p className="text-text-secondary mt-1">Here's what's happening with your profile.</p>
          </div>
          <Link to={`/worker/${currentWorker.id}`}>
            <Button variant="secondary" size="sm">View My Profile</Button>
          </Link>
        </div>

        {/* Profile Completeness */}
        <div className="bg-bg-surface rounded-xl border border-border-subtle p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Profile Completeness
            </h2>
            <span className="text-accent font-bold text-lg">{profileCompleteness}%</span>
          </div>
          <div className="w-full bg-bg-elevated rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
          <p className="text-text-muted text-sm mt-2">
            Add a video intro to reach 100% and get priority matching.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={'\uD83D\uDCE8'} value={12} label="Applications Sent" />
          <StatCard icon={'\uD83D\uDC41\uFE0F'} value={47} label="Profile Views" />
          <StatCard icon={'\uD83D\uDCAC'} value={5} label="Messages" />
          <StatCard icon={'\u2705'} value={39} label="Shifts Completed" />
        </div>

        {/* Certification Alert */}
        <div className="bg-bg-surface rounded-xl border border-border-subtle p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{'\u26A0\uFE0F'}</span>
              <div>
                <h3 className="font-semibold text-text-primary">CPR/First Aid Expired</h3>
                <p className="text-text-secondary text-sm mt-1">
                  Your CPR/First Aid certification expired on June 1, 2025. Some restaurants require
                  this for hiring.
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" className="shrink-0">
              Renew Now
            </Button>
          </div>
        </div>

        {/* Two column layout for Favorites + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Favorite Spots */}
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
              Favorite Spots
            </h2>
            <div className="flex flex-col gap-3">
              {favoriteRestaurants.map((r) => (
                <div
                  key={r.id}
                  className="bg-bg-surface rounded-xl border border-border-subtle p-4 flex items-center gap-4"
                >
                  <img
                    src={r.photoUrl}
                    alt={r.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/restaurant/${r.id}`}
                      className="font-semibold text-text-primary hover:text-accent transition-colors truncate block"
                    >
                      {r.name}
                    </Link>
                    <p className="text-text-muted text-sm">{r.city} &middot; {r.type}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="shrink-0">
                    Rebook
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
              Recent Activity
            </h2>
            <div className="flex flex-col gap-3">
              {recentShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-bg-surface rounded-xl border border-border-subtle p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">
                      {shift.restaurant}
                    </p>
                    <p className="text-text-muted text-sm">
                      {shift.role} &middot; {shift.date}
                    </p>
                  </div>
                  <span className="text-text-primary font-medium text-sm">{shift.pay}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      statusColors[shift.status] || 'bg-bg-elevated text-text-secondary'
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Boost My Profile CTA */}
        <div className="bg-bg-surface rounded-xl border border-border-subtle p-8 text-center opacity-60 cursor-not-allowed">
          <span className="text-3xl">{'\uD83D\uDD12'}</span>
          <h3 className="font-display text-xl font-semibold text-text-primary mt-3">
            Boost My Profile
          </h3>
          <p className="text-text-muted mt-2 max-w-md mx-auto">
            Coming Soon — Priority matching for premium members. Get seen first by top restaurants
            in your area.
          </p>
          <Button variant="ghost" size="md" className="mt-4 cursor-not-allowed" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
}
