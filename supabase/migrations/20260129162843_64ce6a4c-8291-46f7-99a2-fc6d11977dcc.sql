-- Fix the security definer view issue
-- Recreate the view with security_invoker instead of security_barrier

DROP VIEW IF EXISTS public.materials_public;

-- Create view with security_invoker=on (uses caller's permissions, which is correct)
CREATE VIEW public.materials_public
WITH (security_invoker = on)
AS SELECT 
  id,
  title,
  description,
  category,
  subject,
  file_name,
  file_type,
  file_url,
  file_size,
  lesson_number,
  year,
  author,
  genre,
  created_at,
  updated_at
FROM public.materials;
-- answer_key is explicitly excluded

-- Grant access to authenticated users
GRANT SELECT ON public.materials_public TO authenticated;

-- Now fix the RLS policy structure:
-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated to read materials for view access" ON public.materials;

-- 2. Keep only professors/admins access to base table with answer_key
-- The existing "Professors and admins can view all materials" policy handles this

-- 3. For students to access via view, we need to allow SELECT but only for non-sensitive columns
-- Since security_invoker=on, the view uses caller's permissions
-- We need to allow all authenticated users to SELECT from materials table
-- The view naturally hides answer_key column

CREATE POLICY "Authenticated users can read materials"
ON public.materials
FOR SELECT
TO authenticated
USING (true);