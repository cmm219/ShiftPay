import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorageForm from '../hooks/useLocalStorageForm';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_LABELS = ['Restaurant Info', 'Roles', 'Account'];
const TOTAL_STEPS = STEP_LABELS.length;

const RESTAURANT_TYPES = [
  'Fine Dining',
  'Casual',
  'Fast Casual',
  'Upscale Casual',
  'Farm-to-Table',
  'Nightlife',
  'Waterfront',
  'Hotel',
  'BBQ',
  'Food Truck',
];

const CITIES = ['Tampa', 'Orlando', 'Miami', 'St. Pete'];

const EMPLOYEE_COUNTS = ['1-5', '6-15', '16-30', '31-50', '51-100', '100+'];

const ROLE_OPTIONS = [
  { id: 'cook', label: 'Cook', emoji: '\uD83D\uDD25' },
  { id: 'server', label: 'Server', emoji: '\uD83C\uDF7D\uFE0F' },
  { id: 'bartender', label: 'Bartender', emoji: '\uD83C\uDF78' },
  { id: 'host', label: 'Host', emoji: '\uD83D\uDCCB' },
  { id: 'dishwasher', label: 'Dishwasher', emoji: '\uD83E\uDDFD' },
  { id: 'barback', label: 'Barback', emoji: '\uD83E\uDDCA' },
];

// ---------------------------------------------------------------------------
// Shared UI atoms
// ---------------------------------------------------------------------------

const inputBase =
  'w-full bg-bg-elevated border border-border-subtle rounded-lg text-text-primary p-3 focus:border-accent focus:outline-none transition-colors duration-200 placeholder:text-text-muted';

function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-text-secondary text-sm mb-1.5">
      {children}
    </label>
  );
}

function FreeBanner() {
  return (
    <div className="border border-accent rounded-lg px-4 py-2 flex items-center gap-2 mb-6">
      <span className="text-accent text-lg">{'\u2713'}</span>
      <span className="text-accent text-sm font-semibold tracking-wide">
        Free to Join
      </span>
    </div>
  );
}

function ToggleCard({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-accent bg-accent-soft'
          : 'border-border-subtle bg-bg-surface hover:border-text-muted'
      } ${className}`}
    >
      {children}
    </button>
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
      <div className="flex justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <span
              key={label}
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
// Step Components
// ---------------------------------------------------------------------------

function StepRestaurantInfo({ formData, updateField }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        Tell us about your restaurant
      </h2>
      <p className="text-text-secondary text-sm mb-4">
        We'll use this to connect you with qualified staff in your area.
      </p>

      <div>
        <Label htmlFor="name">Restaurant Name</Label>
        <input
          id="name"
          type="text"
          className={inputBase}
          placeholder="The Golden Fork"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          className={`${inputBase} appearance-none cursor-pointer`}
          value={formData.type}
          onChange={(e) => updateField('type', e.target.value)}
        >
          <option value="">Select restaurant type</option>
          {RESTAURANT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="city">City</Label>
        <select
          id="city"
          className={`${inputBase} appearance-none cursor-pointer`}
          value={formData.city}
          onChange={(e) => updateField('city', e.target.value)}
        >
          <option value="">Select a city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Employee Count</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {EMPLOYEE_COUNTS.map((count) => {
            const selected = formData.employeeCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => updateField('employeeCount', count)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  selected
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary hover:border-text-muted'
                }`}
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepRolesHiring({ formData, updateField }) {
  const toggle = (roleId) => {
    const current = formData.rolesHiring;
    const next = current.includes(roleId)
      ? current.filter((r) => r !== roleId)
      : [...current, roleId];
    updateField('rolesHiring', next);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        What roles are you hiring for?
      </h2>
      <p className="text-text-secondary text-sm mb-6">
        Select all positions you need to fill.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ROLE_OPTIONS.map((role) => {
          const selected = formData.rolesHiring.includes(role.id);
          return (
            <ToggleCard key={role.id} selected={selected} onClick={() => toggle(role.id)}>
              <div className="text-3xl mb-2">{role.emoji}</div>
              <div className="text-text-primary font-medium text-sm">{role.label}</div>
            </ToggleCard>
          );
        })}
      </div>
    </div>
  );
}

