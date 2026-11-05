create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Anyone can read posts"
  on public.posts for select
  to anon
  using (true);

create policy "Anyone can create posts"
  on public.posts for insert
  to anon
  with check (true);