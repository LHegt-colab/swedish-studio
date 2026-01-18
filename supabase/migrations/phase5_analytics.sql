-- Phase 5: Analytics & Progression

-- 1. Update Vocab Items for SRS
alter table public.vocab_items add column if not exists repetitions int default 0;
alter table public.vocab_items add column if not exists last_review timestamp with time zone;
-- Note: next_review, interval, and ease_factor already exist from initial schema

-- 2. User Goals Table
create table if not exists public.user_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  goal_type text not null, -- 'vocab_reviews', 'grammar_practice', 'reading_practice', 'time_spent'
  target_value int not null default 0,
  period text default 'weekly', -- For future extensibility
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_goals enable row level security;
drop policy if exists "Users can manage their own goals" on user_goals;
create policy "Users can manage their own goals" on user_goals for all using (auth.uid() = user_id);
