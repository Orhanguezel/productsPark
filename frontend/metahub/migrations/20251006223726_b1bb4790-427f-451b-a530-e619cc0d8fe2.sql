-- Create menu items table for header and footer management
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('page', 'custom')),
  page_id UUID REFERENCES public.custom_pages(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL CHECK (location IN ('header', 'footer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage menu items
CREATE POLICY "Admins can manage menu items"
ON public.menu_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view active menu items
CREATE POLICY "Everyone can view active menu items"
ON public.menu_items
FOR SELECT
USING (is_active = true);

-- Create index for faster queries
CREATE INDEX idx_menu_items_location ON public.menu_items(location);
CREATE INDEX idx_menu_items_order ON public.menu_items(display_order);
CREATE INDEX idx_menu_items_parent ON public.menu_items(parent_id);

-- Update timestamp trigger
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();