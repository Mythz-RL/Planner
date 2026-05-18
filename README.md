# Planner v2

Calendars, daily to-dos, habits, and goals. One workspace, every device.

## What's new in v2

- **Fully mobile-responsive** — works perfectly on iPhone, slide-in menu, touch-friendly buttons
- **Themes** — Light, Dark, Sepia, Midnight, Forest presets + custom theme builder
- **Recurring events** — daily, weekdays, weekly, monthly
- **Habit tracker** — emoji icons, color picker, 30-day heatmap, streak counter
- **Subtasks** — nest todos under todos
- **Drag-to-reorder** — drag todos to reorder or move between days
- **Smoother UI** — animations, confetti when you hit a goal, polished micro-interactions
- **PWA ready** — "Add to Home Screen" on iOS gives you an app-like experience

## Features

- **Today** — events, todos, habits all in one view + quick stats
- **Calendar** — month grid with multiple categories, recurring events, color customization
- **Weekly to-dos** — column per day, drag tasks between days
- **Habits** — build streaks, see 30-day history at a glance
- **Goals** — progress bars with confetti on completion
- **Theme** — customize everything
- **Share with parents** — read-only link, only shows School events

## Upgrading from v1

If you already deployed v1, just run the migration:

1. Go to your Supabase project → SQL Editor
2. Open `supabase-migration-v2.sql`, copy all of it
3. Paste into SQL Editor → Run
4. Push the new code to GitHub (see below) — Vercel auto-deploys

That's it. No data loss; the migration only adds new tables and columns.

## Push the update to GitHub

From the planner folder in Command Prompt:

```bash
git add .
git commit -m "v2: mobile, themes, habits, recurring events"
git push
```

Vercel detects the push and rebuilds in ~2 minutes.

## Fresh deploy (if you haven't deployed at all yet)

See the original README in the v1 zip, or:

1. Create Supabase project, run **both** `supabase-schema.sql` and `supabase-migration-v2.sql`
2. Push code to GitHub, import to Vercel
3. Add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Coming next (per request)

- Web push notifications for event reminders
