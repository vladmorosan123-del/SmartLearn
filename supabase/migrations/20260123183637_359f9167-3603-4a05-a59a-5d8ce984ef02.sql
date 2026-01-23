-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create a table to store uploaded files/materials
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  lesson_number INTEGER,
  author TEXT,
  genre TEXT,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Everyone can view materials (students need to see uploaded content)
CREATE POLICY "Anyone can view materials"
  ON public.materials FOR SELECT
  USING (true);

-- Anyone can insert materials (professors - role checked in app)
CREATE POLICY "Anyone can insert materials"
  ON public.materials FOR INSERT
  WITH CHECK (true);

-- Anyone can update materials
CREATE POLICY "Anyone can update materials"
  ON public.materials FOR UPDATE
  USING (true);

-- Anyone can delete materials
CREATE POLICY "Anyone can delete materials"
  ON public.materials FOR DELETE
  USING (true);

-- Create storage bucket for materials
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

-- Storage policies for materials bucket
CREATE POLICY "Anyone can view materials files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materials');

CREATE POLICY "Anyone can upload materials files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'materials');

CREATE POLICY "Anyone can update materials files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'materials');

CREATE POLICY "Anyone can delete materials files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'materials');

-- Create trigger for updated_at
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();