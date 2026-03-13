import { useParams, Link } from 'react-router-dom';
import { useRestaurant } from '../hooks/useData';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RestaurantProfile() {
  const { id } = useParams();
  const { restaurant, loading } = useRestaurant(id);

  if (loading) return <LoadingSpinner message="Loading restaurant..." />;

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center font-body">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-text-primary">404</h1>
          <p className="mt-2 text-text-secondary text-lg">Restaurant not found.</p>
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
    name,
    type,
    city,
    photoUrl,
    about,
    employeeCount,
    ratingAverage,
    ratingCount,
    openings,
  } = restaurant;

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      <div className="mx-auto max-w-5xl px-6 py-12">
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

        {/* Hero banner */}
        <img
          src={photoUrl}
          alt={name}
          className="h-64 w-full object-cover rounded-xl"
        />

        {/* Restaurant info */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-text-primary">{name}</h1>
            <Badge type="role" value={type} />
          </div>

          <p className="text-text-secondary text-lg flex items-center gap-1">
            {'\uD83D\uDCCD'} {city}
          </p>

          <div className="flex items-center gap-2">
            <span>{'\u2B50'}</span>
            <span className="text-accent text-xl font-bold">{ratingAverage}</span>
            <span className="text-text-muted">({ratingCount} reviews)</span>
          </div>

          <p className="text-text-muted text-sm">
            {'\uD83D\uDC65'} {employeeCount} employees
          </p>
        </div>

        {/* About */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">About</h2>
          <p className="text-text-secondary leading-relaxed">{about}</p>
        </section>

        {/* Current Openings */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-5">
            Current Openings
          </h2>

          {openings.length === 0 ? (
            <p className="text-text-muted">No current openings.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {openings.map((opening, idx) => (
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

                  <Button variant="primary" size="sm" className="mt-auto w-full">
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
