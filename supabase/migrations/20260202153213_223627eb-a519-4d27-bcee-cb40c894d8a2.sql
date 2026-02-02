-- Add year and class columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN study_year integer CHECK (study_year IN (11, 12)),
ADD COLUMN study_class text CHECK (study_class IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'));

-- Update existing students to 11G
UPDATE public.profiles p
SET study_year = 11, study_class = 'G'
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.user_id 
  AND ur.role = 'student'
);