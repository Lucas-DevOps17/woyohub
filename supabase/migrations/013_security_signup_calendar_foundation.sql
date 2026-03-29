-- Security, open signup, custom-skill ownership, and study-session calendar foundation.

alter table public.skills
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;

create index if not exists idx_skills_user_id on public.skills(user_id);

drop policy if exists "Skills are viewable by authenticated users" on public.skills;
drop policy if exists "Authenticated users can view skills" on public.skills;
drop policy if exists "Authenticated users can create skills" on public.skills;
drop policy if exists "Authenticated users can update skills" on public.skills;
drop policy if exists "Authenticated users can delete skills" on public.skills;

create policy "Users can view global and own skills"
on public.skills
for select
using (user_id is null or auth.uid() = user_id);

drop policy if exists "Roadmaps are viewable by authenticated users" on public.roadmaps;
drop policy if exists "Roadmap skills are viewable" on public.roadmap_skills;

create policy "Roadmaps are publicly viewable"
on public.roadmaps
for select
using (true);

create policy "Roadmap skills are publicly viewable"
on public.roadmap_skills
for select
using (true);

create policy "Users can create own custom skills"
on public.skills
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own custom skills"
on public.skills
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own custom skills"
on public.skills
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.google_calendar_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text,
  google_user_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  calendar_id text default 'primary',
  sync_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.google_calendar_connections enable row level security;

drop policy if exists "Users can view own google calendar connection" on public.google_calendar_connections;
drop policy if exists "Users can insert own google calendar connection" on public.google_calendar_connections;
drop policy if exists "Users can update own google calendar connection" on public.google_calendar_connections;
drop policy if exists "Users can delete own google calendar connection" on public.google_calendar_connections;

create policy "Users can view own google calendar connection"
on public.google_calendar_connections
for select
using (auth.uid() = user_id);

create policy "Users can insert own google calendar connection"
on public.google_calendar_connections
for insert
with check (auth.uid() = user_id);

create policy "Users can update own google calendar connection"
on public.google_calendar_connections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own google calendar connection"
on public.google_calendar_connections
for delete
using (auth.uid() = user_id);

create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  location text,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  google_event_id text,
  synced_to_google boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_study_sessions_user_id on public.study_sessions(user_id);
create index if not exists idx_study_sessions_user_starts_at on public.study_sessions(user_id, starts_at);

alter table public.study_sessions enable row level security;

drop policy if exists "Users can view own study sessions" on public.study_sessions;
drop policy if exists "Users can insert own study sessions" on public.study_sessions;
drop policy if exists "Users can update own study sessions" on public.study_sessions;
drop policy if exists "Users can delete own study sessions" on public.study_sessions;

create policy "Users can view own study sessions"
on public.study_sessions
for select
using (auth.uid() = user_id);

create policy "Users can insert own study sessions"
on public.study_sessions
for insert
with check (auth.uid() = user_id);

create policy "Users can update own study sessions"
on public.study_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own study sessions"
on public.study_sessions
for delete
using (auth.uid() = user_id);

drop trigger if exists set_updated_at_google_calendar_connections on public.google_calendar_connections;
create trigger set_updated_at_google_calendar_connections
before update on public.google_calendar_connections
for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_study_sessions on public.study_sessions;
create trigger set_updated_at_study_sessions
before update on public.study_sessions
for each row execute function public.handle_updated_at();
