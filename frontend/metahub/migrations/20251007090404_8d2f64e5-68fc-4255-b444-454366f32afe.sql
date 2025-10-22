-- Create payment_requests table for order payments
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('havale', 'eft', 'wallet')),
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can create own payment requests
CREATE POLICY "Users can create own payment requests"
ON public.payment_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view own payment requests
CREATE POLICY "Users can view own payment requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update payment requests
CREATE POLICY "Admins can update payment requests"
ON public.payment_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();