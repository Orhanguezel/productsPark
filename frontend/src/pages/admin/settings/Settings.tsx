// =============================================================
// FILE: src/pages/admin/settings/index.tsx
// FINAL — Settings Page (SEO split: Pages vs Global)
// - Telegram bool keys persisted as 'true' | 'false' strings
// - Adds SEO Global/Misc keys (robots, analytics, social, schema, hreflang, sitemap, assets)
// - İletişim + Sosyal Medya tab'ı eklendi
// =============================================================
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import GeneralSettingsCard from './components/GeneralSettingsCard';
import SeoSettingsCard from './components/SeoSettingsCard';
import SeoGlobalSettingsCard from './components/SeoGlobalSettingsCard';
import SmtpSettingsCard from './components/SmtpSettingsCard';
import IntegrationsSettingsCard from './components/IntegrationsSettingsCard';
import ContactSettingsCard from './components/Contactsettingscard';
import PopupManagement from '../PopupManagement';
import TopbarManagement from './components/TopbarManagement';
import FooterSettingsCard from './components/FooterSettingsCard';

import {
  useGetPaymentProviderByKeyQuery,
  useGetPaymentProviderAdminByIdQuery,
  useUpdatePaymentProviderAdminMutation,
  useBulkUpsertSiteSettingsAdminMutation,
  useListSiteSettingsAdminQuery,
} from '@/integrations/hooks';

import type { ValueType, AdminSiteSetting, UpsertSiteSettingBody } from '@/integrations/types';

// ------------------ Defaults (UI Form Model) ------------------

const defaultSettings = {
  // ---------------- SEO base ----------------
  site_title: '',
  site_description: '',

  // ---------------- SEO pages ----------------
  seo_home_title: '',
  seo_home_description: '',
  seo_blog_title: '',
  seo_blog_description: '',
  seo_products_title: '',
  seo_products_description: '',
  seo_categories_title: '',
  seo_categories_description: '',
  seo_contact_title: '',
  seo_contact_description: '',
  seo_about_title: '',
  seo_about_description: '',
  seo_campaigns_title: '',
  seo_campaigns_description: '',
  seo_cart_title: '',
  seo_cart_description: '',
  seo_checkout_title: '',
  seo_checkout_description: '',
  seo_login_title: '',
  seo_login_description: '',
  seo_register_title: '',
  seo_register_description: '',
  seo_faq_title: '',
  seo_faq_description: '',
  seo_terms_title: '',
  seo_terms_description: '',
  seo_privacy_title: '',
  seo_privacy_description: '',

  // ---------------- SEO global / misc ----------------
  favicon_url: '',
  logo_url: '',

  robots_meta: 'index,follow',
  robots_txt_enabled: false,
  robots_txt_content: '',

  canonical_base_url: '',
  hreflang_enabled: false,
  hreflang_locales: '[]',

  og_site_name: '',
  og_default_image: '',
  twitter_site: '',
  twitter_card: 'summary_large_image',

  google_site_verification: '',
  bing_site_verification: '',

  schema_org_enabled: false,
  schema_org_organization: '',
  schema_org_website: '',

  analytics_ga_id: '',
  analytics_gtm_id: '',
  facebook_pixel_id: '',

  sitemap_enabled: true,
  sitemap_base_url: '',
  sitemap_urls: '[]',

  custom_header_code: '',
  custom_footer_code: '',

  // ---------------- General ----------------
  min_balance_limit: 10,
  whatsapp_number: '',
  guest_order_enabled: false,
  maintenance_mode: false,
  maintenance_message: '',
  theme_mode: 'user_choice' as 'user_choice' | 'light' | 'dark',
  light_logo: '',
  dark_logo: '',

  // ---------------- SMTP ----------------
  smtp_host: '',
  smtp_port: 465,
  smtp_ssl: true,
  smtp_username: '',
  smtp_password: '',
  smtp_from_email: '',
  smtp_from_name: '',
  contact_email: '',

  // ---------------- paytr (provider) ----------------
  paytr_enabled: false,
  paytr_merchant_id: '',
  paytr_merchant_key: '',
  paytr_merchant_salt: '',
  paytr_test_mode: true,
  paytr_commission: 0,
  paytr_havale_enabled: false,
  paytr_havale_commission: 0,

  // ---------------- shopier ----------------
  shopier_enabled: false,
  shopier_client_id: '',
  shopier_client_secret: '',
  shopier_commission: 0,

  // ---------------- papara ----------------
  papara_enabled: false,
  papara_api_key: '',

  // ---------------- bank transfer ----------------
  bank_transfer_enabled: false,
  bank_account_info: '',

  // ---------------- Social links / Integrations ----------------
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  linkedin_url: '',
  youtube_url: '',
  telegram_channel_url: '',
  discord_webhook_url: '',

  // Google OAuth
  google_client_id: '',
  google_client_secret: '',

  // Cloudinary
  cloudinary_cloud_name: '',
  cloudinary_api_key: '',
  cloudinary_api_secret: '',
  cloudinary_folder: '',
  cloudinary_unsigned_preset: '',

  deposit_approved_telegram: 'false' as 'true' | 'false',
  new_deposit_request_telegram: 'false' as 'true' | 'false',
  new_payment_request_telegram: 'false' as 'true' | 'false',
  new_order_telegram: 'false' as 'true' | 'false',
  new_ticket_telegram: 'false' as 'true' | 'false',
  ticket_replied_telegram: 'false' as 'true' | 'false',

  // Currency vs...
  default_currency: 'TRY',
  available_currencies: ['TRY', 'USD', 'EUR'] as string[],
  currency_rates: { TRY: 1, USD: 0.031, EUR: 0.029 } as Record<string, number>,
  auto_update_rates: false,
  payment_methods: undefined as unknown,

  // Footer
  footer_company_name: '',
  footer_description: '',
  footer_copyright: '',
  footer_email: '',
  footer_phone: '',
  footer_address: '',
};