function StepAccount({ formData, updateField, password, setPassword, confirmPassword, setConfirmPassword }) {
  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        Create your account
      </h2>
      <p className="text-text-secondary text-sm mb-6">
        Set up your login credentials to start posting shifts.
      </p>

      {/* Free banner repeated in this step */}
      <FreeBanner />

      <div className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <input
            id="email"
            type="email"
            className={inputBase}
            placeholder="manager@restaurant.com"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <input
            id="password"
            type="password"
            className={inputBase}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <input
            id="confirmPassword"
            type="password"
            className={`${inputBase} ${passwordMismatch ? 'border-danger' : ''}`}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordMismatch && (
            <p className="text-danger text-xs mt-1">Passwords do not match.</p>
          )}
        </div>

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-1 accent-accent cursor-pointer"
          />
          <span className="text-text-secondary text-sm group-hover:text-text-primary transition-colors">
            I agree to the{' '}
            <span className="text-accent underline">Terms of Service</span> and{' '}
            <span className="text-accent underline">Privacy Policy</span>
          </span>
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateStep(step, formData, { password, confirmPassword } = {}) {
  switch (step) {
    case 1:
      if (!formData.name.trim()) return 'Please enter the restaurant name.';
      if (!formData.type) return 'Please select a restaurant type.';
      if (!formData.city) return 'Please select a city.';
      if (!formData.employeeCount) return 'Please select an employee count.';
      return null;
    case 2:
      if (formData.rolesHiring.length === 0)
        return 'Please select at least one role you are hiring for.';
      return null;
    case 3:
      if (!formData.email.trim()) return 'Please enter an email address.';
      if (password !== undefined) {
        if (!password) return 'Please create a password.';
        if (password.length < 6) return 'Password must be at least 6 characters.';
        if (password !== confirmPassword) return 'Passwords do not match.';
      }
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RestaurantSignup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, updateField, updateFields, clearForm, isLoaded] =
    useLocalStorageForm('shiftpay-restaurant-signup', {
      step: 1,
      name: '',
      type: '',
      city: '',
      employeeCount: '',
      rolesHiring: [],
      email: '',
    });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  const step = formData.step;

  const goNext = () => {
    const err = validateStep(step, formData, { password, confirmPassword });
    if (err) {
      setError(err);
      return;
    }
    setError('');
    if (step < TOTAL_STEPS) {
      updateField('step', step + 1);
    }
  };

  const goBack = () => {
    setError('');
    if (step > 1) {
      updateField('step', step - 1);
    }
  };

  const handleComplete = async () => {
    const err = validateStep(step, formData, { password, confirmPassword });
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      // 1. Create auth account
      const { data, error: authError } = await signUp({
        email: formData.email,
        password,
        role: 'restaurant',
        metadata: {},
      });

      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError('Signup succeeded but no user ID was returned. Please try logging in.');
        setSubmitting(false);
        return;
      }

      if (!supabase) {
        setError('Supabase is not configured. Add credentials to .env.local');
        setSubmitting(false);
        return;
      }

      // 2. Insert restaurant profile
      const { error: restaurantError } = await supabase.from('restaurants').insert({
        profile_id: userId,
        name: formData.name,
        type: formData.type,
        city: formData.city,
        employee_count: formData.employeeCount,
      });

      if (restaurantError) {
        setError('Account created but restaurant save failed: ' + restaurantError.message);
        setSubmitting(false);
        return;
      }

      // 3. Insert roles hiring
      if (formData.rolesHiring.length > 0) {
        const roleRows = formData.rolesHiring.map((role) => ({
          restaurant_id: userId,
          role,
        }));
        const { error: rolesError } = await supabase.from('restaurant_roles_hiring').insert(roleRows);
        if (rolesError) {
          console.warn('Failed to save roles hiring:', rolesError.message);
        }
      }

      // Success
      clearForm();
      setShowToast(true);
      setTimeout(() => {
        navigate('/dashboard/restaurant');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepRestaurantInfo formData={formData} updateField={updateField} />;
      case 2:
        return <StepRolesHiring formData={formData} updateField={updateField} />;
      case 3:
        return <StepAccount formData={formData} updateField={updateField} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        {/* Free banner */}
        <FreeBanner />

        {/* Progress bar */}
        <ProgressBar currentStep={step} />

        {/* Step content */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 sm:p-8">
          {renderStep()}

          {/* Error */}
          {error && (
            <div className="mt-4 text-danger text-sm bg-danger-soft rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-subtle">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer px-5 py-2.5 rounded-lg hover:bg-bg-surface-hover"
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
                className="bg-accent text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={submitting}
                className={`bg-accent text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-accent-hover transition-colors cursor-pointer ${submitting ? 'opacity-60 cursor-not-allowed' : 'animate-pulse-glow'}`}
              >
                {submitting ? 'Creating Account...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success toast */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-success text-black font-semibold px-6 py-3 rounded-lg shadow-lg animate-slide-up z-50">
          Restaurant registered! Redirecting...
        </div>
      )}
    </div>
  );
}
