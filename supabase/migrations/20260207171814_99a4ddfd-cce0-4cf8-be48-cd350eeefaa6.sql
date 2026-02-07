CREATE POLICY "Admins can view all submissions"
ON public.tvc_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));