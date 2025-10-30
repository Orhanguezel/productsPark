import { useEffect, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TopbarManagement } from "@/components/admin/TopbarManagement";
import PopupManagement from "./admin/PopupManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { TestSmtpResult } from "@/integrations/metahub/core/public-api";

// ⬇️ RTK Admin endpoints for payment providers
import {
  useListPaymentProvidersAdminQuery,
  useCreatePaymentProviderAdminMutation,
  useUpdatePaymentProviderAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/payment_providers_admin.endpoints";

// -------------------------------------------------
// Types
// -------------------------------------------------
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
  stripe_enabled: boolean; // legacy (site_settings)
  stripe_public_key: string; // legacy
  stripe_secret_key: string; // legacy
  // legacy PayTR/Shopier alanları schema uyumu için tutuluyor ama kullanılmıyor
  paytr_enabled: boolean;
  paytr_merchant_id: string;
  paytr_merchant_key: string;
  paytr_merchant_salt: string;
  paytr_test_mode: boolean;
  paytr_commission: number;
  paytr_havale_enabled: boolean;
  paytr_havale_commission: number;
  shopier_enabled: boolean;
  shopier_client_id: string;
  shopier_client_secret: string;
  shopier_commission: number;

  papara_enabled: boolean; // legacy
  papara_api_key: string; // legacy
  bank_transfer_enabled: boolean; // legacy
  bank_account_info: string; // legacy
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
  stripe_enabled: false,
  stripe_public_key: "",
  stripe_secret_key: "",
  // legacy (kullanılmayacak)
  paytr_enabled: false,
  paytr_merchant_id: "",
  paytr_merchant_key: "",
  paytr_merchant_salt: "",
  paytr_test_mode: true,
  paytr_commission: 0,
  paytr_havale_enabled: false,
  paytr_havale_commission: 0,
  shopier_enabled: false,
  shopier_client_id: "",
  shopier_client_secret: "",
  shopier_commission: 0,
  papara_enabled: false,
  papara_api_key: "",
  bank_transfer_enabled: false,
  bank_account_info: "",
  google_analytics_id: "",
  facebook_pixel_id: "",
  telegram_bot_token: "",
  telegram_chat_id: "",
  new_order_telegram: false,
  new_ticket_telegram: false,
  deposit_approved_telegram: false,
  new_payment_request_telegram: false,
  new_deposit_request_telegram: false,
  telegram_template_new_order:
    '🛒 *Yeni Sipariş Alındı!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Toplam Tutar: {{final_amount}} TL\n{{discount}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Sipariş Tarihi: {{created_at}}',
  telegram_template_new_payment_request:
    '💳 *Yeni Ödeme Talebi!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Talep Tarihi: {{created_at}}',
  telegram_template_new_ticket:
    '🎫 *Yeni Destek Talebi Açıldı!*\n\n👤 Kullanıcı: {{user_name}}\n📋 Konu: {{subject}}\n📊 Öncelik: {{priority}}\n{{category}}\n\n💬 Mesaj:\n{{message}}\n\n⏰ Talep Tarihi: {{created_at}}',
  telegram_template_deposit_approved:
    '💰 *Bakiye Yükleme Onaylandı!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n\n⏰ Onay Tarihi: {{created_at}}',
  telegram_template_new_deposit_request:
    '💰 *Yeni Bakiye Yükleme Talebi!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n⏰ Talep Tarihi: {{created_at}}',
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

// -------------------------------------------------
// Helper types & utils
// -------------------------------------------------
type UnknownRecord = Record<string, unknown>;
const asRecord = (x: unknown): UnknownRecord => (x && typeof x === "object" ? (x as UnknownRecord) : {});
const toStr = (v: unknown, d = ""): string => (typeof v === "string" ? v : v == null ? d : String(v));
const toNum = (v: unknown, d = 0): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : d;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const toBool = (v: unknown, d = false): boolean => {
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off", ""].includes(s)) return false;
  return d;
};

// -------------------------------------------------
// Local state for Payment Providers (PayTR, Shopier, Iyzico)
// -------------------------------------------------
type PaytrState = {
  enabled: boolean;
  merchant_id: string;
  merchant_key: string;
  merchant_salt: string;
  test_mode: boolean;
  commission: number; // %
  havale_enabled: boolean;
  havale_commission: number; // %
};
const defaultPaytr: PaytrState = {
  enabled: false,
  merchant_id: "",
  merchant_key: "",
  merchant_salt: "",
  test_mode: true,
  commission: 0,
  havale_enabled: false,
  havale_commission: 0,
};

type ShopierState = { enabled: boolean; client_id: string; client_secret: string; commission: number };
const defaultShopier: ShopierState = { enabled: false, client_id: "", client_secret: "", commission: 0 };

type IyzicoState = { enabled: boolean; api_key: string; secret_key: string; commission: number };
const defaultIyzico: IyzicoState = { enabled: false, api_key: "", secret_key: "", commission: 0 };

export default function Settings() {
  // ------- site_settings (non-payment) -------
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ------- email templates -------
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({ template_name: "", template_key: "", subject: "", content: "", variables: [] as string[], is_active: true });

  // ------- payment providers (RTK Admin) -------
  const { data: providersAdmin, isLoading: providersLoading } = useListPaymentProvidersAdminQuery(undefined);
  const [createProvider] = useCreatePaymentProviderAdminMutation();
  const [updateProvider, { isLoading: isUpdatingProvider }] = useUpdatePaymentProviderAdminMutation();

  const providerByKey = useMemo(() => {
    const map = new Map<string, any>();
    (providersAdmin ?? []).forEach((p: any) => map.set(p.key, p));
    return map;
  }, [providersAdmin]);

  const [paytr, setPaytr] = useState<PaytrState>(defaultPaytr);
  const [shopier, setShopier] = useState<ShopierState>(defaultShopier);
  const [iyzico, setIyzico] = useState<IyzicoState>(defaultIyzico);

  // Initialize provider local states when admin list arrives
  useEffect(() => {
    const paytrRow = providerByKey.get("paytr");
    if (paytrRow) {
      const cfg = asRecord(paytrRow.public_config);
      setPaytr({
        enabled: toBool(paytrRow.is_active, false),
        merchant_id: toStr(cfg.merchant_id),
        merchant_key: toStr(cfg.merchant_key),
        merchant_salt: toStr(cfg.merchant_salt),
        test_mode: toBool(cfg.test_mode, true),
        commission: toNum(cfg.commission, 0),
        havale_enabled: toBool(cfg.havale_enabled, false),
        havale_commission: toNum(cfg.havale_commission, 0),
      });
    } else {
      setPaytr(defaultPaytr);
    }

    const shopierRow = providerByKey.get("shopier");
    if (shopierRow) {
      const cfg = asRecord(shopierRow.public_config);
      setShopier({
        enabled: toBool(shopierRow.is_active, false),
        client_id: toStr(cfg.client_id),
        client_secret: toStr(cfg.client_secret),
        commission: toNum(cfg.commission, 0),
      });
    } else {
      setShopier(defaultShopier);
    }

    const iyzicoRow = providerByKey.get("iyzico");
    if (iyzicoRow) {
      const cfg = asRecord(iyzicoRow.public_config);
      setIyzico({
        enabled: toBool(iyzicoRow.is_active, false),
        api_key: toStr(cfg.api_key),
        secret_key: toStr(cfg.secret_key),
        commission: toNum(cfg.commission, 0),
      });
    } else {
      setIyzico(defaultIyzico);
    }
  }, [providerByKey]);

  // --------------------------------------------
  // site_settings CRUD (unchanged)
  // --------------------------------------------
  useEffect(() => {
    fetchSettings();
    fetchEmailTemplates();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub.from("site_settings").select("*");
      if (error) throw error;
      if (data && data.length > 0) {
        const settingsObj = data.reduce((acc: any, item: any) => {
          if (String(item.key).startsWith("telegram_template_") && typeof item.value === "object" && item.value !== null) {
            const v = item.value as { template?: string };
            acc[item.key] = v.template || "";
          } else {
            acc[item.key] = item.value;
          }
          return acc;
        }, {} as any);
        setSettings({ ...defaultSettings, ...settingsObj });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Ayarlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    const toPersistable = (v: unknown): string | number | boolean | null => {
      if (v === null || v === undefined) return null;
      const t = typeof v;
      if (t === "string" || t === "number" || t === "boolean") return v as any;
      try { return JSON.stringify(v); } catch { return String(v); }
    };
    type ValueType = "string" | "number" | "boolean" | "json" | null;
    const guessType = (v: unknown): ValueType => {
      if (v === null || v === undefined) return null;
      const t = typeof v;
      if (t === "string") return "string";
      if (t === "number") return "number";
      if (t === "boolean") return "boolean";
      return "json";
    };
    try {
      setSaving(true);
      await metahub.from("site_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value: toPersistable(value), value_type: guessType(value) }));
      const { error } = await metahub.from("site_settings").insert(settingsArray);
      if (error) throw error;
      toast.success("Ayarlar kaydedildi");
    } catch (e: any) {
      console.error("Error saving settings:", e);
      toast.error(e?.message || "Ayarlar kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------
  // Email template functions (unchanged)
  // --------------------------------------------
  const fetchEmailTemplates = async () => {
    try {
      const { data, error } = await metahub.from("email_templates").select("*").order("template_name");
      if (error) throw error;
      setEmailTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleEditTemplate = (template: any) => {
    const variables = Array.isArray(template.variables)
      ? template.variables.filter((v: any): v is string => typeof v === "string")
      : [];
    setEditingTemplate(template);
    setTemplateForm({ template_name: template.template_name, template_key: template.template_key, subject: template.subject, content: template.content, variables, is_active: template.is_active });
    setShowTemplateModal(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ template_name: "", template_key: "", subject: "", content: "", variables: [], is_active: true });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.template_name || !templateForm.subject || !templateForm.content) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    try {
      if (editingTemplate) {
        const { error } = await metahub.from("email_templates").update({
          template_name: templateForm.template_name,
          subject: templateForm.subject,
          content: templateForm.content,
          variables: templateForm.variables,
          is_active: templateForm.is_active,
        }).eq("id", editingTemplate.id);
        if (error) throw error;
        toast.success("Şablon güncellendi");
      } else {
        const { error } = await metahub.from("email_templates").insert({
          template_key: templateForm.template_key,
          template_name: templateForm.template_name,
          subject: templateForm.subject,
          content: templateForm.content,
          variables: templateForm.variables,
          is_active: templateForm.is_active,
        });
        if (error) throw error;
        toast.success("Şablon oluşturuldu");
      }
      setShowTemplateModal(false);
      fetchEmailTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error("Şablon kaydedilirken hata oluştu");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Bu şablonu silmek istediğinizden emin misiniz?")) return;
    try {
      const { error } = await metahub.from("email_templates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Şablon silindi");
      fetchEmailTemplates();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast.error("Şablon silinirken hata oluştu");
    }
  };

  // --------------------------------------------
  // Payment Providers — helper & save handlers
  // --------------------------------------------
  const upsertProvider = async (
    key: "paytr" | "shopier" | "iyzico" | string,
    displayName: string,
    isActive: boolean,
    publicConfigPatch: Record<string, unknown>
  ) => {
    const row = providerByKey.get(key);
    if (!row) {
      // create if missing
      await createProvider({ key, display_name: displayName, is_active: isActive ? 1 : 0, public_config: publicConfigPatch }).unwrap();
      toast.success(`${displayName} sağlayıcısı oluşturuldu`);
      return;
    }
    // update
    await updateProvider({
      id: row.id,
      body: {
        is_active: isActive ? 1 : 0,
        public_config: { ...(asRecord(row.public_config) || {}), ...publicConfigPatch },
      },
    }).unwrap();
  };

  const savePaytr = async () => {
    try {
      await upsertProvider("paytr", "PayTR", paytr.enabled, {
        merchant_id: paytr.merchant_id,
        merchant_key: paytr.merchant_key,
        merchant_salt: paytr.merchant_salt,
        test_mode: paytr.test_mode,
        commission: paytr.commission,
        havale_enabled: paytr.havale_enabled,
        havale_commission: paytr.havale_commission,
      });
      toast.success("PayTR ayarları kaydedildi");
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.message || "PayTR kaydetme başarısız");
    }
  };

  const saveShopier = async () => {
    try {
      await upsertProvider("shopier", "Shopier", shopier.enabled, {
        client_id: shopier.client_id,
        client_secret: shopier.client_secret,
        commission: shopier.commission,
      });
      toast.success("Shopier ayarları kaydedildi");
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.message || "Shopier kaydetme başarısız");
    }
  };

  const saveIyzico = async () => {
    try {
      await upsertProvider("iyzico", "Iyzico", iyzico.enabled, {
        api_key: iyzico.api_key,
        secret_key: iyzico.secret_key,
        commission: iyzico.commission,
      });
      toast.success("Iyzico ayarları kaydedildi");
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.message || "Iyzico kaydetme başarısız");
    }
  };

  if (loading || providersLoading) {
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

        {/* GENERAL */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Genel Ayarlar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_title">Site Başlığı</Label>
                <Input id="site_title" value={settings.site_title} onChange={(e) => setSettings({ ...settings, site_title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_description">Site Açıklaması</Label>
                <Textarea id="site_description" value={settings.site_description} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_balance_limit">Minimum Bakiye Yükleme Limiti (₺)</Label>
                <Input id="min_balance_limit" type="number" value={settings.min_balance_limit} onChange={(e) => setSettings({ ...settings, min_balance_limit: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Numarası</Label>
                <Input id="whatsapp_number" value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="+905xxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch id="guest_order_enabled" checked={settings.guest_order_enabled} onCheckedChange={(checked) => setSettings({ ...settings, guest_order_enabled: checked })} />
                  <Label htmlFor="guest_order_enabled">Üyeliksiz Sipariş</Label>
                </div>
                <p className="text-xs text-muted-foreground">Kullanıcıların üye olmadan sipariş verebilmesine izin ver</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch id="maintenance_mode" checked={settings.maintenance_mode} onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })} />
                  <Label htmlFor="maintenance_mode">Bakım Modu</Label>
                </div>
              </div>
              {settings.maintenance_mode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenance_message">Bakım Modu Mesajı</Label>
                  <Textarea id="maintenance_message" value={settings.maintenance_message} onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })} rows={3} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="theme_mode">Dark/Light Mod Ayarı</Label>
                <Select value={settings.theme_mode} onValueChange={(value: "user_choice" | "dark_only" | "light_only") => setSettings({ ...settings, theme_mode: value })}>
                  <SelectTrigger id="theme_mode"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_choice">Kullanıcı Karar Versin</SelectItem>
                    <SelectItem value="dark_only">Sadece Dark Mode Çalışsın</SelectItem>
                    <SelectItem value="light_only">Sadece Light Mode Çalışsın</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {settings.theme_mode === "user_choice" && "Kullanıcılar header'daki buton ile tema değiştirebilir"}
                  {settings.theme_mode === "dark_only" && "Site her zaman dark mod'da açılır, kullanıcı değiştiremez"}
                  {settings.theme_mode === "light_only" && "Site her zaman light mod'da açılır, kullanıcı değiştiremez"}
                </p>
              </div>
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold">Özel Kodlar</h3>
                <div className="space-y-2">
                  <Label htmlFor="custom_header_code">Ek Header Kodu</Label>
                  <Textarea id="custom_header_code" value={settings.custom_header_code} onChange={(e) => setSettings({ ...settings, custom_header_code: e.target.value })} rows={5} placeholder="<!-- Canlı destek, Google Analytics, Search Console doğrulama vb. kodları buraya ekleyin -->" />
                  <p className="text-xs text-muted-foreground">Bu alan &lt;head&gt; etiketinin sonuna eklenecektir</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_footer_code">Ek Footer Kodu</Label>
                  <Textarea id="custom_footer_code" value={settings.custom_footer_code} onChange={(e) => setSettings({ ...settings, custom_footer_code: e.target.value })} rows={5} placeholder="<!-- Footer scriptleri buraya ekleyin -->" />
                  <p className="text-xs text-muted-foreground">Bu alan &lt;/body&gt; etiketinin hemen öncesine eklenecektir</p>
                </div>
              </div>
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold">Logo & Favicon</h3>
                <div className="space-y-2">
                  <Label htmlFor="light_logo">Light Mode Logo</Label>
                  <Input id="light_logo" type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fileExt = file.name.split(".").pop();
                    const filePath = `light-logo.${fileExt}`;
                    const { error: uploadError } = await metahub.storage.from("logos").upload(filePath, file, { upsert: true });
                    if (uploadError) { toast.error("Logo yüklenirken hata oluştu"); return; }
                    const { data } = metahub.storage.from("logos").getPublicUrl(filePath);
                    setSettings({ ...settings, light_logo: data.publicUrl });
                    toast.success("Logo yüklendi");
                  }} />
                  <p className="text-xs text-muted-foreground">PNG, JPG veya SVG (maks. 2MB)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dark_logo">Dark Mode Logo</Label>
                  <Input id="dark_logo" type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fileExt = file.name.split(".").pop();
                    const filePath = `dark-logo.${fileExt}`;
                    const { error: uploadError } = await metahub.storage.from("logos").upload(filePath, file, { upsert: true });
                    if (uploadError) { toast.error("Logo yüklenirken hata oluştu"); return; }
                    const { data } = metahub.storage.from("logos").getPublicUrl(filePath);
                    setSettings({ ...settings, dark_logo: data.publicUrl });
                    toast.success("Logo yüklendi");
                  }} />
                  <p className="text-xs text-muted-foreground">PNG, JPG veya SVG (maks. 2MB)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon</Label>
                  <Input id="favicon" type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fileExt = file.name.split(".").pop();
                    const filePath = `favicon.${fileExt}`;
                    const { error: uploadError } = await metahub.storage.from("logos").upload(filePath, file, { upsert: true });
                    if (uploadError) { toast.error("Favicon yüklenirken hata oluştu"); return; }
                    const { data } = metahub.storage.from("logos").getPublicUrl(filePath);
                    setSettings({ ...settings, favicon_url: data.publicUrl });
                    toast.success("Favicon yüklendi");
                  }} />
                  <p className="text-xs text-muted-foreground">ICO, PNG (önerilen: 32x32px)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Sayfa SEO Ayarları</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Ürünler Sayfası (/urunler)</h3>
                <div className="space-y-2">
                  <Label htmlFor="seo_products_title">SEO Başlık</Label>
                  <Input id="seo_products_title" value={settings.seo_products_title || ""} onChange={(e) => setSettings({ ...settings, seo_products_title: e.target.value })} placeholder="Ürünlerimiz - Site Adı" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_products_description">SEO Açıklama</Label>
                  <Textarea id="seo_products_description" value={settings.seo_products_description || ""} onChange={(e) => setSettings({ ...settings, seo_products_description: e.target.value })} rows={3} placeholder="Ürünler sayfası açıklaması..." />
                </div>
              </div>
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Kategoriler Sayfası (/kategoriler)</h3>
                <div className="space-y-2">
                  <Label htmlFor="seo_categories_title">SEO Başlık</Label>
                  <Input id="seo_categories_title" value={settings.seo_categories_title || ""} onChange={(e) => setSettings({ ...settings, seo_categories_title: e.target.value })} placeholder="Kategoriler - Site Adı" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_categories_description">SEO Açıklama</Label>
                  <Textarea id="seo_categories_description" value={settings.seo_categories_description || ""} onChange={(e) => setSettings({ ...settings, seo_categories_description: e.target.value })} rows={3} placeholder="Kategoriler sayfası açıklaması..." />
                </div>
              </div>
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Blog Sayfası (/blog)</h3>
                <div className="space-y-2">
                  <Label htmlFor="seo_blog_title">SEO Başlık</Label>
                  <Input id="seo_blog_title" value={settings.seo_blog_title || ""} onChange={(e) => setSettings({ ...settings, seo_blog_title: e.target.value })} placeholder="Blog - Site Adı" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_blog_description">SEO Açıklama</Label>
                  <Textarea id="seo_blog_description" value={settings.seo_blog_description || ""} onChange={(e) => setSettings({ ...settings, seo_blog_description: e.target.value })} rows={3} placeholder="Blog sayfası açıklaması..." />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">İletişim Sayfası (/iletisim)</h3>
                <div className="space-y-2">
                  <Label htmlFor="seo_contact_title">SEO Başlık</Label>
                  <Input id="seo_contact_title" value={settings.seo_contact_title || ""} onChange={(e) => setSettings({ ...settings, seo_contact_title: e.target.value })} placeholder="İletişim - Site Adı" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_contact_description">SEO Açıklama</Label>
                  <Textarea id="seo_contact_description" value={settings.seo_contact_description || ""} onChange={(e) => setSettings({ ...settings, seo_contact_description: e.target.value })} rows={3} placeholder="İletişim sayfası açıklaması..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>SMTP Mail Ayarları</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Mail Sunucusu</Label>
                  <Input id="smtp_host" placeholder="srvm16.trwww.com" value={settings.smtp_host} onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input id="smtp_port" type="number" placeholder="465" value={settings.smtp_port} onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch id="smtp_ssl" checked={settings.smtp_ssl} onCheckedChange={(checked) => setSettings({ ...settings, smtp_ssl: checked })} />
                    <Label htmlFor="smtp_ssl">SSL Etkin</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Port 465 için SSL etkinleştirilmelidir</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Kullanıcı Adı (Email)</Label>
                  <Input id="smtp_username" type="email" placeholder="mail@siteadi.com" value={settings.smtp_username} onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Şifre</Label>
                  <Input id="smtp_password" type="password" placeholder="••••••••" value={settings.smtp_password} onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_email">Gönderen Email</Label>
                  <Input id="smtp_from_email" type="email" placeholder="noreply@siteadi.com" value={settings.smtp_from_email} onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_name">Gönderen Adı</Label>
                  <Input id="smtp_from_name" placeholder="Dijital Market" value={settings.smtp_from_name} onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })} />
                </div>
              </div>
              <div className="pt-4">
                <Button variant="outline" onClick={async () => {
                  try {
                    const { data, error } = await metahub.functions.invoke<TestSmtpResult>("test-smtp");
                    if (error) throw new Error(error.message);
                    if (data?.success) toast.success(data.message ?? "SMTP testi başarılı");
                    else toast.error(data?.error ?? "SMTP testi başarısız");
                  } catch (err: any) {
                    toast.error("SMTP testi başarısız: " + (err?.message ?? String(err)));
                  }
                }}>Bağlantıyı Test Et</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMAIL TEMPLATES */}
        <TabsContent value="email-templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mail Şablonları</CardTitle>
                <Button onClick={handleNewTemplate}><Plus className="w-4 h-4 mr-2" />Yeni Şablon</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şablon Adı</TableHead>
                    <TableHead>Anahtar</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.template_name}</TableCell>
                      <TableCell><code className="px-2 py-1 bg-muted rounded text-xs">{template.template_key}</code></TableCell>
                      <TableCell className="max-w-md truncate">{template.subject}</TableCell>
                      <TableCell><Badge variant={template.is_active ? "default" : "secondary"}>{template.is_active ? "Aktif" : "Pasif"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENT — RTK Admin payment providers */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Ödeme Yöntemleri</CardTitle></CardHeader>
            <CardContent className="space-y-8">
              {/* PAYTR */}
              <section className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">PayTR Entegrasyonu</h3>
                <p className="text-sm text-muted-foreground">Aynı mağaza bilgileriyle hem kredi kartı hem havale/EFT ödemesi alabilirsiniz</p>
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <h4 className="font-medium">Mağaza Bilgileri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Merchant ID</Label><Input value={paytr.merchant_id} onChange={(e) => setPaytr((s) => ({ ...s, merchant_id: e.target.value }))} placeholder="PayTR Mağaza No" /></div>
                    <div className="space-y-2"><Label>Merchant Key</Label><Input type="password" value={paytr.merchant_key} onChange={(e) => setPaytr((s) => ({ ...s, merchant_key: e.target.value }))} placeholder="PayTR Merchant Key" /></div>
                    <div className="space-y-2"><Label>Merchant Salt</Label><Input type="password" value={paytr.merchant_salt} onChange={(e) => setPaytr((s) => ({ ...s, merchant_salt: e.target.value }))} placeholder="PayTR Merchant Salt" /></div>
                  </div>
                  <div className="flex items-center gap-2"><Switch id="paytr_test_mode" checked={paytr.test_mode} onCheckedChange={(checked) => setPaytr((s) => ({ ...s, test_mode: checked }))} /><Label htmlFor="paytr_test_mode">Test Modu</Label></div>
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-muted mt-4">
                  <div className="flex items-center gap-2"><Switch id="paytr_enabled" checked={paytr.enabled} onCheckedChange={(checked) => setPaytr((s) => ({ ...s, enabled: checked }))} /><Label htmlFor="paytr_enabled" className="font-medium">Kredi Kartı ile Ödeme</Label></div>
                  {paytr.enabled && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="paytr_commission">Ödeme Komisyonu (%)</Label>
                      <Input id="paytr_commission" type="number" min={0} max={100} step={0.01} value={paytr.commission} onChange={(e) => setPaytr((s) => ({ ...s, commission: parseFloat(e.target.value) || 0 }))} placeholder="Örn: 2.5" />
                      <p className="text-xs text-muted-foreground">PayTR kredi kartı ödemelerde uygulanacak komisyon yüzdesi</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-muted mt-4">
                  <div className="flex items-center gap-2"><Switch id="paytr_havale_enabled" checked={paytr.havale_enabled} onCheckedChange={(checked) => setPaytr((s) => ({ ...s, havale_enabled: checked }))} /><Label htmlFor="paytr_havale_enabled" className="font-medium">Havale/EFT ile Ödeme</Label></div>
                  {paytr.havale_enabled && (
                    <>
                      <div className="space-y-2 pl-6">
                        <Label htmlFor="paytr_havale_commission">Ödeme Komisyonu (%)</Label>
                        <Input id="paytr_havale_commission" type="number" min={0} max={100} step={0.01} value={paytr.havale_commission} onChange={(e) => setPaytr((s) => ({ ...s, havale_commission: parseFloat(e.target.value) || 0 }))} placeholder="Örn: 1.5" />
                        <p className="text-xs text-muted-foreground">PayTR havale/EFT ödemelerde uygulanacak komisyon yüzdesi</p>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">PayTR Havale/EFT iframe API ile çalışır. Müşteri banka bilgilerini görüntüleyip ödeme dekontunu yükleyebilir.</p>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  PayTR Bildirim URL'si: <code className="bg-muted px-2 py-1 rounded">{typeof window !== "undefined" ? `${window.location.origin}/functions/v1/paytr-callback` : "/functions/v1/paytr-callback"}</code>
                  <br />PayTR Havale Bildirim URL'si: <code className="bg-muted px-2 py-1 rounded">{typeof window !== "undefined" ? `${window.location.origin}/functions/v1/paytr-havale-callback` : "/functions/v1/paytr-havale-callback"}</code>
                </p>
                <div className="pt-2"><Button onClick={savePaytr} disabled={isUpdatingProvider} className="gap-2"><Save className="w-4 h-4" />Kaydet</Button></div>
              </section>

              {/* SHOPIER */}
              <section className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">Shopier Entegrasyonu</h3>
                <div className="flex items-center gap-2"><Switch id="shopier_enabled" checked={shopier.enabled} onCheckedChange={(checked) => setShopier((s) => ({ ...s, enabled: checked }))} /><Label htmlFor="shopier_enabled">Shopier ile Ödeme Aktif</Label></div>
                {shopier.enabled && (
                  <>
                    <div className="space-y-2"><Label htmlFor="shopier_client_id">Client ID</Label><Input id="shopier_client_id" value={shopier.client_id} onChange={(e) => setShopier((s) => ({ ...s, client_id: e.target.value }))} placeholder="Shopier Client ID" /></div>
                    <div className="space-y-2"><Label htmlFor="shopier_client_secret">Client Secret</Label><Input id="shopier_client_secret" type="password" value={shopier.client_secret} onChange={(e) => setShopier((s) => ({ ...s, client_secret: e.target.value }))} placeholder="Shopier Client Secret" /></div>
                    <div className="space-y-2">
                      <Label htmlFor="shopier_commission">Ödeme Komisyonu (%)</Label>
                      <Input id="shopier_commission" type="number" min={0} max={100} step={0.01} value={shopier.commission} onChange={(e) => setShopier((s) => ({ ...s, commission: parseFloat(e.target.value) || 0 }))} placeholder="Örn: 3.5" />
                      <p className="text-xs text-muted-foreground">Shopier ile yapılan ödemelerde uygulanacak komisyon yüzdesi</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Shopier Direct API ile çalışır. Ödeme tamamlandığında otomatik olarak webhook ile bildirim alınır.</p>
                    <div className="pt-2"><Button onClick={saveShopier} disabled={isUpdatingProvider} className="gap-2"><Save className="w-4 h-4" />Kaydet</Button></div>
                  </>
                )}
              </section>

              {/* IYZICO */}
              <section className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">Iyzico Entegrasyonu</h3>
                <div className="flex items-center gap-2"><Switch id="iyzico_enabled" checked={iyzico.enabled} onCheckedChange={(checked) => setIyzico((s) => ({ ...s, enabled: checked }))} /><Label htmlFor="iyzico_enabled">Iyzico ile Ödeme Aktif</Label></div>
                {iyzico.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>API Key</Label><Input value={iyzico.api_key} onChange={(e) => setIyzico((s) => ({ ...s, api_key: e.target.value }))} placeholder="Iyzico API Key" /></div>
                    <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={iyzico.secret_key} onChange={(e) => setIyzico((s) => ({ ...s, secret_key: e.target.value }))} placeholder="Iyzico Secret Key" /></div>
                    <div className="space-y-2"><Label>Komisyon (%)</Label><Input type="number" min={0} max={100} step={0.01} value={iyzico.commission} onChange={(e) => setIyzico((s) => ({ ...s, commission: parseFloat(e.target.value) || 0 }))} placeholder="Örn: 2.9" /></div>
                  </div>
                )}
                <div className="pt-2"><Button onClick={saveIyzico} disabled={isUpdatingProvider} className="gap-2"><Save className="w-4 h-4" />Kaydet</Button></div>
              </section>

              {/* Wallet & classic bank transfer still kept under site_settings */}
              <section className="space-y-4 border-b pb-6">
                <div className="flex items-center gap-2"><Switch id="wallet_enabled" checked={settings.payment_methods?.wallet_enabled !== false} onCheckedChange={(checked) => setSettings({ ...settings, payment_methods: { ...(settings.payment_methods || {}), wallet_enabled: checked } })} /><Label htmlFor="wallet_enabled" className="text-lg font-semibold">Cüzdan ile Ödeme</Label></div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2"><Switch id="havale_enabled" checked={settings.payment_methods?.havale_enabled || false} onCheckedChange={(checked) => setSettings({ ...settings, payment_methods: { ...(settings.payment_methods || {}), havale_enabled: checked } })} /><Label htmlFor="havale_enabled" className="text-lg font-semibold">Havale</Label></div>
                {settings.payment_methods?.havale_enabled && (
                  <div className="grid grid-cols-1 gap-4 pl-8">
                    <div className="space-y-2"><Label>Banka Adı</Label><Input value={settings.payment_methods?.havale_bank_name || ""} onChange={(e) => setSettings({ ...settings, payment_methods: { ...(settings.payment_methods || {}), havale_bank_name: e.target.value } })} placeholder="Örn: Ziraat Bankası" /></div>
                    <div className="space-y-2"><Label>IBAN</Label><Input value={settings.payment_methods?.havale_iban || ""} onChange={(e) => setSettings({ ...settings, payment_methods: { ...(settings.payment_methods || {}), havale_iban: e.target.value } })} placeholder="TR00 0000 0000 0000 0000 0000 00" /></div>
                    <div className="space-y-2"><Label>Hesap Sahibi</Label><Input value={settings.payment_methods?.havale_account_holder || ""} onChange={(e) => setSettings({ ...settings, payment_methods: { ...(settings.payment_methods || {}), havale_account_holder: e.target.value } })} placeholder="Ad Soyad / Şirket Adı" /></div>
                  </div>
                )}
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TELEGRAM */}
        <TabsContent value="telegram" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Telegram Bildirim Ayarları</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="telegram_bot_token">Telegram Bot Token</Label><Input id="telegram_bot_token" value={settings.telegram_bot_token} onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })} placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" /><p className="text-xs text-muted-foreground">BotFather'dan aldığınız bot token'ını girin</p></div>
                <div className="space-y-2"><Label htmlFor="telegram_chat_id">Telegram Chat ID</Label><Input id="telegram_chat_id" value={settings.telegram_chat_id} onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })} placeholder="-1001234567890" /><p className="text-xs text-muted-foreground">Bildirimlerin gönderileceği chat/grup ID'si</p></div>
                <div className="bg-muted p-4 rounded-lg space-y-2 mb-4">
                  <h4 className="font-semibold text-sm">Nasıl Kurulur?</h4>
                  <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Telegram'da @BotFather ile yeni bir bot oluşturun</li>
                    <li>Bot token'ını yukarıdaki alana yapıştırın</li>
                    <li>Botunuzu grubunuza ekleyin veya direkt mesaj gönderin</li>
                    <li>@userinfobot kullanarak chat ID'nizi öğrenin</li>
                    <li>Chat ID'yi yukarıdaki alana yapıştırın</li>
                  </ol>
                </div>
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold">Bildirim Türleri</h4>
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between"><div><Label htmlFor="new_order_telegram" className="text-base font-medium">Yeni Sipariş Bildirimleri</Label><p className="text-xs text-muted-foreground">Yeni sipariş geldiğinde Telegram bildirimi gönder</p></div><Switch id="new_order_telegram" checked={settings.new_order_telegram} onCheckedChange={(checked) => setSettings({ ...settings, new_order_telegram: checked })} /></div>
                    <div className="space-y-2"><Label htmlFor="telegram_template_new_order">Mesaj Şablonu</Label><Textarea id="telegram_template_new_order" value={settings.telegram_template_new_order || ""} onChange={(e) => setSettings({ ...settings, telegram_template_new_order: e.target.value })} rows={8} className="font-mono text-sm" placeholder="Mesaj şablonunu girin..." /><p className="text-xs text-muted-foreground">Kullanılabilir değişkenler: {'{{order_number}}'}, {'{{customer_name}}'}, {'{{customer_email}}'}, {'{{customer_phone}}'}, {'{{final_amount}}'}, {'{{discount}}'}, {'{{order_items}}'}, {'{{created_at}}'}</p></div>
                  </div>
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between"><div><Label htmlFor="new_payment_request_telegram" className="text-base font-medium">Ödeme Talebi Bildirimleri</Label><p className="text-xs text-muted-foreground">Yeni ödeme talebi oluşturulduğunda Telegram bildirimi gönder</p></div><Switch id="new_payment_request_telegram" checked={settings.new_payment_request_telegram} onCheckedChange={(checked) => setSettings({ ...settings, new_payment_request_telegram: checked })} /></div>
                    <div className="space-y-2"><Label htmlFor="telegram_template_new_payment_request">Mesaj Şablonu</Label><Textarea id="telegram_template_new_payment_request" value={settings.telegram_template_new_payment_request || ""} onChange={(e) => setSettings({ ...settings, telegram_template_new_payment_request: e.target.value })} rows={8} className="font-mono text-sm" placeholder="Mesaj şablonunu girin..." /><p className="text-xs text-muted-foreground">Kullanılabilir değişkenler: {'{{order_number}}'}, {'{{customer_name}}'}, {'{{customer_email}}'}, {'{{customer_phone}}'}, {'{{amount}}'}, {'{{payment_method}}'}, {'{{order_items}}'}, {'{{created_at}}'}</p></div>
                  </div>
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between"><div><Label htmlFor="new_ticket_telegram" className="text-base font-medium">Destek Talebi Bildirimleri</Label><p className="text-xs text-muted-foreground">Yeni destek talebi açıldığında Telegram bildirimi gönder</p></div><Switch id="new_ticket_telegram" checked={settings.new_ticket_telegram} onCheckedChange={(checked) => setSettings({ ...settings, new_ticket_telegram: checked })} /></div>
                    <div className="space-y-2"><Label htmlFor="telegram_template_new_ticket">Mesaj Şablonu</Label><Textarea id="telegram_template_new_ticket" value={settings.telegram_template_new_ticket || ""} onChange={(e) => setSettings({ ...settings, telegram_template_new_ticket: e.target.value })} rows={8} className="font-mono text-sm" placeholder="Mesaj şablonunu girin..." /><p className="text-xs text-muted-foreground">Kullanılabilir değişkenler: {'{{user_name}}'}, {'{{subject}}'}, {'{{priority}}'}, {'{{category}}'}, {'{{message}}'}, {'{{created_at}}'}</p></div>
                  </div>
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between"><div><Label htmlFor="deposit_approved_telegram" className="text-base font-medium">Bakiye Yükleme Bildirimleri</Label><p className="text-xs text-muted-foreground">Bakiye yükleme onaylandığında Telegram bildirimi gönder</p></div><Switch id="deposit_approved_telegram" checked={settings.deposit_approved_telegram} onCheckedChange={(checked) => setSettings({ ...settings, deposit_approved_telegram: checked })} /></div>
                    <div className="space-y-2"><Label htmlFor="telegram_template_deposit_approved">Mesaj Şablonu</Label><Textarea id="telegram_template_deposit_approved" value={settings.telegram_template_deposit_approved || ""} onChange={(e) => setSettings({ ...settings, telegram_template_deposit_approved: e.target.value })} rows={6} className="font-mono text-sm" placeholder="Mesaj şablonunu girin..." /><p className="text-xs text-muted-foreground">Kullanılabilir değişkenler: {'{{user_name}}'}, {'{{amount}}'}, {'{{created_at}}'}</p></div>
                  </div>
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between"><div><Label htmlFor="new_deposit_request_telegram" className="text-base font-medium">Cüzdan Yükleme Talebi Bildirimleri</Label><p className="text-xs text-muted-foreground">Yeni cüzdan yükleme talebi oluşturulduğunda Telegram bildirimi gönder</p></div><Switch id="new_deposit_request_telegram" checked={settings.new_deposit_request_telegram || false} onCheckedChange={(checked) => setSettings({ ...settings, new_deposit_request_telegram: checked })} /></div>
                    <div className="space-y-2"><Label htmlFor="telegram_template_new_deposit_request">Mesaj Şablonu</Label><Textarea id="telegram_template_new_deposit_request" value={settings.telegram_template_new_deposit_request || ""} onChange={(e) => setSettings({ ...settings, telegram_template_new_deposit_request: e.target.value })} rows={7} className="font-mono text-sm" placeholder="Mesaj şablonunu girin..." /><p className="text-xs text-muted-foreground">Kullanılabilir değişkenler: {'{{user_name}}'}, {'{{amount}}'}, {'{{payment_method}}'}, {'{{created_at}}'}</p></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Analitik & Entegrasyonlar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="google_analytics_id">Google Analytics ID</Label><Input id="google_analytics_id" value={settings.google_analytics_id} onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })} placeholder="G-XXXXXXXXXX" /></div>
                <div className="space-y-2"><Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label><Input id="facebook_pixel_id" value={settings.facebook_pixel_id} onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })} /></div>
              </div>
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold">Sosyal Medya</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="facebook_url">Facebook URL</Label><Input id="facebook_url" value={settings.facebook_url} onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="twitter_url">Twitter URL</Label><Input id="twitter_url" value={settings.twitter_url} onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="instagram_url">Instagram URL</Label><Input id="instagram_url" value={settings.instagram_url} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="linkedin_url">LinkedIn URL</Label><Input id="linkedin_url" value={settings.linkedin_url} onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })} /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POPUPS & TOPBAR */}
        <TabsContent value="popups" className="space-y-4"><PopupManagement /></TabsContent>
        <TabsContent value="topbar" className="space-y-4"><TopbarManagement /></TabsContent>

        {/* FOOTER */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Footer Ayarları</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="footer_company_name">Şirket Adı</Label><Input id="footer_company_name" value={settings.footer_company_name || "Dijital Market"} onChange={(e) => setSettings({ ...settings, footer_company_name: e.target.value })} placeholder="Dijital Market" /></div>
              <div className="space-y-2"><Label htmlFor="footer_description">Açıklama</Label><Textarea id="footer_description" value={settings.footer_description || ""} onChange={(e) => setSettings({ ...settings, footer_description: e.target.value })} placeholder="Güvenilir dijital ürün satış platformu. En uygun fiyatlarla lisans, hesap, yazılım ve daha fazlası." rows={3} /></div>
              <div className="space-y-2"><Label htmlFor="footer_copyright">Copyright Metni</Label><Input id="footer_copyright" value={settings.footer_copyright || ""} onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })} placeholder="© 2024 Dijital Market. Tüm hakları saklıdır." /></div>
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">İletişim Bilgileri</h3>
                <div className="space-y-2"><Label htmlFor="footer_email">E-posta</Label><Input id="footer_email" type="email" value={settings.footer_email || ""} onChange={(e) => setSettings({ ...settings, footer_email: e.target.value })} placeholder="destek@dijitalmarket.com" /></div>
                <div className="space-y-2"><Label htmlFor="footer_phone">Telefon</Label><Input id="footer_phone" value={settings.footer_phone || ""} onChange={(e) => setSettings({ ...settings, footer_phone: e.target.value })} placeholder="+90 555 123 45 67" /></div>
                <div className="space-y-2"><Label htmlFor="footer_address">Adres</Label><Textarea id="footer_address" value={settings.footer_address || ""} onChange={(e) => setSettings({ ...settings, footer_address: e.target.value })} placeholder={"Atatürk Cad. No:123\nİstanbul, Türkiye"} rows={2} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Global Save — only site_settings (non-provider) */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSaveSettings} disabled={saving} className="gap-2"><Save className="w-4 h-4" />{saving ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}</Button>
      </div>

      {/* Email Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTemplate ? "Mail Şablonu Düzenle" : "Yeni Mail Şablonu"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="template_name">Şablon Adı *</Label><Input id="template_name" value={templateForm.template_name} onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })} placeholder="Örn: Hoşgeldin Maili" /></div>
              {!editingTemplate && (
                <div className="space-y-2"><Label htmlFor="template_key">Şablon Anahtarı *</Label><Input id="template_key" value={templateForm.template_key} onChange={(e) => setTemplateForm({ ...templateForm, template_key: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="Örn: welcome" /><p className="text-xs text-muted-foreground">Kod içinde kullanılacak benzersiz anahtar</p></div>
              )}
              <div className="space-y-2 md:col-span-2"><Label htmlFor="subject">Mail Konusu *</Label><Input id="subject" value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder={"Örn: Hoş Geldiniz - {{site_name}}"} /><p className="text-xs text-muted-foreground">Değişkenler için {'{{değişken_adı}}'} formatını kullanın</p></div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="content">Mail İçeriği *</Label>
                <div className="border rounded-md">
                  <ReactQuill theme="snow" value={templateForm.content} onChange={(value) => setTemplateForm({ ...templateForm, content: value })} modules={{ toolbar: [[{ header: [1, 2, 3, false] }], ["bold", "italic", "underline", "strike"], [{ color: [] }, { background: [] }], [{ list: "ordered" }, { list: "bullet" }], [{ align: [] }], ["link"], ["clean"]] }} className="bg-background" />
                </div>
                <p className="text-xs text-muted-foreground">HTML formatında yazabilirsiniz. Değişkenler: {'{{user_name}}, {{site_name}}'} vb.</p>
              </div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="variables">Kullanılabilir Değişkenler</Label><Input id="variables" value={templateForm.variables.join(", ")} onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} placeholder="user_name, user_email, site_name" /><p className="text-xs text-muted-foreground">Virgülle ayırarak yazın</p></div>
              <div className="space-y-2 md:col-span-2"><div className="flex items-center gap-2"><Switch id="template_is_active" checked={templateForm.is_active} onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })} /><Label htmlFor="template_is_active">Aktif</Label></div><p className="text-xs text-muted-foreground">Pasif şablonlar mail gönderiminde kullanılmaz</p></div>
            </div>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setShowTemplateModal(false)}>İptal</Button><Button onClick={handleSaveTemplate}><Save className="w-4 h-4 mr-2" />Kaydet</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
