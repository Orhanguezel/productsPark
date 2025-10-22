-- Add RLS policy for admins to view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));