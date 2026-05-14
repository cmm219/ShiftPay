# ShiftPay

ShiftPay is a hospitality hiring marketplace MVP for demo and portfolio review. It focuses on long-term jobs and hiring-team workflows first, with one-time event shifts available for banquet, catering, pop-up, and similar coverage needs.

The app is built to be easy to inspect on GitHub and easy to run locally: React 19, Vite 7, Tailwind CSS 4, Supabase-ready data access, Stripe/Twilio-ready edge function structure, and Playwright coverage. Public demo flows use seeded mock data when Supabase is not configured.

## Demo Flow

1. Run the app and open `http://localhost:3000`.
2. Use **Login -> Demo hiring team** to inspect the hiring dashboard, job lifecycle reminders, renew/close actions, and repost flow.
3. Use **Login -> Demo worker** to inspect the worker dashboard.
4. Browse `/browse` for workers and jobs, or use `/swipe` for the card-style worker discovery view.

No real accounts, payments, messages, emails, SMS notifications, or live hiring outreach are created in demo mode.

## Highlights

- Jobs-first marketplace browse experience with worker and job tabs.
- Demo hiring-team dashboard with active jobs, expiring jobs, expired event shifts, renew, close, and repost flows.
- Public worker profiles, company profiles, job detail pages, and swipe discovery.
- Multi-step worker and hiring-team onboarding with local form persistence.
- Supabase data adapter with mock-data fallback for credential-free review.
- Stripe and Twilio edge-function structure kept isolated from browser code.
- Responsive dark UI with Tailwind CSS 4 design tokens.
- Playwright coverage for critical routes and lifecycle workflows.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 7 |
| Styling | Tailwind CSS 4, custom theme tokens |
| Data/Auth Ready | Supabase Auth, Postgres, RLS, RPCs, Edge Functions |
| Payments Ready | Stripe Checkout and webhooks |
| Notifications Ready | Twilio SMS via Supabase Edge Function |
| Testing | ESLint, Playwright |

## Product Scope

ShiftPay models two account types:

- **Workers** create profiles with roles, availability, certifications, rates, and experience.
- **Hiring teams** create company profiles, post long-term jobs, optionally post event shifts, and review lifecycle states.

The current portfolio build is intentionally demo-safe. Lifecycle expiration, renewal, and repost behavior is wired in the frontend with local demo state. Real email/SMS reminders, cron jobs, durable notification logs, and production hiring operations are future backend work.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Optional: Supabase project for real auth/database flows
- Optional: Stripe and Twilio credentials for payment/SMS edge functions

### Install

```bash
npm install
```

### Environment

Create `.env.local` from the example file:

```bash
cp .env.example .env.local
```

For UI-only review, keep `VITE_FORCE_MOCK_DATA=true` and the app will use mock data for public read flows without attempting network calls. For real backend flows, set `VITE_FORCE_MOCK_DATA=false`, provide Supabase credentials, and apply the migrations in `supabase/migrations`.

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Verify

```bash
npm run lint
npm run build
npm run test:e2e
```

## Useful Routes

| Route | Purpose |
| --- | --- |
| `/` | Portfolio landing page |
| `/browse` | Worker and job marketplace |
| `/swipe` | Worker discovery view |
| `/login` | Login plus demo worker / demo hiring-team access |
| `/hiring/signup` | Hiring-team onboarding |
| `/worker/signup` | Worker onboarding |
| `/dashboard/hiring` | Hiring-team dashboard |
| `/dashboard/worker` | Worker dashboard |
| `/post-job` | Long-term job and event-shift posting flow |
| `/company/:id` | Public company profile |
| `/jobs/:id` | Event-shift detail route |

Legacy routes such as `/restaurant/signup`, `/dashboard/restaurant`, `/post-shift`, and `/restaurant/:id` remain available for compatibility with the existing schema and older links.

## Repository Structure

```text
src/
  components/        Reusable UI primitives and cards
  contexts/          Auth provider and context value
  data/              Mock demo data
  hooks/             Data, auth, form, and filter hooks
  lib/               Supabase client and API adapter
  pages/             Route-level React views
  utils/             Shared constants and posting lifecycle helpers
supabase/
  functions/         Stripe and notification edge functions
  migrations/        Database schema, RLS policies, RPCs, billing, SMS logs
tests/               Playwright route and flow coverage
```

## Architecture Notes

- The frontend talks to `src/lib/api.js` instead of scattering Supabase calls through pages.
- Current database table and role names still use `restaurants` and `shifts`; UI routes/components are moving toward hiring-team/company/job language while preserving compatibility.
- Public read flows degrade to mock data when Supabase is not configured, which keeps the app reviewable without exposing private infrastructure.
- Demo lifecycle state is stored locally so reviewers can renew, close, and repost without backend jobs.
- Payment and notification integrations are isolated in Supabase Edge Functions so browser code never handles service secrets.

## Current Boundaries

This is an MVP, not a deployed marketplace. Real operational monitoring, production seed data, file uploads, admin adjudication, scheduled reminder delivery, and live messaging are intentionally outside the current scope.

## License

Portfolio project. All rights reserved unless a license is added.
