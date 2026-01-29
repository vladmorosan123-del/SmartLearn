-- Drop the existing materials_public view and recreate it
DROP VIEW IF EXISTS public.materials_public;

-- Create a public view that explicitly EXCLUDES the answer_key column
-- This ensures students cannot access answer keys even through the view
CREATE VIEW public.materials_public AS
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
COMMENT ON VIEW public.materials_public IS 'Public view of materials table that excludes answer_key column for security. Students should query this view instead of the materials table directly.';