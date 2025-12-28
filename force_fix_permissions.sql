-- 1. Reset Policies for News Table
drop policy if exists "News are viewable by everyone" on public.news;
drop policy if exists "Allow anonymous inserts" on public.news;

create policy "News are viewable by everyone" on public.news for select using (true);
create policy "Allow anonymous inserts" on public.news for insert with check (true);

-- 2. Reset Policies for Storage (Media Bucket)
-- Note: You MUST have a bucket named 'media' created in the Storage dashboard.
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Insert" on storage.objects;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'media' );
create policy "Public Insert" on storage.objects for insert with check ( bucket_id = 'media' );
