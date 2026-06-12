-- Star Reach — players table + public RLS policies.
-- Applied via the Supabase CLI: `make push` (bunx supabase db push).

create table if not exists players (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  coins integer default 0,
  best_altitude integer default 0,
  upgrades jsonb default '{}',
  created_at timestamptz default now(),
  last_seen timestamptz default now()
);

alter table players enable row level security;

create policy "public read" on players for select using (true);
create policy "public insert" on players for insert with check (true);
create policy "public update own" on players for update using (true);
