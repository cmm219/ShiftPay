import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useLocalStorageForm from '../hooks/useLocalStorageForm';
import { useAuth } from '../hooks/useAuth';
import { createOpening, createShift } from '../lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_LABELS = ['Basics', 'Details', 'Confirm'];
const TOTAL_STEPS = STEP_LABELS.length;

const ROLE_OPTIONS = [
  'Line Cook',
  'Prep Cook',
  'Dishwasher',
  'Server',
  'Bartender',
  'Host/Hostess',
  'Busser',
  'Food Runner',
  'Barista',
  'Sous Chef',
];

const CITIES = [
  'Tampa',
  'Miami',
  'Orlando',
  'Jacksonville',
  'Fort Lauderdale',
  'St. Petersburg',
  'Sarasota',
  'Naples',
  'Clearwater',
  'Tallahassee',
];

const FREE_TIER_LIMIT = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns today's date in YYYY-MM-DD format. */
function todayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

/** Returns a time string 2 hours from now, rounded to nearest 30 min. */
function defaultStartTime() {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(d.getMinutes() >= 30 ? 30 : 0, 0, 0);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Returns a time string 6 hours after the given start. */
function defaultEndTime(start) {
  if (!start) return '22:00';
  const [h, m] = start.split(':').map(Number);
  const end = new Date(2000, 0, 1, h + 4, m);
  const hh = String(end.getHours()).padStart(2, '0');
  const mm = String(end.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Format 24h time to 12h display. */
function formatTime(t) {
  if (!t) return '\u2014';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Format YYYY-MM-DD to readable date. */
function formatDate(d) {
  if (!d) return '\u2014';
  const date = new Date(d + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function titleCaseRole(value) {
  if (!value) return '';
  const normalized = String(value).replace(/-/g, ' ').toLowerCase();
  const roleMap = {
    cook: 'Line Cook',
    server: 'Server',
    bartender: 'Bartender',
    host: 'Host/Hostess',
    dishwasher: 'Dishwasher',
    barback: 'Barback',
  };
  return roleMap[normalized] || normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function numericPay(value) {
  if (!value) return '';
  const match = String(value).match(/\d+/);
  return match ? match[0] : '';
}

// ---------------------------------------------------------------------------
// Shared UI atoms (matching WorkerSignup / RestaurantSignup)
// ---------------------------------------------------------------------------

const inputBase =
  'w-full bg-bg-elevated border border-border-subtle rounded-lg text-text-primary p-3 focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none transition-colors duration-200 placeholder:text-text-muted min-h-[44px]';

function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-text-secondary text-sm mb-1.5">
      {children}
    </label>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="text-danger text-xs mt-1" role="alert">
      {message}
    </p>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({ currentStep }) {
  const pct = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary text-sm">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
        <span className="text-text-muted text-xs">{STEP_LABELS[currentStep - 1]}</span>
      </div>

      {/* Track */}
      <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="flex justify-between" role="list">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <span
              key={label}
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
              className={`text-xs transition-colors duration-200 ${
                isActive
                  ? 'text-accent font-semibold'
                  : isDone
                    ? 'text-text-secondary'
                    : 'text-text-muted'
              }`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Basics
// ---------------------------------------------------------------------------

function StepBasics({ formData, updateField, errors }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        Job Basics
      </h2>
      <p className="text-text-secondary text-sm mb-4">
        Start with the role you are hiring for. One-time event shifts are available for banquet, catering, and pop-up coverage.
      </p>

      {/* Shift type toggle */}
      <div>
        <Label>Posting Type</Label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            type="button"
            onClick={() => updateField('shiftType', 'long-term')}
            className={`rounded-lg border p-4 text-center transition-all duration-200 cursor-pointer min-h-[44px] ${
              formData.shiftType === 'long-term'
                ? 'border-accent bg-accent-soft'
                : 'border-border-subtle bg-bg-surface hover:border-text-muted'
            }`}
          >
            <div className="text-lg mb-1">Long-term Job</div>
            <div className="text-text-muted text-xs">Primary hiring flow</div>
          </button>
          <button
            type="button"
            onClick={() => updateField('shiftType', 'urgent')}
            className={`rounded-lg border p-4 text-center transition-all duration-200 cursor-pointer min-h-[44px] ${
              formData.shiftType === 'urgent'
                ? 'border-accent bg-accent-soft'
                : 'border-border-subtle bg-bg-surface hover:border-text-muted'
            }`}
          >
            <div className="text-lg mb-1">Event Shift</div>
            <div className="text-text-muted text-xs">Banquet or catering coverage</div>
          </button>
        </div>
      </div>

      {/* Role */}
      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          className={`${inputBase} appearance-none cursor-pointer ${errors.role ? 'border-danger' : ''}`}
          value={formData.role}
          onChange={(e) => updateField('role', e.target.value)}
          aria-describedby={errors.role ? 'error-role' : undefined}
        >
          <option value="">Select a role</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <FieldError id="error-role" message={errors.role} />
      </div>

      {/* City */}
      <div>
        <Label htmlFor="city">City</Label>
        <select
          id="city"
          className={`${inputBase} appearance-none cursor-pointer ${errors.city ? 'border-danger' : ''}`}
          value={formData.city}
          onChange={(e) => updateField('city', e.target.value)}
          aria-describedby={errors.city ? 'error-city' : undefined}
        >
          <option value="">Select a city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <FieldError id="error-city" message={errors.city} />
      </div>

      {/* Date / Time — only for urgent shifts */}
      {formData.shiftType === 'urgent' && (
        <>
          <div>
            <Label htmlFor="date">Date</Label>
            <input
              id="date"
              type="date"
              className={`${inputBase} ${errors.date ? 'border-danger' : ''}`}
              value={formData.date}
              min={todayISO()}
              onChange={(e) => updateField('date', e.target.value)}
              aria-describedby={errors.date ? 'error-date' : undefined}
            />
            <FieldError id="error-date" message={errors.date} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <input
                id="startTime"
                type="time"
                className={`${inputBase} ${errors.startTime ? 'border-danger' : ''}`}
                value={formData.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                aria-describedby={errors.startTime ? 'error-startTime' : undefined}
              />
              <FieldError id="error-startTime" message={errors.startTime} />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <input
                id="endTime"
                type="time"
                className={`${inputBase} ${errors.endTime ? 'border-danger' : ''}`}
                value={formData.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                aria-describedby={errors.endTime ? 'error-endTime' : undefined}
              />
              <FieldError id="error-endTime" message={errors.endTime} />
            </div>
          </div>
        </>
      )}

      {/* Ongoing badge for long-term */}
      {formData.shiftType === 'long-term' && (
        <div className="flex items-center gap-2 bg-accent-soft border border-accent rounded-lg px-4 py-3">
          <span className="text-accent text-sm font-semibold">Ongoing</span>
          <span className="text-text-secondary text-sm">
            — Workers will see this as an open restaurant job
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Details
// ---------------------------------------------------------------------------

function StepDetails({ formData, updateField, errors }) {
  const charCount = (formData.description || '').length;
  const charMax = 500;

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        Job Details
      </h2>
      <p className="text-text-secondary text-sm mb-4">
        Set the pay and describe what the worker should expect from this role.
      </p>

      {/* Pay rate */}
      <div>
        <Label htmlFor="payRate">Pay Rate</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
          <input
            id="payRate"
            type="number"
            min="1"
            max="200"
            step="0.50"
            className={`${inputBase} pl-7 pr-12 ${errors.payRate ? 'border-danger' : ''}`}
            placeholder="25"
            value={formData.payRate}
            onChange={(e) => updateField('payRate', e.target.value)}
            aria-describedby={errors.payRate ? 'error-payRate' : undefined}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            /hr
          </span>
        </div>
        <FieldError id="error-payRate" message={errors.payRate} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={4}
          maxLength={charMax}
          className={`${inputBase} resize-none ${errors.description ? 'border-danger' : ''}`}
          placeholder="Describe the role, schedule expectations, dress code, or event details..."
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          aria-describedby={
            [errors.description ? 'error-description' : '', 'description-counter']
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
        <div className="flex justify-between mt-1">
          <FieldError id="error-description" message={errors.description} />
          <span
            id="description-counter"
            className={`text-xs ml-auto ${
              charCount > charMax * 0.9 ? 'text-warning' : 'text-text-muted'
            }`}
          >
            {charCount}/{charMax}
          </span>
        </div>
      </div>

      {/* Urgent toggle — only for urgent shift type */}
      {formData.shiftType === 'urgent' && (
        <label
          htmlFor="isUrgent"
          className="flex items-center gap-3 cursor-pointer group bg-bg-elevated border border-border-subtle rounded-lg p-4 min-h-[44px]"
        >
          <input
            id="isUrgent"
            type="checkbox"
            checked={formData.isUrgent}
            onChange={(e) => updateField('isUrgent', e.target.checked)}
            className="w-5 h-5 accent-accent cursor-pointer flex-shrink-0"
          />
          <div>
            <span className="text-text-primary font-medium group-hover:text-accent transition-colors">
              Mark as Urgent
            </span>
            <p className="text-text-muted text-xs mt-0.5">
              Event shifts get a priority badge in the local demo.
            </p>
          </div>
        </label>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Confirm
// ---------------------------------------------------------------------------

function StepConfirm({ formData }) {
  const isUrgent = formData.shiftType === 'urgent';

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        Review &amp; Post
      </h2>
      <p className="text-text-secondary text-sm mb-6">
        Double-check everything before posting.
      </p>

      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-5 space-y-3 text-sm">
        <SummaryRow
          label="Type"
          value={
            isUrgent ? (
              <span className="text-warning font-semibold">Event Shift</span>
            ) : (
              <span className="text-accent font-semibold">Long-term Job</span>
            )
          }
        />
        <SummaryRow label="Role" value={formData.role || '\u2014'} />
        <SummaryRow label="City" value={formData.city || '\u2014'} />
        {isUrgent && (
          <>
            <SummaryRow label="Date" value={formatDate(formData.date)} />
            <SummaryRow
              label="Time"
              value={`${formatTime(formData.startTime)} \u2013 ${formatTime(formData.endTime)}`}
            />
          </>
        )}
        {!isUrgent && (
          <>
            <SummaryRow label="Schedule" value="Ongoing" />
            <SummaryRow label="Demo visibility" value="30 days, then repost or renew" />
          </>
        )}
        <SummaryRow
          label="Pay Rate"
          value={formData.payRate ? `$${formData.payRate}/hr` : '\u2014'}
        />
        {isUrgent && (
          <SummaryRow
            label="Urgent Flag"
            value={formData.isUrgent ? 'Yes' : 'No'}
          />
        )}
      </div>

      {/* Description preview */}
      {formData.description && (
        <div className="mt-4 bg-bg-surface border border-border-subtle rounded-lg p-4">
          <span className="text-text-muted text-xs uppercase tracking-wider block mb-2">
            Description
          </span>
          <p className="text-text-secondary text-sm whitespace-pre-wrap leading-relaxed">
            {formData.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateStep(step, formData) {
  const errors = {};

  switch (step) {
    case 1:
      if (!formData.role) errors.role = 'Please select a role.';
      if (!formData.city) errors.city = 'Please select a city.';
      if (formData.shiftType === 'urgent') {
        if (!formData.date) errors.date = 'Please select a date.';
        else if (formData.date < todayISO()) errors.date = 'Date cannot be in the past.';
        if (!formData.startTime) errors.startTime = 'Please set a start time.';
        if (!formData.endTime) errors.endTime = 'Please set an end time.';
        if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
          errors.endTime = 'End time must be after start time.';
        }
      }
      break;
    case 2: {
      const rate = parseFloat(formData.payRate);
      if (!formData.payRate || isNaN(rate) || rate <= 0) {
        errors.payRate = 'Please enter a valid pay rate.';
      } else if (rate > 200) {
        errors.payRate = 'Pay rate cannot exceed $200/hr.';
      }
      if (!formData.description || formData.description.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters.';
      }
      break;
    }
    case 3:
      // All validated in earlier steps
      break;
    default:
      break;
  }

  return errors;
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PostShift() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const repostType = searchParams.get('repost');
  const typeParam = searchParams.get('type');
  const isRepost = Boolean(repostType);
  const defaultShiftType =
    repostType === 'shift' || typeParam === 'shift' ? 'urgent' : 'long-term';
  const formStorageKey = isRepost
    ? `shiftpay-post-shift-repost-${searchParams.toString()}`
    : 'shiftpay-post-shift';

  // Derive smart defaults (city from profile if available)
  const defaultCity = profile?.city || '';

  const startDefault = defaultStartTime();

  const [formData, updateField, , clearForm, isLoaded] =
    useLocalStorageForm(formStorageKey, {
      step: 1,
      shiftType: defaultShiftType,
      role: titleCaseRole(searchParams.get('role')),
      city: searchParams.get('city') || defaultCity,
      date: todayISO(),
      startTime: startDefault,
      endTime: defaultEndTime(startDefault),
      payRate: numericPay(searchParams.get('payRate')),
      description: searchParams.get('description') || '',
      isUrgent: false,
    });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(null);

  // Mock: track remaining free posts (would come from API in production)
  const [postsUsed] = useState(0);
  const postsRemaining = FREE_TIER_LIMIT - postsUsed;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  const step = formData.step;

  // ---- Navigation ----

  const goNext = () => {
    const stepErrors = validateStep(step, formData);
    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setSubmitError('');
    if (step < TOTAL_STEPS) {
      updateField('step', step + 1);
    }
  };

  const goBack = () => {
    setErrors({});
    setSubmitError('');
    if (step > 1) {
      updateField('step', step - 1);
    }
  };

  // ---- Submit ----

  const handlePost = async () => {
    // Re-validate all steps
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const stepErrors = validateStep(s, formData);
      if (hasErrors(stepErrors)) {
        setErrors(stepErrors);
        updateField('step', s);
        return;
      }
    }

    setErrors({});
    setSubmitError('');
    setSubmitting(true);

    try {
      const isUrgent = formData.shiftType === 'urgent';
      const payload = {
        role: formData.role,
        date: isUrgent ? formData.date : null,
        startTime: isUrgent ? formData.startTime : null,
        endTime: isUrgent ? formData.endTime : null,
        payRate: parseFloat(formData.payRate),
        city: formData.city,
        description: formData.description.trim(),
        isUrgent: isUrgent && formData.isUrgent,
      };

      const result = isUrgent
        ? await createShift(payload)
        : await createOpening(payload);

      if (result.error) {
        setSubmitError(result.error.message || 'Failed to post. Please try again.');
        setSubmitting(false);
        return;
      }

      // Success
      clearForm();
      setSuccess({
        city: payload.city,
        type: isUrgent ? 'shift' : 'opening',
      });
    } catch (err) {
      setSubmitError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Success state ----

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-display text-text-primary mb-2">
              {success.type === 'opening' ? 'Job Posted!' : 'Event Shift Posted!'}
            </h2>
            <p className="text-text-secondary mb-8">
              {success.type === 'opening'
                ? `Your long-term job is now visible in the local demo for ${success.city}.`
                : `Your event shift is now visible in the local demo for ${success.city}. No live notifications were sent.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/dashboard/restaurant"
                className="bg-accent text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-accent-hover transition-colors inline-block"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="text-text-secondary hover:text-text-primary transition-colors px-6 py-2.5 rounded-lg hover:bg-bg-surface-hover cursor-pointer"
              >
                Post Another Job
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Free tier limit reached ----

  if (postsRemaining <= 0) {
    return (
      <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-warning-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-display text-text-primary mb-2">
              Free Tier Limit Reached
            </h2>
            <p className="text-text-secondary mb-6">
              You've used all {FREE_TIER_LIMIT} free job posts. Upgrade to post unlimited jobs and unlock priority placement.
            </p>
            <button
              type="button"
              className="bg-accent text-black font-semibold px-8 py-3 rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
            >
              Upgrade Plan
            </button>
            <div className="mt-4">
              <Link
                to="/dashboard/restaurant"
                className="text-text-muted hover:text-text-secondary text-sm transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Render step content ----

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepBasics formData={formData} updateField={updateField} errors={errors} />;
      case 2:
        return <StepDetails formData={formData} updateField={updateField} errors={errors} />;
      case 3:
        return <StepConfirm formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Free tier remaining banner */}
        <div className="border border-accent rounded-lg px-4 py-2 flex items-center justify-between mb-6">
          <span className="text-accent text-sm font-semibold tracking-wide">
            {isRepost ? 'Repost draft' : 'Post a Job'}
          </span>
          <span className="text-text-secondary text-sm">
            {postsRemaining} of {FREE_TIER_LIMIT} posts remaining
          </span>
        </div>

        {isRepost && (
          <div className="mb-6 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
            {repostType === 'shift'
              ? 'Prior event-shift details are prefilled for this local demo. Choose a new future date and time before reposting.'
              : 'Prior job details are prefilled for this local demo. Reposted jobs start a fresh 30-day visibility window.'}
          </div>
        )}

        {/* Progress bar */}
        <ProgressBar currentStep={step} />

        {/* Step content */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 sm:p-8">
          {renderStep()}

          {/* Submit error banner */}
          {submitError && (
            <div className="mt-4 bg-danger-soft border border-danger rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-danger text-sm">{submitError}</span>
              <button
                type="button"
                onClick={() => setSubmitError('')}
                className="text-danger hover:text-text-primary text-sm font-medium ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-subtle">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer px-5 py-2.5 rounded-lg hover:bg-bg-surface-hover min-h-[44px]"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                className="bg-accent text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-accent-hover transition-colors cursor-pointer min-h-[44px]"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePost}
                disabled={submitting}
                className={`bg-accent text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-accent-hover transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 ${
                  submitting ? 'opacity-60 cursor-not-allowed' : 'animate-pulse-glow'
                }`}
              >
                {submitting && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {submitting
                  ? 'Posting...'
                  : formData.shiftType === 'long-term'
                    ? 'Post Job'
                    : 'Post Event Shift'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
