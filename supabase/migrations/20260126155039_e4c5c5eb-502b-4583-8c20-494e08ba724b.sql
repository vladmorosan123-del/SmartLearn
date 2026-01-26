-- Add time tracking columns to tvc_submissions
ALTER TABLE public.tvc_submissions 
ADD COLUMN IF NOT EXISTS time_spent_seconds integer DEFAULT 0;

-- Create lesson_views table for tracking time spent on lessons
CREATE TABLE IF NOT EXISTS public.lesson_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
  view_started_at timestamp with time zone NOT NULL DEFAULT now(),
  view_ended_at timestamp with time zone,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on lesson_views
ALTER TABLE public.lesson_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_views
CREATE POLICY "Students can insert own views"
ON public.lesson_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own views"
ON public.lesson_views
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Students can view own views"
ON public.lesson_views
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Professors can view all views"
ON public.lesson_views
FOR SELECT
USING (has_role(auth.uid(), 'profesor'::app_role));