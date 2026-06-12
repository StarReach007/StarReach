-- Star Reach — players table tied to Supabase Auth, with per-user RLS.
-- Applied via the Supabase CLI: `make push` (bunx supabase db push).
--
-- Accounts use real email + password (Supabase Auth). The username is captured
-- at sign-up in user metadata and copied into players.username by the trigger
-- below. If "Confirm email" is ON (Authentication -> Providers -> Email), new
-- users must confirm before their first sign-in.

create table if not exists players (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  username text unique not null,
  coins integer default 0,
  best_altitude integer default 0,
  upgrades jsonb default '{}',
  created_at timestamptz default now(),
  last_seen timestamptz default now()
);

alter table players enable row level security;

-- Each player can read and write ONLY their own row (data isolation).
create policy "read own" on players
  for select using (auth_user_id = auth.uid());

create policy "insert own" on players
  for insert with check (auth_user_id = auth.uid());

create policy "update own" on players
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Auto-create the player row when a new auth user signs up.
-- SECURITY DEFINER so the insert runs regardless of the client session/RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players (auth_user_id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
