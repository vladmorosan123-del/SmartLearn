-- Adaugă RLS pe view-ul materials_public pentru a permite acces doar utilizatorilor autentificați

-- Revocăm accesul pentru utilizatori neautentificați
REVOKE SELECT ON public.materials_public FROM anon;

-- Păstrăm accesul pentru utilizatori autentificați
GRANT SELECT ON public.materials_public TO authenticated;

-- Adaugă politică RLS pentru view (necesită să fie un tabel cu RLS, dar view-urile moștenesc de la tabel de bază)
-- View-ul folosește security_invoker=true, deci va respecta RLS-ul de pe materials

-- Creăm o politică suplimentară pe materials pentru utilizatorii autentificați care folosesc view-ul
CREATE POLICY "Authenticated users can view materials via public view"
ON public.materials FOR SELECT
TO authenticated
USING (true);