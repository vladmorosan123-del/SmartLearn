-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view materials" ON storage.objects;
DROP POLICY IF EXISTS "Professors and admins can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Professors and admins can update materials" ON storage.objects;
DROP POLICY IF EXISTS "Professors and admins can delete materials" ON storage.objects;

-- Create storage policies for the materials bucket
-- Allow all authenticated users to view/download files
CREATE POLICY "Authenticated users can view materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'materials');

-- Allow professors and admins to upload files
CREATE POLICY "Professors and admins can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' 
  AND (
    public.has_role(auth.uid(), 'profesor'::public.app_role) 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Allow professors and admins to update files
CREATE POLICY "Professors and admins can update materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materials' 
  AND (
    public.has_role(auth.uid(), 'profesor'::public.app_role) 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Allow professors and admins to delete files
CREATE POLICY "Professors and admins can delete materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials' 
  AND (
    public.has_role(auth.uid(), 'profesor'::public.app_role) 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);