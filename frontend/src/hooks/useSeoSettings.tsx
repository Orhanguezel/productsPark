// =============================================================
// FILE: src/hooks/useSeoSettings.ts
// FINAL — Public site_settings -> flat SiteSettings + SEO fallbacks
// - strict/no-any, exactOptionalPropertyTypes friendly
// - allowedKeys updated to match SEO + misc_robots_social_schema_hreflang_sitemap seeds
// =============================================================

import { useMemo } from 'react';
import { useListSiteSettingsQuery } from '@/integrations/hooks';

import type {
  SiteSetting,
  SiteSettings,
  SiteSettingsPublicListParams,
  JsonLike,
} from '@/integrations/types';

/**
 * SEO ekranında kullanılan subset (+ legacy title/description fallback)
 * NOTE: Bu tip sadece "settings" çıktısı için fallback’li SEO değerlerini taşır.
 */
type SeoSettings = {
  site_title: string;
  site_description: string;

  // Core pages
  seo_home_title: string;
  seo_home_description: string;

  seo_products_title: string;
  seo_products_description: string;

  seo_categories_title: string;
  seo_categories_description: string;

  seo_blog_title: string;
  seo_blog_description: string;

  seo_contact_title: string;
  seo_contact_description: string;

  // Optional pages (standart)
  seo_about_title: string;
  seo_about_description: string;

  seo_campaigns_title: string;
  seo_campaigns_description: string;

  seo_cart_title: string;
  seo_cart_description: string;

  seo_checkout_title: string;
  seo_checkout_description: string;

  seo_login_title: string;
  seo_login_description: string;

  seo_register_title: string;
  seo_register_description: string;

  seo_faq_title: string;
  seo_faq_description: string;

  seo_terms_title: string;
  seo_terms_description: string;

  seo_privacy_title: string;
  seo_privacy_description: string;
  canonical_base_url: string;
};

const defaultSeo: SeoSettings = {
  site_title: 'Dijital Ürün Satış Scripti',
  site_description: 'Dijital Ürün Satış Scripti yazılımı ile dijitalde öne çıkın',

  seo_home_title: 'Dijimins - Dijital Ürünler, Oyun Lisansları ve Yazılım',
  seo_home_description:
    'Dijital ürünler, oyun lisansları ve yazılım çözümleri. Güvenli ödeme, hızlı teslimat ve 7/24 destek.',

  seo_products_title: 'Tüm Ürünler - Dijimins',
  seo_products_description:
    'Tüm dijital ürünleri inceleyin. Hızlı teslimat, güvenli ödeme ve avantajlı fiyatlar.',

  seo_categories_title: 'Tüm Kategoriler - Dijimins',
  seo_categories_description:
    'Kategorilere göre dijital ürünleri keşfedin: oyun, yazılım, abonelik ve daha fazlası.',

  seo_blog_title: 'Blog Yazıları - Dijimins',
  seo_blog_description:
    'Dijital ürünler, yazılım ve oyun dünyası hakkında güncel bilgiler, ipuçları ve rehberler.',

  seo_contact_title: 'Bize Ulaşın - Dijimins',
  seo_contact_description:
    'Sorularınız için bizimle iletişime geçin. Destek ekibimiz size yardımcı olmaktan memnuniyet duyar.',

  seo_about_title: 'Hakkımızda - Dijimins',
  seo_about_description:
    'Dijimins hakkında. Güvenli dijital ürün satışı, hızlı teslimat ve müşteri memnuniyeti odağımızdır.',

  seo_campaigns_title: 'Kampanyalar - Dijimins',
  seo_campaigns_description:
    'Güncel kampanyalar ve fırsatlar. Seçili dijital ürünlerde avantajlı fiyatlar.',

  seo_cart_title: 'Sepet - Dijimins',
  seo_cart_description:
    'Sepetinizdeki ürünleri gözden geçirin ve hızlıca satın alma işlemini tamamlayın.',

  seo_checkout_title: 'Ödeme - Dijimins',
  seo_checkout_description:
    'Güvenli ödeme adımı. Siparişinizi tamamlayın ve teslimat detaylarını görüntüleyin.',

  seo_login_title: 'Giriş Yap - Dijimins',
  seo_login_description: 'Hesabınıza giriş yapın ve siparişlerinizi yönetin.',

  seo_register_title: 'Kayıt Ol - Dijimins',
  seo_register_description:
    'Hızlıca kayıt olun, avantajlardan yararlanın ve siparişlerinizi kolayca takip edin.',

  seo_faq_title: 'Sık Sorulan Sorular - Dijimins',
  seo_faq_description:
    'Ödeme, teslimat ve ürün kullanımı hakkında sık sorulan soruların yanıtları.',

  seo_terms_title: 'Kullanım Şartları - Dijimins',
  seo_terms_description: 'Kullanım şartları ve hizmet koşulları hakkında bilgilendirme.',

  seo_privacy_title: 'Gizlilik Politikası - Dijimins',
  seo_privacy_description:
    'Kişisel verilerin korunması ve gizlilik politikamız hakkında bilgilendirme.',
  canonical_base_url: '',
};

