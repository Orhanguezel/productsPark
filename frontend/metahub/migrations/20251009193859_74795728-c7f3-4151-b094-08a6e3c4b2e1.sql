-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active email templates"
ON public.email_templates
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_key, template_name, subject, content, variables) VALUES
(
  'welcome',
  'Hoşgeldin',
  'Hoş Geldiniz - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Hoş Geldiniz!</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">{{site_name}} ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #666;">E-posta: <strong>{{user_email}}</strong></p>
    </div>
    <p style="color: #666; font-size: 16px;">Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
  '["user_name", "user_email", "site_name"]'::jsonb
),
(
  'ticket_replied',
  'Destek Talebiniz Yanıtlandı',
  'Destek Talebiniz Yanıtlandı - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Destek Talebiniz Yanıtlandı</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Destek talebiniz yanıtlandı.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Talep #:</strong> {{ticket_id}}</p>
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Konu:</strong> {{ticket_subject}}</p>
      <p style="margin: 0; color: #666;"><strong>Yanıt:</strong> {{reply_message}}</p>
    </div>
    <p style="color: #666; font-size: 16px;">Detayları görüntülemek için destek paneline giriş yapabilirsiniz.</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
  '["user_name", "ticket_id", "ticket_subject", "reply_message", "site_name"]'::jsonb
),
(
  'deposit_success',
  'Bakiye Yüklemesi Başarılı',
  'Bakiye Yükleme Onaylandı - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #10b981; text-align: center;">✓ Bakiye Yükleme Başarılı</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Bakiye yükleme talebiniz onaylandı ve hesabınıza eklendi.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Yüklenen Tutar:</strong> {{amount}} TL</p>
      <p style="margin: 0; color: #666;"><strong>Yeni Bakiye:</strong> {{new_balance}} TL</p>
    </div>
    <p style="color: #666; font-size: 16px;">Artık alışverişe başlayabilirsiniz!</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
  '["user_name", "amount", "new_balance", "site_name"]'::jsonb
),
(
  'order_received',
  'Siparişiniz Alındı',
  'Siparişiniz Alındı - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Siparişiniz Alındı</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{customer_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Siparişiniz başarıyla alındı ve işleme alındı.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Sipariş No:</strong> {{order_number}}</p>
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Toplam Tutar:</strong> {{final_amount}} TL</p>
      <p style="margin: 0; color: #666;"><strong>Durum:</strong> {{status}}</p>
    </div>
    <p style="color: #666; font-size: 16px;">Siparişinizin durumunu hesabınızdan takip edebilirsiniz.</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
  '["customer_name", "order_number", "final_amount", "status", "site_name"]'::jsonb
),
(
  'order_cancelled',
  'Siparişiniz İptal Edildi',
  'Sipariş İptali - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #ef4444; text-align: center;">Siparişiniz İptal Edildi</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{customer_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Siparişiniz iptal edildi.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Sipariş No:</strong> {{order_number}}</p>
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Tutar:</strong> {{final_amount}} TL</p>
      <p style="margin: 0; color: #666;"><strong>İptal Nedeni:</strong> {{cancellation_reason}}</p>
    </div>
    <p style="color: #666; font-size: 16px;">Ödemeniz varsa iade işlemi başlatılacaktır.</p>
    <p style="color: #666; font-size: 16px;">Sorularınız için bizimle iletişime geçebilirsiniz.</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
  '["customer_name", "order_number", "final_amount", "cancellation_reason", "site_name"]'::jsonb
),
(
  'order_completed',
  'Siparişiniz Tamamlandı',
  'Siparişiniz Tamamlandı - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #10b981; text-align: center;">✓ Siparişiniz Tamamlandı</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{customer_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Siparişiniz başarıyla tamamlandı ve ürünleriniz teslim edildi.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Sipariş No:</strong> {{order_number}}</p>
      <p style="margin: 0; color: #666;"><strong>Toplam Tutar:</strong> {{final_amount}} TL</p>
    </div>
    <p style="color: #666; font-size: 16px;">Ürünlerinizi hesabınızdan görüntüleyebilirsiniz.</p>
    <p style="color: #666; font-size: 16px;">Deneyiminizi paylaşmak isterseniz değerlendirme yapabilirsiniz.</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
  '["customer_name", "order_number", "final_amount", "site_name"]'::jsonb
),
(
  'password_reset',
  'Şifre Sıfırlama',
  'Şifre Sıfırlama Talebi - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Şifre Sıfırlama</h1>
    <p style="color: #666; font-size: 16px;">Merhaba,</p>
    <p style="color: #666; font-size: 16px;">Hesabınız için şifre sıfırlama talebi aldık.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <a href="{{reset_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Şifremi Sıfırla</a>
    </div>
    <p style="color: #666; font-size: 14px;">Bu linkin geçerlilik süresi 1 saattir.</p>
    <p style="color: #666; font-size: 14px;">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
  '["reset_link", "site_name"]'::jsonb
);