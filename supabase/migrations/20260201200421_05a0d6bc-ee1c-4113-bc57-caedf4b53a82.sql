-- Drop the view with security definer issue
DROP VIEW IF EXISTS public.materials_public;

-- Recreate view with security_invoker = true (uses querying user's permissions)
CREATE VIEW public.materials_public 
WITH (security_invoker = true)
AS
SELECT
  id,
  title,
  description,
  file_name,
  file_type,
  file_url,
  file_size,
  subject,
  category,
  lesson_number,
  author,
  genre,
  year,
  created_at,
  updated_at,
  publish_at
FROM public.materials
WHERE publish_at IS NULL OR publish_at <= NOW();