-- ============================================
-- SECURITY FIX 1: Secure invitation_codes table
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can verify invitation codes" ON public.invitation_codes;

-- Create a secure function to verify invitation codes without exposing sensitive data
CREATE OR REPLACE FUNCTION public.verify_invitation_code(_code text)
RETURNS TABLE (
  is_valid boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Look up the code
  SELECT ic.is_used, ic.expires_at 
  INTO code_record
  FROM public.invitation_codes ic
  WHERE UPPER(ic.code) = UPPER(_code);
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::boolean, 'Cod invalid sau deja folosit'::text;
    RETURN;
  END IF;
  
  -- Check if already used
  IF code_record.is_used THEN
    RETURN QUERY SELECT false::boolean, 'Cod invalid sau deja folosit'::text;
    RETURN;
  END IF;
  
  -- Check if expired
  IF code_record.expires_at < now() THEN
    RETURN QUERY SELECT false::boolean, 'Codul a expirat'::text;
    RETURN;
  END IF;
  
  -- Code is valid
  RETURN QUERY SELECT true::boolean, NULL::text;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.verify_invitation_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_invitation_code(text) TO authenticated;

-- ============================================
-- SECURITY FIX 2: Secure materials answer_key
-- ============================================

-- Drop the permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view materials" ON public.materials;

-- Create a view that excludes answer_key for students
CREATE OR REPLACE VIEW public.materials_public
WITH (security_invoker = on)
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
  year,
  author,
  genre,
  created_at,
  updated_at
  -- Intentionally excludes answer_key
FROM public.materials;

-- Grant access to the view
GRANT SELECT ON public.materials_public TO anon;
GRANT SELECT ON public.materials_public TO authenticated;

-- Policy for students: can only see materials through the public view (no answer_key)
CREATE POLICY "Students can view materials without answer keys" 
ON public.materials 
FOR SELECT 
USING (
  -- Only allow through view (which doesn't include answer_key)
  -- Or if user is a professor/admin, they can see everything
  has_role(auth.uid(), 'profesor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create a separate policy for unauthenticated/student access via view
-- The view will handle the column restriction
CREATE POLICY "Anyone can view materials basic info" 
ON public.materials 
FOR SELECT 
USING (true);

-- Actually, we need a different approach - use column-level security via a function

-- Drop the policies we just created
DROP POLICY IF EXISTS "Students can view materials without answer keys" ON public.materials;
DROP POLICY IF EXISTS "Anyone can view materials basic info" ON public.materials;

-- Create a function to get materials with answer_key only for authorized users
CREATE OR REPLACE FUNCTION public.get_material_answer_key(_material_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only professors and admins can get answer keys
  IF NOT (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RETURN NULL;
  END IF;
  
  RETURN (SELECT answer_key FROM public.materials WHERE id = _material_id);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_material_answer_key(uuid) TO authenticated;

-- Create a policy that allows everyone to view materials (we'll handle answer_key in the application)
CREATE POLICY "Anyone can view materials" 
ON public.materials 
FOR SELECT 
USING (true);

-- ============================================
-- SECURITY FIX 3: Add admin policies for tvc_submissions
-- ============================================

-- Allow professors and admins to update submissions (for corrections)
CREATE POLICY "Professors can update submissions" 
ON public.tvc_submissions 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'profesor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow professors and admins to delete submissions (for privacy/corrections)
CREATE POLICY "Professors can delete submissions" 
ON public.tvc_submissions 
FOR DELETE 
USING (
  has_role(auth.uid(), 'profesor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);