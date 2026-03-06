# ShiftPay — Execution Plan

## Phase 0: MVP Frontend (COMPLETE)

**Status**: Done. Built 2026-03-06.

Everything below was completed in one session:

- [x] Vite + React + Tailwind v4 scaffold
- [x] Design system (dark theme, amber accents, custom fonts)
- [x] Landing page with hero, stats, how-it-works, role categories, footer
- [x] Worker signup (6-step with localStorage persistence)
- [x] Restaurant signup (3-step with localStorage persistence)
- [x] Browse page with filter sidebar and worker card grid
- [x] Swipe view with keyboard navigation and card transitions
- [x] Worker profile with certifications, reviews, demand badges
- [x] Restaurant profile with openings and apply buttons
- [x] Worker dashboard (stats, cert alerts, favorites, boost CTA)
- [x] Restaurant dashboard (posts, matches, hired, rebook)
- [x] Urgent shift detail ("On the Fly") with countdown timer
- [x] Login stub
- [x] Navbar with mobile hamburger
- [x] 6 reusable components (Badge, Button, ProfileCard, StatCard, FilterSidebar, Navbar)
- [x] Mock data (10 workers, 5 restaurants, 5 shifts)
- [x] CONTROL docs
- [x] AI skill file

---

## Phase 1: Backend + Auth

**Goal**: Real user accounts, persistent data, deployable.

### Backend Selection
- [ ] Choose backend: Supabase (fastest) vs Firebase vs custom Node/Express + PostgreSQL
- [ ] Set up database schema matching existing mock data models
- [ ] Migrate mock data to seed files

### Authentication
- [ ] Email/password signup and login (replace stub)
- [ ] Role-based access: worker vs restaurant owner
- [ ] Session management (JWT or Supabase session)
- [ ] Protected routes (dashboards require login)

### Data Migration
- [ ] Replace `src/data/*.js` imports with API calls
- [ ] Replace `useLocalStorageForm` with real form submission
- [ ] Worker CRUD (create profile, edit, delete)
- [ ] Restaurant CRUD

### File Uploads
- [ ] Certification photo upload (S3, Cloudinary, or Supabase Storage)
- [ ] Profile photo upload
- [ ] Worker photo upload during signup

### Deployment
- [ ] Frontend: Vercel or Netlify
- [ ] Backend: Supabase hosted or Railway/Render for custom backend
- [ ] Custom domain setup
- [ ] SSL / HTTPS

---

## Phase 2: Core Platform Features

**Goal**: The features that make ShiftPay actually useful.

### Shift Posting & Claiming
- [ ] Restaurants can post shifts (role, pay, time, requirements)
- [ ] Workers see available shifts matching their profile
- [ ] "Claim Now" actually locks in the shift
- [ ] Shift status tracking (open → claimed → completed)
- [ ] "On the Fly" urgent notifications (push or email)

### Messaging
- [ ] Real-time in-app chat (WebSocket or Supabase Realtime)
- [ ] Quick templates ("Confirming 5pm tonight", etc.)
- [ ] Read receipts
- [ ] Chat history tied to shifts
- [ ] Notification badges

### Matching & Interest
- [ ] "Express Interest" creates a real connection request
- [ ] Restaurant sees interested workers in dashboard
- [ ] Worker sees interested restaurants in dashboard
- [ ] Match = both sides express interest
- [ ] Demand status computed from real interest counts

### Ratings & Reviews
- [ ] Post-shift rating flow (1-5 stars + comment, both sides)
- [ ] Aggregate ratings on profiles
- [ ] Auto-generated badges ("Rockstar Server" for consistent 4.8+)
- [ ] Low rating warnings

### Rebook
- [ ] "Rebook" button pre-fills shift details from last booking
- [ ] Workers see "Favorite Spots" based on completed shifts
- [ ] Recurring rebook scheduling

---

## Phase 3: Growth & Monetization

**Goal**: Revenue, scale, and competitive moat.

### Payments
- [ ] Stripe integration for restaurant subscriptions
- [ ] Pricing tiers (free browse, paid contact/hire)
- [ ] Per-hire transaction fees (alternative model)
- [ ] Worker pay tracking / transparent pay tools
- [ ] Area pay averages computed from real data

### Verification System
- [ ] Admin review queue for uploaded certifications
- [ ] Automated cert expiry tracking and alerts
- [ ] Verified badge system (gold ServSafe badge, etc.)
- [ ] Background check partner integration

### Notifications
- [ ] Push notifications (mobile web)
- [ ] Email notifications (new matches, shift reminders, cert expiry)
- [ ] SMS for urgent "On the Fly" shifts
- [ ] Notification preferences

### Analytics
- [ ] Restaurant dashboard: shift fill rate, top workers, labor cost forecasts
- [ ] Worker dashboard: earnings tracker, shifts completed, monthly summaries
- [ ] Admin dashboard: platform metrics, user growth, revenue

---

## Phase 4: Future (V2/V3)

**Parked for later — needs real user data and traction first.**

- AI smart matching (auto-rank workers by fit)
- Gamification (Bronze → Silver → Gold worker tiers)
- Video skill checks (self-recorded demos)
- Event/catering mode (banquet shifts, large parties)
- Weather/seasonal demand alerts
- Geographic expansion beyond Florida
- Native mobile app (React Native or Flutter)