/* ----------------------------- helpers ----------------------------- */

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const toOptStr = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
};

const toOptNum = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const toOptBool = (v: unknown): boolean | undefined => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return undefined;
};

/* ----------------------------- allowed keys + guard ----------------------------- */
/**
 * IMPORTANT:
 * - Buraya eklemediğin key public list endpoint’ten "flat" içine düşmez.
 * - Admin tarafında bulk upsert "tüm key’leri" basabilir ama public okuma whitelist ile ilerliyoruz.
 */
const allowedKeys = [
  // ---------------- SEO pages ----------------
  'site_title',
  'site_description',

  'seo_home_title',
  'seo_home_description',

  'seo_products_title',
  'seo_products_description',

  'seo_categories_title',
  'seo_categories_description',

  'seo_blog_title',
  'seo_blog_description',

  'seo_contact_title',
  'seo_contact_description',

  'seo_about_title',
  'seo_about_description',

  'seo_campaigns_title',
  'seo_campaigns_description',

  'seo_cart_title',
  'seo_cart_description',

  'seo_checkout_title',
  'seo_checkout_description',

  'seo_login_title',
  'seo_login_description',

  'seo_register_title',
  'seo_register_description',

  'seo_faq_title',
  'seo_faq_description',

  'seo_terms_title',
  'seo_terms_description',

  'seo_privacy_title',
  'seo_privacy_description',

  // ---------------- Assets / Brand ----------------
  'favicon_url',
  'logo_url',

  // ---------------- Robots meta/txt ----------------
  'robots_meta',
  'robots_txt_enabled',
  'robots_txt_content',

  // ---------------- Canonical + Hreflang ----------------
  'canonical_base_url',
  'hreflang_enabled',
  'hreflang_locales',

  // ---------------- Social ----------------
  'og_site_name',
  'og_default_image',
  'twitter_site',
  'twitter_card',

  // ---------------- Verification ----------------
  'google_site_verification',
  'bing_site_verification',

  // ---------------- Schema.org ----------------
  'schema_org_enabled',
  'schema_org_organization',
  'schema_org_website',

  // ---------------- Analytics ----------------
  'analytics_ga_id',
  'analytics_gtm_id',
  'facebook_pixel_id',

  // ---------------- Sitemap ----------------
  'sitemap_enabled',
  'sitemap_base_url',
  'sitemap_urls',

  // ---------------- Custom codes ----------------
  'custom_header_code',
  'custom_footer_code',

  // ---------------- Payment / Wallet / Bank ----------------
  'bank_transfer_enabled',
  'bank_account_info',
  'payment_methods',

  // ---------------- Analytics / OAuth / Integrations (existing) ----------------
  'google_client_id',
  'google_client_secret',
  'cloudinary_cloud_name',
  'cloudinary_folder',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudinary_unsigned_preset',
  'facebook_url',
  'twitter_url',
  'instagram_url',
  'linkedin_url',
  'discord_webhook_url',

  // ---------------- SMTP ----------------
  'smtp_host',
  'smtp_port',
  'smtp_ssl',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name',

  // ---------------- Telegram ----------------
  'telegram_bot_token',
  'telegram_chat_id',
  'new_order_telegram',
  'telegram_template_new_order',
] as const satisfies ReadonlyArray<keyof SiteSettings>;

