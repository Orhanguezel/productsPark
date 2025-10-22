-- Drop existing restrictive INSERT policies for orders
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Guest users can create orders" ON public.orders;

-- Create a single permissive INSERT policy that allows both authenticated and guest orders
CREATE POLICY "Anyone can create orders with proper user_id"
ON public.orders
FOR INSERT
WITH CHECK (
  -- Guest users: user_id must be NULL and no auth
  (user_id IS NULL AND auth.uid() IS NULL)
  OR
  -- Authenticated users: user_id must match auth.uid()
  (user_id IS NOT NULL AND auth.uid() = user_id)
);