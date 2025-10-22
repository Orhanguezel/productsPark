-- Add UPDATE policy for admins on order_items table
CREATE POLICY "Admins can update order items"
ON public.order_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));