type AllowedKey = (typeof allowedKeys)[number];

const allowedKeySet: ReadonlySet<string> = new Set(allowedKeys as readonly string[]);

function isAllowedKey(k: string): k is AllowedKey {
  return allowedKeySet.has(k);
}

/* ----------------------------- coercion ----------------------------- */

function coerceSettingValue<K extends AllowedKey>(key: K, value: JsonLike): SiteSettings[K] {
  // boolean keys
  const boolKeys: ReadonlySet<AllowedKey> = new Set([
    'bank_transfer_enabled',
    'smtp_ssl',
    'new_order_telegram',
    'robots_txt_enabled',
  ]);

  // number keys
  const numberKeys: ReadonlySet<AllowedKey> = new Set(['smtp_port']);

  // json/object keys
  const objectKeys: ReadonlySet<AllowedKey> = new Set(['payment_methods']);

  // json-as-text lists (stored as text but you may parse later)
  // burada string olarak tutuyoruz; parse eden yerler ayrıca JSON.parse yapar
  const jsonTextKeys: ReadonlySet<AllowedKey> = new Set([
    'hreflang_locales',
    'schema_org_organization',
    'schema_org_website',
    'sitemap_urls',
  ]);

  if (boolKeys.has(key)) {
    const b = toOptBool(value);
    // IMPORTANT: exactOptionalPropertyTypes: boolean | undefined dönebilir
    return (typeof b === 'boolean' ? b : undefined) as SiteSettings[K];
  }

  if (numberKeys.has(key)) {
    const n = toOptNum(value);
    return (n ?? null) as SiteSettings[K];
  }

  if (objectKeys.has(key)) {
    if (value === null) return null as SiteSettings[K];
    if (isObject(value)) return value as SiteSettings[K];
    // json string geldiyse parse etmiyoruz; null’a çekiyoruz
    return null as SiteSettings[K];
  }

  if (jsonTextKeys.has(key)) {
    // DB bazen JSON objeyi already-parsed döndürebilir; string’e normalize edelim
    if (value == null) return null as SiteSettings[K];
    if (typeof value === 'string') return (value.trim() ? value : null) as SiteSettings[K];
    try {
      return JSON.stringify(value) as SiteSettings[K];
    } catch {
      return (String(value) || null) as SiteSettings[K];
    }
  }

  // default: string-like
  return (toOptStr(value) as SiteSettings[K]) ?? (null as SiteSettings[K]);
}

/**
 * SiteSetting[] -> flat SiteSettings
 * IMPORTANT: collector Record kullanıyoruz; SiteSettings üzerinde index yok.
 */
function toFlatSiteSettings(rows: SiteSetting[] | undefined): SiteSettings {
  const bag: Partial<Record<AllowedKey, SiteSettings[AllowedKey]>> = {};
  if (!rows?.length) return bag as SiteSettings;

  for (const row of rows) {
    const keyStr = row.key;
    if (!isAllowedKey(keyStr)) continue;

    const k = keyStr; // AllowedKey
    bag[k] = coerceSettingValue(k, row.value);
  }

  return bag as SiteSettings;
}

/* ----------------------------- hook ----------------------------- */

type UseSeoSettingsArgs = {
  params?: SiteSettingsPublicListParams;
  seoOnly?: boolean;
};

