# ShiftPay — Tasks

**Last updated**: 2026-03-13

---

## Completed (Session 1 — MVP Frontend)

- [x] Scaffold Vite + React project
- [x] Install Tailwind v4, React Router
- [x] Define design system (@theme tokens, fonts, animations)
- [x] Build mock data (10 workers, 5 restaurants, 5 shifts)
- [x] Build custom hooks (useLocalStorageForm, useFilters)
- [x] Build utility constants (roles, certs, demand statuses, cities)
- [x] Build all 6 reusable components
- [x] Build all 11 pages
- [x] Wire up App.jsx router
- [x] Rename Shiftd → ShiftPay globally
- [x] Verify build (zero errors)
- [x] Browser test all routes
- [x] Create CONTROL docs
- [x] Create AI skill file

## Completed (Session 2 — Backend Integration)

- [x] Decide backend: Supabase
- [x] Design database schema (13 tables, enums, RLS policies)
- [x] Run migration 001 (initial schema) on Supabase
- [x] Run migration 002 (anonymous read policies)
- [x] Build Supabase client (src/lib/supabase.js)
- [x] Build API layer (src/lib/api.js) with snake→camelCase transforms
- [x] Build data hooks (src/hooks/useData.js) with mock fallback
- [x] Build AuthContext (src/contexts/AuthContext.jsx) — signUp, signIn, signOut, profile fetch
- [x] Build useAuth hook (src/hooks/useAuth.js)
- [x] Build ProtectedRoute component (role-based dashboard guards)
- [x] Wire Login page to Supabase Auth (real sign-in/sign-out)
- [x] Wire Worker Signup to Supabase (creates auth user + workers + roles + certs + availability)
- [x] Wire Restaurant Signup to Supabase (creates auth user + restaurants + hiring roles)
- [x] Update Navbar with auth-aware UI (user menu, avatar, sign out)
- [x] Update Browse, Swipe, WorkerProfile, RestaurantProfile, ShiftDetail to use Supabase
- [x] Add LoadingSpinner component
- [x] Create `demo` branch (mock-data-only for demos)
- [x] Write 115 Playwright e2e tests (12 spec files, all passing)
- [x] Set up Playwright config with auto dev server

---

## Immediate Next

- [ ] Test signup end-to-end (create first real user to verify full flow works)
- [ ] Seed database with mock data (so browse/profiles show real DB data)
- [ ] Fix "Post a Shift" nav link (currently points to non-existent `/post-shift`)
- [ ] Add a 404 catch-all route
- [ ] Add React error boundary wrapper
- [ ] Replace Unsplash photos with local fallbacks or a more reliable CDN

---

## Backend Phase 3 — Remaining Write Operations

- [ ] Update dashboards to show current user's data (currently hardcoded mock)
- [ ] Shift claiming (write to shifts table)
- [ ] Post-shift reviews (write to reviews table)
- [ ] Favorites/rebook (write operations)

---

## Backend Phase 4 — File Uploads

- [ ] Profile photo uploads to Supabase Storage
- [ ] Cert document uploads
- [ ] Replace Unsplash URLs with uploaded photos

---

## Polish

- [ ] Add page transition animations between routes
- [ ] Add skeleton loading states
- [ ] Mobile test pass — verify all pages on small screens
- [ ] Add ARIA labels to interactive elements
- [ ] Add meta tags / page titles per route
- [ ] Add favicon (use existing ICON SHIFTPAY.jpg as source)

---

## Deferred (Phase 5+)

- [ ] Real-time messaging (Supabase Realtime)
- [ ] Push notifications
- [ ] Stripe payments for restaurants
- [ ] Admin dashboard for cert verification
- [ ] AI matching engine
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Native mobile app
