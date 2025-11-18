-- Allow admins to read all works so the admin view can list the 10 most recent from every user
CREATE POLICY "Admins can view all work"
ON public.work_in_progress
FOR SELECT
USING (has_role(auth.uid(), 'admin'::public.app_role));