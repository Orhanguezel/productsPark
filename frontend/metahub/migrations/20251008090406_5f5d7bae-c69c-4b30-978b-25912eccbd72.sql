-- Make user_id nullable in payment_requests for guest orders
ALTER TABLE public.payment_requests ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create own payment requests" ON public.payment_requests;

-- Create a single permissive INSERT policy for payment_requests
CREATE POLICY "Payment requests can be created for valid orders"
ON public.payment_requests
FOR INSERT
WITH CHECK (
  -- Guest users: user_id must be NULL and no auth
  (user_id IS NULL AND auth.uid() IS NULL)
  OR
  -- Authenticated users: user_id must match auth.uid()
  (user_id IS NOT NULL AND auth.uid() = user_id)
);