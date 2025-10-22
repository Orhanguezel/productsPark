-- Create footer sections table for grouping footer menu items
CREATE TABLE IF NOT EXISTS public.footer_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.footer_sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage footer sections"
ON public.footer_sections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active footer sections"
ON public.footer_sections
FOR SELECT
USING (is_active = true);

-- Add section_id to menu_items table
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.footer_sections(id) ON DELETE SET NULL;

-- Insert default footer sections
INSERT INTO public.footer_sections (title, display_order, is_active)
VALUES 
  ('Hızlı Erişim', 0, true),
  ('Müşteri Hizmetleri', 1, true)
ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_footer_sections_updated_at
  BEFORE UPDATE ON public.footer_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();