-- Add timer_minutes column to materials table for custom test duration
ALTER TABLE public.materials 
ADD COLUMN timer_minutes integer DEFAULT 180;

-- Add comment for clarity
COMMENT ON COLUMN public.materials.timer_minutes IS 'Custom timer duration in minutes for TVC tests. Default is 180 (3 hours).';