
-- Drop and recreate get_materials_for_students with subject_config
DROP FUNCTION IF EXISTS public.get_materials_for_students();

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
  publish_at timestamptz,
  subject_config jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
    m.publish_at,
    CASE 
      WHEN m.subject_config IS NOT NULL THEN (
        SELECT jsonb_object_agg(
          key,
          (value - 'answerKey') || jsonb_build_object(
            'questionCount', COALESCE((value->>'questionCount')::int, 0),
            'oficiu', COALESCE((value->>'oficiu')::int, 0)
          )
        )
        FROM jsonb_each(m.subject_config)
      )
      ELSE NULL
    END as subject_config
  FROM public.materials m
  WHERE m.publish_at IS NULL OR m.publish_at <= NOW();
END;
$$;

-- Update get_material_question_count to handle subject_config
CREATE OR REPLACE FUNCTION public.get_material_question_count(_material_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  answer_count integer;
  config_count integer;
BEGIN
  SELECT COALESCE(
    (SELECT SUM((value->>'questionCount')::int) FROM jsonb_each(m.subject_config)), 0
  )::int
  INTO config_count
  FROM public.materials m
  WHERE m.id = _material_id AND m.subject_config IS NOT NULL;

  IF config_count IS NOT NULL AND config_count > 0 THEN
    RETURN config_count;
  END IF;

  SELECT COALESCE(jsonb_array_length(answer_key), 0)
  INTO answer_count
  FROM public.materials
  WHERE id = _material_id;
  
  RETURN COALESCE(answer_count, 0);
END;
$$;
