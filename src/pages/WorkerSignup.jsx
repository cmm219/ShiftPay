import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorageForm from '../hooks/useLocalStorageForm';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_LABELS = ['Basics', 'Roles', 'Certs', 'Schedule', 'Experience', 'Pay'];
const TOTAL_STEPS = STEP_LABELS.length;

const CITIES = ['Tampa', 'Orlando', 'Miami', 'St. Pete'];

const ROLE_OPTIONS = [
  { id: 'cook', label: 'Cook', emoji: '\uD83D\uDD25' },
  { id: 'server', label: 'Server', emoji: '\uD83C\uDF7D\uFE0F' },
  { id: 'bartender', label: 'Bartender', emoji: '\uD83C\uDF78' },
  { id: 'host', label: 'Host', emoji: '\uD83D\uDCCB' },
  { id: 'dishwasher', label: 'Dishwasher', emoji: '\uD83E\uDDFD' },
  { id: 'barback', label: 'Barback', emoji: '\uD83E\uDDCA' },
];

const CERT_OPTIONS = [
  { id: 'servsafe', label: 'ServSafe', emoji: '\u2705' },
  { id: 'tips', label: 'TIPS Training', emoji: '\uD83C\uDF7A' },
  { id: 'food_handler', label: "Food Handler's Card", emoji: '\uD83C\uDF54' },
  { id: 'cpr_first_aid', label: 'CPR / First Aid', emoji: '\u2764\uFE0F' },
  { id: 'alcohol_awareness', label: 'Alcohol Awareness', emoji: '\uD83C\uDF77' },
];

const AVAILABILITY_OPTIONS = [
  { id: 'full_time', label: 'Full-time', emoji: '\uD83D\uDCBC' },
  { id: 'part_time', label: 'Part-time', emoji: '\u23F0' },
  { id: 'weekends', label: 'Weekends', emoji: '\uD83C\uDF89' },
  { id: 'on_call', label: 'On-call', emoji: '\uD83D\uDCF1' },
];

const EXPERIENCE_RANGES = ['0-1', '2-3', '4-6', '7-10', '10+'];

const RESTAURANT_TYPES = [
  'Fine Dining',
  'Casual',
  'Fast Casual',
  'Upscale Casual',
  'Hotel',
  'Nightlife',
  'Farm-to-Table',
  'Waterfront',
  'Food Truck',
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
        Always Free for Workers
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
      <div className="hidden sm:flex justify-between">
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

function StepBasics({ formData, updateField, password, setPassword, confirmPassword, setConfirmPassword }) {
  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        Let's get started
      </h2>
      <p className="text-text-secondary text-sm mb-4">
        Tell us a bit about yourself so restaurants can find you.
      </p>

      <div>
        <Label htmlFor="name">Full Name</Label>
        <input
          id="name"
          type="text"
          className={inputBase}
          placeholder="Jane Doe"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <input
          id="email"
          type="email"
          className={inputBase}
          placeholder="jane@example.com"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <input
          id="phone"
          type="tel"
          className={inputBase}
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
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
    </div>
  );
}

