import { useState, useRef, useCallback } from 'react';
import Button from './Button';

function StarIcon({ filled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      className="w-7 h-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

const MAX_COMMENT = 500;

export default function ReviewForm({
  shiftId,
  revieweeType,
  revieweeName,
  onSubmit,
  onCancel,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const starsRef = useRef([]);

  const handleStarClick = useCallback((value) => {
    setRating(value);
  }, []);

  const handleStarKeyDown = useCallback(
    (e, value) => {
      let next = value;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        next = Math.min(value + 1, 5);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        next = Math.max(value - 1, 1);
      } else {
        return;
      }
      setRating(next);
      starsRef.current[next - 1]?.focus();
    },
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        shiftId,
        rating,
        comment: comment.trim() || null,
        revieweeType,
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 text-center">
        <p className="text-success font-medium text-lg">
          Review submitted! Thank you.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-5"
    >
      <h3 className="font-display text-lg font-semibold text-text-primary">
        Rate your experience with {revieweeName}
      </h3>

      {/* Star Rating */}
      <div
        role="radiogroup"
        aria-label="Rating"
        className="flex gap-1"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            ref={(el) => (starsRef.current[value - 1] = el)}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value !== 1 ? 's' : ''}`}
            tabIndex={rating === value || (rating === 0 && value === 1) ? 0 : -1}
            onClick={() => handleStarClick(value)}
            onKeyDown={(e) => handleStarKeyDown(e, value)}
            className={`cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface rounded ${
              value <= rating ? 'text-accent' : 'text-text-muted'
            }`}
          >
            <StarIcon filled={value <= rating} />
          </button>
        ))}
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <textarea
          value={comment}
          onChange={(e) => {
            if (e.target.value.length <= MAX_COMMENT) {
              setComment(e.target.value);
            }
          }}
          placeholder="Share your experience (optional)"
          rows={4}
          aria-describedby="comment-counter"
          className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent transition-colors"
        />
        <p
          id="comment-counter"
          className={`text-xs text-right ${
            comment.length >= MAX_COMMENT ? 'text-red-400' : 'text-text-muted'
          }`}
        >
          {comment.length}/{MAX_COMMENT}
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-danger text-sm" aria-live="polite">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Review'
          )}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-text-secondary hover:underline text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
