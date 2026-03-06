# ShiftPay — Decisions

Technical and design decisions made during development, with rationale.

---

## D1: Dark Theme with Amber/Gold Accents

**Decision**: Near-black (#0a0a0a) background with amber (#F59E0B) as the primary accent color.

**Rationale**: The hospitality industry skews toward warm, premium aesthetics. Dark themes feel modern and "funded startup" — not student project. Amber/gold reads as premium without being flashy. High contrast against dark backgrounds makes key CTAs (hire, claim, signup) pop immediately.

**Rejected**: Light theme (too generic), blue accent (too corporate/tech), red accent (too aggressive for a hiring platform).

---

## D2: Playfair Display + DM Sans Font Pairing

**Decision**: Playfair Display for display/headlines, DM Sans for body text.

**Rationale**: Playfair brings editorial gravitas — makes the platform feel established and trustworthy. DM Sans is clean and highly readable at small sizes without being boring. The serif/sans contrast creates visual hierarchy without needing heavy weight variations. JetBrains Mono for step numbers and code-like elements adds a tech-forward accent.

**Rejected**: Inter (overused in AI/tech), Space Grotesk (becoming AI slop default), system fonts (no personality).

---

## D3: localStorage Over Auth for MVP

**Decision**: No backend, no database, no authentication. All signup state persists in browser localStorage.

**Rationale**: The goal of the MVP is to prove the UI/UX concept and have a demo-ready product. Adding auth and a backend would triple the development time for zero user-facing benefit at this stage. localStorage lets signup forms survive page refreshes without any infrastructure. When we add a real backend, the `useLocalStorageForm` hook gets swapped for API calls — the UI doesn't change.

**Next step**: Supabase or Firebase for auth + database when ready to go live.

---

## D4: Mock Data Instead of API

**Decision**: All workers, restaurants, and shifts are hardcoded JavaScript arrays in `src/data/`.

**Rationale**: Same reasoning as D3 — speed to demo. Mock data lets us design realistic profiles with varied roles, certifications, demand statuses, and reviews without needing a data pipeline. The mock data is structured identically to what a real API would return, so the migration path is clean.

**Data counts**: 10 workers, 5 restaurants, 5 shifts, 2 chat conversations.

---

## D5: Tailwind CSS v4 with @theme

**Decision**: Use Tailwind v4's new `@theme` block in CSS instead of the traditional `tailwind.config.js`.

**Rationale**: v4 is the current version (installed via npm). The `@theme` approach keeps all design tokens in CSS where they belong, makes them available as CSS custom properties for non-Tailwind use, and eliminates the config file. Tokens are referenced as `bg-bg-primary`, `text-accent`, `border-border-subtle`, etc.

**Gotcha**: This is different from Tailwind v3 tutorials. Anyone working on this project needs to know that theme changes go in `src/index.css`, not a config file.

---

## D6: Restaurant Industry Terminology

**Decision**: Use real restaurant industry slang as platform features.

**Terms adopted**:
- **In the Weeds** → Worker has high demand / lots of restaurant interest
- **Double Sat** → 2 restaurants currently interested in the worker
- **Triple Sat** → 3+ restaurants interested (extremely high demand)
- **86'd** → Worker is unavailable / off the market / booked solid
- **On the Fly** → Urgent shift posting, rush hire, first-come-first-served

**Rationale**: This makes the platform feel native to the industry. Restaurant people instantly understand these terms. It's a differentiation play — no other hiring platform speaks this language. The demand status badges (In the Weeds, Double Sat, Triple Sat) create FOMO for restaurants and social proof for workers.

---

## D7: "Always Free" Worker Positioning

**Decision**: Worker accounts are free forever. This is shown prominently on every signup step.

**Rationale**: Workers are the supply side — the platform is worthless without them. Charging workers creates friction and drives them to competitors. Revenue comes from the restaurant side (subscriptions, per-hire fees, promoted listings). The "Always Free for Workers" banner builds trust and removes signup hesitation.

---

## D8: Florida-Only Market

**Decision**: Launch market is Florida — Tampa, Orlando, Miami, St. Pete.

**Rationale**: Geographic focus keeps the mock data realistic and the value proposition tight. Florida has a massive hospitality industry (tourism, nightlife, dining). Starting local lets us build density in one market before expanding. All mock data uses real Florida restaurant names and cities.

---

## D9: Swipe View as Secondary to Grid

**Decision**: Grid browse (`/browse`) is the primary view. Swipe (`/swipe`) is an alternative accessed via a toggle.

**Rationale**: The Tinder metaphor is fun and memorable, but restaurants hiring staff need to scan and compare — that's a grid job. Swipe is better for casual browsing or when a restaurant has a specific urgent need. Both views use the same worker data and link to the same profiles.

---

## D10: No Build-Time Image Processing

**Decision**: Worker and restaurant photos use Unsplash URLs with `?w=400&h=400&fit=crop&crop=face` parameters.

**Rationale**: No image pipeline needed for the MVP. Unsplash serves optimized images at the requested dimensions. When we add real user uploads, we'll use a service like Cloudinary or S3 + CloudFront with on-the-fly resizing. The `photoUrl` field in mock data is structured the same way a real image URL would be.
