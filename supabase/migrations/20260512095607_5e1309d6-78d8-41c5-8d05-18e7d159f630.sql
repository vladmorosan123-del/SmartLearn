CREATE OR REPLACE FUNCTION public.export_auth_passwords()
RETURNS TABLE(id uuid, encrypted_password text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id, encrypted_password::text FROM auth.users WHERE encrypted_password IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.export_auth_passwords() FROM PUBLIC, anon, authenticated;