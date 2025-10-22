-- Completely rebuild the orders INSERT policy with minimal checks
DROP POLICY IF EXISTS "Allow order creation for guests and users" ON public.orders;

CREATE POLICY "Enable insert for all users"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Temporarily make order_items also permissive for testing
DROP POLICY IF EXISTS "Allow order items for all orders" ON public.order_items;

CREATE POLICY "Enable insert for all order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

-- Same for payment requests
DROP POLICY IF EXISTS "Allow payment requests for all orders" ON public.payment_requests;

CREATE POLICY "Enable insert for all payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (true);