-- Phase 3: Reading Module Migration

-- 1. READING TEXTS
create table if not exists public.reading_texts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  text_content text not null, -- Stores the full Swedish text
  level text,
  source text,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.reading_texts enable row level security;
drop policy if exists "Users can perform all actions on their own reading texts." on reading_texts;
create policy "Users can perform all actions on their own reading texts." on reading_texts for all using (auth.uid() = user_id);

-- 2. READING QUESTIONS
create table if not exists public.reading_questions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reading_id uuid references public.reading_texts(id) on delete cascade not null,
  type text not null check (type in ('mcq', 'open')),
  question text not null,
  choices jsonb, -- Nullable for open questions
  answer text not null,
  explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.reading_questions enable row level security;
drop policy if exists "Users can perform all actions on their own reading questions." on reading_questions;
create policy "Users can perform all actions on their own reading questions." on reading_questions for all using (auth.uid() = user_id);

-- 3. UPDATE PRACTICE ATTEMPTS
-- Add foreign key to reading_questions (nullable) to track practice on specific questions
alter table public.practice_attempts add column if not exists reading_question_id uuid references public.reading_questions(id) on delete cascade;

-- Note: 'item_type' column was already added in Phase 2, so we can reuse it (values: 'vocab', 'grammar', 'reading')
