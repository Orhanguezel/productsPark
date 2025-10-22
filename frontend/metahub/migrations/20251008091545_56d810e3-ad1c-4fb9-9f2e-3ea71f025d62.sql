-- Drop ALL policies on these tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on orders
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.orders';
    END LOOP;
    
    -- Drop all policies on order_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'order_items' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.order_items';
    END LOOP;
    
    -- Drop all policies on payment_requests
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payment_requests' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.payment_requests';
    END LOOP;
END $$;

-- Create ONE simple policy for INSERT on orders
CREATE POLICY "orders_insert_policy"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Create ONE simple policy for SELECT on orders
CREATE POLICY "orders_select_policy"
ON public.orders
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IS NULL 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create ONE simple policy for UPDATE on orders
CREATE POLICY "orders_update_policy"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Order items - simple policies
CREATE POLICY "order_items_insert_policy"
ON public.order_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "order_items_select_policy"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "order_items_update_policy"
ON public.order_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Payment requests - simple policies
CREATE POLICY "payment_requests_insert_policy"
ON public.payment_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "payment_requests_select_policy"
ON public.payment_requests
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IS NULL 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "payment_requests_update_policy"
ON public.payment_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));