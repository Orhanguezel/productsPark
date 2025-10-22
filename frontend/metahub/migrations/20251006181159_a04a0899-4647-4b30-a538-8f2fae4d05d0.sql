-- Admin users can also view all user roles
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    auth.uid() = user_id
  );