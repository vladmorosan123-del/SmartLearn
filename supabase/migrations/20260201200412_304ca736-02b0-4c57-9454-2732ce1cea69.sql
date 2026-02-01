-- Drop the view and function with CASCADE, then recreate
DROP VIEW IF EXISTS public.materials_public CASCADE;
DROP FUNCTION IF EXISTS public.get_materials_for_students() CASCADE;

-- Recreate the function with publish_at column and filtering
CREATE FUNCTION public.get_materials_for_students()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  file_name text,
  file_type text,
  file_url text,
  file_size bigint,
  subject text,
  category text,
  lesson_number integer,
  author text,
  genre text,
  year integer,
  oficiu integer,
  timer_minutes integer,
  created_at timestamptz,
  updated_at timestamptz,
  publish_at timestamptz
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
    m.file_name,
    m.file_type,
    m.file_url,
    m.file_size,
    m.subject,
    m.category,
    m.lesson_number,
    m.author,
    m.genre,
    m.year,
    m.oficiu,
    m.timer_minutes,
    m.created_at,
    m.updated_at,
    m.publish_at
  FROM public.materials m
  WHERE m.publish_at IS NULL OR m.publish_at <= NOW()
$$;

-- Recreate the materials_public view (without answer_key and with publish_at filter)
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
  updated_at,
  publish_at
FROM public.materials
WHERE publish_at IS NULL OR publish_at <= NOW();