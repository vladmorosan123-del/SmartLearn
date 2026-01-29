-- Create a function to get material question count without exposing answers
CREATE OR REPLACE FUNCTION public.get_material_question_count(_material_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  answer_count integer;
BEGIN
  SELECT COALESCE(jsonb_array_length(answer_key), 0)
  INTO answer_count
  FROM public.materials
  WHERE id = _material_id;
  
  RETURN COALESCE(answer_count, 0);
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.get_material_question_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_material_question_count(uuid) TO authenticated;