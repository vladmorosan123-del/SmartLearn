
-- Drop the materials_public view since it's unused in application code
-- Students access materials via the secure get_materials_for_students() RPC
-- This view has no RLS and exposes file_url and metadata without authentication
DROP VIEW IF EXISTS public.materials_public;
