-- Drop existing policies
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "payment_requests_insert_policy" ON public.payment_requests;

-- Create INSERT policies without role restriction (applies to all roles including anon)
CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "payment_requests_insert_policy" ON public.payment_requests
FOR INSERT 
WITH CHECK (true);