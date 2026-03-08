# Supabase — Backend for ShiftPay

## What It Is

Supabase is a Backend-as-a-Service (BaaS). Instead of building a server, database, auth system, and file storage from scratch, Supabase gives you all of it instantly through a dashboard and API.

You get a full backend without writing backend code.

## What It Gives ShiftPay

| Feature | What it does for us | Without Supabase |
|---------|-------------------|------------------|
| **PostgreSQL Database** | Stores workers, restaurants, shifts, reviews, messages — all relational | Set up our own Postgres server, host it, manage backups |
| **Auth** | Email/password signup + login, JWT sessions, password reset | Write our own auth system (weeks of work, easy to get wrong) |
| **Row Level Security** | "Workers can only edit their own profile" — enforced at the database level | Write middleware to check permissions on every API endpoint |
| **Storage** | Profile photos, cert document uploads with access control | Set up S3 or Cloudinary, write upload endpoints |
| **Realtime** | Live messaging, instant shift status updates via WebSocket | Set up Socket.io or a pub/sub system |
| **Auto-generated API** | Every table automatically gets REST + GraphQL endpoints | Write every API route by hand (Express/FastAPI) |
| **Dashboard** | Web UI to view/edit data, run SQL, manage users | Need pgAdmin or build an admin panel |

## Why Not a Custom Node/Express Backend?

- Supabase gives months of backend work in an afternoon
- The frontend talks directly to Supabase (no middleman server to deploy)
- Auth is the hardest thing to get right — Supabase handles it
- When you outgrow it, you can migrate off (it's just Postgres underneath)

## Pricing

| Plan | Cost | What You Get |
|------|------|-------------|
| **Free** | $0/month | 500 MB database, 1 GB file storage, 50k monthly active users, 500 MB bandwidth, 2 projects |
| **Pro** | $25/month | 8 GB database, 100 GB storage, unlimited users, 250 GB bandwidth, daily backups, email support |
| **Team** | $599/month | Everything in Pro + SOC2 compliance, priority support, SSO |
| **Enterprise** | Custom | Dedicated infrastructure, SLA |

**ShiftPay MVP uses the Free tier.** Even with 1,000 users we'd stay under the limits. Only upgrade when there's real traffic and revenue.

## How It Works in Practice

```
User clicks "Sign Up" on ShiftPay
  -> Frontend calls supabase.auth.signUp()
  -> Supabase creates user, returns JWT token
  -> Frontend calls supabase.from('workers').insert({...})
  -> Data goes directly to Postgres
  -> Done. No server needed.

User opens Browse page
  -> Frontend calls supabase.from('workers').select('*')
  -> Postgres returns rows, RLS filters automatically
  -> React renders the cards
```

No Express server. No API routes to write. No server to deploy or pay for.

## Setup Steps

1. Go to https://supabase.com and create an account
2. Click "New Project" — name it `shiftpay`, region US East (Virginia)
3. Save the database password somewhere safe
4. Once created, go to Settings > API and copy:
   - **Project URL** (e.g. `https://abcdefghij.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
5. Paste both into `C:\Shiftd\.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
   ```
6. Go to SQL Editor in the Supabase dashboard
7. Paste the contents of `supabase/migrations/001_initial_schema.sql` and run it
8. The app is now connected to a real backend

## Security Notes

- The **anon key** is safe to expose in frontend code — RLS protects the data
- The **service role key** must NEVER be in frontend code — it bypasses all security
- `.env.local` is gitignored — credentials never enter version control
- RLS is enabled on every table — no data is accessible without explicit policies

## ShiftPay Integration Status

- **Phase 1 (Complete)**: Supabase client, AuthContext, ProtectedRoute, signup/login wired up
- **Phase 2 (Next)**: Replace mock data imports with Supabase queries
- **Phase 3**: Write operations (shift claiming, reviews, favorites)
- **Phase 4**: File uploads (profile photos, cert documents)
- **Phase 5**: Realtime (messaging, notifications)
