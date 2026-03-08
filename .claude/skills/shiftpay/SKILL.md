# ShiftPay - Restaurant Staff Marketplace

## Overview
ShiftPay is a Tinder/Indeed-style marketplace web app connecting restaurant workers (servers, bartenders, cooks, etc.) with restaurant owners. Premium hospitality aesthetic — bold dark theme, warm amber/gold accents. Should look like a funded startup.

## Tech Stack
- **Framework**: Vite + React
- **Styling**: Tailwind CSS (custom dark theme via `tailwind.config.js`)
- **Routing**: React Router v6
- **State**: localStorage for signup persistence via `useLocalStorageForm` hook
- **Data**: Mock data throughout (no backend)
- **Dev Server**: localhost:3000

## Design System

### Color Tokens (defined in `tailwind.config.js` under `theme.extend.colors`)
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | #0a0a0a | Near-black background |
| `bg-surface` | #141414 | Cards, elevated surfaces |
| `bg-surface-hover` | #1a1a1a | Card hover states |
| `text-primary` | #f5f5f5 | Main text |
| `text-secondary` | #a3a3a3 | Muted/secondary text |
| `accent` | #F59E0B | Amber/gold primary accent |
| `accent-hover` | #D97706 | Darker amber for hover |
| `success` | #22C55E | Verified badges, positive |
| `warning` | #EAB308 | Pending, expiring |
| `danger` | #EF4444 | Errors, 86'd status |

### Component Patterns
- **Button Primary**: amber bg, dark text, hover darken
- **Button Secondary**: outlined, amber border, transparent bg
- **Button Ghost**: text-only, subtle hover bg
- **Profile Card**: dark surface, rounded-xl, hover lift + shadow, border-subtle
- **Stat Card**: compact, icon + number + label
- **Badge**: small pill, colored by type (cert, status, availability)
- **List Item**: horizontal card with avatar + info + action

### Motion Standards
- Cards: `transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`
- Buttons: `transition-colors duration-200`
- Page loads: staggered reveals with animation-delay

## File Structure
```
src/
  components/     # ProfileCard, Badge, Button, FilterSidebar, Navbar, etc.
  pages/          # One file per route: Landing, WorkerSignup, Browse, etc.
  data/           # Mock data: workers.js, restaurants.js, shifts.js
  hooks/          # useLocalStorageForm, useFilters, etc.
  utils/          # Helpers, constants, role definitions
  App.jsx         # Router setup
  index.css       # Tailwind base + custom tokens
```

## Routes
| Path | Page | Priority |
|------|------|----------|
| `/` | Landing Page | MVP |
| `/worker/signup` | Worker Signup (6-step) | MVP |
| `/restaurant/signup` | Restaurant Signup (3-step) | MVP |
| `/browse` | Worker Browse (restaurant view) | MVP |
| `/worker/:id` | Worker Profile | MVP |
| `/restaurant/:id` | Restaurant Profile | MVP |
| `/dashboard/restaurant` | Restaurant Dashboard | MVP |
| `/swipe` | Tinder-style Swipe View | Stretch |
| `/dashboard/worker` | Worker Dashboard | Stretch |
| `/jobs/:id` | Urgent Shift Detail | Stretch |
| `/login` | Login Stub | Stretch |

## Domain-Specific Terminology
- **In the Weeds**: High activity / lots of restaurant interest
- **Double Sat**: 2 restaurants currently interested
- **Triple Sat**: 3+ restaurants interested / extremely high demand
- **86'd**: Unavailable / off the market / passed on
- **On the Fly**: Urgent shift posting — rush hire, first-come-first-served
- **Rebook**: Re-hire a previous worker with pre-filled details

## Mock Data Requirements
- 8-10 realistic worker profiles with varied roles, certs, demand statuses
- 5 restaurant profiles
- 3-5 shift records
- Florida cities: Tampa, Orlando, Miami, St. Pete
- Real-sounding names

## Key Features
1. **Multi-step signup** with localStorage persistence
2. **Certification system**: ServSafe (gold), TIPS, Food Handler, CPR, Alcohol Awareness
3. **Demand status badges** on profiles and cards
4. **Filter/browse** with sidebar filters (role, certs, availability, distance, pay)
5. **Swipe view** with keyboard arrow support
6. **Post-shift feedback** (1-5 star + comment)
7. **Instant shift booking** with countdown timer
8. **Rebook one-tap** from restaurant dashboard
9. **In-app chat** (mock UI only)
10. **Transparent pay tools** with area averages

## Build Verification
- All routes navigable via React Router
- Responsive on mobile and desktop
- Hover animations on cards
- Swipe view keyboard navigation
- Signup forms persist via localStorage
- Filters update results immediately
- Sufficient color contrast (dark theme + gold accents)
- All interactive elements keyboard-navigable
