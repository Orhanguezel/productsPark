-- Drop old fake_order_notifications table and recreate with product_id
DROP TABLE IF EXISTS public.fake_order_notifications CASCADE;

CREATE TABLE public.fake_order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
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

CREATE TRIGGER update_fake_order_notifications_updated_at
BEFORE UPDATE ON public.fake_order_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog-images bucket
CREATE POLICY "Admins can upload blog images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'blog-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'blog-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view blog images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');