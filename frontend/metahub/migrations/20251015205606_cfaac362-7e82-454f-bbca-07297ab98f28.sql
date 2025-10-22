-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

-- Create new insert policy that allows both authenticated and anonymous users
CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Drop existing restrictive order_items insert policy
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;

-- Create new insert policy for order_items that allows both authenticated and anonymous users
CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);