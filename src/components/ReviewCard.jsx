import Badge from './Badge';

function StarIcon({ filled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span
          key={value}
          className={value <= rating ? 'text-accent' : 'text-text-muted'}
        >
          <StarIcon filled={value <= rating} />
        </span>
      ))}
    </div>
  );
}

export default function ReviewCard({ review }) {
  const { rating, comment, date, reviewerName, reviewerType } = review;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const badgeLabel =
    reviewerType === 'worker' ? 'Worker Review' : 'Restaurant Review';

  return (
    <div className="bg-bg-surface/50 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-text-primary text-sm">
          {reviewerName}
        </span>
        {formattedDate && (
          <span className="text-text-muted text-xs">{formattedDate}</span>
        )}
      </div>

      <StarDisplay rating={rating} />

      {comment && (
        <p className="text-text-secondary text-sm leading-relaxed">
          {comment}
        </p>
      )}

      <div>
        <Badge value={badgeLabel} />
      </div>
    </div>
  );
}
