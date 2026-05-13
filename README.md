# ShiftPay

ShiftPay is a full-stack marketplace MVP for restaurants that need qualified shift workers fast. Restaurants can post urgent shifts or long-term openings, workers can browse and claim available work, and both sides get role-specific dashboards for scheduling, completion, reviews, and billing.

This repository is built as a portfolio project with real application architecture: React 19, Supabase Auth/Postgres/RLS, Stripe checkout/webhooks, Twilio-ready worker notifications, and Playwright coverage.

## Highlights

- Role-based auth for workers and restaurants with protected dashboards.
- Public marketplace browse, swipe, worker profile, restaurant profile, and shift detail flows.
- Multi-step worker and restaurant onboarding with local form persistence.
- Supabase data layer with mock-data fallback for local demos without credentials.
- Race-safe shift claiming through Postgres RPCs.
- Two-party shift completion and review tables.
- Stripe-ready subscription and invoice checkout edge functions.
- Twilio-ready SMS notification edge function with per-worker rate logging.
- Responsive dark UI with Tailwind CSS 4 design tokens.
- End-to-end Playwright specs for critical routes and workflows.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 7 |
| Styling | Tailwind CSS 4, custom theme tokens |
| Backend | Supabase Auth, Postgres, RLS, RPCs, Edge Functions |
| Payments | Stripe Checkout and webhooks |
| Notifications | Twilio SMS via Supabase Edge Function |
| Testing | ESLint, Playwright |

## Product Scope

ShiftPay models two account types:

- **Workers** create profiles with roles, availability, certifications, rates, and experience.
- **Restaurants** create business profiles, post shifts/openings, track fills, and manage billing.

The app supports a credential-free demo mode. If Supabase environment variables are missing, read views automatically fall back to curated mock data so reviewers can still inspect the UI and flows locally.

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

For UI-only review, leave the values blank and the app will use mock data for public read flows. For real backend flows, provide Supabase credentials and apply the migrations in `supabase/migrations`.

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

## Repository Structure

```text
src/
  components/        Reusable UI primitives and cards
  contexts/          Auth provider and context value
  data/              Mock demo data
  hooks/             Data, auth, form, and filter hooks
  lib/               Supabase client and API adapter
  pages/             Route-level React views
  utils/             Shared constants
supabase/
  functions/         Stripe and notification edge functions
  migrations/        Database schema, RLS policies, RPCs, billing, SMS logs
tests/               Playwright route and flow coverage
```

## Architecture Notes

- The frontend talks to a small API adapter in `src/lib/api.js` instead of scattering Supabase calls through pages.
- Database writes that need consistency, such as claiming a shift, are handled by Postgres functions with RLS-aware ownership checks.
- Auth profiles are enriched client-side with the active worker or restaurant entity id, keeping dashboard ownership checks explicit.
- Public read flows degrade to mock data when Supabase is not configured, which keeps the app reviewable without exposing private infrastructure.
- Payment and notification integrations are isolated in Supabase Edge Functions so browser code never handles service secrets.

## Current Boundaries

This is an MVP, not a deployed marketplace. File uploads, admin adjudication, production seed data, and real operational monitoring are intentionally outside the current scope. The code is structured so those pieces can be added without rewriting the routing, data adapter, or database ownership model.

## License

Portfolio project. All rights reserved unless a license is added.
