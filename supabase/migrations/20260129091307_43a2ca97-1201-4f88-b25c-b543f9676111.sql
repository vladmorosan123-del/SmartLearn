-- Recreate the view with SECURITY INVOKER to ensure RLS is properly enforced
-- This ensures the view uses the permissions of the querying user, not the view creator
DROP VIEW IF EXISTS public.materials_public;

CREATE VIEW public.materials_public 
WITH (security_invoker = true) AS
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
  updated_at
FROM public.materials;

-- Grant SELECT access to the view for all authenticated and anonymous users
GRANT SELECT ON public.materials_public TO anon, authenticated;

-- Add a comment to document the purpose of this view
COMMENT ON VIEW public.materials_public IS 'Public view of materials table that excludes answer_key column for security. Uses SECURITY INVOKER to respect RLS policies of the querying user.';