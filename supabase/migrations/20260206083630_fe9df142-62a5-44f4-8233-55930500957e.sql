DROP FUNCTION IF EXISTS public.get_materials_for_students();

CREATE OR REPLACE FUNCTION public.get_materials_for_students()
 RETURNS TABLE(id uuid, title text, description text, file_name text, file_type text, file_url text, file_size integer, subject text, category text, lesson_number integer, author text, genre text, year integer, oficiu integer, timer_minutes integer, created_at timestamp with time zone, updated_at timestamp with time zone, publish_at timestamp with time zone, subject_config jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;