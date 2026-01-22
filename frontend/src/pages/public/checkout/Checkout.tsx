// =============================================================
// FILE: src/pages/public/Checkout.tsx  (FINAL)
// - Wallet balance is always number (safe coercion)
// - Do NOT silently display 0 when API fails (log errors)
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

import { CheckoutCustomerInfoCard } from './components/CheckoutCustomerInfoCard';
import { CheckoutPaymentMethodsCard } from './components/CheckoutPaymentMethodsCard';
import { CheckoutOrderSummaryCard } from './components/CheckoutOrderSummaryCard';

import {
  useCallRpcMutation,
  useCreateOrderMutation,
  useCreatePaymentRequestMutation,
  useDeleteCartItemMutation,
  useGetMyProfileQuery,
  useGetMyWalletBalanceQuery,
  useGetSiteSettingByKeyQuery,
  usePaytrGetTokenMutation,
  useSendEmailMutation,
  useSendTelegramNotificationMutation,
  useShopierCreatePaymentMutation,
  useGetPublicPaymentMethodsQuery,
} from '@/integrations/hooks';

import type {
  CreateOrderBody,
  CreateOrderItemBody,
  CheckoutData,
  OrderPaymentMethod,
  PublicPaymentMethod,
} from '@/integrations/types';

import { normalizeCheckoutData, CheckoutPaymentMethodOption } from '@/integrations/types';

/* ---------------- helpers ---------------- */

type BankTransferKind = 'havale' | 'eft';

const isRecord = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

const optStr = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s : undefined;
};

const toNum = (v: unknown, d = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : d;
  }
  if (v && typeof v === 'object') {
    const rec = v as Record<string, unknown>;
    if (rec.balance != null) return toNum(rec.balance, d);
    if (rec.data && typeof rec.data === 'object' && (rec.data as any).balance != null) {
      return toNum((rec.data as any).balance, d);
    }
  }
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : d;
};

