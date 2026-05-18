# Planner

Your all-in-one planning workspace. Multiple calendars, daily to-dos, goals, and a read-only share link for parents. Built with Next.js + Supabase. Free to host on Vercel.

## What's in here

- **Today** — events for today + a checkable to-do list
- **Calendar** — month grid with multiple categories (School, Debate, Sports, Personal). Toggle each on/off. Click any day to add events.
- **Weekly to-dos** — a column per day, navigate by week
- **Goals** — progress bars, increment with +/-, set deadlines
- **Share with parents** — generates a read-only URL that ONLY shows your School calendar

## Deploy in 5 steps (~10 minutes)

### 1. Make a Supabase account (the database)

1. Go to **https://supabase.com** and sign up (free tier is plenty)
2. Click **New project**. Name it `planner`. Pick a strong DB password and save it.
3. Wait ~1 minute for the project to provision.

### 2. Set up the database

1. In your Supabase project sidebar, click **SQL Editor**
2. Click **New query**
3. Open the file **`supabase-schema.sql`** from this project, copy everything, paste it into the editor
4. Click **Run** (bottom right). You should see "Success. No rows returned."

### 3. Get your Supabase keys

1. In Supabase, click **Project Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)
3. Create a file named `.env.local` in the project root and paste them in:

```
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Push to GitHub

1. Make a GitHub account if you don't have one: **https://github.com**
2. Create a new empty repository called `planner` (don't add a README, it'll conflict)
3. In your terminal, from the project folder:

```bash
git init
git add .
git commit -m "initial planner"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/planner.git
git push -u origin main
```

### 5. Deploy to Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **Add New → Project**, pick your `planner` repo
3. Before clicking Deploy, expand **Environment Variables** and add the same two from step 3:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Wait ~2 minutes.
5. You'll get a URL like `planner-yourname.vercel.app`. Open it on your laptop and on both phones. Sign up once, log in everywhere. **Everything syncs.**

## Run it locally (optional)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## How the parent share works

1. Sign in, click **Share with parents** in the sidebar
2. Hit **Create share link** — you get a URL like `planner-yourname.vercel.app/shared/abc123xyz`
3. Send that to your parents. They can see only your **School** calendar, no login needed, no edits.
4. Revoke anytime from the same page.

Anything in your Debate, Sports, or Personal calendars stays private.

## Adding more features later

The architecture is set up to grow. Stuff you could add:
- Recurring events (weekly swim practice, etc.)
- Notifications/reminders (Supabase has a cron + edge functions feature for this)
- Drag-to-reorder to-dos
- Notes per event
- Habit streaks
- Import from Google Calendar

Open the relevant page in `/app/dashboard/` and extend. The data layer (Supabase) handles sync automatically — whatever you change in the UI shows up on all devices within a second.
