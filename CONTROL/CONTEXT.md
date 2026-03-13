# ShiftPay — Technical Context

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build tool | Vite 7.3 |
| Framework | React 19 |
| Styling | Tailwind CSS 4 (v4 uses `@theme` in CSS, NOT tailwind.config.js) |
| Routing | React Router 7 (v7 — BrowserRouter) |
| Backend | Supabase (PostgreSQL, Auth, RLS, Storage) |
| Auth | Supabase Auth (email/password, role-based) |
| State | localStorage via `useLocalStorageForm` + React Context for auth |
| Data | Supabase queries with automatic mock data fallback |
| Testing | Playwright (115 e2e tests) |
| Fonts | Google Fonts — Playfair Display (display), DM Sans (body), JetBrains Mono (mono) |
| Dev server | localhost:3000 |

## How to Run

```bash
npm install           # first time only
npm run dev           # starts Vite on localhost:3000
npm run build         # production build to dist/
npx playwright test   # run e2e tests (auto-starts dev server)
```

## Environment Variables

```bash
# .env.local (not committed)
VITE_SUPABASE_URL=https://ukiooedxfozuakvdjcly.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

If env vars are missing, app runs in mock-data-only mode (no auth, no DB writes).

## File Structure

```
C:\Users\Cmcna\Dev\projects\shiftpay\
├── CONTROL/                  # Project docs (authoritative)
├── .claude/skills/shiftpay/  # AI skill context
├── public/                   # Static assets
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql        # 13 tables, enums, triggers, RLS, indexes, storage
│       └── 002_anon_read_policies.sql    # Anonymous SELECT policies for public browsing
├── tests/                    # Playwright e2e tests (12 spec files, 115 tests)
│   ├── landing.spec.js       # 9 tests
│   ├── browse.spec.js        # 9 tests
│   ├── swipe.spec.js         # 10 tests
│   ├── worker-profile.spec.js      # 12 tests
│   ├── restaurant-profile.spec.js  # 10 tests
│   ├── shift-detail.spec.js  # 11 tests
│   ├── login.spec.js         # 7 tests
│   ├── worker-signup.spec.js # 8 tests
│   ├── restaurant-signup.spec.js   # 4 tests
│   ├── worker-dashboard.spec.js    # 4 tests (verifies auth redirect)
│   ├── restaurant-dashboard.spec.js # 2 tests
│   └── navigation.spec.js   # 11 tests
├── src/
│   ├── components/           # Reusable UI (8 files)
│   │   ├── Badge.jsx         # Role/cert/status/availability badges
│   │   ├── Button.jsx        # Primary/secondary/ghost/danger variants
│   │   ├── FilterSidebar.jsx # Browse page filter controls
│   │   ├── LoadingSpinner.jsx # Async loading state indicator
│   │   ├── Navbar.jsx        # Fixed top nav, auth-aware (user menu when logged in)
│   │   ├── ProfileCard.jsx   # Worker card for browse grid
│   │   ├── ProtectedRoute.jsx # Route guard: redirects to /login, enforces role access
│   │   └── StatCard.jsx      # Icon + number + label card
│   ├── contexts/
│   │   └── AuthContext.jsx   # AuthProvider: signUp, signIn, signOut, profile auto-fetch
│   ├── pages/                # One file per route (11 files)
│   │   ├── Landing.jsx       # / — Hero, stats, how-it-works, roles, footer
│   │   ├── Login.jsx         # /login — Supabase Auth (email/password, role toggle)
│   │   ├── WorkerSignup.jsx  # /worker/signup — 6-step, writes to Supabase
│   │   ├── RestaurantSignup.jsx  # /restaurant/signup — 3-step, writes to Supabase
│   │   ├── Browse.jsx        # /browse — Supabase + mock fallback
│   │   ├── Swipe.jsx         # /swipe — Supabase + mock fallback
│   │   ├── WorkerProfile.jsx # /worker/:id — Supabase + mock fallback
│   │   ├── RestaurantProfile.jsx # /restaurant/:id — Supabase + mock fallback
│   │   ├── WorkerDashboard.jsx   # /dashboard/worker — Mock data (hardcoded Jasmine Davis)
│   │   ├── RestaurantDashboard.jsx # /dashboard/restaurant — Mock data (hardcoded Bern's)
│   │   └── ShiftDetail.jsx   # /jobs/:id — Supabase + mock fallback
│   ├── data/                 # Mock data fallback (3 files)
│   │   ├── workers.js        # 10 worker profiles
│   │   ├── restaurants.js    # 5 restaurant profiles
│   │   └── shifts.js         # 5 shifts + chat message mocks
│   ├── hooks/                # Custom React hooks (4 files)
│   │   ├── useLocalStorageForm.js  # Multi-step form persistence
│   │   ├── useFilters.js     # Browse page combinatorial filter logic
│   │   ├── useAuth.js        # AuthContext consumer
│   │   └── useData.js        # Supabase query hooks with mock fallback
│   ├── lib/
│   │   ├── supabase.js       # Supabase client init (returns null if unconfigured)
│   │   └── api.js            # Query functions + snake→camelCase transforms
│   ├── utils/
│   │   └── constants.js      # Roles, certs, demand statuses, cities, pay defaults
│   ├── App.jsx               # Router setup, AuthProvider wrapper
│   ├── main.jsx              # React entry point
│   └── index.css             # Tailwind imports + @theme tokens + animations
├── .env.local                # Supabase credentials (not committed)
├── playwright.config.js      # Playwright config (chromium, port 3000, auto dev server)
├── index.html                # HTML shell with Google Fonts
├── vite.config.js            # Vite + React + Tailwind plugins, port 3000
└── package.json              # Dependencies and scripts
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Hero + stats + how-it-works + role grid + footer |
| `/login` | Login | Supabase Auth login with worker/restaurant toggle |
| `/worker/signup` | WorkerSignup | 6-step: basics, roles, certs, schedule, experience, pay → writes to Supabase |
| `/restaurant/signup` | RestaurantSignup | 3-step: info, roles, account → writes to Supabase |
| `/browse` | Browse | Filter sidebar + worker card grid |
| `/swipe` | Swipe | Tinder-style single card with keyboard nav |
| `/worker/:id` | WorkerProfile | Full profile with reviews |
| `/restaurant/:id` | RestaurantProfile | Restaurant profile with openings |
| `/dashboard/worker` | WorkerDashboard | Stats, cert alerts, favorites, activity |
| `/dashboard/restaurant` | RestaurantDashboard | Posts, matches, hired, rebook |
| `/jobs/:id` | ShiftDetail | "On the Fly" urgent shift with countdown |

