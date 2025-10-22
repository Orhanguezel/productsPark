-- Create topbar_settings table
CREATE TABLE public.topbar_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  message text NOT NULL,
  coupon_code text,
  link_url text,
  link_text text,
  background_color text DEFAULT 'hsl(var(--primary))',
  text_color text DEFAULT 'hsl(var(--primary-foreground))',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topbar_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view active topbar"
  ON public.topbar_settings
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage topbar"
  ON public.topbar_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_topbar_settings_updated_at
  BEFORE UPDATE ON public.topbar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();