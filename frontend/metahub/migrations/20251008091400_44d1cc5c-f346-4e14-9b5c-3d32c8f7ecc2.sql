-- Re-enable RLS on the tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable insert for all payment requests" ON public.payment_requests;

-- Create simple, working policies for orders
CREATE POLICY "Allow order insert"
ON public.orders
FOR INSERT
WITH CHECK (
  -- Guest orders: user_id is NULL
  (user_id IS NULL)
  OR
  -- User orders: user_id matches authenticated user
  (user_id = auth.uid())
);

-- Keep SELECT policies for users to view their orders
CREATE POLICY "Allow users to view own orders"
ON public.orders
FOR SELECT
USING (
  (user_id = auth.uid())
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Keep UPDATE for admins only
CREATE POLICY "Allow admins to update orders"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Order items policies
CREATE POLICY "Allow order item insert"
ON public.order_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow users to view order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Allow admins to update order items"
ON public.order_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Payment requests policies
CREATE POLICY "Allow payment request insert"
ON public.payment_requests
FOR INSERT
WITH CHECK (
  (user_id IS NULL)
  OR
  (user_id = auth.uid())
);

CREATE POLICY "Allow users to view own payment requests"
ON public.payment_requests
FOR SELECT
USING (
  (user_id = auth.uid())
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Allow admins to update payment requests"
ON public.payment_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));