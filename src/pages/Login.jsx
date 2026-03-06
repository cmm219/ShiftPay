import { useState } from 'react';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'worker', label: 'Worker' },
  { id: 'restaurant', label: 'Restaurant' },
];

export default function Login() {
  const [activeTab, setActiveTab] = useState('worker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signupPath =
    activeTab === 'worker' ? '/worker/signup' : '/restaurant/signup';

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

          {/* Tab toggle */}
          <div className="mt-6 flex rounded-lg border border-border-subtle bg-bg-primary p-1">
            {TABS.map((tab) => (
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

          {/* Form */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 space-y-4"
          >
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

            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-accent py-3 font-semibold text-black transition-all duration-200 hover:bg-accent-hover"
            >
              Sign In
            </button>
          </form>

          {/* Sign-up link */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link
              to={signupPath}
              className="font-medium text-accent hover:underline"
            >
              Sign up as a {activeTab === 'worker' ? 'Worker' : 'Restaurant'}
            </Link>
          </p>

          {/* Demo notice */}
          <p className="mt-4 rounded-lg bg-accent-soft px-4 py-2.5 text-center text-xs text-text-muted">
            This is a demo — no real authentication
          </p>
        </div>
      </div>
    </div>
  );
}
