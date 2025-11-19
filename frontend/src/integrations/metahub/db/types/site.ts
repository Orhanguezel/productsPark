// =============================================================
// FILE: src/integrations/metahub/db/types/site.ts
// =============================================================

export type ValueType = "string" | "number" | "boolean" | "json";

export type SettingValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>
  | null;

export type SiteSettingRow = {
  id?: string; // opsiyonel; bazı BE'lerde olmayabilir
  key: string;
  value: unknown; // ham değer, normalizer bunu SettingValue'ya indirger
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TopbarSettingRow = {
  id: string;
  is_active: boolean | 0 | 1;
  message: string;
  coupon_code?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

// Email template tablosu FE’de "any" idi — tipe alalım
export type EmailTemplateRow = {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  content: string; // HTML (quill)
  variables: string[]; // ['user_name','site_name',...]
  is_active: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

// =============================================================
// Kanonik SiteSettings tipi (admin/settings + kartlar burada kullanacak)
// =============================================================
export type SiteSettings = {
  site_title: string;
  site_description: string;
  seo_products_title?: string;
  seo_products_description?: string;
  seo_categories_title?: string;
  seo_categories_description?: string;
  seo_blog_title?: string;
  seo_blog_description?: string;
  seo_contact_title?: string;
  seo_contact_description?: string;

  min_balance_limit: number;
  whatsapp_number: string;
  guest_order_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  theme_mode: "user_choice" | "dark_only" | "light_only";
  light_logo: string;
  dark_logo: string;
  favicon_url: string;
  custom_header_code: string;
  custom_footer_code: string;

  // SMTP
  smtp_host: string;
  smtp_port: number;
  smtp_ssl: boolean;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;

  // Admin iletişim maili
  contact_email?: string;

  // Payment (PayTR bridge)
  paytr_enabled: boolean;
  paytr_merchant_id: string;
  paytr_merchant_key: string;
  paytr_merchant_salt: string;
  paytr_test_mode: boolean;
  paytr_commission: number;
  paytr_havale_enabled: boolean;
  paytr_havale_commission: number;

  // Shopier
  shopier_enabled: boolean;
  shopier_client_id: string;
  shopier_client_secret: string;
  shopier_commission: number;

  // Papara
  papara_enabled: boolean;
  papara_api_key: string;

  // Banka Havale / EFT
  bank_transfer_enabled: boolean;
  bank_account_info: string;

  // Analytics & Sosyal
  google_analytics_id: string;
  facebook_pixel_id: string;

  // Bildirimler
  telegram_bot_token: string;
  telegram_chat_id: string;
  new_order_telegram: boolean;
  new_ticket_telegram: boolean;
  deposit_approved_telegram: boolean;
  new_payment_request_telegram: boolean;
  new_deposit_request_telegram?: boolean;
  telegram_template_new_order?: string;
  telegram_template_new_payment_request?: string;
  telegram_template_new_ticket?: string;
  telegram_template_deposit_approved?: string;
  telegram_template_new_deposit_request?: string;
  discord_webhook_url: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;

   // ✅ Google OAuth
  google_client_id: string;
  google_client_secret: string;

  // ✅ Cloudinary / Storage
  cloudinary_cloud_name: string;
  cloudinary_api_key: string;
  cloudinary_api_secret: string;
  cloudinary_folder: string;
  cloudinary_unsigned_preset: string;


  default_currency: string;
  available_currencies: string[];
  currency_rates: { TRY: number; USD: number; EUR: number };
  auto_update_rates: boolean;

  payment_methods?: {
    wallet_enabled?: boolean;
    havale_enabled?: boolean;
    havale_iban?: string;
    havale_account_holder?: string;
    havale_bank_name?: string;
    eft_enabled?: boolean;
    eft_iban?: string;
    eft_account_holder?: string;
    eft_bank_name?: string;
  };

  // Footer basic
  footer_company_name?: string;
  footer_description?: string;
  footer_copyright?: string;
  footer_email?: string;
  footer_phone?: string;
  footer_address?: string;
};
