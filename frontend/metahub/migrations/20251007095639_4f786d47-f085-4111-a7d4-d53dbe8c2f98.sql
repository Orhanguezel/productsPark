-- Allow users to insert order items for their own orders
CREATE POLICY "Users can insert order items for own orders"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Allow admins to insert order items
CREATE POLICY "Admins can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));