-- =====================================================
-- Planner App — Supabase Schema
-- Paste this whole file into Supabase SQL Editor and run.
-- =====================================================

-- CALENDARS (categories with colors)
create table if not exists calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#2383e2',
  is_school boolean not null default false,
  created_at timestamptz not null default now()
);

-- EVENTS (calendar entries)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calendar_id uuid not null references calendars(id) on delete cascade,
  title text not null,
  description text,
  start_date date not null,
  start_time time,
  end_date date,
  end_time time,
  all_day boolean not null default true,
  created_at timestamptz not null default now()
);

-- TODOS (daily checklist items)
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  content text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- GOALS (with progress)
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  target int not null default 100,
  progress int not null default 0,
  deadline date,
  created_at timestamptz not null default now()
);

-- SHARE LINKS (read-only parent view)
create table if not exists share_links (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'school', -- only 'school' calendars visible
  created_at timestamptz not null default now()
);

-- =====================================================
-- ROW LEVEL SECURITY — each user only sees their own data
-- =====================================================
alter table calendars   enable row level security;
alter table events      enable row level security;
alter table todos       enable row level security;
alter table goals       enable row level security;
alter table share_links enable row level security;

create policy "own calendars"   on calendars   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own events"      on events      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own todos"       on todos       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own goals"       on goals       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own share links" on share_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public read for share links (parents view, no login required)
create policy "anyone reads share links" on share_links for select using (true);
create policy "public reads school events" on events for select using (
  exists (
    select 1 from calendars c
    where c.id = events.calendar_id and c.is_school = true
      and exists (select 1 from share_links s where s.user_id = c.user_id)
  )
);
create policy "public reads school calendars" on calendars for select using (
  is_school = true and exists (select 1 from share_links s where s.user_id = calendars.user_id)
);

-- =====================================================
-- AUTO-CREATE default calendars when a user signs up
-- =====================================================
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.calendars (user_id, name, color, is_school) values
    (new.id, 'School',       '#2383e2', true),
    (new.id, 'Debate',       '#9065b0', false),
    (new.id, 'Sports',       '#0f7b6c', false),
    (new.id, 'Personal',     '#d44c47', false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
