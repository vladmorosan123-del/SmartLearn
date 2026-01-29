-- Securizare bucket storage materials - doar profesori și admini pot modifica fișiere

-- Ștergem politicile permisive existente
DROP POLICY IF EXISTS "Anyone can upload materials files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update materials files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete materials files" ON storage.objects;

-- Profesorii și adminii pot încărca materiale
CREATE POLICY "Professors and admins can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials' AND
  (public.has_role(auth.uid(), 'profesor'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- Profesorii și adminii pot actualiza materiale
CREATE POLICY "Professors and admins can update materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'materials' AND
  (public.has_role(auth.uid(), 'profesor'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- Profesorii și adminii pot șterge materiale
CREATE POLICY "Professors and admins can delete materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'materials' AND
  (public.has_role(auth.uid(), 'profesor'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
);