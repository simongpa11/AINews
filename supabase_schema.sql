-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- News Table
create table public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  summary text not null,
  content text,
  original_url text,
  image_url text,
  audio_url text,
  relevance_score int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Folders Table
create table public.folders (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Saved News Table
create table public.saved_news (
  id uuid default uuid_generate_v4() primary key,
  news_id uuid references public.news(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete set null, -- Can be null if just "saved" without a specific folder
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(news_id, user_id) -- Prevent saving same news multiple times for same user
);

-- RLS Policies (Row Level Security)
alter table public.news enable row level security;
alter table public.folders enable row level security;
alter table public.saved_news enable row level security;

-- News is readable by everyone
create policy "News are viewable by everyone" on public.news
  for select using (true);

-- Folders are private to the user
create policy "Users can view their own folders" on public.folders
  for select using (auth.uid() = user_id);

create policy "Users can insert their own folders" on public.folders
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own folders" on public.folders
  for update using (auth.uid() = user_id);

create policy "Users can delete their own folders" on public.folders
  for delete using (auth.uid() = user_id);

-- Saved News are private to the user
create policy "Users can view their own saved news" on public.saved_news
  for select using (auth.uid() = user_id);

create policy "Users can insert their own saved news" on public.saved_news
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own saved news" on public.saved_news
  for delete using (auth.uid() = user_id);
