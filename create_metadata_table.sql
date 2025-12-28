-- Daily Metadata Table
create table public.daily_metadata (
  id bigint generated always as identity primary key,
  date date not null unique,
  podcast_url text,
  podcast_script text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.daily_metadata enable row level security;

create policy "Daily metadata is viewable by everyone" on public.daily_metadata
  for select using (true);

create policy "Allow service role to insert/update metadata" on public.daily_metadata
  for all using (true) with check (true);
