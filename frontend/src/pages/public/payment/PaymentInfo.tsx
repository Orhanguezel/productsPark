// =============================================================
// FILE: src/pages/account/components/PaymentInfo.tsx
// FINAL — Bank Transfer flow (provider_key = bank_transfer)
// - Uses sessionStorage bankTransferKind + bankTransferConfig (from Checkout) if available
// - Fallback to site_settings.bank_account_info
// - Creates order with payment_method: 'bank_transfer' (single provider key)
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useCreateOrderMutation, useGetSiteSettingByKeyQuery } from '@/integrations/hooks';
import type { CreateOrderBody } from '@/integrations/types';
import { toStr, isPlainObject } from '@/integrations/types/common';

type BankTransferKind = 'havale' | 'eft';

type BankAccountInfo = {
  iban: string | null;
  account_holder: string | null;
  bank_name: string | null;
};

type BankTransferPublicConfig = Partial<{
  type: unknown;
  methods: unknown;
  commission: unknown;
  havale: unknown;
  eft: unknown;
}>;

type PaymentSessionData = {
  cartItems: Array<{
    products: { id: string; name: string; price?: number | string };
    quantity?: number | string;
    selected_options?: unknown;
  }>;
  subtotal?: number | string;
  discount?: number | string;
  total?: number | string;
  appliedCoupon?: { code?: string } | null;
  notes?: string | null;

  // from Checkout sessionStorage (optional)
  paymentMethod?: string;
};

const toNumLoose = (v: unknown, d = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : d;
  }
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : d;
};

function jsonLikeToDisplayText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);

  try {
    if (Array.isArray(v) || isPlainObject(v)) return JSON.stringify(v, null, 2);
  } catch {
    // ignore
  }

  return toStr(v);
}

const parseKind = (v: unknown): BankTransferKind => {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return s === 'eft' ? 'eft' : 'havale';
};

function pickOptStr(o: Record<string, unknown>, key: string): string | null {
  const v = o[key];
  if (typeof v === 'string') {
    const s = v.trim();
    return s ? s : null;
  }
  return null;
}

function pickAccountFromConfig(
  cfg: BankTransferPublicConfig | null,
  kind: BankTransferKind,
): BankAccountInfo {
  if (!cfg) return { iban: null, account_holder: null, bank_name: null };

  const hv = isPlainObject(cfg.havale) ? (cfg.havale as Record<string, unknown>) : null;
  const ef = isPlainObject(cfg.eft) ? (cfg.eft as Record<string, unknown>) : null;

  const selected = kind === 'eft' ? (ef ?? hv) : (hv ?? ef);
  if (!selected) return { iban: null, account_holder: null, bank_name: null };

  return {
    iban: pickOptStr(selected, 'iban'),
    account_holder:
      pickOptStr(selected, 'account_holder') ??
      pickOptStr(selected, 'accountHolder') ??
      pickOptStr(selected, 'holder'),
    bank_name: pickOptStr(selected, 'bank_name') ?? pickOptStr(selected, 'bankName'),
  };
}

function formatAccountText(kind: BankTransferKind, acc: BankAccountInfo): string {
  const lines: string[] = [];
  lines.push(kind === 'eft' ? 'EFT Hesap Bilgileri' : 'Havale Hesap Bilgileri');

  if (acc.bank_name) lines.push(`Banka: ${acc.bank_name}`);
  if (acc.account_holder) lines.push(`Alıcı: ${acc.account_holder}`);
  if (acc.iban) lines.push(`IBAN: ${acc.iban}`);

  return lines.length ? lines.join('\n') : '';
}

