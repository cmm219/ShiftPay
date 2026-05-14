import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useCompany, useOpenings } from '../hooks/useData';
import { useSavedJobs } from '../hooks/useSavedJobs';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { isActiveOpening } from '../utils/postingLifecycle';
import { isSaveableLongTermOpening } from '../utils/savedJobs';

export default function CompanyProfile() {
  const { id } = useParams();
  const { company, loading } = useCompany(id);
  const { openings: allOpenings } = useOpenings();
  const savedJobs = useSavedJobs();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return <LoadingSpinner message="Loading hiring profile..." />;

  if (!company) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center font-body">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-text-primary">404</h1>
          <p className="mt-2 text-text-secondary text-lg">Hiring profile not found.</p>
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
  } = company;

  const openings = allOpenings.filter(
    (opening) => String(opening.restaurantId) === String(id) && isActiveOpening(opening)
  );

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

        {/* Hiring profile info */}
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

        {/* Current Jobs */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-5">
            Current Jobs
          </h2>

          {openings.length === 0 ? (
            <p className="text-text-muted">No current jobs.</p>
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

                  <div className="mt-auto">
                    {!savedJobs.isHiringTeam && isSaveableLongTermOpening(opening) && (
                      <Button
                        variant={savedJobs.isSaved(opening.id) ? 'secondary' : 'primary'}
                        size="sm"
                        className="w-full"
                        onClick={() => handleSaveJob(opening)}
                      >
                        {savedJobs.isSaved(opening.id) ? 'Saved' : 'Save job'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
