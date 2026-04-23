
-- Create public bucket for complaint and repair images
insert into storage.buckets (id, name, public)
values ('complaint-images', 'complaint-images', true)
on conflict (id) do nothing;

-- Public read access
create policy "Public read complaint images"
on storage.objects for select
using (bucket_id = 'complaint-images');

-- Allow anyone (including anonymous demo users) to upload complaint images
create policy "Anyone can upload complaint images"
on storage.objects for insert
with check (bucket_id = 'complaint-images');

-- Allow anyone to update/delete their objects in this prototype bucket
create policy "Anyone can update complaint images"
on storage.objects for update
using (bucket_id = 'complaint-images');

create policy "Anyone can delete complaint images"
on storage.objects for delete
using (bucket_id = 'complaint-images');
