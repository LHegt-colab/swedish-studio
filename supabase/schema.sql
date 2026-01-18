-- FINAL FIX SCRIPT
-- This script adds columns as NULLABLE first to avoid "contains null values" errors.
-- Orphaned rows (with null user_id) will simply be hidden by RLS, which is safe.

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text
);
alter table public.profiles add column if not exists username text unique;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;

alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check ((select auth.uid()) = id);
drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using ((select auth.uid()) = id);

-- 2. NOTES
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade, -- Nullable allowed
  title text not null,
  content text,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Remove NOT NULL constraint for migration compatibility
alter table public.notes add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.notes add column if not exists tags text[];

alter table public.notes enable row level security;
drop policy if exists "Users can perform all actions on their own notes." on notes;
create policy "Users can perform all actions on their own notes." on notes for all using (auth.uid() = user_id);

-- 3. VOCAB ITEMS
create table if not exists public.vocab_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  sv_word text not null,
  nl_word text not null,
  example_sentence text,
  part_of_speech text,
  level text,
  source text,
  next_review timestamp with time zone,
  interval int,
  ease_factor float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.vocab_items add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.vocab_items add column if not exists sv_word text;
alter table public.vocab_items add column if not exists nl_word text;

alter table public.vocab_items enable row level security;
drop policy if exists "Users can perform all actions on their own vocab." on vocab_items;
create policy "Users can perform all actions on their own vocab." on vocab_items for all using (auth.uid() = user_id);

-- 4. PRACTICE SESSIONS
create table if not exists public.practice_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  mode text,
  direction text,
  total_items int default 0,
  score int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.practice_sessions add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.practice_sessions add column if not exists total_items int default 0;
alter table public.practice_sessions add column if not exists score int default 0;

alter table public.practice_sessions enable row level security;
drop policy if exists "Users can perform all actions on their own sessions." on practice_sessions;
create policy "Users can perform all actions on their own sessions." on practice_sessions for all using (auth.uid() = user_id);

-- 5. PRACTICE ATTEMPTS
create table if not exists public.practice_attempts (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.practice_sessions(id) on delete cascade,
  vocab_id uuid references public.vocab_items(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade,
  is_correct boolean not null,
  user_answer text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.practice_attempts add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.practice_attempts add column if not exists session_id uuid references public.practice_sessions(id) on delete cascade;
alter table public.practice_attempts add column if not exists vocab_id uuid references public.vocab_items(id) on delete set null;

alter table public.practice_attempts enable row level security;
drop policy if exists "Users can perform all actions on their own attempts." on practice_attempts;
create policy "Users can perform all actions on their own attempts." on practice_attempts for all using (auth.uid() = user_id);

-- 6. PRONUNCIATION ITEMS
create table if not exists public.pronunciation_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  sv_text text not null,
  notes text,
  ipa text,
  level text,
  tags text[],
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.pronunciation_items add column if not exists user_id uuid references public.profiles(id) on delete cascade;

alter table public.pronunciation_items enable row level security;
drop policy if exists "Users can perform all actions on their own pronunciation items." on pronunciation_items;
create policy "Users can perform all actions on their own pronunciation items." on pronunciation_items for all using (auth.uid() = user_id);

-- 7. HANDLERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
