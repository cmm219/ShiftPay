# ShiftPay — Current State

**Last updated**: 2026-03-13

---

## Build Status: Backend Phase 2 Complete

Supabase backend connected. Read operations wired up with automatic mock data fallback. 115 Playwright e2e tests passing. Demo branch preserved with mock-only version.

## Pages (11/11 built)

| Route | Page | Status |
|-------|------|--------|
| `/` | Landing | Complete |
| `/login` | Login | Supabase Auth (email/password, role toggle) |
| `/worker/signup` | Worker Signup | Writes to Supabase (6 steps, localStorage + DB) |
| `/restaurant/signup` | Restaurant Signup | Writes to Supabase (3 steps, localStorage + DB) |
| `/browse` | Browse Workers | Supabase + mock fallback |
| `/swipe` | Swipe View | Supabase + mock fallback |
| `/worker/:id` | Worker Profile | Supabase + mock fallback |
| `/restaurant/:id` | Restaurant Profile | Supabase + mock fallback |
| `/dashboard/worker` | Worker Dashboard | Mock only (needs auth) |
| `/dashboard/restaurant` | Restaurant Dashboard | Mock only (needs auth) |
| `/jobs/:id` | Shift Detail | Supabase + mock fallback |

## Components (8 built)

| Component | Props | Notes |
|-----------|-------|-------|
| Navbar | — | Fixed top, mobile hamburger, auth-aware (shows user menu when logged in) |
| Button | variant, size | primary/secondary/ghost/danger |
| Badge | type, value, certStatus | role/cert/status/availability |
| ProfileCard | worker, onViewProfile | Browse grid card |
| StatCard | icon, value, label | Dashboard stat tiles |
| FilterSidebar | filters, onFilterChange, onReset, embedded | Browse filters, mobile drawer |
| LoadingSpinner | message | Async loading state indicator |
| ProtectedRoute | — | Guards dashboard routes, redirects to /login, enforces role-based access |

## Mock Data

| File | Records | Notes |
|------|---------|-------|
| `workers.js` | 10 workers | Varied roles, certs, cities, demand statuses |
| `restaurants.js` | 5 restaurants | Real FL restaurant names |
| `shifts.js` | 5 shifts + 2 chat convos | Mix of open/claimed/completed |

## Hooks

| Hook | Key | Purpose |
|------|-----|---------|
| `useLocalStorageForm` | `shiftpay-worker-signup` | Worker signup persistence |
| `useLocalStorageForm` | `shiftpay-restaurant-signup` | Restaurant signup persistence |
| `useFilters` | — | Browse page combinatorial filtering |
| `useAuth` | — | Consumes AuthContext (user, profile, signIn, signUp, signOut) |
| `useWorkers` | — | Fetch workers from Supabase (mock fallback) |
| `useWorker(id)` | — | Fetch single worker by ID |
| `useRestaurants` | — | Fetch restaurants from Supabase |
| `useRestaurant(id)` | — | Fetch single restaurant by ID |
| `useShifts` | — | Fetch shifts from Supabase |
| `useShift(id)` | — | Fetch single shift by ID |

## Auth System

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.jsx` | AuthProvider with signUp, signIn, signOut, auto profile fetch |
| `src/hooks/useAuth.js` | Context consumer hook |
| `src/components/ProtectedRoute.jsx` | Route guard with role-based redirects |

**Auth flow:**
- Signup creates Supabase Auth user → DB trigger auto-creates `profiles` row → signup page inserts worker/restaurant record + related tables
- Login authenticates → auto-fetches profile → redirects to role-appropriate dashboard
- Navbar shows user menu (avatar, email, role, sign out) when authenticated
- ProtectedRoute redirects unauthenticated users to `/login`, enforces worker vs restaurant access

## API Layer

| File | Purpose |
|------|---------|
| `src/lib/supabase.js` | Supabase client init (env vars, returns null if unconfigured) |
| `src/lib/api.js` | Query functions + snake→camelCase transforms |

## Supabase

| Item | Details |
|------|---------|
| Project | `shiftpay` on Supabase |
| Migration 001 | 13 tables, enums, triggers, RLS, indexes, storage |
| Migration 002 | Anonymous read policies for public browsing |
| Auth | Supabase Auth (email/password, role-based) |
| Database | Empty — app falls back to mock data automatically |

## Testing

| Framework | Tests | Status |
|-----------|-------|--------|
| Playwright | 115 e2e tests across 12 spec files | All passing |

## Branches

| Branch | Purpose |
|--------|---------|
| `master` | Backend integration (Supabase + mock fallback) |
| `demo` | Mock-data-only version for demos |

## What's Real vs. Mock

| Feature | Real? | Notes |
|---------|-------|-------|
| Page navigation | Real | React Router, all routes work |
| Signup form UX | Real | Multi-step, validation, back/forward, localStorage |
| Filter/browse | Real | All filters work combinatorially |
| Swipe + keyboard | Real | Left/right arrows, space to view profile |
| Supabase connection | Real | Read queries with mock fallback |
| Worker photos | External | Unsplash URLs, not user uploads |
| Login/auth | Real | Supabase Auth (email/password), role-based routing, session persistence |
| Signup → DB writes | Real | Worker + Restaurant signup write to Supabase tables |
| Cert uploads | Mock | UI only, "File selected" text, no storage |
| Chat messages | Mock | Static conversation data |
| Ratings/reviews | Mock | Hardcoded in worker data |
| Demand statuses | Mock | Static field, not computed |
| Shift claiming | Mock | Button exists, no real booking |
| Rebook | Mock | Button exists, no real re-hire flow |
| Payroll | Mock | Button exists, no integration |
| Notifications | Not built | No push, email, or SMS |
| Payments | Not built | No Stripe, no billing |

## Known Gaps

1. **No 404 page** — Unknown routes show blank content area
2. **"Post a Shift" nav link** goes to non-existent route
3. **Images depend on Unsplash** — If Unsplash is down, photos break
4. **No error boundaries** — React errors crash the whole app
5. **Accessibility** — Basic keyboard nav works, but no ARIA labels, skip links, or screen reader testing
6. **SEO** — Client-side rendered, no meta tags, no SSR
7. **Dashboards still mock-only** — Need auth integration to show current user's data
8. **Database empty** — No seed data in Supabase yet, app uses mock fallback
