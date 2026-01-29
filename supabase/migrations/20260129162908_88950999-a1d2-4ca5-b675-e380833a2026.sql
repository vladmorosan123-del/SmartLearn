-- Remove the view that triggers the security definer warning
-- Students will use the function directly instead

DROP VIEW IF EXISTS public.materials_public;

-- Keep the function - it's secure because:
-- 1. It requires authentication (auth.uid() IS NOT NULL)
-- 2. It only returns safe columns (no answer_key)
-- 3. It has search_path set to public

-- Create a regular view with security_invoker that references the function
-- This way the view itself is not security definer
CREATE VIEW public.materials_public
WITH (security_invoker = on)
AS SELECT * FROM public.get_materials_for_students();

GRANT SELECT ON public.materials_public TO authenticated;