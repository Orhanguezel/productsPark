// =============================================================
// FILE: src/pages/public/checkout/Checkout.tsx   (Routes'taki path'e göre)
// FINAL — Create payment_session and always navigate to existing routes
// Fixes:
// - NO /paytr-odeme, /shopier-odeme navigation (route yok)
// - Always creates payment_session (public endpoint) => session id exists
// - PaymentIframe can render via session id
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
  useCreateOrderMutation,
  useCreatePaymentSessionMutation,
  useCreatePaymentRequestMutation,
  useDeleteCartItemMutation,
  useGetMyProfileQuery,
  useGetMyWalletBalanceQuery,
  useGetPublicPaymentMethodsQuery,
  useGetSiteSettingByKeyQuery,
  useListCartItemsQuery,
} from '@/integrations/hooks';

import type {
  CheckoutData,
  CreateOrderBody,
  OrderPaymentMethod,
  PublicPaymentMethod,
} from '@/integrations/types';

import { normalizeCheckoutData, toNum, isPlainObject, toTrimStr } from '@/integrations/types';
import type { CheckoutPaymentMethodOption } from '@/integrations/types';

import {
  type BankTransferKind,
  buildCheckoutPaymentOptions,
  buildOrderItemsFromCheckout,
  extractWalletBalance,
  getCheckoutTotal,
  getCommissionRateFromMethod,
  resolveCartItemPricing,
  money2,
  extractCustomerInfo,
} from './checkout.utils';

function isAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const s = (err as { status?: unknown }).status;
  return s === 401 || s === 403;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsFallback, setNeedsFallback] = useState(false);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Payment
  const [paymentMethods, setPaymentMethods] = useState<CheckoutPaymentMethodOption[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>(''); // provider_key
  const [bankTransferKind, setBankTransferKind] = useState<BankTransferKind>('havale');

  // Wallet
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const { data: publicMethodsResp } = useGetPublicPaymentMethodsQuery();
  const { data: profileData } = useGetMyProfileQuery();
  const { data: paytrDevIpSetting } = useGetSiteSettingByKeyQuery('paytr_dev_user_ip', {
    skip: selectedPayment !== 'paytr',
  });

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
  const [createPaymentSession] = useCreatePaymentSessionMutation();
  const [createPaymentRequest] = useCreatePaymentRequestMutation();
  const [deleteCartItem] = useDeleteCartItemMutation();

  const {
    data: fallbackCartItems = [],
    isLoading: fallbackCartLoading,
    isFetching: fallbackCartFetching,
  } = useListCartItemsQuery(
    user
      ? {
          user_id: user.id,
          with: 'products',
          sort: 'created_at',
          order: 'desc',
        }
      : undefined,
    {
      skip: !user || !needsFallback,
    },
  );

  // ----------------------------------------------------------
  // Auth guard
  // ----------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error('Lütfen giriş yapın');
      navigate('/giris', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ----------------------------------------------------------
  // checkoutData from sessionStorage
  // ----------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const raw = sessionStorage.getItem('checkoutData');
    if (!raw) {
      setNeedsFallback(true);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      const normalized = normalizeCheckoutData(parsed);

      const cartItems = (normalized as any)?.cartItems;
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        setNeedsFallback(true);
        return;
      }

      setCheckoutData(normalized as CheckoutData);
      setNeedsFallback(false);
    } catch (err) {
      console.error('Checkout data parse error:', err);
      setNeedsFallback(true);
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!needsFallback || !user) return;
    if (fallbackCartLoading || fallbackCartFetching) return;

    const rows = Array.isArray(fallbackCartItems) ? fallbackCartItems : [];
    if (!rows.length) {
      toast.error('Sepetinizde ürün bulunmuyor');
      navigate('/sepet', { replace: true });
      setNeedsFallback(false);
      return;
    }

    const subtotal = rows.reduce((sum, item) => {
      const pricing = resolveCartItemPricing(item as any);
      return sum + pricing.totalPrice;
    }, 0);

    const next: CheckoutData = {
      cartItems: rows as any,
      subtotal,
      discount: 0,
      total: subtotal,
      appliedCoupon: null,
    };

    try {
      sessionStorage.setItem('checkoutData', JSON.stringify(next));
    } catch (err) {
      console.warn('checkoutData sessionStorage write failed:', err);
    }

    setCheckoutData(next);
    setNeedsFallback(false);
  }, [
    needsFallback,
    user,
    fallbackCartItems,
    fallbackCartLoading,
    fallbackCartFetching,
    navigate,
  ]);

  // ----------------------------------------------------------
  // profile -> customer info
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const info = extractCustomerInfo(profileData, user);
    setCustomerName((prev) => (prev.trim() ? prev : info.name));
    setCustomerEmail((prev) => (prev.trim() ? prev : info.email));
    setCustomerPhone((prev) => (prev.trim() ? prev : info.phone));
  }, [user, profileData]);

  // ----------------------------------------------------------
  // wallet balance
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    if (walletBalanceError) {
      console.error('wallet balance error:', walletBalanceErrObj);
      setWalletBalance(toNum((profileData as any)?.wallet_balance, 0));
      return;
    }

    if (typeof walletBalanceRaw !== 'undefined') {
      setWalletBalance(extractWalletBalance(walletBalanceRaw, 0));
      return;
    }

    if (profileData) setWalletBalance(toNum((profileData as any)?.wallet_balance, 0));
  }, [user, walletBalanceRaw, walletBalanceError, walletBalanceErrObj, profileData]);

  // ----------------------------------------------------------
  // public methods -> options
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const methods = (publicMethodsResp?.methods ?? []) as PublicPaymentMethod[];
    if (!Array.isArray(methods)) return;

    const next = buildCheckoutPaymentOptions({
      methods,
      bankTransferKind,
      ensureWallet: true,
    });

    setPaymentMethods(next);

    const first = next[0]?.id ?? '';
    setSelectedPayment((prev) => {
      const prevKey = toTrimStr(prev);
      if (prevKey && next.some((m) => m.id === prevKey)) return prevKey;
      return String(first);
    });
  }, [publicMethodsResp, user, bankTransferKind]);

  const selectedPublicMethod = useMemo(() => {
    const methods = publicMethodsResp?.methods ?? [];
    if (!Array.isArray(methods) || !selectedPayment) return null;

    const key = toTrimStr(selectedPayment);
    return (
      (methods as PublicPaymentMethod[]).find((m) => toTrimStr((m as any)?.key) === key) ?? null
    );
  }, [publicMethodsResp, selectedPayment]);

  const paytrDevIp = useMemo(() => {
    const v = (paytrDevIpSetting as any)?.value;
    return typeof v === 'string' ? v.trim() : '';
  }, [paytrDevIpSetting]);

  const commissionRate = useMemo(() => {
    if (!selectedPayment || selectedPayment === 'wallet') return 0;
    return getCommissionRateFromMethod(selectedPublicMethod);
  }, [selectedPayment, selectedPublicMethod]);

  const clearCartAfterOrder = async () => {
    if (!checkoutData) return;

    try {
      const items = (checkoutData as any).cartItems as any[];
      if (!Array.isArray(items)) return;

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

  const buildPaytrBasket = (
    items: Array<{ product_name?: string; price?: string | number; quantity?: number }>,
    commissionAmount: number,
  ): Array<[string, string, number]> => {
    const basket: Array<[string, string, number]> = [];

    for (const it of items) {
      const name = String(it?.product_name ?? '').trim();
      if (!name) continue;
      const unit = money2(toNum(it?.price, 0));
      const qty = Math.max(1, Number(it?.quantity ?? 1));
      basket.push([name, unit, qty]);
    }

    if (commissionAmount > 0) {
      basket.push(['Ödeme Komisyonu', money2(commissionAmount), 1]);
    }

    return basket;
  };

  const goBankTransferInfo = async () => {
    if (!checkoutData) return;

    try {
      const cfg = isPlainObject((selectedPublicMethod as any)?.config)
        ? ((selectedPublicMethod as any).config as Record<string, unknown>)
        : null;

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

      navigate('/odeme-bilgileri');
    } catch (err) {
      console.error('Bank transfer navigate error:', err);
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu');
    }
  };

  const handleSubmit = async () => {
    if (!checkoutData || !user) return;

    if (!customerName.trim()) return void toast.error('Lütfen ad soyad girin');
    if (!customerEmail.trim()) return void toast.error('Lütfen e-posta adresinizi girin');
    if (!customerPhone.trim()) return void toast.error('Lütfen telefon numaranızı girin');

    if (selectedPayment === 'bank_transfer') {
      await goBankTransferInfo();
      return;
    }

    const checkoutTotal = getCheckoutTotal(checkoutData);
    const commission =
      selectedPayment && selectedPayment !== 'wallet' ? (checkoutTotal * commissionRate) / 100 : 0;
    const finalTotal = checkoutTotal + commission;

    if (selectedPayment === 'wallet' && walletBalance < finalTotal) {
      toast.error('Yetersiz cüzdan bakiyesi');
      return;
    }

    try {
      setLoading(true);

      const orderNumber = `ORD${Date.now()}`;
      const items = buildOrderItemsFromCheckout(checkoutData);

      const paymentMethod = (selectedPayment || 'credit_card') as OrderPaymentMethod;
      const couponCode = (checkoutData as any)?.appliedCoupon?.code ?? null;

      const body: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: paymentMethod,
        payment_status: selectedPayment === 'wallet' ? 'paid' : 'pending',
        items,
        subtotal: money2(toNum((checkoutData as any).subtotal, 0)),
        discount: money2(toNum((checkoutData as any).discount, 0)),
        total: money2(finalTotal),
        ...(couponCode ? { coupon_code: couponCode } : {}),
        ...(typeof (checkoutData as any).notes === 'string'
          ? { notes: (checkoutData as any).notes }
          : (checkoutData as any).notes === null
            ? { notes: null }
            : {}),
      };

      const order = await createOrder(body).unwrap();

      if (selectedPayment === 'wallet') {
        await clearCartAfterOrder();
        navigate('/odeme-basarili');
        return;
      }

      // BEST-EFFORT payment_request (auth fail patlatmaz)
      let paymentRequestId: string | null = null;
      try {
        const pr = await createPaymentRequest({
          order_id: (order as any).id,
          user_id: user.id ?? null,
          amount: money2(finalTotal),
          currency: (publicMethodsResp as any)?.currency ?? 'TRY',
          payment_method: paymentMethod,
          proof_image_url: null,
          payment_proof: null,
          status: 'pending',
        } as any).unwrap();

        paymentRequestId = (pr as any)?.id ? String((pr as any).id) : null;
      } catch (e) {
        if (!isAuthError(e)) console.error('createPaymentRequest failed:', e);
      }

      // ✅ PayTR
      if (selectedPayment === 'paytr' || selectedPayment === 'shopier') {
        const currency = (publicMethodsResp as any)?.currency ?? 'TRY';
        const basket = buildPaytrBasket(items, commission);

        const meta = {
          payment_request_id: paymentRequestId,
          basket,
          user_phone: customerPhone,
          user_address: 'N/A',
          product_name: `Sipariş ${orderNumber}`,
          ...(paytrDevIp ? { dev_user_ip: paytrDevIp } : {}),
        };

        const session = await createPaymentSession({
          provider_key: selectedPayment,
          order_id: (order as any).id,
          amount: finalTotal,
          currency,
          customer: {
            id: user.id ?? undefined,
            email: customerEmail,
            name: customerName,
          },
          meta,
        }).unwrap();

        const sessionId = String((session as any)?.id ?? '').trim();
        if (!sessionId) throw new Error('payment_session_id_missing');

        sessionStorage.setItem(
          'payment_session',
          JSON.stringify({
            id: sessionId,
            provider_key: selectedPayment,
            order_id: (order as any).id,
            payment_request_id: paymentRequestId,
          }),
        );

        await clearCartAfterOrder();
        navigate(`/odeme-iframe?session_id=${encodeURIComponent(sessionId)}`);
        return;
      }

      await clearCartAfterOrder();
      navigate('/odeme-bildirimi');
    } catch (err) {
      console.error('Checkout error:', err);
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

  const total = getCheckoutTotal(checkoutData);
  const commission =
    selectedPayment && selectedPayment !== 'wallet' ? (total * commissionRate) / 100 : 0;
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