export const useSeoSettings = (args?: UseSeoSettingsArgs) => {
  const seoOnly = args?.seoOnly ?? false;

  const params: SiteSettingsPublicListParams = useMemo(() => {
    if (!seoOnly) return args?.params;

    return {
      ...(args?.params ?? {}),
      keys: [
        // minimum seo keys
        'site_title',
        'site_description',

        'seo_home_title',
        'seo_home_description',

        'seo_products_title',
        'seo_products_description',
        'seo_categories_title',
        'seo_categories_description',
        'seo_blog_title',
        'seo_blog_description',
        'seo_contact_title',
        'seo_contact_description',

        'seo_about_title',
        'seo_about_description',
        'seo_campaigns_title',
        'seo_campaigns_description',
        'seo_cart_title',
        'seo_cart_description',
        'seo_checkout_title',
        'seo_checkout_description',
        'seo_login_title',
        'seo_login_description',
        'seo_register_title',
        'seo_register_description',
        'seo_faq_title',
        'seo_faq_description',
        'seo_terms_title',
        'seo_terms_description',
        'seo_privacy_title',
        'seo_privacy_description',

        // globals seo-related
        'robots_meta',
        'favicon_url',
        'logo_url',
        'og_site_name',
        'og_default_image',
        'twitter_site',
        'twitter_card',
        'google_site_verification',
        'bing_site_verification',
        'schema_org_enabled',
        'schema_org_organization',
        'schema_org_website',
        'analytics_ga_id',
        'analytics_gtm_id',
        'facebook_pixel_id',
        'canonical_base_url',
      ],
    };
  }, [args?.params, seoOnly]);

  const { data, isLoading } = useListSiteSettingsQuery(params);

  const flat = useMemo<SiteSettings>(() => toFlatSiteSettings(data), [data]);

  const settings = useMemo<SeoSettings>(() => {
    const get = (k: keyof SeoSettings): string => {
      const v = (flat as unknown as Record<string, unknown>)[String(k)];
      const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
      // fallback: defaultSeo
      return s ? s : defaultSeo[k];
    };

    return {
      site_title: get('site_title'),
      site_description: get('site_description'),

      seo_home_title: get('seo_home_title'),
      seo_home_description: get('seo_home_description'),

      seo_products_title: get('seo_products_title'),
      seo_products_description: get('seo_products_description'),

      seo_categories_title: get('seo_categories_title'),
      seo_categories_description: get('seo_categories_description'),

      seo_blog_title: get('seo_blog_title'),
      seo_blog_description: get('seo_blog_description'),

      seo_contact_title: get('seo_contact_title'),
      seo_contact_description: get('seo_contact_description'),

      seo_about_title: get('seo_about_title'),
      seo_about_description: get('seo_about_description'),

      seo_campaigns_title: get('seo_campaigns_title'),
      seo_campaigns_description: get('seo_campaigns_description'),

      seo_cart_title: get('seo_cart_title'),
      seo_cart_description: get('seo_cart_description'),

      seo_checkout_title: get('seo_checkout_title'),
      seo_checkout_description: get('seo_checkout_description'),

      seo_login_title: get('seo_login_title'),
      seo_login_description: get('seo_login_description'),

      seo_register_title: get('seo_register_title'),
      seo_register_description: get('seo_register_description'),

      seo_faq_title: get('seo_faq_title'),
      seo_faq_description: get('seo_faq_description'),

      seo_terms_title: get('seo_terms_title'),
      seo_terms_description: get('seo_terms_description'),

      seo_privacy_title: get('seo_privacy_title'),
      seo_privacy_description: get('seo_privacy_description'),
      canonical_base_url: get('canonical_base_url'),
    };
  }, [flat]);

  return {
    settings, // SEO odaklı (fallback’li)
    flat, // SiteSettings (SEO + misc + payment/smtp/integrations dahil)
    loading: isLoading,
  };
};
