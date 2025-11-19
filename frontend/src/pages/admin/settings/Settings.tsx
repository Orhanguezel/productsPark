// =============================================================
// FILE: src/pages/admin/settings/index.tsx
// =============================================================
"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

import GeneralSettingsCard from "./components/GeneralSettingsCard";
import SeoSettingsCard from "./components/SeoSettingsCard";
import SmtpSettingsCard from "./components/SmtpSettingsCard";
import EmailTemplatesManager from "./components/EmailTemplatesManager";
import PaymentSettingsCard from "./components/PaymentSettingsCard";
import TelegramSettingsCard from "./components/TelegramSettingsCard";
import IntegrationsSettingsCard from "./components/IntegrationsSettingsCard";
import PopupManagement from "../PopupManagement";
import TopbarManagement from "./components/TopbarManagement";
import FooterSettingsCard from "./components/FooterSettingsCard";

// PUBLIC (key ile provider çekmek için)
import { useGetPaymentProviderByKeyQuery } from "@/integrations/metahub/rtk/endpoints/payment_providers.endpoints";

// ADMIN (id ile detay ve update)
import {
  useGetPaymentProviderAdminByIdQuery,
  useUpdatePaymentProviderAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/payment_providers_admin.endpoints";

import {
  useBulkUpsertSiteSettingsAdminMutation,
  useListSiteSettingsAdminQuery,
} from "@/integrations/metahub/rtk/endpoints/admin/site_settings_admin.endpoints";

import type {
  SiteSettings,
  ValueType,
} from "@/integrations/metahub/db/types/site";

// ------------------ Defaults ------------------

const defaultSettings: SiteSettings = {
  site_title: "",
  site_description: "",

  seo_products_title: "",
  seo_products_description: "",
  seo_categories_title: "",
  seo_categories_description: "",
  seo_blog_title: "",
  seo_blog_description: "",
  seo_contact_title: "",
  seo_contact_description: "",

  min_balance_limit: 10,
  whatsapp_number: "",
  guest_order_enabled: false,
  maintenance_mode: false,
  maintenance_message: "",
  theme_mode: "user_choice",
  light_logo: "",
  dark_logo: "",
  favicon_url: "",
  custom_header_code: "",
  custom_footer_code: "",

  // SMTP default
  smtp_host: "",
  smtp_port: 465,
  smtp_ssl: true,
  smtp_username: "",
  smtp_password: "",
  smtp_from_email: "",
  smtp_from_name: "",
  contact_email: "",

  // paytr köprü (provider)
  paytr_enabled: false,
  paytr_merchant_id: "",
  paytr_merchant_key: "",
  paytr_merchant_salt: "",
  paytr_test_mode: true,
  paytr_commission: 0,
  paytr_havale_enabled: false,
  paytr_havale_commission: 0,

  // shopier
  shopier_enabled: false,
  shopier_client_id: "",
  shopier_client_secret: "",
  shopier_commission: 0,

  // papara
  papara_enabled: false,
  papara_api_key: "",

  // bank transfer
  bank_transfer_enabled: false,
  bank_account_info: "",

  // 🔍 Analytics & sosyal
  google_analytics_id: "",
  facebook_pixel_id: "",
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
  linkedin_url: "",
  discord_webhook_url: "",

  // ✅ Google OAuth (site_settings’ten gelecek)
  google_client_id: "",
  google_client_secret: "",

  // ✅ Cloudinary / Dosya Yükleme
  cloudinary_cloud_name: "",
  cloudinary_api_key: "",
  cloudinary_api_secret: "",
  cloudinary_folder: "",
  cloudinary_unsigned_preset: "",

  telegram_bot_token: "",
  telegram_chat_id: "",
  new_order_telegram: false,
  new_ticket_telegram: false,
  deposit_approved_telegram: false,
  new_payment_request_telegram: false,
  new_deposit_request_telegram: false,
  telegram_template_new_order: "🛒 *Yeni Sipariş Alındı!*",
  telegram_template_new_payment_request: "💳 *Yeni Ödeme Talebi!*",
  telegram_template_new_ticket: "🎫 *Yeni Destek Talebi Açıldı!*",
  telegram_template_deposit_approved: "💰 *Bakiye Yükleme Onaylandı!*",
  telegram_template_new_deposit_request: "💰 *Yeni Bakiye Yükleme Talebi!*",

  default_currency: "TRY",
  available_currencies: ["TRY", "USD", "EUR"],
  currency_rates: { TRY: 1, USD: 0.031, EUR: 0.029 },
  auto_update_rates: false,
  payment_methods: undefined,

  footer_company_name: "",
  footer_description: "",
  footer_copyright: "",
  footer_email: "",
  footer_phone: "",
  footer_address: "",
};


const PAYTR_KEY = "paytr" as const;
const PAYTR_SITESETTING_PREFIX = "paytr_";

const bool = (v: unknown) =>
  v === true || v === "true" || v === 1 || v === "1";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Site settings (RTK üzerinden)
  const {
    data: siteSettingsRows,
    isLoading: loadingSettings,
    isFetching: fetchingSettings,
  } = useListSiteSettingsAdminQuery();

  // Provider (PayTR)
  const { data: paytrPublic } = useGetPaymentProviderByKeyQuery(PAYTR_KEY);
  const paytrId = paytrPublic?.id;
  const { data: paytrAdmin } = useGetPaymentProviderAdminByIdQuery(paytrId!, {
    skip: !paytrId,
  });
  const [updatePaytr, { isLoading: savingPaytr }] =
    useUpdatePaymentProviderAdminMutation();

  // Site settings bulk upsert
  const [bulkUpsert, { isLoading: savingSiteSettings }] =
    useBulkUpsertSiteSettingsAdminMutation();

  const origin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    [],
  );

  // RTK'dan gelen site_settings → local settings (ilk yüklemede)
  useEffect(() => {
    if (!siteSettingsRows || initialized) return;

    const obj: Partial<SiteSettings> = {};

    for (const item of siteSettingsRows) {
      const key = item.key as keyof SiteSettings;
      let val: unknown = item.value;

      // Eski sürümde telegram template'ler { template: string } şeklindeyse
      if (
        typeof item.key === "string" &&
        item.key.startsWith("telegram_template_") &&
        val &&
        typeof val === "object" &&
        "template" in (val as Record<string, unknown>)
      ) {
        val = (val as { template?: string }).template ?? "";
      }

      // SiteSettings içinde tanımlı key ise at
      if (key in defaultSettings) {
        (obj as any)[key] = val;
      }
    }

    setSettings({
      ...defaultSettings,
      ...obj,
    });
    setInitialized(true);
  }, [siteSettingsRows, initialized]);

  // Provider → UI state
  useEffect(() => {
    if (!paytrAdmin) return;
    const pub = (paytrAdmin.public_config ?? {}) as Record<string, unknown>;
    const sec = (paytrAdmin.secret_config ?? {}) as Record<string, unknown>;

    setSettings((prev) => ({
      ...prev,
      paytr_enabled: bool(pub.enabled),
      paytr_test_mode:
        pub.test_mode === undefined ? true : bool(pub.test_mode),
      paytr_commission:
        typeof pub.card_commission === "number"
          ? pub.card_commission
          : Number(pub.card_commission ?? 0) || 0,
      paytr_havale_enabled: bool(pub.havale_enabled),
      paytr_havale_commission:
        typeof pub.havale_commission === "number"
          ? pub.havale_commission
          : Number(pub.havale_commission ?? 0) || 0,
      paytr_merchant_id:
        typeof sec.merchant_id === "string"
          ? sec.merchant_id
          : String(sec.merchant_id ?? ""),
      paytr_merchant_key:
        typeof sec.merchant_key === "string"
          ? sec.merchant_key
          : String(sec.merchant_key ?? ""),
      paytr_merchant_salt:
        typeof sec.merchant_salt === "string"
          ? sec.merchant_salt
          : String(sec.merchant_salt ?? ""),
    }));
  }, [paytrAdmin]);

  const toPersistable = (
    v: unknown,
  ): string | number | boolean | null => {
    if (v == null) return null;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") {
      return v as string | number | boolean;
    }
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  const guessType = (v: unknown): ValueType | null => {
    if (v == null) return null;
    const t = typeof v;
    if (t === "string") return "string";
    if (t === "number") return "number";
    if (t === "boolean") return "boolean";
    return "json";
  };

  const buildPaytrUpdateBody = (s: SiteSettings) => ({
    public_config: {
      enabled: !!s.paytr_enabled,
      test_mode: s.paytr_test_mode !== false,
      card_commission: Number(s.paytr_commission || 0),
      havale_enabled: !!s.paytr_havale_enabled,
      havale_commission: Number(s.paytr_havale_commission || 0),
    },
    secret_config: {
      merchant_id: s.paytr_merchant_id?.trim() || "",
      merchant_key: s.paytr_merchant_key?.trim() || "",
      merchant_salt: s.paytr_merchant_salt?.trim() || "",
    },
  });

  async function handleSaveAll() {
    try {
      setSaving(true);

      // 1) PayTR provider (varsa)
      if (paytrId) {
        try {
          await updatePaytr({
            id: paytrId,
            body: buildPaytrUpdateBody(settings),
          }).unwrap();
        } catch (err) {
          const e = err as {
            data?: { message?: string };
            message?: string;
          };
          toast.error(
            "PayTR kaydedilemedi: " +
              (e?.data?.message || e?.message || "Hata"),
          );
        }
      }

      // 2) site_settings — admin bulk upsert
      const items = Object.entries(settings)
        // PayTR için site_settings kullanmıyoruz
        .filter(([k]) => !k.startsWith(PAYTR_SITESETTING_PREFIX))
        .map(([key, value]) => ({
          key,
          value: toPersistable(value),
          value_type: guessType(value),
          group: null as string | null,
          description: null as string | null,
        }));

      await bulkUpsert({ items }).unwrap();

      toast.success("Ayarlar kaydedildi");
    } catch (e) {
      console.error(e);
      const msg =
        (e as { message?: string })?.message ||
        "Ayarlar kaydedilirken hata oluştu";
      toast.error(msg);
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
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="email-templates">Mail Şablonları</TabsTrigger>
          <TabsTrigger value="payment">Ödeme</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
          <TabsTrigger value="popups">Popuplar</TabsTrigger>
          <TabsTrigger value="topbar">Topbar</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsCard
            settings={settings}
            setSettings={setSettings}
          />
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <SeoSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="smtp" className="space-y-4">
          <SmtpSettingsCard
            settings={settings}
            setSettings={setSettings}
          />
        </TabsContent>

        <TabsContent value="email-templates" className="space-y-4">
          <EmailTemplatesManager />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <PaymentSettingsCard
            settings={settings}
            setSettings={setSettings}
            origin={origin}
            savingProvider={savingPaytr}
          />
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <TelegramSettingsCard
            settings={settings}
            setSettings={setSettings}
          />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsSettingsCard
            settings={settings}
            setSettings={setSettings}
          />
        </TabsContent>

        <TabsContent value="popups" className="space-y-4">
          <PopupManagement />
        </TabsContent>

        <TabsContent value="topbar" className="space-y-4">
          <TopbarManagement />
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <FooterSettingsCard
            settings={settings}
            setSettings={setSettings}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSaveAll}
          disabled={savingAny}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {savingAny ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}
        </Button>
      </div>
    </AdminLayout>
  );
}
