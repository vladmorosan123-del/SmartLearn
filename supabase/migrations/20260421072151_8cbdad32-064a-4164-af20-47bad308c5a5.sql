CREATE OR REPLACE FUNCTION public.get_material_options_per_question(_material_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  m_record RECORD;
  result jsonb;
  subj_key text;
  subj_val jsonb;
  ans_array jsonb;
  per_q jsonb;
  i integer;
  letter text;
  max_letter text;
  letters text[] := ARRAY['A','B','C','D','E','F'];
BEGIN
  SELECT answer_key, subject_config INTO m_record
  FROM public.materials WHERE id = _material_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Multi-subject mode
  IF m_record.subject_config IS NOT NULL THEN
    result := '{}'::jsonb;
    FOR subj_key, subj_val IN SELECT * FROM jsonb_each(m_record.subject_config)
    LOOP
      ans_array := COALESCE(subj_val->'answerKey', '[]'::jsonb);
      per_q := '[]'::jsonb;
      FOR i IN 0..(jsonb_array_length(ans_array) - 1)
      LOOP
        letter := COALESCE(ans_array->>i, '');
        IF letter = ANY(letters) AND letter > 'D' THEN
          max_letter := letter;
        ELSE
          max_letter := 'D';
        END IF;
        per_q := per_q || to_jsonb(max_letter);
      END LOOP;
      result := result || jsonb_build_object(subj_key, per_q);
    END LOOP;
    RETURN result;
  END IF;

  -- Single-subject mode
  IF m_record.answer_key IS NOT NULL THEN
    per_q := '[]'::jsonb;
    FOR i IN 0..(jsonb_array_length(m_record.answer_key) - 1)
    LOOP
      letter := COALESCE(m_record.answer_key->>i, '');
      IF letter = ANY(letters) AND letter > 'D' THEN
        max_letter := letter;
      ELSE
        max_letter := 'D';
      END IF;
      per_q := per_q || to_jsonb(max_letter);
    END LOOP;
    RETURN per_q;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_material_options_per_question(uuid) TO authenticated, anon;