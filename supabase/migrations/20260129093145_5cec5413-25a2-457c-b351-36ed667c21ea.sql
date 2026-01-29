-- Securizare: Restricționare acces direct la tabelul materials
-- Elevii trebuie să folosească view-ul materials_public care exclude answer_key

-- Ștergem politica permisivă care permite oricui să vadă materialele
DROP POLICY IF EXISTS "Anyone can view materials" ON public.materials;

-- Creăm politică pentru profesori și admini să vadă tot (inclusiv answer_key)
CREATE POLICY "Professors and admins can view all materials"
ON public.materials FOR SELECT
USING (
  has_role(auth.uid(), 'profesor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Notă: Elevii vor folosi view-ul materials_public care exclude answer_key
-- View-ul materials_public are deja GRANT SELECT pentru authenticated și anon