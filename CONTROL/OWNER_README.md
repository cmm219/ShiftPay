# ShiftPay — Owner README

## What Is This?

ShiftPay is a marketplace app that connects restaurant workers (servers, bartenders, cooks, hosts, dishwashers, barbacks) with restaurant owners who need to fill shifts. Think Tinder meets Indeed, built specifically for Florida's hospitality industry.

Workers sign up for free, add their roles and certifications, and get matched with restaurants. Restaurants browse talent, post urgent shifts, and rebook their best workers with one tap.

## Where Are We Right Now?

**MVP is built and running.** Every page works. The full app runs on localhost:3000.

What you can do right now:
- Browse 10 realistic worker profiles with photos, ratings, certs, and demand badges
- Swipe through workers Tinder-style (keyboard arrows work too)
- Walk through the full 6-step worker signup and 3-step restaurant signup
- View worker and restaurant profiles with reviews, openings, and hire buttons
- See restaurant and worker dashboards with stats, job posts, matches, and rebook prompts
- View "On the Fly" urgent shift postings with countdown timers

## What's Real vs. What's Demo?

| Feature | Status |
|---------|--------|
| All 11 pages and navigation | Real, working |
| Worker/restaurant profiles | Mock data (10 workers, 5 restaurants) |
| Signup forms with progress bars | Real UI, saves to browser localStorage |
| Filters on browse page | Real, functional filtering |
| Swipe view with keyboard nav | Real, working |
| Login / authentication | Stub only — no real auth yet |
| File uploads (certs) | UI only — no actual file storage |
| Chat / messaging | Mock conversation data, no live messaging |
| Payments / payroll | Buttons only — no payment processing |
| Push notifications | Not built yet |

## The Brand

- **Name**: ShiftPay
- **Look**: Dark theme, amber/gold accents — premium hospitality vibe
- **Target Market**: Florida (Tampa, Orlando, Miami, St. Pete)
- **Worker positioning**: Always free. "Always Free for Workers" badge on every signup step
- **Restaurant positioning**: Free to join, browse talent, post shifts

## Industry Lingo We Use

These are real restaurant terms repurposed as platform features:
- **In the Weeds** — Worker has lots of restaurant interest (high demand)
- **Double Sat** — 2 restaurants currently interested
- **Triple Sat** — 3+ restaurants interested (extremely high demand)
- **86'd** — Unavailable / off the market / booked solid
- **On the Fly** — Urgent shift posting, first-come-first-served

## What's Next?

1. **Backend + Auth** — Real user accounts, database, API
2. **Real file uploads** — Cert photos stored in cloud
3. **Live messaging** — In-app chat between workers and restaurants
4. **Deployment** — Get it online (Vercel or Netlify for frontend)
5. **Stripe integration** — Restaurant subscriptions or per-hire fees

## How to Run It

1. Open a terminal in the project folder
2. Run `npm install` (first time only)
3. Run `npm run dev`
4. Open http://localhost:3000

That's it. No database, no backend, no API keys needed for the MVP.

## Files That Matter

- `CONTROL/` — You're here. Project docs, plans, and history
- `src/pages/` — Every page in the app (11 files)
- `src/components/` — Reusable UI pieces (6 files)
- `src/data/` — Mock workers, restaurants, and shifts
- `.claude/skills/shiftd/SKILL.md` — AI assistant context file for this project
