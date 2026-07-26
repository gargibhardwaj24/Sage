set timezone = 'Asia/Kolkata';

create extension if not exists btree_gist;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'there',
  settings jsonb not null default '{}'::jsonb,
  seeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  notes text not null default '',
  category_id text not null default 'deep-work',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  completed boolean not null default false,
  reminder_minutes integer,
  priority text,
  method text,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint events_end_after_start check (ends_at > starts_at),
  constraint events_title_not_blank check (length(btrim(title)) > 0)
);

create index events_user_starts_at_idx
  on public.events (user_id, starts_at)
  where deleted_at is null;

create index events_user_span_idx
  on public.events
  using gist (user_id, tstzrange(starts_at, ends_at))
  where deleted_at is null;

create index events_user_updated_at_idx on public.events (user_id, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, 'there'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.events enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

create policy events_select_own on public.events
  for select using (auth.uid() = user_id);

create policy events_insert_own on public.events
  for insert with check (auth.uid() = user_id);

create policy events_update_own on public.events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy events_delete_own on public.events
  for delete using (auth.uid() = user_id);

create or replace function public.overlapping_events(
  window_start timestamptz,
  window_end timestamptz,
  exclude_id uuid default null
)
returns setof public.events
language sql
stable
security invoker
as $$
  select *
  from public.events
  where user_id = auth.uid()
    and deleted_at is null
    and completed = false
    and (exclude_id is null or id <> exclude_id)
    and tstzrange(starts_at, ends_at) && tstzrange(window_start, window_end)
  order by starts_at;
$$;
