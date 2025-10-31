-- EMAIL_TEMPLATES SEED
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT IGNORE INTO `email_templates`
(`id`, `template_key`, `template_name`, `subject`, `content`, `variables`, `is_active`, `locale`, `created_at`, `updated_at`)
VALUES
-- ticket_replied
('4290e3d9-d5b8-4423-aab2-1cbc85bee59b',
 'ticket_replied',
 'Ticket Replied',
 'Destek Talebiniz Yanıtlandı - {{site_name}}',
 '<h1 class=\"ql-align-center\">Destek Talebiniz Yanıtlandı</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>Destek talebiniz yanıtlandı.</p><p><br></p><p>Detayları görüntülemek için kullanıcı paneline giriş yapabilirsiniz.</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>',
 JSON_ARRAY('user_name','ticket_id','ticket_subject','reply_message','site_name'),
 1, NULL, '2025-10-09 19:38:58.000', '2025-10-13 20:28:47.000'),

-- order_item_delivery
('4f85350b-c082-4677-bd9f-ad1e7d9bd038',
 'order_item_delivery',
 'Order Item Delivery',
 'Ürününüz Teslim Edildi - {{product_name}}',
 '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n  <h1 style=\"color: #10b981; text-align: center;\">✓ Ürününüz Teslim Edildi</h1>\n  <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n  <p style=\"color: #666; font-size: 16px;\">Siparişinize ait ürününüz teslim edilmiştir.</p>\n  \n  <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n    <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n    <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Ürün:</strong> {{product_name}}</p>\n  </div>\n  \n  <div style=\"background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;\">\n    <h3 style=\"margin-top: 0; color: #10b981;\">Teslimat Bilgileri:</h3>\n    <pre style=\"background: white; padding: 15px; border-radius: 5px; color: #333; white-space: pre-wrap; word-wrap: break-word;\">{{delivery_content}}</pre>\n  </div>\n  \n  <p style=\"color: #666; font-size: 14px; margin-top: 20px;\">\n    <strong>Not:</strong> Bu bilgileri güvenli bir şekilde saklayınız. Hesabınızdan tüm siparişlerinizi görüntüleyebilirsiniz.\n  </p>\n  \n  <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n</div>',
 JSON_ARRAY('customer_name','order_number','product_name','delivery_content','site_name'),
 1, NULL, '2025-10-16 08:13:25.000', '2025-10-16 08:13:25.000'),

-- order_completed
('547e8ec8-2746-4bb8-9be3-3db4d186697d',
 'order_completed',
 'Order Completed',
 'Siparişiniz Tamamlandı - {{site_name}}',
 '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #10b981; text-align: center;\">✓ Siparişiniz Tamamlandı</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz başarıyla tamamlandı ve ürünleriniz teslim edildi.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0; color: #666;\"><strong>Toplam Tutar:</strong> {{final_amount}} TL</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Ürünlerinizi hesabınızdan görüntüleyebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Deneyiminizi paylaşmak isterseniz değerlendirme yapabilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>',
 JSON_ARRAY('customer_name','order_number','final_amount','site_name'),
 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- order_received
('5adeb7c9-e07b-4a36-9e49-460cd626cf8c',
 'order_received',
 'Order Received',
 'Siparişiniz Alındı - {{site_name}}',
 '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #333; text-align: center;\">Siparişiniz Alındı</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz başarıyla alındı ve işleme alındı.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Toplam Tutar:</strong> {{final_amount}} TL</p>\n      <p style=\"margin: 0; color: #666;\"><strong>Durum:</strong> {{status}}</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Siparişinizin durumunu hesabınızdan takip edebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>',
 JSON_ARRAY('customer_name','order_number','final_amount','status','site_name'),
 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- deposit_success
('d75ec05a-bac7-446a-ac2a-cfc7b7f2dd07',
 'deposit_success',
 'Deposit Success',
 'Bakiye Yükleme Onaylandı - {{site_name}}',
 '<h1 class=\"ql-align-center\">✓ Bakiye Yükleme Başarılı</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>Bakiye yükleme talebiniz onaylandı ve hesabınıza eklendi.</p><p><br></p><p><strong>Yüklenen Tutar:</strong> {{amount}} TL</p><p><strong>Yeni Bakiye:</strong> {{new_balance}} TL</p><p>Artık alışverişe başlayabilirsiniz!</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>',
 JSON_ARRAY('user_name','amount','new_balance','site_name'),
 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:49:38.000'),

-- password_reset
('da91f94a-bfe1-46b7-83fc-b4152e27c65e',
 'password_reset',
 'Password Reset',
 'Şifre Sıfırlama Talebi - {{site_name}}',
 '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #333; text-align: center;\">Şifre Sıfırlama</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba,</p>\n    <p style=\"color: #666; font-size: 16px;\">Hesabınız için şifre sıfırlama talebi aldık.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;\">\n      <a href=\"{{reset_link}}\" style=\"display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;\">Şifremi Sıfırla</a>\n    </div>\n    <p style=\"color: #666; font-size: 14px;\">Bu linkin geçerlilik süresi 1 saattir.</p>\n    <p style=\"color: #666; font-size: 14px;\">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>',
 JSON_ARRAY('reset_link','site_name'),
 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- order_cancelled
('dd5ecc0c-ab34-499a-8103-7a435472794a',
 'order_cancelled',
 'Order Cancelled',
 'Sipariş İptali - {{site_name}}',
 '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #ef4444; text-align: center;\">Siparişiniz İptal Edildi</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz iptal edildi.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Tutar:</strong> {{final_amount}} TL</p>\n      <p style=\"margin: 0; color: #666;\"><strong>İptal Nedeni:</strong> {{cancellation_reason}}</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Ödemeniz varsa iade işlemi başlatılacaktır.</p>\n    <p style=\"color: #666; font-size: 16px;\">Sorularınız için bizimle iletişime geçebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>',
 JSON_ARRAY('customer_name','order_number','final_amount','cancellation_reason','site_name'),
 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- welcome
('e7fae474-c1cf-4600-8466-2f915146cfb9',
 'welcome',
 'Welcome',
 'Hesabiniz Oluşturuldu - {{site_name}}',
 '<h1 class=\"ql-align-center\">Hesabınız Oluşturuldu</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>{{site_name}} ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p><p><br></p><p>E-posta: <strong>{{user_email}}</strong></p><p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>',
 JSON_ARRAY('user_name','user_email','site_name'),
 1, NULL, '2025-10-09 19:38:58.000', '2025-10-13 15:06:38.000');
