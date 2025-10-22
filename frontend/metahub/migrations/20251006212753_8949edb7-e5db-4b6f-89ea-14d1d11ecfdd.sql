-- Create product reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product FAQs table
CREATE TABLE IF NOT EXISTS public.product_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_faqs ENABLE ROW LEVEL SECURITY;

-- RLS policies for product reviews
CREATE POLICY "Everyone can view active reviews"
  ON public.product_reviews
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage reviews"
  ON public.product_reviews
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for product FAQs
CREATE POLICY "Everyone can view active FAQs"
  ON public.product_faqs
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
  ON public.product_faqs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_active ON public.product_reviews(is_active);
CREATE INDEX idx_product_faqs_product_id ON public.product_faqs(product_id);
CREATE INDEX idx_product_faqs_active ON public.product_faqs(is_active);
CREATE INDEX idx_product_faqs_order ON public.product_faqs(product_id, display_order);