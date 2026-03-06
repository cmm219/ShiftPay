# ShiftPay — Tasks

**Last updated**: 2026-03-06

---

## Completed (Session 1)

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

---

## Immediate Next (When Ready)

- [ ] Fix "Post a Shift" nav link (currently points to non-existent `/post-shift`)
- [ ] Add a 404 catch-all route
- [ ] Add React error boundary wrapper
- [ ] Replace Unsplash photos with local fallbacks or a more reliable CDN

---

## Pre-Backend Polish

- [ ] Add page transition animations between routes
- [ ] Add skeleton loading states (prep for API latency)
- [ ] Mobile test pass — verify all pages on small screens
- [ ] Add ARIA labels to interactive elements
- [ ] Add meta tags / page titles per route
- [ ] Add favicon (use existing ICON SHIFTPAY.jpg as source)

---

## Backend Setup (Phase 1)

- [ ] Decide: Supabase vs Firebase vs custom Node+PostgreSQL
- [ ] Design database schema from mock data models
- [ ] Set up auth (email/password, role-based)
- [ ] Build API endpoints for workers, restaurants, shifts
- [ ] Replace mock data imports with API calls
- [ ] Replace localStorage signup with real form submission
- [ ] Set up file storage for cert and profile photo uploads
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Deploy backend

---

## Deferred (Phase 2+)

- [ ] Real-time messaging (WebSocket / Supabase Realtime)
- [ ] Shift posting and claiming flow
- [ ] Post-shift rating system
- [ ] Push notifications
- [ ] Stripe payments for restaurants
- [ ] Admin dashboard for cert verification
- [ ] AI matching engine
- [ ] Native mobile app
