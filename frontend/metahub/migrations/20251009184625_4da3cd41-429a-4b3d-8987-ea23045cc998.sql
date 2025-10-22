-- Create popups table for campaign and product promotion popups
CREATE TABLE public.popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  coupon_code TEXT,
  button_text TEXT,
  button_link TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  display_frequency TEXT NOT NULL DEFAULT 'always',
  display_pages TEXT NOT NULL DEFAULT 'all',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- Admin can manage popups
CREATE POLICY "Admins can manage popups"
ON public.popups
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view active popups
CREATE POLICY "Everyone can view active popups"
ON public.popups
FOR SELECT
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);

-- Create trigger for updated_at
CREATE TRIGGER update_popups_updated_at
BEFORE UPDATE ON public.popups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();