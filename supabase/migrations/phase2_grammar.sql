-- Phase 2: Grammar Module Migration (Fixed)

-- 1. GRAMMAR TOPICS
create table if not exists public.grammar_topics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  theory_markdown text,
  tags text[],
  level text,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.grammar_topics enable row level security;
drop policy if exists "Users can perform all actions on their own grammar topics." on grammar_topics;
create policy "Users can perform all actions on their own grammar topics." on grammar_topics for all using (auth.uid() = user_id);

-- 2. GRAMMAR EXERCISES
create table if not exists public.grammar_exercises (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.grammar_topics(id) on delete cascade not null,
  type text not null check (type in ('mcq', 'fill_in')),
  question text not null,
  choices jsonb, -- Nullable for fill_in
  answer text not null,
  explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.grammar_exercises enable row level security;
drop policy if exists "Users can perform all actions on their own grammar exercises." on grammar_exercises;
create policy "Users can perform all actions on their own grammar exercises." on grammar_exercises for all using (auth.uid() = user_id);

-- 3. MODIFY PRACTICE SESSIONS (Relax constraints Safely)
do $$
declare
  r record;
begin
  -- Loop through CHECK constraints on practice_sessions
  -- Exclude 'not_null' constraints which sometimes appear in this list depending on DB version/setup
  for r in (
      select constraint_name 
      from information_schema.table_constraints 
      where table_name = 'practice_sessions' 
      and constraint_type = 'CHECK'
      and constraint_name not like '%not_null%' 
  ) loop
    begin
        execute 'alter table public.practice_sessions drop constraint ' || quote_ident(r.constraint_name);
    exception when others then
        -- Ignore errors if we can't drop it (e.g. system constraint)
        raise notice 'Could not drop constraint: %', r.constraint_name;
    end;
  end loop;
end $$;

-- Optional: If the above loop was too aggressive or failed, we simply ensure the columns are nullable/text 
-- to avoid issues, though dropping the CHECK 'mode in ...' is the main goal.
alter table public.practice_sessions alter column mode type text;
alter table public.practice_sessions alter column direction type text;


-- 4. MODIFY PRACTICE ATTEMPTS
alter table public.practice_attempts add column if not exists grammar_exercise_id uuid references public.grammar_exercises(id) on delete cascade;
alter table public.practice_attempts add column if not exists item_type text default 'vocab'; 
