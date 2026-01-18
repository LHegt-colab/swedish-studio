-- Phase 4: Audio Pronunciation Module

-- 1. Update Pronunciation Items
alter table public.pronunciation_items add column if not exists audio_reference_url text;
alter table public.pronunciation_items add column if not exists audio_reference_storage_key text;

-- 2. Create Recordings Table (User's own recordings)
create table if not exists public.pronunciation_recordings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.pronunciation_items(id) on delete cascade not null,
  recording_url text not null,
  storage_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pronunciation_recordings enable row level security;

drop policy if exists "Users can manage their own recordings" on pronunciation_recordings;
create policy "Users can manage their own recordings" on pronunciation_recordings for all using (auth.uid() = user_id);

-- 3. Update Practice Attempts for link to Pronunciation & Metadata
alter table public.practice_attempts add column if not exists pronunciation_id uuid references public.pronunciation_items(id) on delete cascade;
alter table public.practice_attempts add column if not exists metadata jsonb;
-- metadata will store { "self_rating": 1-5 }
