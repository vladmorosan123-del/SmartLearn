-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view chapters" ON public.chapters;
CREATE POLICY "Anyone authenticated can view chapters"
  ON public.chapters FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Professors and admins can insert chapters" ON public.chapters;
CREATE POLICY "Professors and admins can insert chapters"
  ON public.chapters FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Professors and admins can update chapters" ON public.chapters;
CREATE POLICY "Professors and admins can update chapters"
  ON public.chapters FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Professors and admins can delete chapters" ON public.chapters;
CREATE POLICY "Professors and admins can delete chapters"
  ON public.chapters FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_chapters_updated_at ON public.chapters;
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add chapter_id and barem columns to materials if missing
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS barem_url TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS barem_name TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS barem_size INTEGER;

CREATE INDEX IF NOT EXISTS idx_materials_chapter_id ON public.materials(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject, order_index);