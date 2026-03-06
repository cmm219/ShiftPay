# ShiftPay — Current State

**Last updated**: 2026-03-06

---

## Build Status: MVP Complete

The frontend MVP is fully built and running. No backend, no auth, no real data — all mock.

## Pages (11/11 built)

| Route | Page | Status |
|-------|------|--------|
| `/` | Landing | Complete |
| `/login` | Login | Stub (no real auth) |
| `/worker/signup` | Worker Signup | Complete (6 steps, localStorage) |
| `/restaurant/signup` | Restaurant Signup | Complete (3 steps, localStorage) |
| `/browse` | Browse Workers | Complete (filters, grid) |
| `/swipe` | Swipe View | Complete (keyboard nav, transitions) |
| `/worker/:id` | Worker Profile | Complete (reviews, certs, demand) |
| `/restaurant/:id` | Restaurant Profile | Complete (openings, apply) |
| `/dashboard/worker` | Worker Dashboard | Complete (mock data for Jasmine Davis) |
| `/dashboard/restaurant` | Restaurant Dashboard | Complete (mock data for Bern's) |
| `/jobs/:id` | Shift Detail | Complete (countdown, claim button) |

## Components (6/6 built)

| Component | Props | Notes |
|-----------|-------|-------|
| Navbar | — | Fixed top, mobile hamburger, ShiftPay logo |
| Button | variant, size | primary/secondary/ghost/danger |
| Badge | type, value, certStatus | role/cert/status/availability |
| ProfileCard | worker, onViewProfile | Browse grid card |
| StatCard | icon, value, label | Dashboard stat tiles |
| FilterSidebar | filters, onFilterChange, onReset, embedded | Browse filters, mobile drawer |

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

## What's Real vs. Mock

| Feature | Real? | Notes |
|---------|-------|-------|
| Page navigation | Real | React Router, all routes work |
| Signup form UX | Real | Multi-step, validation, back/forward, localStorage |
| Filter/browse | Real | All filters work combinatorially |
| Swipe + keyboard | Real | Left/right arrows, space to view profile |
| Worker photos | External | Unsplash URLs, not user uploads |
| Login/auth | Mock | Stub form, no real authentication |
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
4. **No loading states** — Pages render instantly from mock data (will need skeletons with real API)
5. **No error boundaries** — React errors crash the whole app
6. **Accessibility** — Basic keyboard nav works, but no ARIA labels, skip links, or screen reader testing
7. **SEO** — Client-side rendered, no meta tags, no SSR