export default function PaymentInfo() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const orderId = params.get('order_id') ?? params.get('orderId') ?? null;
  const isExistingOrder = Boolean(orderId);

  const { user, loading: authLoading } = useAuth();

  const { data: bankSetting, isLoading: bankLoading } =
    useGetSiteSettingByKeyQuery('bank_account_info');

  const [createOrder] = useCreateOrderMutation();

  const [paymentData, setPaymentData] = useState<PaymentSessionData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [bankTransferKind, setBankTransferKind] = useState<BankTransferKind>('havale');
  const [bankTransferConfig, setBankTransferConfig] = useState<BankTransferPublicConfig | null>(
    null,
  );

  // -------- load session storage (new flow) + auth gating --------
  useEffect(() => {
    if (isExistingOrder) return;
    if (authLoading) return;

    if (!user) {
      toast.error('Ödeme bildirimi için giriş yapmanız gerekiyor.');
      navigate('/giris');
      return;
    }

    const raw = sessionStorage.getItem('havalepaymentData');
    if (!raw) {
      toast.error('Ödeme bilgisi bulunamadı');
      navigate('/');
      return;
    }

    try {
      setPaymentData(JSON.parse(raw) as PaymentSessionData);
    } catch {
      toast.error('Ödeme bilgisi okunamadı');
      navigate('/');
      return;
    }

    // kind/config are optional (but Checkout sets them)
    setBankTransferKind(parseKind(sessionStorage.getItem('bankTransferKind')));

    try {
      const cfgRaw = sessionStorage.getItem('bankTransferConfig');
      if (cfgRaw) {
        const parsed = JSON.parse(cfgRaw) as unknown;
        setBankTransferConfig(isPlainObject(parsed) ? (parsed as BankTransferPublicConfig) : null);
      } else {
        setBankTransferConfig(null);
      }
    } catch {
      setBankTransferConfig(null);
    }
  }, [isExistingOrder, authLoading, user, navigate]);

  // Existing order için de auth zorunlu olsun (account sayfası)
  useEffect(() => {
    if (!isExistingOrder) return;
    if (authLoading) return;

    if (!user) {
      toast.error('Devam etmek için giriş yapmanız gerekiyor.');
      navigate('/giris');
    }
  }, [isExistingOrder, authLoading, user, navigate]);

  const bankInfoText = useMemo(() => {
    // 1) Prefer Checkout-provided config (bank_transfer public_config)
    const acc = pickAccountFromConfig(bankTransferConfig, bankTransferKind);
    const accText = formatAccountText(bankTransferKind, acc);
    if (accText.trim()) return accText;

    // 2) Fallback to site_settings (legacy / generic)
    return bankSetting ? jsonLikeToDisplayText((bankSetting as any).value) : '';
  }, [bankTransferConfig, bankTransferKind, bankSetting]);

  const pageLoading = authLoading || bankLoading;

  const handleConfirm = async () => {
    if (authLoading) return;

    if (!user) {
      toast.error('Oturum bulunamadı. Lütfen giriş yapın.');
      navigate('/giris');
      return;
    }

    // Existing order: burada payment_request yaratmıyoruz (backend/önceki akış).
    if (isExistingOrder) {
      sessionStorage.removeItem('checkoutData');
      sessionStorage.removeItem('havalepaymentData');
      toast.success('Bilgiler kaydedildi');
      navigate('/odeme-beklemede');
      return;
    }

    try {
      setSubmitting(true);

      if (!paymentData) {
        toast.error('Ödeme bilgisi bulunamadı');
        return;
      }

      const items = (paymentData.cartItems ?? []).map((i) => {
        const price = toNumLoose(i.products.price ?? 0, 0);
        const qty = toNumLoose(i.quantity ?? 1, 1);
        const lineTotal = price * qty;

        return {
          product_id: String(i.products.id),
          product_name: String(i.products.name),
          quantity: qty,
          price: price.toFixed(2),
          total: lineTotal.toFixed(2),
          options: i.selected_options ?? null,
        };
      });

      const subtotal = toNumLoose(paymentData.subtotal ?? 0, 0);
      const discount = toNumLoose(paymentData.discount ?? 0, 0);
      const total =
        paymentData.total != null ? toNumLoose(paymentData.total, 0) : subtotal - discount;

      const couponCode: string | null =
        paymentData.appliedCoupon?.code && String(paymentData.appliedCoupon.code).trim()
          ? String(paymentData.appliedCoupon.code).trim()
          : null;

      const orderBody: CreateOrderBody = {
        order_number: `ORD${Date.now()}`,
        payment_method: 'bank_transfer', // ✅ single provider_key
        payment_status: 'pending',
        items,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        coupon_code: couponCode,
        notes: paymentData.notes ?? null,
      };

      await createOrder(orderBody).unwrap();

      // local caches temizliği
      sessionStorage.removeItem('checkoutData');
      sessionStorage.removeItem('havalepaymentData');
      sessionStorage.removeItem('bankTransferKind');
      sessionStorage.removeItem('bankTransferConfig');
      localStorage.removeItem('guestCart');

      toast.success('Ödeme bildiriminiz alındı');
      navigate('/odeme-beklemede');
    } catch (e) {
      console.error(e);
      toast.error('İşlem sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-muted-foreground">Yükleniyor...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              Havale / EFT Bilgileri
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />

            <div className="bg-muted p-4 rounded whitespace-pre-wrap text-sm">
              {bankInfoText || 'Banka bilgisi bulunamadı.'}
            </div>

            <Separator />

            <Button
              size="lg"
              className="w-full"
              disabled={submitting || (!isExistingOrder && !paymentData)}
              onClick={() => void handleConfirm()}
            >
              {submitting ? 'Gönderiliyor…' : 'Ödemeyi Yaptım'}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
