-- Make materials bucket public so files can be accessed directly
-- This aligns with the existing RLS policy "Anyone can view materials files"
UPDATE storage.buckets SET public = true WHERE id = 'materials';