const SEO_BOOL_KEYS = new Set<string>([
  'robots_txt_enabled',
  'hreflang_enabled',
  'schema_org_enabled',
  'sitemap_enabled',
]);
const TELEGRAM_BOOL_KEYS = new Set<string>([
  'deposit_approved_telegram',
  'new_deposit_request_telegram',
  'new_payment_request_telegram',
  'new_order_telegram',
  'new_ticket_telegram',
  'ticket_replied_telegram',
]);

type SettingsFormModel = typeof defaultSettings;
type SettingsKey = keyof SettingsFormModel;

const PAYTR_KEY = 'paytr' as const;
const PAYTR_SITESETTING_PREFIX = 'paytr_';

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const isSettingsKey = (k: string): k is SettingsKey =>
  Object.prototype.hasOwnProperty.call(defaultSettings, k);

const setSetting = <K extends SettingsKey>(
  obj: Partial<SettingsFormModel>,
  key: K,
  value: SettingsFormModel[K],
) => {
  obj[key] = value;
};

const toBoolish = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return false;
};

const boolToDb = (b: boolean): 'true' | 'false' => (b ? 'true' : 'false');

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsFormModel>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const {
    data: siteSettingsRows,
    isLoading: loadingSettings,
    isFetching: fetchingSettings,
  } = useListSiteSettingsAdminQuery();

  // Provider (PayTR)
  const { data: paytrPublic } = useGetPaymentProviderByKeyQuery(PAYTR_KEY);
  const paytrId = paytrPublic?.id ?? null;

  const { data: paytrAdmin } = useGetPaymentProviderAdminByIdQuery(paytrId as string, {
    skip: !paytrId,
  });

  const [updatePaytr, { isLoading: savingPaytr }] = useUpdatePaymentProviderAdminMutation();
  const [bulkUpsert, { isLoading: savingSiteSettings }] = useBulkUpsertSiteSettingsAdminMutation();

  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), []);

  // rows -> settings (ilk yüklemede)
  useEffect(() => {
    if (!siteSettingsRows || initialized) return;

    const obj: Partial<SettingsFormModel> = {};

    for (const item of siteSettingsRows as AdminSiteSetting[]) {
      const rawKey = String(item.key ?? '');
      if (!isSettingsKey(rawKey)) continue;

      let val: unknown = item.value;

      // Eski dump: telegram_template_* { template: string }
      if (rawKey.startsWith('telegram_template_') && isObject(val) && 'template' in val) {
        val = (val as { template?: unknown }).template ?? '';
      }

      setSetting(obj, rawKey, val as SettingsFormModel[typeof rawKey]);
    }

    setSettings({
      ...defaultSettings,
      ...obj,
    });

    setInitialized(true);
  }, [siteSettingsRows, initialized]);

  // Provider -> UI state (PayTR)
  useEffect(() => {
    if (!paytrAdmin) return;

    const pub = (paytrAdmin.public_config ?? {}) as Record<string, unknown>;
    const sec = (paytrAdmin.secret_config ?? {}) as Record<string, unknown>;

    setSettings((prev) => ({
      ...prev,
      paytr_enabled: toBoolish(pub.enabled),
      paytr_test_mode: pub.test_mode === undefined ? true : toBoolish(pub.test_mode),
      paytr_commission: Number(pub.card_commission ?? pub.commission ?? 0) || 0,
      paytr_havale_enabled: toBoolish(pub.havale_enabled),
      paytr_havale_commission: Number(pub.havale_commission ?? 0) || 0,
      paytr_merchant_id: String(sec.merchant_id ?? ''),
      paytr_merchant_key: String(sec.merchant_key ?? ''),
      paytr_merchant_salt: String(sec.merchant_salt ?? ''),
    }));
  }, [paytrAdmin]);

  const toPersistable = (key: string, v: unknown): string | number | boolean | null => {
    if (v == null) return null;

    // ✅ Telegram bool + SEO bool => DB'ye her zaman 'true'|'false' yaz
    if (TELEGRAM_BOOL_KEYS.has(key) || SEO_BOOL_KEYS.has(key)) {
      return boolToDb(toBoolish(v));
    }

    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') return v as string | number | boolean;

    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  const guessType = (key: string, v: unknown): ValueType | null => {
    if (v == null) return null;

    // ✅ bool key'ler string persist edildiği için type='string'
    if (TELEGRAM_BOOL_KEYS.has(key) || SEO_BOOL_KEYS.has(key)) return 'string';

    const t = typeof v;
    if (t === 'string') return 'string';
    if (t === 'number') return 'number';
    if (t === 'boolean') return 'boolean';
    return 'json';
  };

  const buildPaytrUpdateBody = (s: SettingsFormModel) => {
    const existing =
      paytrAdmin && typeof paytrAdmin.public_config === 'object' ? paytrAdmin.public_config : {};

    const pickExisting = (keys: string[]): string | undefined => {
      for (const k of keys) {
        const v = (existing as Record<string, unknown>)[k];
        const s2 = typeof v === 'string' ? v.trim() : '';
        if (s2) return s2;
      }
      return undefined;
    };

    const ok_url = pickExisting(['ok_url', 'okUrl', 'merchant_ok_url', 'MERCHANT_OK_URL']);
    const fail_url = pickExisting([
      'fail_url',
      'failUrl',
      'merchant_fail_url',
      'MERCHANT_FAIL_URL',
    ]);
    const notification_url = pickExisting([
      'notification_url',
      'notificationUrl',
      'notify_url',
      'NOTIFICATION_URL',
    ]);
    const type = pickExisting(['type']);
    const mode = pickExisting(['mode']);

    const cardCommission = Number(s.paytr_commission || 0);

    const secret = {
      merchant_id: s.paytr_merchant_id?.trim() || '',
      merchant_key: s.paytr_merchant_key?.trim() || '',
      merchant_salt: s.paytr_merchant_salt?.trim() || '',
    };
    const hasSecret = Object.values(secret).some((v) => typeof v === 'string' && v.length > 0);

    return {
      public_config: {
        enabled: !!s.paytr_enabled,
        test_mode: s.paytr_test_mode !== false,
        commission: cardCommission,
        card_commission: cardCommission,
        havale_enabled: !!s.paytr_havale_enabled,
        havale_commission: Number(s.paytr_havale_commission || 0),
        ...(ok_url ? { ok_url } : {}),
        ...(fail_url ? { fail_url } : {}),
        ...(notification_url ? { notification_url } : {}),
        ...(type ? { type } : {}),
        ...(mode ? { mode } : {}),
      },
      ...(hasSecret ? { secret_config: secret } : {}),
    };
  };

  async function handleSaveAll() {
    try {
      setSaving(true);

      // 1) PayTR provider (varsa)
      if (paytrId) {
        try {
          await updatePaytr({ id: paytrId, body: buildPaytrUpdateBody(settings) }).unwrap();
        } catch (err) {
          const e = err as { data?: { message?: string }; message?: string };
          toast.error('PayTR kaydedilemedi: ' + (e?.data?.message || e?.message || 'Hata'));
        }
      }

      // 2) site_settings — admin bulk upsert
      const items: UpsertSiteSettingBody[] = Object.entries(settings)
        .filter(([k]) => !k.startsWith(PAYTR_SITESETTING_PREFIX))
        .map(([key, value]) => ({
          key,
          value: toPersistable(key, value),
          value_type: guessType(key, value),
          group: null,
          description: null,
        }));

      await bulkUpsert({ items }).unwrap();
      toast.success('Ayarlar kaydedildi');
    } catch (e: any) {
      console.error(e);
      toast.error((e as { message?: string })?.message || 'Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  }

  const initialLoading = !initialized && (loadingSettings || fetchingSettings);
  const savingAny = saving || savingPaytr || savingSiteSettings;

  if (initialLoading) {
    return (
      <AdminLayout title="Ayarlar">
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Ayarlar">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="contact">İletişim</TabsTrigger>

          <TabsTrigger value="seo-pages">SEO Sayfalar</TabsTrigger>
          <TabsTrigger value="seo-global">SEO Global</TabsTrigger>

          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
          <TabsTrigger value="popups">Popuplar</TabsTrigger>
          <TabsTrigger value="topbar">Topbar</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <ContactSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="seo-pages" className="space-y-4">
          <SeoSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="seo-global" className="space-y-4">
          <SeoGlobalSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="smtp" className="space-y-4">
          <SmtpSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="popups" className="space-y-4">
          <PopupManagement />
        </TabsContent>

        <TabsContent value="topbar" className="space-y-4">
          <TopbarManagement />
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <FooterSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSaveAll} disabled={savingAny} className="gap-2">
          <Save className="w-4 h-4" />
          {savingAny ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
        </Button>
      </div>
    </AdminLayout>
  );
}
