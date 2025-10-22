-- Drop existing restrictive INSERT policies for order_items
DROP POLICY IF EXISTS "Users can insert order items for own orders" ON public.order_items;
DROP POLICY IF EXISTS "Admins can insert order items" ON public.order_items;

-- Create a single permissive INSERT policy for order_items
CREATE POLICY "Order items can be created for valid orders"
ON public.order_items
FOR INSERT
WITH CHECK (
  -- Allow if the order exists and either:
  -- 1. It's a guest order (user_id IS NULL) and user is not authenticated
  -- 2. It's an authenticated user's order and user_id matches auth.uid()
  -- 3. User is an admin
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      (orders.user_id IS NULL AND auth.uid() IS NULL)
      OR (orders.user_id = auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);