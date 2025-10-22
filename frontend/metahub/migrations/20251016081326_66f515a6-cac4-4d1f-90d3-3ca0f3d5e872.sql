-- Email template for order item delivery details
INSERT INTO email_templates (template_key, template_name, subject, content, variables, is_active)
VALUES (
  'order_item_delivery',
  'Ürün Teslimat Bilgileri',
  'Ürününüz Teslim Edildi - {{product_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #10b981; text-align: center;">✓ Ürününüz Teslim Edildi</h1>
  <p style="color: #666; font-size: 16px;">Merhaba <strong>{{customer_name}}</strong>,</p>
  <p style="color: #666; font-size: 16px;">Siparişinize ait ürününüz teslim edilmiştir.</p>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; color: #666;"><strong>Sipariş No:</strong> {{order_number}}</p>
    <p style="margin: 0 0 10px 0; color: #666;"><strong>Ürün:</strong> {{product_name}}</p>
  </div>
  
  <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
    <h3 style="margin-top: 0; color: #10b981;">Teslimat Bilgileri:</h3>
    <pre style="background: white; padding: 15px; border-radius: 5px; color: #333; white-space: pre-wrap; word-wrap: break-word;">{{delivery_content}}</pre>
  </div>
  
  <p style="color: #666; font-size: 14px; margin-top: 20px;">
    <strong>Not:</strong> Bu bilgileri güvenli bir şekilde saklayınız. Hesabınızdan tüm siparişlerinizi görüntüleyebilirsiniz.
  </p>
  
  <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
</div>',
  '["customer_name", "order_number", "product_name", "delivery_content", "site_name"]'::jsonb,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  variables = EXCLUDED.variables,
  updated_at = now();