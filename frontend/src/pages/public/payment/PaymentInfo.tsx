// =============================================================
// FILE: src/pages/account/components/PaymentInfo.tsx
// FINAL — Havale flow (order only; NO payment_requests call)
// - Fix: bankSetting.value JsonLike -> string render
// - Fix: prevent early redirect while auth is loading
// - Fix: remove auth-required /payment_requests (401) usage
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

type PaymentSessionData = {
  cartItems: Array<{
    products: { id: string; name: string; price?: number | string };
    quantity?: number;
    selected_options?: unknown;
  }>;
  subtotal?: number | string;
  discount?: number | string;
  total?: number | string;
  appliedCoupon?: { code?: string } | null;
  notes?: string | null;
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

  // -------- load session storage (new flow) + auth gating --------
  useEffect(() => {
    // Existing order route: we still require login, but we don't need session payload
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
    return bankSetting ? jsonLikeToDisplayText(bankSetting.value) : '';
  }, [bankSetting]);

  const pageLoading = authLoading || bankLoading;

  const handleConfirm = async () => {
    if (authLoading) return;

    if (!user) {
      toast.error('Oturum bulunamadı. Lütfen giriş yapın.');
      navigate('/giris');
      return;
    }

    // Existing order: bu sayfada artık payment_request yaratmıyoruz.
    // Backend akışında zaten oluşturulmuş olmalı; burada sadece UX yönlendiriyoruz.
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
        const price = Number(i.products.price ?? 0);
        const qty = Number(i.quantity ?? 1);
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

      const subtotal = Number(paymentData.subtotal ?? 0) || 0;
      const discount = Number(paymentData.discount ?? 0) || 0;
      const total =
        paymentData.total != null ? Number(paymentData.total) || 0 : subtotal - discount;

      const couponCode: string | null =
        paymentData.appliedCoupon?.code && String(paymentData.appliedCoupon.code).trim()
          ? String(paymentData.appliedCoupon.code).trim()
          : null;

      const orderBody: CreateOrderBody = {
        order_number: `ORD${Date.now()}`,
        payment_method: 'bank_transfer',
        payment_status: 'pending',
        items,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        coupon_code: couponCode, // ✅ string | null (undefined yok)
        notes: paymentData.notes ?? null,
      };

      await createOrder(orderBody).unwrap();

      // local caches temizliği
      sessionStorage.removeItem('checkoutData');
      sessionStorage.removeItem('havalepaymentData');
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
              onClick={handleConfirm}
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
