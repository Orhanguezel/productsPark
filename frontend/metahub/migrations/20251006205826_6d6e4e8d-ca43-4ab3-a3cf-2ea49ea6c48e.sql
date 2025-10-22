-- Create fake order notifications table
CREATE TABLE public.fake_order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  display_interval INTEGER NOT NULL DEFAULT 30, -- seconds between notifications
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fake_order_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fake notifications"
ON public.fake_order_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active fake notifications"
ON public.fake_order_notifications
FOR SELECT
USING (is_active = true);

-- Create wallet deposit requests table
CREATE TABLE public.wallet_deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  proof_image_url TEXT,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.wallet_deposit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own deposit requests"
ON public.wallet_deposit_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deposit requests"
ON public.wallet_deposit_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit requests"
ON public.wallet_deposit_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deposit requests"
ON public.wallet_deposit_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create custom pages table
CREATE TABLE public.custom_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom pages"
ON public.custom_pages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view published custom pages"
ON public.custom_pages
FOR SELECT
USING (is_published = true);

-- Create storage buckets for logos and product images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('logos', 'logos', true),
  ('product-images', 'product-images', true);

-- Storage policies for logos bucket
CREATE POLICY "Admins can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Storage policies for product-images bucket
CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Add trigger for updated_at columns
CREATE TRIGGER update_fake_order_notifications_updated_at
BEFORE UPDATE ON public.fake_order_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_deposit_requests_updated_at
BEFORE UPDATE ON public.wallet_deposit_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_pages_updated_at
BEFORE UPDATE ON public.custom_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();