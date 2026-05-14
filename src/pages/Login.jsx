import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_TABS = [
  { id: 'worker', label: 'Worker' },
  { id: 'restaurant', label: 'Hiring team' },
];

const METHOD_TABS = [
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
];

export default function Login() {
  const [activeTab, setActiveTab] = useState('worker');
  const [loginMethod, setLoginMethod] = useState('email');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const otpInputRef = useRef(null);
  const cooldownRef = useRef(null);

  const { user, profile, signIn, signInWithPhone, verifyOtp, signInDemo } = useAuth();
  const navigate = useNavigate();

  // Once user and profile are loaded after sign-in, redirect by role
  useEffect(() => {
    if (user && profile?.role) {
      const dest =
        profile.role === 'restaurant'
          ? '/dashboard/hiring'
          : '/dashboard/worker';
      navigate(dest, { replace: true });
    }
  }, [user, profile, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  // Auto-focus OTP input when code is sent
  useEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent]);

  const signupPath =
    activeTab === 'worker' ? '/worker/signup' : '/hiring/signup';

  // Format phone for display: (555) 555-5555
  const formatPhoneDisplay = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: signInError } = await signIn({ email, password });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = useCallback(async () => {
    setError('');

    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSendingOtp(true);
    try {
      const fullPhone = `+1${phone}`;
      const { error: otpError } = await signInWithPhone(fullPhone);

      if (otpError) {
        setError(otpError.message || 'Failed to send verification code.');
      } else {
        setOtpSent(true);
        setCooldown(60);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  }, [phone, signInWithPhone]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const fullPhone = `+1${phone}`;
      const { error: verifyError } = await verifyOtp(fullPhone, otp);

      if (verifyError) {
        setError(verifyError.message || 'Invalid verification code.');
      }
      // On success, the useEffect above will handle navigation
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendCode = () => {
    if (cooldown > 0) return;
    setOtp('');
    handleSendOtp();
  };

  const handleSwitchMethod = (method) => {
    setLoginMethod(method);
    setError('');
  };

  const handleDemoSignIn = (role) => {
    signInDemo(role);
    navigate(role === 'restaurant' ? '/dashboard/hiring' : '/dashboard/worker');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 font-body">
      <div className="animate-fade-in w-full max-w-md">
        {/* Logo */}
        <Link
          to="/"
          className="mb-8 block text-center font-display text-3xl font-bold text-accent"
        >
          ShiftPay
        </Link>

        {/* Card */}
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-8">
          <h1 className="text-center font-display text-2xl font-bold text-text-primary">
            Sign In
          </h1>

          {/* Role tab toggle */}
          <div className="mt-6 flex rounded-lg border border-border-subtle bg-bg-primary p-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 cursor-pointer rounded-md py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-accent text-black'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-accent/25 bg-accent-soft p-4">
            <div className="mb-3 text-sm text-[#f5d27d]">
              Demo access uses seeded local data only. No real account, messaging, hiring outreach, or payments are created.
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('restaurant')}
                className="cursor-pointer rounded-md bg-accent px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
              >
                Demo hiring team
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('worker')}
                className="cursor-pointer rounded-md border border-accent/35 bg-transparent px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
              >
                Demo worker
              </button>
            </div>
          </div>

          {/* Login method toggle */}
          <div className="mt-4 flex rounded-lg border border-border-subtle bg-bg-primary p-1">
            {METHOD_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSwitchMethod(tab.id)}
                className={`flex-1 cursor-pointer rounded-md py-2 text-sm font-medium transition-all duration-200 ${
                  loginMethod === tab.id
                    ? 'bg-accent text-black'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Email login form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
                />
              </div>

              <div className="text-right">
                <span className="cursor-pointer text-sm text-text-muted hover:text-text-secondary">
                  Forgot password?
                </span>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full cursor-pointer rounded-lg bg-accent py-3 font-semibold text-black transition-all duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Phone OTP login form */}
          {loginMethod === 'phone' && (
            <div className="mt-6 space-y-4">
              {!otpSent ? (
                /* Step 1: Phone number input */
                <>
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block text-sm font-medium text-text-secondary"
                    >
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center rounded-lg border border-border-subtle bg-bg-primary px-3 text-sm text-text-secondary">
                        +1
                      </span>
                      <input
                        id="phone"
                        type="tel"
                        value={formatPhoneDisplay(phone)}
                        onChange={handlePhoneChange}
                        placeholder="(555) 555-5555"
                        className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || phone.length < 10}
                    className="w-full cursor-pointer rounded-lg bg-accent py-3 font-semibold text-black transition-all duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingOtp ? 'Sending code...' : 'Send Code'}
                  </button>
                </>
              ) : (
                /* Step 2: OTP verification */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-center text-sm text-text-secondary">
                    We sent a code to{' '}
                    <span className="font-medium text-text-primary">
                      +1 {formatPhoneDisplay(phone)}
                    </span>
                  </p>

                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-1.5 block text-sm font-medium text-text-secondary"
                    >
                      Verification Code
                    </label>
                    <input
                      ref={otpInputRef}
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="000000"
                      className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifyingOtp || otp.length < 6}
                    className="w-full cursor-pointer rounded-lg bg-accent py-3 font-semibold text-black transition-all duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify'}
                  </button>

                  {/* Resend code */}
                  <div className="text-center">
                    {cooldown > 0 ? (
                      <span className="text-sm text-text-muted">
                        Resend code in {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        className="cursor-pointer text-sm font-medium text-accent hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </div>

                  {/* Change phone number */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                        setError('');
                        setCooldown(0);
                      }}
                      className="cursor-pointer text-sm text-text-muted hover:text-text-secondary"
                    >
                      Use a different number
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Sign-up link */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link
              to={signupPath}
              className="font-medium text-accent hover:underline"
            >
            Sign up as a {activeTab === 'worker' ? 'Worker' : 'Hiring Team'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
