-- First add the publish_at column
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS publish_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_materials_publish_at ON public.materials(publish_at);

COMMENT ON COLUMN public.materials.publish_at IS 'When set, material will only be visible to students after this timestamp';