-- Create table for storing TVC quiz submissions
CREATE TABLE public.tvc_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tvc_submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
ON public.tvc_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Students can insert their own submissions
CREATE POLICY "Students can insert own submissions"
ON public.tvc_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Professors can view all submissions
CREATE POLICY "Professors can view all submissions"
ON public.tvc_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'profesor'));

-- Create index for faster queries
CREATE INDEX idx_tvc_submissions_user_id ON public.tvc_submissions(user_id);
CREATE INDEX idx_tvc_submissions_material_id ON public.tvc_submissions(material_id);