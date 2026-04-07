
-- Enable necessary extensions if needed (though not strictly required for this schema)
-- create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
-- Create a table for public profiles linked to auth.users if it doesn't exist
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  updated_at timestamp with time zone,
  display_name text,
  avatar_url text,
  primary key (id)
);

-- Enable RLS on profiles (safe to run repeatedly)
alter table public.profiles enable row level security;

-- Policies for profiles
-- Drop existing policies to ensure clean creation
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. INSPECTIONS TABLE
-- Create a table for inspections using JSONB columns for flexibility if it doesn't exist
create table if not exists public.inspections (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  local_id text, -- ID generated on the client side for syncing
  user_id uuid references auth.users not null,
  header jsonb not null default '{}'::jsonb, -- Stores all inspection metadata
  blocks jsonb not null default '[]'::jsonb, -- Stores the array of block data
  totals jsonb not null default '{}'::jsonb, -- Stores calculated totals
  
  primary key (id),
  unique(local_id) -- Ensure local IDs are unique to prevent duplicate syncs
);

-- Enable RLS on inspections (safe to run repeatedly)
alter table public.inspections enable row level security;

-- Policies for inspections
-- Drop existing policies to ensure clean creation
drop policy if exists "Users can view their own inspections." on public.inspections;
create policy "Users can view their own inspections."
  on public.inspections for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own inspections." on public.inspections;
create policy "Users can insert their own inspections."
  on public.inspections for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own inspections." on public.inspections;
create policy "Users can update their own inspections."
  on public.inspections for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own inspections." on public.inspections;
create policy "Users can delete their own inspections."
  on public.inspections for delete
  using ( auth.uid() = user_id );

-- 3. AUTOMATIC PROFILE CREATION TRIGGER
-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

-- Handle trigger logic carefully
-- Safely drop existing trigger before re-creating
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. STORAGE BUCKETS (For block photos)
insert into storage.buckets (id, name, public)
values ('block-photos', 'block-photos', true)
on conflict (id) do nothing;

create policy "Block photos are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'block-photos' );

create policy "Authenticated users can upload block photos."
  on storage.objects for insert
  with check ( 
    bucket_id = 'block-photos' 
    AND auth.role() = 'authenticated'
  );

create policy "Users can delete their own block photos."
  on storage.objects for delete
  using ( 
    bucket_id = 'block-photos' 
    AND auth.uid() = owner 
  );
