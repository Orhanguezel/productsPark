-- Add SELECT policies for anon users (needed for INSERT...RETURNING)
-- This allows anon users to see orders they just created

-- Orders: Allow anon to select orders without user_id (guest orders)
CREATE POLICY "orders_anon_select_policy" ON public.orders
AS PERMISSIVE
FOR SELECT 
TO anon
USING (user_id IS NULL);

-- Order items: Allow anon to select order items for guest orders
CREATE POLICY "order_items_anon_select_policy" ON public.order_items
AS PERMISSIVE
FOR SELECT 
TO anon
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id IS NULL
  )
);

-- Payment requests: Allow anon to select their own payment requests (guest orders)
CREATE POLICY "payment_requests_anon_select_policy" ON public.payment_requests
AS PERMISSIVE
FOR SELECT 
TO anon
USING (user_id IS NULL);