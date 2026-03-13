import { useParams, Link } from 'react-router-dom';
import { useWorker } from '../hooks/useData';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

export default function WorkerProfile() {
  const { id } = useParams();
  const { worker, loading } = useWorker(id);

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  if (!worker) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center font-body">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-text-primary">404</h1>
          <p className="mt-2 text-text-secondary text-lg">Worker not found.</p>
          <Link
            to="/browse"
            className="mt-6 inline-block text-accent hover:text-accent-hover transition-colors"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    city,
    photoUrl,
    roles,
    certifications,
    availabilityTags,
    experienceYears,
    restaurantTypes,
    preferredRateMin,
    preferredRateMax,
    ratingAverage,
    ratingCount,
    demandStatus,
    bio,
    reviews,
  } = worker;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-accent' : 'text-text-muted'}>
          {'\u2B50'}
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-bg-primary font-body">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Back link */}
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Browse
        </Link>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left column — photo and key info */}
          <div className="lg:col-span-1 flex flex-col items-center lg:items-start gap-5">
            <img
              src={photoUrl}
              alt={name}
              className="rounded-2xl w-full max-w-sm aspect-square object-cover"
            />
            <h1 className="font-display text-3xl font-bold text-text-primary">{name}</h1>
            <p className="text-text-secondary text-lg flex items-center gap-1">
              {'\uD83D\uDCCD'} {city}
            </p>

            {demandStatus && (
              <div className="scale-110 origin-left">
                <Badge type="status" value={demandStatus} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span>{'\u2B50'}</span>
              <span className="text-accent text-xl font-bold">{ratingAverage}</span>
              <span className="text-text-muted">({ratingCount} reviews)</span>
            </div>

            {/* CTA — mobile visible, desktop sticky */}
            <div className="w-full max-w-sm mt-2">
              <Button variant="primary" size="lg" className="w-full">
                Hire This Person
              </Button>
            </div>
          </div>

          {/* Right column — details */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Roles */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-3">Roles</h2>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge key={role} type="role" value={role} />
                ))}
              </div>
            </section>

            {/* Certifications */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
                Certifications
              </h2>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert) => (
                  <Badge
                    key={cert.type}
                    type="cert"
                    value={cert.type}
                    certStatus={cert.status}
                  />
                ))}
              </div>
            </section>

            {/* Availability */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
                Availability
              </h2>
              <div className="flex flex-wrap gap-2">
                {availabilityTags.map((tag) => (
                  <Badge key={tag} type="availability" value={tag} />
                ))}
              </div>
            </section>

            {/* Experience */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
                Experience
              </h2>
              <p className="text-text-primary text-lg font-medium">
                {experienceYears} {experienceYears === 1 ? 'year' : 'years'} experience
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {restaurantTypes.map((rt) => (
                  <span
                    key={rt}
                    className="rounded-full px-3 py-1 text-xs font-medium bg-bg-elevated text-text-secondary border border-border-subtle"
                  >
                    {rt}
                  </span>
                ))}
              </div>
            </section>

            {/* Pay Range */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
                Pay Range
              </h2>
              <p className="text-accent text-2xl font-bold">
                ${preferredRateMin} &ndash; ${preferredRateMax}
                <span className="text-text-muted text-base font-normal"> / hr</span>
              </p>
              <p className="text-text-muted text-sm mt-1">
                Miami servers average: $20-28/hr
              </p>
            </section>

            {/* Bio */}
            <section>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-3">About</h2>
              <p className="text-text-secondary leading-relaxed">{bio}</p>
            </section>
          </div>
        </div>

        {/* Reviews — full width */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-text-primary mb-6">
            Reviews{' '}
            <span className="text-text-muted text-lg font-normal">({reviews.length})</span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, idx) => (
              <div
                key={idx}
                className="bg-bg-elevated rounded-xl p-5 border border-border-subtle flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">
                    {review.restaurantName}
                  </span>
                  <div className="flex gap-0.5 text-sm">{renderStars(review.rating)}</div>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {review.comment}
                </p>
                <p className="text-text-muted text-xs mt-auto">{review.date}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA — full width on mobile */}
        <div className="mt-12 lg:hidden">
          <Button variant="primary" size="lg" className="w-full">
            Hire This Person
          </Button>
        </div>
      </div>
    </div>
  );
}
