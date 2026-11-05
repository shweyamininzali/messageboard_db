create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "Anyone can read posts" on public.posts;
drop policy if exists "Anyone can create posts" on public.posts;

grant select, insert on public.posts to service_role;