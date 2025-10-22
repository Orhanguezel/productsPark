-- Drop existing insert policies
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "payment_requests_insert_policy" ON public.payment_requests;

-- Create policies for BOTH authenticated and anon roles
-- Orders table
CREATE POLICY "orders_insert_policy" ON public.orders
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "orders_anon_insert_policy" ON public.orders
AS PERMISSIVE
FOR INSERT 
TO anon
WITH CHECK (true);

-- Order items table
CREATE POLICY "order_items_insert_policy" ON public.order_items
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "order_items_anon_insert_policy" ON public.order_items
AS PERMISSIVE
FOR INSERT 
TO anon
WITH CHECK (true);

-- Payment requests table
CREATE POLICY "payment_requests_insert_policy" ON public.payment_requests
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "payment_requests_anon_insert_policy" ON public.payment_requests
AS PERMISSIVE
FOR INSERT 
TO anon
WITH CHECK (true);