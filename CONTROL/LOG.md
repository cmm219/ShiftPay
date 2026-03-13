# ShiftPay — Session Log

---

## Session 1 — 2026-03-06

### What happened

Built the entire ShiftPay MVP frontend from scratch in one session.

### Work performed

**Project Setup**
- Scaffolded Vite + React project
- Installed dependencies: react-router-dom, tailwindcss, @tailwindcss/vite
- Configured Vite for port 3000 with Tailwind v4 plugin
- Set up index.html with Google Fonts (Playfair Display, DM Sans, JetBrains Mono)
- Defined full design system in `src/index.css` using Tailwind v4 `@theme` block
- Custom colors, fonts, animations (fade-in, slide-up, pulse-glow)

**Mock Data**
- Created 10 realistic worker profiles (varied roles, certs, demand statuses, reviews)
- Created 5 restaurant profiles (real Florida restaurant names)
- Created 5 shift records with 2 mock chat conversations
- All using Florida cities: Tampa, Orlando, Miami, St. Pete

**Hooks & Utils**
- `useLocalStorageForm` — Multi-step form persistence with hydration guard
- `useFilters` — Combinatorial filter logic for browse page
- `constants.js` — Roles, certs, demand statuses, availabilities, cities, pay defaults

**Components (6)**
- Navbar, Button, Badge, ProfileCard, StatCard, FilterSidebar
- All use custom Tailwind v4 theme tokens
- FilterSidebar supports embedded mode for parent layout control

**Pages (11)**
- Landing: Hero with radial gradient, stats bar, how-it-works, role categories, footer
- Login: Stub with worker/restaurant toggle
- Worker Signup: 6-step flow with progress bar, validation, localStorage, "Always Free" banner
- Restaurant Signup: 3-step flow with same pattern
- Browse: Filter sidebar (desktop sticky, mobile drawer) + responsive card grid
- Swipe: Tinder-style with card stack, keyboard nav, slide-out transitions
- Worker Profile: Two-column, certs, reviews, demand badge, hire CTA
- Restaurant Profile: Banner photo, openings with urgency badges
- Worker Dashboard: Mock for Jasmine Davis — stats, cert alert, favorites, boost CTA
- Restaurant Dashboard: Mock for Bern's — posts, matches, hired, rebook prompt
- Shift Detail: "On the Fly" urgent banner, countdown timer, "Claim Now" with pulse glow

**Build Approach**
- Used 6 parallel agents to build different parts simultaneously
- All agents completed successfully with zero build errors
- Global rename from "Shiftd" to "ShiftPay" across all files
- Production build verified (328 KB JS, 37 KB CSS gzip)

**Verification**
- `npm run build` — zero errors
- Dev server running on localhost:3000
- Browser tested: Landing, Browse, Swipe, Worker Profile, Restaurant Dashboard, Worker Signup, Shift Detail
- All routes render correctly with mock data

### Files created
- 24 source files (11 pages, 6 components, 3 data, 2 hooks, 1 util, 1 router)
- 7 CONTROL docs
- 1 AI skill file
- Config files (vite.config.js, index.html, index.css, package.json)

### Decisions made
- Dark theme + amber accents (D1)
- Playfair Display + DM Sans fonts (D2)
- localStorage over auth for MVP (D3)
- Mock data over API (D4)
- Tailwind v4 @theme (D5)
- Restaurant industry terminology (D6)
- "Always Free" for workers (D7)
- Florida-only market (D8)
- Grid primary, swipe secondary (D9)
- Unsplash for photos (D10)

### Known issues at session end
- "Post a Shift" nav link goes nowhere
- No 404 route
- No error boundaries
- Photos depend on Unsplash availability

---

## Session 2 — 2026-03-13

### What happened

Wired up Supabase backend for read operations. Created API layer, data hooks, and 115 Playwright tests.

### Work performed

