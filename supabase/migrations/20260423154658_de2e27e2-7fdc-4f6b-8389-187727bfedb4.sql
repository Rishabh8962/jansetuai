
-- Remove broad public SELECT (which allows LIST) and replace with a no-op
-- so only direct URL access via the public bucket works (no listing).
drop policy if exists "Public read complaint images" on storage.objects;

-- We rely on the bucket being public=true to serve files directly via /object/public/...
-- No SELECT policy on storage.objects needed for public URL access of a public bucket.
