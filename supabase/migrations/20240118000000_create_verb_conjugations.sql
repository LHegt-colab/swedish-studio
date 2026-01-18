-- Create verb_conjugations table
create table if not exists public.verb_conjugations (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    group_name text not null, -- 'Categorie 1', 'Categorie 2', etc.
    infinitive text not null,
    present text not null,
    past text not null,
    supine text not null,
    future text not null,
    translation text, -- Dutch translation
    created_at timestamp with time zone not null default now(),
    
    constraint verb_conjugations_pkey primary key (id)
);

-- Add RLS policies
alter table public.verb_conjugations enable row level security;

create policy "Users can view their own verbs"
    on public.verb_conjugations for select
    using (auth.uid() = user_id);

create policy "Users can insert their own verbs"
    on public.verb_conjugations for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own verbs"
    on public.verb_conjugations for update
    using (auth.uid() = user_id);

create policy "Users can delete their own verbs"
    on public.verb_conjugations for delete
    using (auth.uid() = user_id);
