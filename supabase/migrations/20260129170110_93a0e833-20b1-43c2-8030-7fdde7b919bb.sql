-- Add oficiu (bonus points) column to materials table for TVC tests
ALTER TABLE public.materials 
ADD COLUMN oficiu integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.materials.oficiu IS 'Bonus points (oficiu) for TVC tests';