**Supabase Setup**
- Created Supabase project (`shiftpay`)
- Configured `.env.local` with project URL and anon key
- Ran migration 001 (13 tables, enums, triggers, RLS, indexes, storage buckets)
- Fixed migration ordering bug (`auth_role()` referenced `profiles` before creation)
- Ran migration 002 (anonymous SELECT policies for public browsing)

**Auth System**
- `src/contexts/AuthContext.jsx` — Full auth state management (signUp, signIn, signOut, auto profile fetch)
- `src/hooks/useAuth.js` — Context consumer hook
- `src/components/ProtectedRoute.jsx` — Guards dashboard routes, enforces role-based access
- Updated `Login.jsx` — Wired to Supabase Auth (real email/password sign-in)
- Updated `WorkerSignup.jsx` — On completion: creates auth user → inserts worker + roles + certs + availability
- Updated `RestaurantSignup.jsx` — On completion: creates auth user → inserts restaurant + hiring roles
- Updated `Navbar.jsx` — Auth-aware: shows user menu with avatar, email, role, sign out when logged in

**API Layer**
- `src/lib/supabase.js` — Supabase client init (returns null if env vars missing)
- `src/lib/api.js` — Query functions with Supabase nested selects
- Transform layer: snake_case DB → camelCase frontend (matches mock data shape)
- Functions: `fetchWorkers()`, `fetchWorkerById()`, `fetchRestaurants()`, `fetchRestaurantById()`, `fetchShifts()`, `fetchShiftById()`

**Data Hooks**
- `src/hooks/useData.js` — Generic `useQuery()` hook with loading/error states
- Automatic mock data fallback when Supabase is unconfigured or empty
- Exports: `useWorkers()`, `useWorker(id)`, `useRestaurants()`, `useRestaurant(id)`, `useShifts()`, `useShift(id)`

**Page Updates (Read Operations)**
- Browse, Swipe, WorkerProfile, RestaurantProfile, ShiftDetail now use Supabase hooks
- Added LoadingSpinner component for async states
- Fixed React hooks violation in Swipe.jsx (loading check was between useState and useCallback)

**Git Strategy**
- Created `demo` branch from master (preserves mock-data-only version)
- Master branch continues with real backend integration

**Playwright Testing**
- 12 spec files, 115 tests total, all passing
- Coverage: Landing, Browse, Swipe, WorkerProfile, RestaurantProfile, ShiftDetail, Login, WorkerSignup, RestaurantSignup, WorkerDashboard, RestaurantDashboard, Navigation
- Tests verify redirects, form inputs, filters, navigation, mobile viewports

### Files created/modified
- New: `src/contexts/AuthContext.jsx`, `src/hooks/useAuth.js`, `src/components/ProtectedRoute.jsx`
- New: `src/lib/supabase.js`, `src/lib/api.js`, `src/hooks/useData.js`, `src/components/LoadingSpinner.jsx`
- New: `supabase/migrations/002_anon_read_policies.sql`
- New: `playwright.config.js`, 12 test files in `tests/`
- Modified: `Login.jsx`, `WorkerSignup.jsx`, `RestaurantSignup.jsx`, `Navbar.jsx`, `App.jsx` (auth wiring)
- Modified: `Browse.jsx`, `Swipe.jsx`, `WorkerProfile.jsx`, `RestaurantProfile.jsx`, `ShiftDetail.jsx` (Supabase hooks)
- Modified: `package.json` (added @supabase/supabase-js, @playwright/test)

### Decisions made
- D11: Supabase as BaaS (PostgreSQL, Auth, RLS, Storage, Realtime)
- D12: Mock data fallback pattern (try Supabase first, fall back to mock if empty)
- D13: Demo branch for mock-only demos, master for real backend
- D14: Snake-to-camel transform layer at API boundary
- D15: Auto-create profile via database trigger on auth signup

### Known issues at session end
- Dashboards still use hardcoded mock data (need real users to show dynamic data)
- Database is empty — no users have signed up yet, app runs on mock fallback
- No signup has been tested end-to-end yet (first real user not created)
- Remaining write operations: shift claiming, reviews, favorites
