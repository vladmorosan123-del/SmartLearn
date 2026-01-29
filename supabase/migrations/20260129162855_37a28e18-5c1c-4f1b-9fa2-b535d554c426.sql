-- CORRECT APPROACH: Use a function to access materials for students
-- This hides answer_key at the database level

-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read materials" ON public.materials;

-- 2. Create a security definer function that returns materials without answer_key
-- This function runs with elevated privileges but returns only safe columns
CREATE OR REPLACE FUNCTION public.get_materials_for_students()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  subject text,
  file_name text,
  file_type text,
  file_url text,
  file_size integer,
  lesson_number integer,
  year integer,
  author text,
  genre text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.title,
    m.description,
    m.category,
    m.subject,
    m.file_name,
    m.file_type,
    m.file_url,
    m.file_size,
    m.lesson_number,
    m.year,
    m.author,
    m.genre,
    m.created_at,
    m.updated_at
  FROM public.materials m
  WHERE auth.uid() IS NOT NULL;  -- Only for authenticated users
$$;

-- 3. Drop and recreate the view to use this function
DROP VIEW IF EXISTS public.materials_public;

-- 4. Create a simple view that calls the function
CREATE VIEW public.materials_public AS
SELECT * FROM public.get_materials_for_students();

-- 5. Grant access
GRANT SELECT ON public.materials_public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_materials_for_students() TO authenticated;