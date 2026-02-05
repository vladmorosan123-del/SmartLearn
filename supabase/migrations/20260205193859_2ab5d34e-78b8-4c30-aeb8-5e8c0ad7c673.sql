
-- Add subject_config JSONB column for per-subject answer keys, oficiu, and question counts in TVC Complet tests
ALTER TABLE public.materials ADD COLUMN subject_config jsonb DEFAULT NULL;

-- subject_config stores per-subject test configuration, e.g.:
-- {
--   "matematica": { "questionCount": 9, "answerKey": ["A","B",...], "oficiu": 3 },
--   "informatica": { "questionCount": 5, "answerKey": ["C","D",...], "oficiu": 2 },
--   "fizica": { "questionCount": 7, "answerKey": ["A","C",...], "oficiu": 1 }
-- }