function StepRoles({ formData, updateField }) {
  const toggle = (roleId) => {
    const current = formData.roles;
    const next = current.includes(roleId)
      ? current.filter((r) => r !== roleId)
      : [...current, roleId];
    updateField('roles', next);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        What roles do you fill?
      </h2>
      <p className="text-text-secondary text-sm mb-6">
        Select all that apply. You can always update these later.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ROLE_OPTIONS.map((role) => {
          const selected = formData.roles.includes(role.id);
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

function StepCerts({ formData, updateField }) {
  const certs = formData.certifications;

  const toggleCert = (certId) => {
    const idx = certs.findIndex((c) => c.type === certId);
    if (idx >= 0) {
      // Toggle hasIt
      const updated = certs.map((c) =>
        c.type === certId ? { ...c, hasIt: !c.hasIt } : c,
      );
      updateField('certifications', updated);
    } else {
      updateField('certifications', [...certs, { type: certId, hasIt: true }]);
    }
  };

  const handleFakeUpload = (certId) => {
    const idx = certs.findIndex((c) => c.type === certId);
    if (idx >= 0) {
      const updated = certs.map((c) =>
        c.type === certId ? { ...c, fileSelected: true } : c,
      );
      updateField('certifications', updated);
    } else {
      updateField('certifications', [
        ...certs,
        { type: certId, hasIt: true, fileSelected: true },
      ]);
    }
  };

  const getCert = (certId) => certs.find((c) => c.type === certId);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">Certifications</h2>
      <p className="text-text-secondary text-sm mb-6">
        Let restaurants know what you're certified in.
      </p>

      <div className="space-y-4">
        {CERT_OPTIONS.map((cert) => {
          const data = getCert(cert.id);
          const hasIt = data?.hasIt ?? false;
          const fileSelected = data?.fileSelected ?? false;

          return (
            <div
              key={cert.id}
              className={`rounded-lg border p-4 transition-all duration-200 ${
                hasIt
                  ? 'border-accent bg-accent-soft'
                  : 'border-border-subtle bg-bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cert.emoji}</span>
                  <span className="text-text-primary font-medium">{cert.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCert(cert.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    hasIt
                      ? 'bg-accent text-black'
                      : 'border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-muted'
                  }`}
                >
                  {hasIt ? 'I have this' : 'Mark as held'}
                </button>
              </div>

              {hasIt && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleFakeUpload(cert.id)}
                    className="text-xs px-3 py-1.5 rounded border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors cursor-pointer"
                  >
                    Upload Certificate
                  </button>
                  {fileSelected && (
                    <span className="text-xs text-success">File selected</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepAvailability({ formData, updateField }) {
  const toggle = (id) => {
    const current = formData.availability;
    const next = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id];
    updateField('availability', next);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        When are you available?
      </h2>
      <p className="text-text-secondary text-sm mb-6">
        Pick the schedule types that work for you.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {AVAILABILITY_OPTIONS.map((opt) => {
          const selected = formData.availability.includes(opt.id);
          return (
            <ToggleCard key={opt.id} selected={selected} onClick={() => toggle(opt.id)}>
              <div className="text-3xl mb-2">{opt.emoji}</div>
              <div className="text-text-primary font-medium text-sm">{opt.label}</div>
            </ToggleCard>
          );
        })}
      </div>
    </div>
  );
}

function StepExperience({ formData, updateField }) {
  const toggleRestType = (type) => {
    const current = formData.restaurantTypes;
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateField('restaurantTypes', next);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">Your Experience</h2>
      <p className="text-text-secondary text-sm mb-6">
        Help us match you with the right opportunities.
      </p>

      {/* Years */}
      <div className="mb-8">
        <Label>Years of Experience</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {EXPERIENCE_RANGES.map((range) => {
            const selected = formData.experienceYears === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => updateField('experienceYears', range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  selected
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary hover:border-text-muted'
                }`}
              >
                {range} {range === '10+' ? 'yrs' : 'yrs'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Restaurant types */}
      <div>
        <Label>Restaurant Types</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {RESTAURANT_TYPES.map((type) => {
            const selected = formData.restaurantTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleRestType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  selected
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary hover:border-text-muted'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepPay({ formData, updateField }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display text-text-primary mb-1">
        Preferred Pay Rate
      </h2>
      <p className="text-text-secondary text-sm mb-6">
        Set the hourly range you're looking for.
      </p>

      {/* Current range display */}
      <div className="text-center mb-8">
        <span className="text-4xl font-display text-accent">
          ${formData.preferredRateMin} &ndash; ${formData.preferredRateMax}
        </span>
        <span className="text-text-muted text-lg ml-1">/ hr</span>
      </div>

      {/* Sliders */}
      <div className="space-y-6 mb-8">
        <div>
          <div className="flex justify-between mb-2">
            <Label>Minimum</Label>
            <span className="text-text-secondary text-sm">${formData.preferredRateMin}/hr</span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={1}
            value={formData.preferredRateMin}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val <= formData.preferredRateMax) {
                updateField('preferredRateMin', val);
              }
            }}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>$10</span>
            <span>$50</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label>Maximum</Label>
            <span className="text-text-secondary text-sm">${formData.preferredRateMax}/hr</span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={1}
            value={formData.preferredRateMax}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= formData.preferredRateMin) {
                updateField('preferredRateMax', val);
              }
            }}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>$10</span>
            <span>$50</span>
          </div>
        </div>
      </div>

      {/* Market average hint */}
      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 text-center">
        <p className="text-text-secondary text-sm">
          Tampa servers average:{' '}
          <span className="text-accent font-semibold">$18 &ndash; $25/hr</span>
        </p>
      </div>

      {/* Summary */}
      <div className="mt-8 bg-bg-surface border border-border-subtle rounded-lg p-5">
        <h3 className="text-text-primary font-semibold mb-4">Profile Summary</h3>

        <div className="space-y-3 text-sm">
          <SummaryRow label="Name" value={formData.name || '\u2014'} />
          <SummaryRow label="Email" value={formData.email || '\u2014'} />
          <SummaryRow label="Phone" value={formData.phone || '\u2014'} />
          <SummaryRow label="City" value={formData.city || '\u2014'} />
          <SummaryRow
            label="Roles"
            value={
              formData.roles.length
                ? formData.roles
                    .map((r) => ROLE_OPTIONS.find((o) => o.id === r)?.label ?? r)
                    .join(', ')
                : '\u2014'
            }
          />
          <SummaryRow
            label="Certifications"
            value={
              formData.certifications.filter((c) => c.hasIt).length
                ? formData.certifications
                    .filter((c) => c.hasIt)
                    .map((c) => CERT_OPTIONS.find((o) => o.id === c.type)?.label ?? c.type)
                    .join(', ')
                : '\u2014'
            }
          />
          <SummaryRow
            label="Availability"
            value={
              formData.availability.length
                ? formData.availability
                    .map((a) => AVAILABILITY_OPTIONS.find((o) => o.id === a)?.label ?? a)
                    .join(', ')
                : '\u2014'
            }
          />
          <SummaryRow
            label="Experience"
            value={formData.experienceYears ? `${formData.experienceYears} years` : '\u2014'}
          />
          <SummaryRow
            label="Restaurant Types"
            value={formData.restaurantTypes.length ? formData.restaurantTypes.join(', ') : '\u2014'}
          />
          <SummaryRow
            label="Pay Range"
            value={`$${formData.preferredRateMin} \u2013 $${formData.preferredRateMax}/hr`}
          />
        </div>
      </div>
    </div>
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
// Validation
// ---------------------------------------------------------------------------

function validateStep(step, formData, { password, confirmPassword } = {}) {
  switch (step) {
    case 1:
      if (!formData.name.trim()) return 'Please enter your name.';
      if (!formData.email.trim()) return 'Please enter your email.';
      if (!formData.phone.trim()) return 'Please enter your phone number.';
      if (password !== undefined) {
        if (!password) return 'Please create a password.';
        if (password.length < 6) return 'Password must be at least 6 characters.';
        if (password !== confirmPassword) return 'Passwords do not match.';
      }
      if (!formData.city) return 'Please select a city.';
      return null;
    case 2:
      if (formData.roles.length === 0) return 'Please select at least one role.';
      return null;
    case 3:
      return null; // Certs are optional
    case 4:
      if (formData.availability.length === 0)
        return 'Please select at least one availability option.';
      return null;
    case 5:
      if (!formData.experienceYears) return 'Please select your experience range.';
      return null;
    case 6:
      return null; // Pay has defaults
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function WorkerSignup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, updateField, updateFields, clearForm, isLoaded] =
    useLocalStorageForm('shiftpay-worker-signup', {
      step: 1,
      name: '',
      email: '',
      phone: '',
      city: '',
      roles: [],
      certifications: [],
      availability: [],
      experienceYears: '',
      restaurantTypes: [],
      preferredRateMin: 15,
      preferredRateMax: 30,
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
    const err = validateStep(step, formData);
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
        role: 'worker',
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

      // 2. Insert worker profile
      const { error: workerError } = await supabase.from('workers').insert({
        profile_id: userId,
        name: formData.name,
        city: formData.city,
        experience_years: parseInt(formData.experienceYears) || 0,
        preferred_rate_min: parseInt(formData.preferredRateMin) || 15,
        preferred_rate_max: parseInt(formData.preferredRateMax) || 30,
        bio: formData.bio || null,
      });

      if (workerError) {
        setError('Account created but profile save failed: ' + workerError.message);
        setSubmitting(false);
        return;
      }

      // 3. Insert roles, certifications, availability in parallel
      const inserts = [];

      if (formData.roles.length > 0) {
        const roleRows = formData.roles.map((role) => ({ worker_id: userId, role }));
        inserts.push(supabase.from('worker_roles').insert(roleRows));
      }

      const activeCerts = formData.certifications.filter((c) => c.hasIt);
      if (activeCerts.length > 0) {
        const certRows = activeCerts.map((c) => ({ worker_id: userId, certification_type: c.type }));
        inserts.push(supabase.from('worker_certifications').insert(certRows));
      }

      if (formData.availability.length > 0) {
        const availRows = formData.availability.map((a) => ({ worker_id: userId, availability_type: a }));
        inserts.push(supabase.from('worker_availability').insert(availRows));
      }

      const results = await Promise.all(inserts);
      results.forEach((r) => {
        if (r.error) console.warn('Insert warning:', r.error.message);
      });

      // Success
      clearForm();
      setShowToast(true);
      setTimeout(() => {
        navigate('/dashboard/worker');
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
        return <StepBasics formData={formData} updateField={updateField} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} />;
      case 2:
        return <StepRoles formData={formData} updateField={updateField} />;
      case 3:
        return <StepCerts formData={formData} updateField={updateField} />;
      case 4:
        return <StepAvailability formData={formData} updateField={updateField} />;
      case 5:
        return <StepExperience formData={formData} updateField={updateField} />;
      case 6:
        return <StepPay formData={formData} updateField={updateField} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        {/* Always-free banner */}
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
                {submitting ? 'Creating Account...' : 'Complete Signup'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success toast */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-success text-black font-semibold px-6 py-3 rounded-lg shadow-lg animate-slide-up z-50">
          Welcome to ShiftPay! Redirecting...
        </div>
      )}
    </div>
  );
}
