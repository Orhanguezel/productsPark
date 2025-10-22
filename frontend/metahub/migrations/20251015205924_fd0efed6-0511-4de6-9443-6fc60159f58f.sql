-- Drop all existing insert policies for orders
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

-- Create a simple insert policy that works for all users (authenticated and anonymous)
CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT 
WITH CHECK (true);

-- Drop all existing insert policies for order_items
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;

-- Create a simple insert policy for order_items that works for all users
CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT 
WITH CHECK (true);