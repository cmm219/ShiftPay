# ShiftPay — Technical Context

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build tool | Vite 7.3 |
| Framework | React 19 |
| Styling | Tailwind CSS 4 (v4 uses `@theme` in CSS, NOT tailwind.config.js) |
| Routing | React Router 7 (v7 — BrowserRouter) |
| State | localStorage via custom `useLocalStorageForm` hook |
| Data | Mock JSON arrays (no backend, no database) |
| Fonts | Google Fonts — Playfair Display (display), DM Sans (body), JetBrains Mono (mono) |
| Dev server | localhost:3000 |

## How to Run

```bash
npm install    # first time only
npm run dev    # starts Vite on localhost:3000
npm run build  # production build to dist/
```

## File Structure

```
C:\Shiftd\
├── CONTROL/                # Project docs (you are here)
├── .claude/skills/shiftd/  # AI skill context
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI (6 files)
│   │   ├── Badge.jsx       # Role/cert/status/availability badges
│   │   ├── Button.jsx      # Primary/secondary/ghost/danger variants
│   │   ├── FilterSidebar.jsx # Browse page filter controls
│   │   ├── Navbar.jsx      # Fixed top nav with mobile hamburger
│   │   ├── ProfileCard.jsx # Worker card for browse grid
│   │   └── StatCard.jsx    # Icon + number + label card
│   ├── pages/              # One file per route (11 files)
│   │   ├── Landing.jsx     # / — Hero, stats, how-it-works, roles, footer
│   │   ├── Login.jsx       # /login — Stub login form
│   │   ├── WorkerSignup.jsx      # /worker/signup — 6-step flow
│   │   ├── RestaurantSignup.jsx  # /restaurant/signup — 3-step flow
│   │   ├── Browse.jsx      # /browse — Filter sidebar + worker grid
│   │   ├── Swipe.jsx       # /swipe — Tinder-style card view
│   │   ├── WorkerProfile.jsx     # /worker/:id — Full worker profile
│   │   ├── RestaurantProfile.jsx # /restaurant/:id — Restaurant profile
│   │   ├── WorkerDashboard.jsx   # /dashboard/worker — Worker home
│   │   ├── RestaurantDashboard.jsx # /dashboard/restaurant — Restaurant home
│   │   └── ShiftDetail.jsx # /jobs/:id — Urgent shift detail
│   ├── data/               # Mock data (3 files)
│   │   ├── workers.js      # 10 worker profiles
│   │   ├── restaurants.js  # 5 restaurant profiles
│   │   └── shifts.js       # 5 shifts + chat message mocks
│   ├── hooks/              # Custom React hooks (2 files)
│   │   ├── useLocalStorageForm.js  # Multi-step form persistence
│   │   └── useFilters.js   # Browse page filter logic
│   ├── utils/
│   │   └── constants.js    # Roles, certs, demand statuses, cities, pay defaults
│   ├── App.jsx             # Router setup with all routes
│   ├── main.jsx            # React entry point
│   └── index.css           # Tailwind imports + @theme tokens + animations
├── index.html              # HTML shell with Google Fonts
├── vite.config.js          # Vite + React + Tailwind plugins, port 3000
└── package.json            # Dependencies and scripts
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Hero + stats + how-it-works + role grid + footer |
| `/login` | Login | Stub login with worker/restaurant toggle |
| `/worker/signup` | WorkerSignup | 6-step: basics, roles, certs, schedule, experience, pay |
| `/restaurant/signup` | RestaurantSignup | 3-step: info, roles, account |
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

## Patterns

- **Signup persistence**: `useLocalStorageForm` hook saves form state on every keystroke. Keys: `shiftpay-worker-signup`, `shiftpay-restaurant-signup`
- **Filtering**: Browse page uses local filter state with combinatorial AND logic across all filter types
- **Badges**: Single `Badge` component handles 4 types (role, cert, status, availability) via `type` prop
- **Animations**: CSS keyframes in `index.css` — `animate-fade-in`, `animate-slide-up`, `animate-pulse-glow`. Staggered via inline `animationDelay` style
- **Mobile responsive**: Filter sidebar collapses to drawer on mobile, nav collapses to hamburger, grids stack to single column
