-- Allow public access to media bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'media' );

create policy "Public Insert"
on storage.objects for insert
with check ( bucket_id = 'media' );

-- Allow anonymous inserts to news table (for the script)
create policy "Allow anonymous inserts"
on public.news
for insert
with check ( true );