const getCommissionRateFromMethod = (m?: PublicPaymentMethod | null): number => {
  if (!m) return 0;

  const cr = (m as unknown as Record<string, unknown>)['commission_rate'];
  if (typeof cr === 'number' && Number.isFinite(cr)) return cr;

  const cfg = isRecord((m as any).config) ? ((m as any).config as Record<string, unknown>) : null;
  const c = cfg ? (cfg as any).commission : undefined;
  return toNum(c, 0);
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(false);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [paymentMethods, setPaymentMethods] = useState<CheckoutPaymentMethodOption[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>('');

  const [bankTransferKind, setBankTransferKind] = useState<BankTransferKind>('havale');
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const { data: publicMethodsResp } = useGetPublicPaymentMethodsQuery();

  const { data: siteTitleSetting } = useGetSiteSettingByKeyQuery('site_title');
  const { data: newOrderTelegramSetting } = useGetSiteSettingByKeyQuery('new_order_telegram');
  const { data: newPaymentRequestTelegramSetting } = useGetSiteSettingByKeyQuery(
    'new_payment_request_telegram',
  );

  const { data: profileData } = useGetMyProfileQuery();

  // ❗️default 0 yok, hatayı gizlemiyoruz
  const {
    data: walletBalanceRaw,
    isError: walletBalanceError,
    error: walletBalanceErrObj,
  } = useGetMyWalletBalanceQuery(undefined, {
    skip: !user,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [createOrder] = useCreateOrderMutation();
  const [createPaymentRequest] = useCreatePaymentRequestMutation();

  const [paytrGetToken] = usePaytrGetTokenMutation();
  const [shopierCreatePayment] = useShopierCreatePaymentMutation();
  const [sendEmail] = useSendEmailMutation();
  const [sendTelegramNotification] = useSendTelegramNotificationMutation();

  const [callRpc] = useCallRpcMutation();
  const [deleteCartItem] = useDeleteCartItemMutation();

  // ----------------------------------------------------------
  // 0) guests kapalı: checkout sayfasına auth şartı
  // ----------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error('Lütfen giriş yapın');
      navigate('/giris', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ----------------------------------------------------------
  // 1) İlk yükleme: checkoutData
  // ----------------------------------------------------------
  useEffect(() => {
    const initCheckout = async () => {
      const raw = sessionStorage.getItem('checkoutData');

      if (!raw) {
        toast.error('Sepetinizde ürün bulunmuyor');
        navigate('/sepet', { replace: true });
        return;
      }

      try {
        const parsed: unknown = JSON.parse(raw);
        const normalized = normalizeCheckoutData(parsed);

        if (
          !normalized ||
          !Array.isArray((normalized as any).cartItems) ||
          (normalized as any).cartItems.length === 0
        ) {
          toast.error('Sepetinizde ürün bulunmuyor');
          navigate('/sepet', { replace: true });
          return;
        }

        setCheckoutData(normalized as CheckoutData);
      } catch (error) {
        console.error('Checkout data parse error:', error);
        toast.error('Bir hata oluştu');
        navigate('/sepet', { replace: true });
      }
    };

    if (authLoading) return;
    if (!user) return;
    void initCheckout();
  }, [authLoading, user, navigate]);

  // ----------------------------------------------------------
  // 2) Profil bilgisi → customer info
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user || !profileData) return;
    setCustomerName(profileData.full_name ?? '');
    setCustomerEmail(user.email ?? '');
    setCustomerPhone(profileData.phone ?? '');
  }, [user, profileData]);

  // ----------------------------------------------------------
  // 2.b) Wallet balance (authoritative)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    if (walletBalanceError) {
      console.error('wallet balance error:', walletBalanceErrObj);
      // fallback: profile’dan varsa
      const fallback = toNum((profileData as any)?.wallet_balance, 0);
      setWalletBalance(fallback);
      return;
    }

    if (walletBalanceRaw !== undefined) {
      setWalletBalance(toNum(walletBalanceRaw, 0));
      return;
    }

    // fallback
    if (profileData) setWalletBalance(toNum((profileData as any)?.wallet_balance, 0));
  }, [user, walletBalanceRaw, walletBalanceError, walletBalanceErrObj, profileData]);

  // ----------------------------------------------------------
  // 3) public/payment-methods → paymentMethods (UI)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!publicMethodsResp) return;
    if (!user) return;

    const next: CheckoutPaymentMethodOption[] = [];

    const backendMethods = (publicMethodsResp.methods || [])
      .filter((m) => m && m.enabled)
      .map((m) => {
        const id = String(m.key || '').trim();
        const name = String(m.display_name || m.key || '').trim() || id;

        if (m.type === 'bank_transfer') {
          const cfg = isRecord(m.config) ? m.config : null;

          const hv =
            cfg && isRecord((cfg as any).havale)
              ? ((cfg as any).havale as Record<string, unknown>)
              : null;

          const ef =
            cfg && isRecord((cfg as any).eft) ? ((cfg as any).eft as Record<string, unknown>) : null;

          const fallback = (bankTransferKind === 'eft' ? ef : hv) ?? hv ?? ef;

          return {
            id,
            name,
            enabled: true,
            ...(fallback && optStr((fallback as any).iban)
              ? { iban: String((fallback as any).iban) }
              : {}),
            ...(fallback && optStr((fallback as any).account_holder)
              ? { account_holder: String((fallback as any).account_holder) }
              : {}),
            ...(fallback && optStr((fallback as any).bank_name)
              ? { bank_name: String((fallback as any).bank_name) }
              : {}),
          } satisfies CheckoutPaymentMethodOption;
        }

        return { id, name, enabled: true } satisfies CheckoutPaymentMethodOption;
      });

    next.push(...backendMethods);

    if (!next.some((x) => String((x as any).id) === 'wallet')) {
      next.unshift({ id: 'wallet', name: 'Cüzdan', enabled: true } as CheckoutPaymentMethodOption);
    }

    setPaymentMethods(next);

    const first = next.length ? next[0] : undefined;
    setSelectedPayment((prev) => {
      if (prev && next.some((m) => String((m as any).id) === prev)) return prev;
      return String((first as any)?.id ?? '');
    });
  }, [publicMethodsResp, user, bankTransferKind]);

  const selectedPublicMethod = useMemo(() => {
    if (!publicMethodsResp?.methods?.length) return null;
    if (!selectedPayment) return null;
    return publicMethodsResp.methods.find((m) => m.key === selectedPayment) ?? null;
  }, [publicMethodsResp, selectedPayment]);

  const commissionRate = useMemo(() => {
    if (!selectedPayment || selectedPayment === 'wallet') return 0;
    return getCommissionRateFromMethod(selectedPublicMethod);
  }, [selectedPayment, selectedPublicMethod]);

  const buildOrderItems = (): CreateOrderItemBody[] => {
    if (!checkoutData) return [];
    const items = (checkoutData as any).cartItems as any[];

    return items.map((item) => {
      const priceNum = Number(item?.products?.price ?? 0);
      const quantityNum = Number(item?.quantity ?? 1);
      const totalNum = priceNum * quantityNum;

      return {
        product_id: String(item?.products?.id ?? ''),
        product_name: String(item?.products?.name ?? ''),
        quantity: quantityNum,
        price: priceNum.toFixed(2),
        total: totalNum.toFixed(2),
        options: item?.selected_options ?? null,
      };
    });
  };

  const incrementCouponUsage = async () => {
    const coupon = (checkoutData as any)?.appliedCoupon;
    if (!coupon?.id) return;

    try {
      await callRpc({
        name: 'exec_sql',
        args: { sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${coupon.id}'` },
      }).unwrap();
    } catch (err) {
      console.error('Coupon usage increment RPC error:', err);
    }
  };

  const clearCartAfterOrder = async () => {
    if (!checkoutData) return;

    try {
      const items = (checkoutData as any).cartItems as any[];
      await Promise.all(
        items.map(async (ci) => {
          if (!ci?.id) return;
          try {
            await deleteCartItem(ci.id).unwrap();
          } catch (err) {
            console.error('Delete cart item error:', err);
          }
        }),
      );
    } catch (cleanupError) {
      console.error('Cart cleanup error:', cleanupError);
    } finally {
      sessionStorage.removeItem('checkoutData');
    }
  };

  const goBankTransferInfo = async () => {
    if (!checkoutData) return;

    try {
      const cfg = isRecord(selectedPublicMethod?.config)
        ? (selectedPublicMethod!.config as Record<string, unknown>)
        : null;

      const hv =
        cfg && isRecord((cfg as any).havale)
          ? ((cfg as any).havale as Record<string, unknown>)
          : null;

      const ef =
        cfg && isRecord((cfg as any).eft) ? ((cfg as any).eft as Record<string, unknown>) : null;

      const selectedAccount = bankTransferKind === 'eft' ? (ef ?? hv) : (hv ?? ef);

      const paymentData = {
        customerName,
        customerEmail,
        customerPhone,
        cartItems: (checkoutData as any).cartItems,
        subtotal: (checkoutData as any).subtotal,
        discount: (checkoutData as any).discount,
        total: (checkoutData as any).total,
        appliedCoupon: (checkoutData as any).appliedCoupon,
        paymentMethod: selectedPayment,
        notes: (checkoutData as any).notes,
      };

      sessionStorage.setItem('havalepaymentData', JSON.stringify(paymentData));
      sessionStorage.setItem('bankTransferKind', bankTransferKind);
      sessionStorage.setItem('bankTransferConfig', JSON.stringify(cfg ?? null));
      sessionStorage.setItem('bankTransferAccount', JSON.stringify(selectedAccount ?? null));

      navigate('/odeme-bilgileri');
    } catch (error) {
      console.error('Bank transfer navigate error:', error);
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    }
  };

  const handleSubmit = async () => {
    if (!checkoutData) return;
    if (!user) return;

    if (!customerName.trim()) return void toast.error('Lütfen ad soyad girin');
    if (!customerEmail.trim()) return void toast.error('Lütfen e-posta adresinizi girin');
    if (!customerPhone.trim()) return void toast.error('Lütfen telefon numaranızı girin');

    if (selectedPayment === 'bank_transfer') return void (await goBankTransferInfo());

    if (selectedPayment === 'paytr') return;
    if (selectedPayment === 'shopier') return;

    const checkoutTotal = toNum((checkoutData as any)?.total, 0);

    if (selectedPayment === 'wallet' && walletBalance < checkoutTotal) {
      toast.error('Yetersiz cüzdan bakiyesi');
      return;
    }

    try {
      setLoading(true);

      const orderNumber = `ORD${Date.now()}`;
      const items = buildOrderItems();

      const paymentMethod: OrderPaymentMethod =
        (selectedPayment || 'credit_card') as OrderPaymentMethod;

      const couponCode = (checkoutData as any)?.appliedCoupon?.code ?? null;

      const body: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: paymentMethod,
        payment_status: selectedPayment === 'wallet' ? 'paid' : 'pending',
        items,
        subtotal: (checkoutData as any).subtotal,
        discount: (checkoutData as any).discount,
        total: (checkoutData as any).total,
        ...(couponCode ? { coupon_code: couponCode } : {}),
        ...(typeof (checkoutData as any).notes === 'string'
          ? { notes: (checkoutData as any).notes }
          : (checkoutData as any).notes === null
            ? { notes: null }
            : {}),
      };

      const order = await createOrder(body).unwrap();
      if ((checkoutData as any).appliedCoupon) await incrementCouponUsage();

      const isNewOrderTelegramEnabled =
        newOrderTelegramSetting?.value === true || newOrderTelegramSetting?.value === 'true';

      if (selectedPayment === 'wallet' || (order as any).payment_status === 'paid') {
        try {
          if (isNewOrderTelegramEnabled) {
            await sendTelegramNotification({ type: 'new_order', orderId: (order as any).id } as any).unwrap();
          }
        } catch (telegramError) {
          console.error('Telegram notification error:', telegramError);
        }
      }

      try {
        const siteTitle = typeof siteTitleSetting?.value === 'string' ? siteTitleSetting.value : '';
        const safeTitle = siteTitle || 'Dijital Market';
        const statusText = selectedPayment === 'wallet' ? 'Ödendi' : 'Beklemede';

        await sendEmail({
          to: customerEmail,
          subject: `${safeTitle} - Siparişiniz alındı (${orderNumber})`,
          text: `Merhaba ${customerName},

${safeTitle} üzerinden verdiğiniz ${orderNumber} numaralı siparişiniz alındı.

Toplam tutar: ${toNum((checkoutData as any).total, 0).toFixed(2)} TL.
Ödeme durumu: ${statusText}.

Teşekkürler.`,
        }).unwrap();
      } catch (emailError) {
        console.error('Order received email error:', emailError);
      }

      if (selectedPayment === 'wallet') {
        await clearCartAfterOrder();
        navigate('/odeme-basarili');
        return;
      }

      await createPaymentRequest({
        order_id: (order as any).id,
        user_id: user.id ?? null,
        amount: (checkoutData as any).total,
        currency: publicMethodsResp?.currency ?? 'TRY',
        payment_method: paymentMethod,
        proof_image_url: null,
        status: 'pending',
      }).unwrap();

      const isPaymentTelegramEnabled =
        newPaymentRequestTelegramSetting?.value === true ||
        newPaymentRequestTelegramSetting?.value === 'true';

      try {
        if (isPaymentTelegramEnabled) {
          await sendTelegramNotification({
            type: 'new_payment_request',
            paymentRequestId: (order as any).payment_request_id ?? undefined,
          } as any).unwrap();
        }
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError);
      }

      await clearCartAfterOrder();
      navigate('/odeme-bildirimi');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Sipariş oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || !checkoutData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">Yükleniyor...</div>
        <Footer />
      </div>
    );
  }

  const total = toNum((checkoutData as any).total, 0);
  const commission = selectedPayment && selectedPayment !== 'wallet' ? (total * commissionRate) / 100 : 0;
  const finalTotal = total + commission;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/sepet')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sepete Dön
          </Button>

          <h1 className="text-4xl font-bold mb-8">Ödeme</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CheckoutCustomerInfoCard
                customerName={customerName}
                customerEmail={customerEmail}
                customerPhone={customerPhone}
                setCustomerName={setCustomerName}
                setCustomerEmail={setCustomerEmail}
                setCustomerPhone={setCustomerPhone}
              />

              <CheckoutPaymentMethodsCard
                paymentMethods={paymentMethods}
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
                walletBalance={walletBalance}
                finalTotal={finalTotal}
                loading={loading}
              />
            </div>

            <div className="lg:col-span-1">
              <CheckoutOrderSummaryCard
                checkoutData={checkoutData}
                selectedPayment={selectedPayment}
                commissionRate={commissionRate}
                commission={commission}
                finalTotal={finalTotal}
                onSubmit={handleSubmit}
                loading={loading}
                walletBalance={walletBalance}
              />
            </div>
          </div>

          {walletBalanceError && (
            <div className="mt-4 text-xs text-muted-foreground">
              Cüzdan bakiyesi alınamadı. Konsolu kontrol edin.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
