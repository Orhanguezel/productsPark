// =============================================================
// FILE: src/pages/public/Checkout.tsx
// FINAL
// - FE does NOT send email/telegram (backend handles)
// - Coupon used_count RPC removed (backend redeems atomically)
// - All enabled payment methods are available (backend-driven)
// - Helpers moved to ./checkout/checkout.utils
// - Types/helpers imported from integrations/types barrel
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
  useCreatePaymentRequestMutation,
  useDeleteCartItemMutation,
  useGetMyProfileQuery,
  useGetMyWalletBalanceQuery,
  useGetPublicPaymentMethodsQuery,
  usePaytrGetTokenMutation,
  useShopierCreatePaymentMutation,
} from '@/integrations/hooks';

import type {
  CheckoutData,
  CreateOrderBody,
  OrderPaymentMethod,
  PublicPaymentMethod,
} from '@/integrations/types';

import { normalizeCheckoutData, toNum, toBool, isPlainObject } from '@/integrations/types';

import type { CheckoutPaymentMethodOption } from '@/integrations/types';

import {
  type BankTransferKind,
  buildCheckoutPaymentOptions,
  buildOrderItemsFromCheckout,
  extractWalletBalance,
  getCheckoutTotal,
  getCommissionRateFromMethod,
  money2,
  extractCustomerInfo
} from './checkout.utils';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(false);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Payment
  const [paymentMethods, setPaymentMethods] = useState<CheckoutPaymentMethodOption[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [bankTransferKind, setBankTransferKind] = useState<BankTransferKind>('havale');

  // Wallet
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const { data: publicMethodsResp } = useGetPublicPaymentMethodsQuery();
  const { data: profileData } = useGetMyProfileQuery();

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

  const [deleteCartItem] = useDeleteCartItemMutation();

  // ----------------------------------------------------------
  // 0) Auth guard
  // ----------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error('Lütfen giriş yapın');
      navigate('/giris', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ----------------------------------------------------------
  // 1) load checkoutData from sessionStorage
  // ----------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const raw = sessionStorage.getItem('checkoutData');
    if (!raw) {
      toast.error('Sepetinizde ürün bulunmuyor');
      navigate('/sepet', { replace: true });
      return;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      const normalized = normalizeCheckoutData(parsed);

      const cartItems = (normalized as any)?.cartItems;
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        toast.error('Sepetinizde ürün bulunmuyor');
        navigate('/sepet', { replace: true });
        return;
      }

      setCheckoutData(normalized as CheckoutData);
    } catch (err) {
      // do not mask failures
      console.error('Checkout data parse error:', err);
      toast.error('Bir hata oluştu');
      navigate('/sepet', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ----------------------------------------------------------
  // 2) profile -> customer info
  // ----------------------------------------------------------
 useEffect(() => {
   if (!user) return;

   const info = extractCustomerInfo(profileData, user);

   // Only hydrate if currently empty (do not overwrite user's edits)
   setCustomerName((prev) => (prev.trim() ? prev : info.name));
   setCustomerEmail((prev) => (prev.trim() ? prev : info.email));
   setCustomerPhone((prev) => (prev.trim() ? prev : info.phone));
 }, [user, profileData]);

  // ----------------------------------------------------------
  // 3) wallet balance (authoritative)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    if (walletBalanceError) {
      console.error('wallet balance error:', walletBalanceErrObj);
      // fallback to profile field if present
      setWalletBalance(toNum((profileData as any)?.wallet_balance, 0));
      return;
    }

    if (typeof walletBalanceRaw !== 'undefined') {
      setWalletBalance(extractWalletBalance(walletBalanceRaw, 0));
      return;
    }

    // fallback
    if (profileData) setWalletBalance(toNum((profileData as any)?.wallet_balance, 0));
  }, [user, walletBalanceRaw, walletBalanceError, walletBalanceErrObj, profileData]);

  // ----------------------------------------------------------
  // 4) public payment methods -> UI options
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
      if (prev && next.some((m) => m.id === prev)) return prev;
      return String(first);
    });
  }, [publicMethodsResp, user, bankTransferKind]);

  const selectedPublicMethod = useMemo(() => {
    const methods = publicMethodsResp?.methods ?? [];
    if (!Array.isArray(methods) || !selectedPayment) return null;
    return (
      (methods as PublicPaymentMethod[]).find((m) => (m as any)?.key === selectedPayment) ?? null
    );
  }, [publicMethodsResp, selectedPayment]);

  const commissionRate = useMemo(() => {
    // wallet has no commission on FE (if backend wants commission, it should return total already)
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

  const goBankTransferInfo = async () => {
    if (!checkoutData) return;

    try {
      const cfg = isPlainObject((selectedPublicMethod as any)?.config)
        ? ((selectedPublicMethod as any).config as Record<string, unknown>)
        : null;

      // keep existing flow: store details for the bank transfer info page
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

    // bank transfer = separate info page
    if (selectedPayment === 'bank_transfer') {
      await goBankTransferInfo();
      return;
    }

    const checkoutTotal = getCheckoutTotal(checkoutData);
    const commission =
      selectedPayment && selectedPayment !== 'wallet' ? (checkoutTotal * commissionRate) / 100 : 0;
    const finalTotal = checkoutTotal + commission;

    // wallet guard (client-side)
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

      // 1) Create order (backend will handle notifications/emails/telegram)
      const order = await createOrder(body).unwrap();

      // 2) Wallet = done
      if (selectedPayment === 'wallet') {
        await clearCartAfterOrder();
        navigate('/odeme-basarili');
        return;
      }

      // 3) For non-wallet methods, create payment request/session (backend-specific)
      //    If your backend creates it automatically, you can remove this block.
      const pr = await createPaymentRequest({
        order_id: (order as any).id,
        user_id: user.id ?? null,
        amount: money2(finalTotal),
        currency: (publicMethodsResp as any)?.currency ?? 'TRY',
        payment_method: paymentMethod,
        proof_image_url: null,
        status: 'pending',
      }).unwrap();

      // 4) Provider-specific flows
      if (selectedPayment === 'paytr') {
        // Expect paytrGetToken to return token or redirect url (depends on your BE)
        const tokRes = await paytrGetToken({
          order_id: (order as any).id,
          payment_request_id: (pr as any)?.id ?? null,
        } as any).unwrap();

        sessionStorage.setItem(
          'paytr_checkout',
          JSON.stringify({ order, payment_request: pr, token: tokRes }),
        );
        await clearCartAfterOrder();

        // route name can differ in your app
        navigate('/paytr-odeme');
        return;
      }

      if (selectedPayment === 'shopier') {
        // Expect { form_action, form_data } or redirect url
        const shRes = await shopierCreatePayment({
          order_id: (order as any).id,
          payment_request_id: (pr as any)?.id ?? null,
        } as any).unwrap();

        sessionStorage.setItem(
          'shopier_checkout',
          JSON.stringify({ order, payment_request: pr, shopier: shRes }),
        );
        await clearCartAfterOrder();

        // route name can differ in your app
        navigate('/shopier-odeme');
        return;
      }

      // 5) Generic methods (credit_card / provider keys): go to payment notification / status page
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
