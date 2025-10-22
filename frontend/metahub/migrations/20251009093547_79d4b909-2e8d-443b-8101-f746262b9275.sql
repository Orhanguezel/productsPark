-- Add delete policies for support_tickets
CREATE POLICY "Admins can delete tickets" 
ON public.support_tickets
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add delete policy for orders
CREATE POLICY "Admins can delete orders" 
ON public.orders
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));