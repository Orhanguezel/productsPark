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
import { metahub } from "@/integrations/metahub/client";

import GeneralSettingsCard from "./GeneralSettingsCard";
import SeoSettingsCard from "./SeoSettingsCard";
import SmtpSettingsCard from "./SmtpSettingsCard";
import EmailTemplatesManager from "./EmailTemplatesManager";
import PaymentSettingsCard from "./PaymentSettingsCard";
import TelegramSettingsCard from "./TelegramSettingsCard";
import IntegrationsSettingsCard from "./IntegrationsSettingsCard";
import PopupManagement from "../PopupManagement";
import TopbarManagement from "./TopbarManagement";
import FooterSettingsCard from "./FooterSettingsCard";

// PUBLIC (key ile provider çekmek için)
import { useGetPaymentProviderByKeyQuery } from "@/integrations/metahub/rtk/endpoints/payment_providers.endpoints";

// ADMIN (id ile detay ve update)
import {
  useGetPaymentProviderAdminByIdQuery,
  useUpdatePaymentProviderAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/payment_providers_admin.endpoints";

// ------------------ Types ------------------
interface SiteSettings {
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
  smtp_host: string;
  smtp_port: number;
  smtp_ssl: boolean;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  // Payment (provider üzerinden saklanan alanlarla köprü)
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
  // Banka Transfer
  bank_transfer_enabled: boolean;
  bank_account_info: string;
  // Analytics & Sosyal
  google_analytics_id: string;
  facebook_pixel_id: string;
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
}

const defaultSettings: SiteSettings = {
  site_title: "",
  site_description: "",
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
  smtp_host: "",
  smtp_port: 465,
  smtp_ssl: true,
  smtp_username: "",
  smtp_password: "",
  smtp_from_email: "",
  smtp_from_name: "",
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
  // analytics & sosyal
  google_analytics_id: "",
  facebook_pixel_id: "",
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
  discord_webhook_url: "",
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
  linkedin_url: "",
  default_currency: "TRY",
  available_currencies: ["TRY", "USD", "EUR"],
  currency_rates: { TRY: 1, USD: 0.031, EUR: 0.029 },
  auto_update_rates: false,
};

const PAYTR_KEY = "paytr" as const;
const PAYTR_SITESETTING_PREFIX = "paytr_"; // site_settings’a YAZMAYACAĞIZ

const bool = (v: unknown) => v === true || v === "true" || v === 1 || v === "1";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Provider (PayTR)
  const { data: paytrPublic } = useGetPaymentProviderByKeyQuery(PAYTR_KEY);
  const paytrId = paytrPublic?.id;
  const { data: paytrAdmin } = useGetPaymentProviderAdminByIdQuery(paytrId!, { skip: !paytrId });
  const [updatePaytr, { isLoading: savingPaytr }] = useUpdatePaymentProviderAdminMutation();

  const origin = useMemo(() => (typeof window !== "undefined" ? window.location.origin : ""), []);

  useEffect(() => { void fetchSettings(); }, []);

  // Provider → UI state (any yok)
  useEffect(() => {
    if (!paytrAdmin) return;
    const pub = (paytrAdmin.public_config ?? {}) as Record<string, unknown>;
    const sec = (paytrAdmin.secret_config ?? {}) as Record<string, unknown>;

    setSettings((prev) => ({
      ...prev,
      paytr_enabled: bool(pub.enabled),
      paytr_test_mode: pub.test_mode === undefined ? true : bool(pub.test_mode),
      paytr_commission:
        typeof pub.card_commission === "number"
          ? pub.card_commission
          : Number(pub.card_commission ?? 0) || 0,
      paytr_havale_enabled: bool(pub.havale_enabled),
      paytr_havale_commission:
        typeof pub.havale_commission === "number"
          ? pub.havale_commission
          : Number(pub.havale_commission ?? 0) || 0,
      paytr_merchant_id: typeof sec.merchant_id === "string" ? sec.merchant_id : String(sec.merchant_id ?? ""),
      paytr_merchant_key: typeof sec.merchant_key === "string" ? sec.merchant_key : String(sec.merchant_key ?? ""),
      paytr_merchant_salt: typeof sec.merchant_salt === "string" ? sec.merchant_salt : String(sec.merchant_salt ?? ""),
    }));
  }, [paytrAdmin]);

  async function fetchSettings() {
    try {
      setLoading(true);
      const { data, error } = await metahub.from("site_settings").select("*");
      if (error) throw error;

      if (data && data.length > 0) {
        const obj = data.reduce((acc: Record<string, unknown>, item: { key: string; value: unknown }) => {
          if (typeof item?.key === "string" && item.key.startsWith("telegram_template_") && typeof item.value === "object" && item.value !== null) {
            acc[item.key] = (item.value as { template?: string }).template || "";
          } else {
            acc[item.key] = item.value as unknown;
          }
          return acc;
        }, {});
        setSettings({ ...defaultSettings, ...(obj as Partial<SiteSettings>) });
      }
    } catch (e) {
      console.error(e);
      toast.error("Ayarlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  const toPersistable = (v: unknown): string | number | boolean | null => {
    if (v == null) return null;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") return v as string | number | boolean;
    try { return JSON.stringify(v); } catch { return String(v); }
  };

  type ValueType = "string" | "number" | "boolean" | "json" | null;
  const guessType = (v: unknown): ValueType => {
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
          await updatePaytr({ id: paytrId, body: buildPaytrUpdateBody(settings) }).unwrap();
        } catch (err) {
          const e = err as { data?: { message?: string }; message?: string };
          toast.error("PayTR kaydedilemedi: " + (e?.data?.message || e?.message || "Hata"));
        }
      }

      // 2) site_settings (PayTR prefix’li anahtarları hariç tut)
      await metahub.from("site_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = Object.entries(settings)
        .filter(([k]) => !k.startsWith(PAYTR_SITESETTING_PREFIX))
        .map(([key, value]) => ({ key, value: toPersistable(value), value_type: guessType(value) }));

      const { error } = await metahub.from("site_settings").insert(rows);
      if (error) throw error;

      toast.success("Ayarlar kaydedildi");
    } catch (e) {
      console.error(e);
      const msg = (e as { message?: string })?.message || "Ayarlar kaydedilirken hata oluştu";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Ayarlar">
        <div className="flex items-center justify-center py-8"><p>Yükleniyor...</p></div>
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
          <GeneralSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <SeoSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="smtp" className="space-y-4">
          <SmtpSettingsCard settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="email-templates" className="space-y-4">
          <EmailTemplatesManager />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <PaymentSettingsCard settings={settings} setSettings={setSettings} origin={origin} savingProvider={savingPaytr} />
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <TelegramSettingsCard settings={settings} setSettings={setSettings} />
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
        <Button onClick={handleSaveAll} disabled={saving || savingPaytr} className="gap-2">
          <Save className="w-4 h-4" />
          {saving || savingPaytr ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}
        </Button>
      </div>
    </AdminLayout>
  );
}
