-- Make the materials bucket private to prevent direct URL access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'materials';