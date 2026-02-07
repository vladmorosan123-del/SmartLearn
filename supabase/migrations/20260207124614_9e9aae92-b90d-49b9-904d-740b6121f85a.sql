
-- Revoke anonymous access to materials_public view
REVOKE SELECT ON public.materials_public FROM anon;

-- Ensure only authenticated users can access the view
GRANT SELECT ON public.materials_public TO authenticated;
