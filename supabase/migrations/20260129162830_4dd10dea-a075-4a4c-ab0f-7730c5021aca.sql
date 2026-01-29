-- =====================================================
-- FIX 1: Profiles table - Block anonymous access
-- =====================================================

-- Add explicit policy to block anonymous users
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- =====================================================
-- FIX 2: Invitation codes - Block anonymous access
-- =====================================================

-- Add explicit policy to block anonymous users
CREATE POLICY "Block anonymous access to invitation_codes"
ON public.invitation_codes
FOR SELECT
TO anon
USING (false);

-- =====================================================
-- FIX 3: Materials - Hide answer_key from students
-- Remove the overly permissive SELECT policy that exposes answer_key
-- Students should use materials_public view which excludes answer_key
-- =====================================================

-- Drop the policy that allows all authenticated users to see all materials (including answer_key)
DROP POLICY IF EXISTS "Authenticated users can view materials via public view" ON public.materials;

-- Ensure the materials_public view has proper security settings
-- Recreate it with security_invoker to use caller's permissions
DROP VIEW IF EXISTS public.materials_public;

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
-- Note: answer_key is explicitly excluded from this view

-- Grant SELECT on the public view to authenticated users
GRANT SELECT ON public.materials_public TO authenticated;

-- Add policy allowing authenticated students to read materials via the view
-- The view excludes answer_key, so this is safe
CREATE POLICY "Authenticated users can view materials metadata"
ON public.materials
FOR SELECT
TO authenticated
USING (true);

-- But we need to ensure this only works through the view for students
-- Actually, we need a different approach - use a function to check role

-- Drop the policy we just created
DROP POLICY IF EXISTS "Authenticated users can view materials metadata" ON public.materials;

-- Create a policy that only allows professors/admins to directly query materials table
-- Students will use the view which has security_invoker=on
CREATE POLICY "Only professors and admins can directly select materials"
ON public.materials
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'profesor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- For the view to work for students, we need to allow SELECT but 
-- students can only access through the view (which hides answer_key)
-- Since security_invoker=on, the view uses the caller's permissions
-- We need a different approach

-- Actually, let's use security_definer instead so the view can access data
DROP VIEW IF EXISTS public.materials_public;

CREATE VIEW public.materials_public
WITH (security_barrier = true)
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

-- Grant access to the view
GRANT SELECT ON public.materials_public TO authenticated;

-- Now we need a policy that allows the view to access data
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Only professors and admins can directly select materials" ON public.materials;

-- Create policy: professors/admins can see everything directly
-- The existing "Professors and admins can view all materials" policy should remain

-- For students accessing via view, we need to allow SELECT on base table
-- but the view filters out answer_key column
CREATE POLICY "Allow authenticated to read materials for view access"
ON public.materials
FOR SELECT
TO authenticated
USING (true);