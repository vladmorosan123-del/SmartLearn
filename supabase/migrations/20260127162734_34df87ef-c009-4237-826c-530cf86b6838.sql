-- Drop existing overly permissive policies on materials
DROP POLICY IF EXISTS "Anyone can delete materials" ON public.materials;
DROP POLICY IF EXISTS "Anyone can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Anyone can update materials" ON public.materials;

-- Create secure policies for materials
-- Only professors and admins can insert materials
CREATE POLICY "Professors and admins can insert materials" 
ON public.materials 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'profesor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only professors and admins can update materials
CREATE POLICY "Professors and admins can update materials" 
ON public.materials 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'profesor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only professors and admins can delete materials
CREATE POLICY "Professors and admins can delete materials" 
ON public.materials 
FOR DELETE 
USING (
  has_role(auth.uid(), 'profesor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);