## Design System

### Color Tokens (defined in `src/index.css` via `@theme`)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | #0a0a0a | Page background |
| `bg-surface` | #141414 | Cards, elevated surfaces |
| `bg-surface-hover` | #1a1a1a | Card hover |
| `bg-elevated` | #1e1e1e | Inputs, nested surfaces |
| `border-subtle` | #2a2a2a | Borders |
| `text-primary` | #f5f5f5 | Main text |
| `text-secondary` | #a3a3a3 | Muted text |
| `text-muted` | #737373 | Dimmed text |
| `accent` | #F59E0B | Amber/gold — primary accent |
| `accent-hover` | #D97706 | Darker amber |
| `success` | #22C55E | Verified, positive |
| `warning` | #EAB308 | Pending, expiring |
| `danger` | #EF4444 | Errors, 86'd |

### Fonts
- **Display** (`font-display`): Playfair Display — headlines, names, section titles
- **Body** (`font-body`): DM Sans — everything else
- **Mono** (`font-mono`): JetBrains Mono — step numbers, code-like elements

### Tailwind v4 Note
Tailwind v4 does NOT use `tailwind.config.js`. All theme customization lives in `src/index.css` inside the `@theme { }` block. Colors are referenced as `bg-bg-primary`, `text-text-secondary`, `border-border-subtle`, etc.

## Supabase Architecture

### Database Tables (13)
`profiles`, `workers`, `worker_roles`, `worker_availability`, `worker_certifications`, `restaurants`, `restaurant_hiring_roles`, `openings`, `shifts`, `reviews`, `conversations`, `messages`, `favorites`

### Key Relationships
- `profiles` 1:1 with `auth.users` (auto-created via trigger on signup)
- `workers.profile_id` → `profiles.id` (1:1)
- `restaurants.profile_id` → `profiles.id` (1:1)
- `worker_roles`, `worker_availability`, `worker_certifications` → many-to-one with `workers`
- `restaurant_hiring_roles` → many-to-one with `restaurants`
- `reviews` → references both `workers` and `restaurants`

### RLS Policies
- **Anon read**: Workers, restaurants, shifts, reviews, openings, certs, roles, availability (public browsing)
- **Auth write**: Users can only insert/update/delete their own records
- **Special**: Workers can claim open shifts, anyone can review shifts they participated in

### Data Flow
1. **Signup**: Auth signup → trigger creates `profiles` row → page inserts domain record (worker/restaurant) + related tables
2. **Read pages**: Hook calls Supabase → transforms snake_case to camelCase → returns data (or falls back to mock if empty/error)
3. **Auth state**: `AuthContext` listens to `onAuthStateChange` → auto-fetches profile → Navbar/ProtectedRoute react

### Storage Buckets
- `avatars` — Profile photos (not yet wired to UI)
- `certifications` — Cert document uploads (not yet wired to UI)

## Patterns

- **Signup persistence**: `useLocalStorageForm` hook saves form state on every keystroke. Keys: `shiftpay-worker-signup`, `shiftpay-restaurant-signup`
- **Mock data fallback**: `useQuery()` hook in `useData.js` tries Supabase first, returns mock data if unconfigured/empty/error. All pages work identically with or without Supabase.
- **Data transforms**: `src/lib/api.js` converts Supabase snake_case responses to camelCase matching mock data shape. Pages never know the data source.
- **Auth flow**: `AuthContext` wraps entire app. `useAuth()` hook provides user, profile, signIn, signUp, signOut. `ProtectedRoute` guards dashboards.
- **Filtering**: Browse page uses local filter state with combinatorial AND logic across all filter types
- **Badges**: Single `Badge` component handles 4 types (role, cert, status, availability) via `type` prop
- **Animations**: CSS keyframes in `index.css` — `animate-fade-in`, `animate-slide-up`, `animate-pulse-glow`. Staggered via inline `animationDelay` style
- **Mobile responsive**: Filter sidebar collapses to drawer on mobile, nav collapses to hamburger, grids stack to single column
