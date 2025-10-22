-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can create orders with proper user_id" ON public.orders;

-- Create a simpler policy that allows inserts when user_id is NULL (guest) or matches auth
CREATE POLICY "Allow order creation for guests and users"
ON public.orders
FOR INSERT
TO public, anon, authenticated
WITH CHECK (
  -- For guest orders: user_id must be NULL
  user_id IS NULL
  OR
  -- For authenticated users: user_id must match
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Also update order_items policy to be simpler
DROP POLICY IF EXISTS "Order items can be created for valid orders" ON public.order_items;

CREATE POLICY "Allow order items for all orders"
ON public.order_items
FOR INSERT
TO public, anon, authenticated
WITH CHECK (
  -- Order must exist
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
  )
);

-- Update payment_requests policy
DROP POLICY IF EXISTS "Payment requests can be created for valid orders" ON public.payment_requests;

CREATE POLICY "Allow payment requests for all orders"
ON public.payment_requests
FOR INSERT
TO public, anon, authenticated
WITH CHECK (
  user_id IS NULL
  OR
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);