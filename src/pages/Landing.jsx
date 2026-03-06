import { Link } from 'react-router-dom';

const stats = [
  { value: '500+', label: 'Verified Workers' },
  { value: '50+', label: 'Restaurants' },
  { value: '100%', label: 'ServSafe Certified' },
];

const steps = [
  {
    number: '01',
    title: 'Create Your Profile',
    icon: '\uD83D\uDCCB',
    description: 'Sign up in minutes. Add your roles, certs, and availability.',
  },
  {
    number: '02',
    title: 'Get Matched',
    icon: '\uD83E\uDD1D',
    description: 'Restaurants browse, swipe, and express interest in top talent.',
  },
  {
    number: '03',
    title: 'Start Working',
    icon: '\uD83D\uDD25',
    description: 'Accept shifts, get paid, build your reputation.',
  },
];

const roles = [
  {
    icon: '\uD83D\uDD25',
    name: 'Cook',
    description: 'Line cooks, prep cooks, and kitchen leads ready to fire on all cylinders.',
  },
  {
    icon: '\uD83C\uDF7D\uFE0F',
    name: 'Server',
    description: 'Experienced front-of-house staff who deliver exceptional guest experiences.',
  },
  {
    icon: '\uD83C\uDF78',
    name: 'Bartender',
    description: 'Skilled mixologists and bar pros who keep the drinks flowing.',
  },
  {
    icon: '\uD83D\uDCCB',
    name: 'Host',
    description: 'Friendly, organized hosts who manage the floor and set the tone.',
  },
  {
    icon: '\uD83E\uDDFD',
    name: 'Dishwasher',
    description: 'The backbone of every kitchen. Reliable, fast, and always essential.',
  },
  {
    icon: '\uD83E\uDDCA',
    name: 'Barback',
    description: 'Hardworking support staff who keep the bar stocked and running smooth.',
  },
];

const footerLinks = [
  { label: 'Browse Workers', to: '/browse' },
  { label: 'Post a Shift', to: '/shifts/new' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-primary font-body">
      {/* ====== HERO SECTION ====== */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, var(--color-accent-glow) 0%, var(--color-bg-primary) 70%)',
        }}
      >
        <div
          className="animate-fade-in max-w-4xl"
          style={{ animationDelay: '0s' }}
        >
          <h1 className="font-display text-5xl leading-tight font-bold tracking-tight text-text-primary md:text-7xl md:leading-tight">
            Find Certified Restaurant Staff.{' '}
            <span className="text-accent">Instantly.</span>
          </h1>

          <p
            className="animate-fade-in mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-text-secondary"
            style={{ animationDelay: '0.15s', opacity: 0 }}
          >
            The marketplace connecting Florida's best hospitality talent with
            restaurants that need them.
          </p>

          <div
            className="animate-fade-in mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: '0.3s', opacity: 0 }}
          >
            <Link
              to="/browse"
              className="inline-flex items-center rounded-lg bg-accent px-8 py-3.5 text-lg font-semibold text-black transition-all duration-200 hover:bg-accent-hover"
            >
              I'm a Restaurant
            </Link>
            <Link
              to="/worker/signup"
              className="inline-flex items-center rounded-lg border border-accent bg-transparent px-8 py-3.5 text-lg font-semibold text-accent transition-all duration-200 hover:bg-accent-soft"
            >
              I'm Looking for Work
            </Link>
          </div>
        </div>

        {/* scroll indicator */}
        <div
          className="animate-fade-in absolute bottom-10 text-text-muted"
          style={{ animationDelay: '0.6s', opacity: 0 }}
        >
          <svg
            className="mx-auto h-6 w-6 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      {/* ====== STATS BAR ====== */}
      <section
        className="animate-fade-in border-y border-border-subtle bg-bg-surface"
        style={{ animationDelay: '0.45s', opacity: 0 }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-around gap-8 px-6 py-10 sm:flex-row sm:gap-0">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-2xl font-bold text-text-primary md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm tracking-wide text-text-secondary uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2
          className="animate-fade-in text-center font-display text-3xl font-bold text-text-primary md:text-4xl"
          style={{ animationDelay: '0.1s', opacity: 0 }}
        >
          How ShiftPay Works
        </h2>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="animate-fade-in rounded-xl border border-border-subtle bg-bg-surface p-8"
              style={{ animationDelay: `${0.2 + i * 0.15}s`, opacity: 0 }}
            >
              <span className="font-mono text-sm font-semibold text-accent">
                {step.number}
              </span>
              <div className="mt-4 text-4xl">{step.icon}</div>
              <h3 className="mt-4 font-display text-xl font-semibold text-text-primary">
                {step.title}
              </h3>
              <p className="mt-2 leading-relaxed text-text-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== ROLE CATEGORIES ====== */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2
          className="animate-fade-in text-center font-display text-3xl font-bold text-text-primary md:text-4xl"
          style={{ animationDelay: '0.1s', opacity: 0 }}
        >
          Every Role Covered
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role, i) => (
            <div
              key={role.name}
              className="animate-fade-in rounded-xl border border-border-subtle bg-bg-surface p-6 transition-all duration-300 hover:border-accent/30"
              style={{ animationDelay: `${0.15 + i * 0.1}s`, opacity: 0 }}
            >
              <div className="text-3xl">{role.icon}</div>
              <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">
                {role.name}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-border-subtle bg-bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-12 md:flex-row md:justify-between">
          {/* Logo & tagline */}
          <div className="text-center md:text-left">
            <Link to="/" className="font-display text-2xl font-bold text-accent">
              ShiftPay
            </Link>
            <p className="mt-1 text-sm text-text-muted">
              Built for Florida's hospitality industry.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-border-subtle py-6 text-center text-sm text-text-muted">
          &copy; 2026 ShiftPay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
