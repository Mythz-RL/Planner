-- =====================================================
-- Planner v2 Migration — Run this in Supabase SQL Editor
-- Safe to run on existing database. Additive only.
-- =====================================================

-- USER SETTINGS (theme preferences)
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light',  -- 'light' | 'dark' | 'sepia' | 'custom'
  custom_bg text,
  custom_surface text,
  custom_text text,
  custom_accent text,
  custom_muted text,
  week_starts_on int not null default 1, -- 0=Sun, 1=Mon
  updated_at timestamptz not null default now()
);

-- RECURRING EVENTS: extend events table
alter table events add column if not exists recurrence text;       -- 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays'
alter table events add column if not exists recurrence_until date; -- optional end date
alter table events add column if not exists reminder_minutes int;  -- minutes before event for reminder (null = no reminder)

-- SUBTASKS: extend todos with parent_id
alter table todos add column if not exists parent_id uuid references todos(id) on delete cascade;

-- HABITS
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default '✨',
  color text default '#2383e2',
  frequency text not null default 'daily', -- 'daily' | 'weekdays' | 'weekly'
  target_per_week int default 7,
  position int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- HABIT CHECK-INS (one row per habit per day completed)
create table if not exists habit_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique(habit_id, day)
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table user_settings    enable row level security;
alter table habits           enable row level security;
alter table habit_checkins   enable row level security;

-- Drop existing policies if rerunning, then create
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'user_settings' and policyname = 'own settings') then
    create policy "own settings"   on user_settings    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'habits' and policyname = 'own habits') then
    create policy "own habits"     on habits           for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'habit_checkins' and policyname = 'own checkins') then
    create policy "own checkins"   on habit_checkins   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Auto-create user_settings on signup
create or replace function public.handle_new_user_settings() returns trigger as $$
begin
  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_settings on auth.users;
create trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute procedure public.handle_new_user_settings();

-- Backfill settings for existing users
insert into user_settings (user_id)
  select id from auth.users
  on conflict do nothing;
