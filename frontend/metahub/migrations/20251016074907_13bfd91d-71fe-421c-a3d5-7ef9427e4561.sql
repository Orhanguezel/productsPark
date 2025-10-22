-- Drop existing insert policies
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;

-- Create insert policies that explicitly work for both anonymous and authenticated users
CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also create insert policy for payment_requests for anon users
DROP POLICY IF EXISTS "payment_requests_insert_policy" ON public.payment_requests;
CREATE POLICY "payment_requests_insert_policy" ON public.payment_requests
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);