// =============================================================
// FILE: src/pages/account/components/PaymentInfo.tsx
// =============================================================
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, CheckCircle } from "lucide-react";

import {
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  type CreateOrderBody,
} from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import { useGetSiteSettingByKeyQuery } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";
import {
  useCreatePaymentRequestMutation,
} from "@/integrations/metahub/rtk/endpoints/payment_requests.endpoints";
import {
  useSendTelegramNotificationMutation,
} from "@/integrations/metahub/rtk/endpoints/functions.endpoints";
import type { OrderView as Order } from "@/integrations/metahub/rtk/types";

const toStringOrNull = (v: unknown): string | null =>
  typeof v === "string" ? v : v == null ? null : String(v);

const truthy = (v: unknown) =>
  v === true || v === "true" || v === "1" || v === 1;

// SessionStorage'dan gelen havale ödeme datası için basit tip
type PaymentSessionData = {
  cartItems?: Array<{
    products: {
      id: string;
      name: string;
      price?: number | string;
    };
    quantity?: number;
    selected_options?: unknown;
  }>;
  subtotal?: number | string;
  discount?: number | string;
  total?: number | string;
  appliedCoupon?: { code?: string } | null;
  notes?: string | null;
};

const PaymentInfo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // orderId/order_id her ikisini de destekle
  const orderIdParam =
    searchParams.get("order_id") ?? searchParams.get("orderId") ?? null;
  const hasExistingOrder = !!orderIdParam;

  // --- RTK: mevcut siparişi çek (eski flow için) ---
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
  } = useGetOrderByIdQuery(orderIdParam ?? "", {
    skip: !orderIdParam,
  });

  // --- RTK: banka hesap bilgisi (site_settings) ---
  const {
    data: bankSetting,
    isLoading: bankLoading,
  } = useGetSiteSettingByKeyQuery("bank_account_info");

  // --- RTK: yeni ödeme bildirimi telegram ayarı ---
  const { data: paymentRequestTelegramSetting } =
    useGetSiteSettingByKeyQuery("new_payment_request_telegram");

  const bankInfo = useMemo(
    () => (bankSetting ? toStringOrNull(bankSetting.value) : null),
    [bankSetting]
  );

  const isPaymentTelegramEnabled = truthy(
    paymentRequestTelegramSetting?.value
  );

  // --- RTK: sipariş & payment_request & telegram ---
  const [createOrder] = useCreateOrderMutation();
  const [createPaymentRequest] = useCreatePaymentRequestMutation();
  const [sendTelegramNotification] = useSendTelegramNotificationMutation();

  // --- local state: yeni flow için sessionStorage'daki paymentData ---
  const [paymentData, setPaymentData] = useState<PaymentSessionData | null>(
    null
  );
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Yeni flow'da (orderId yoksa) sessionStorage'dan paymentData oku
  useEffect(() => {
    if (hasExistingOrder) {
      setLoadingLocal(false);
      return;
    }

    try {
      const savedData = sessionStorage.getItem("havalepaymentData");
      if (!savedData) {
        toast.error("Ödeme bilgileri bulunamadı");
        navigate("/");
        return;
      }
      const data = JSON.parse(savedData) as PaymentSessionData;
      setPaymentData(data);
    } catch (err) {
      console.error(err);
      toast.error("Bilgiler yüklenemedi");
    } finally {
      setLoadingLocal(false);
    }
  }, [hasExistingOrder, navigate]);

  const loading =
    loadingLocal || bankLoading || (hasExistingOrder && orderLoading);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(String(text));
    toast.success("Panoya kopyalandı");
  };

  // --- Eski flow: zaten var olan sipariş için payment_request aç ---
  const handleExistingOrderPaymentConfirm = async (ord: Order) => {
    const amount =
      Number(ord.final_amount ?? ord.total_amount ?? 0) || 0;

    await createPaymentRequest({
      order_id: ord.id,
      user_id: ord.user_id ?? null,
      amount,
      currency: "TRY",
      payment_method: "bank_transfer",
      status: "pending",
      payment_proof: null,
    }).unwrap();

    // Telegram ayarı artık RTK site_settings'ten
    try {
      if (isPaymentTelegramEnabled) {
        await sendTelegramNotification({
          type: "new_payment_request",
          orderId: ord.id,
          amount,
          currency: "TRY",
        }).unwrap();
      }
    } catch (e) {
      console.warn("Telegram notification error", e);
    }
  };

  // --- Yeni flow: paymentData → /orders + /payment_requests ---
  const handleNewOrderPaymentConfirm = async () => {
    if (!paymentData) {
      throw new Error("payment_data_missing");
    }

    const orderNumber = `ORD${Date.now()}`;

    const items = (paymentData.cartItems ?? []).map((item) => {
      const price = Number(item.products?.price ?? 0);
      const quantity = Number(item.quantity ?? 1);
      const total = price * quantity;

      return {
        product_id: String(item.products.id),
        product_name: String(item.products.name),
        quantity,
        price: price.toFixed(2),
        total: total.toFixed(2),
        options: item.selected_options ?? null,
      };
    });

    // 🔧 Burayı tamamen number'a çeviriyoruz ki TS hata vermesin
    const subtotalRaw: number =
      Number(paymentData.subtotal ?? 0) || 0;
    const discountRaw: number =
      Number(paymentData.discount ?? 0) || 0;
    const totalRaw: number =
      paymentData.total != null
        ? Number(paymentData.total) || 0
        : subtotalRaw - discountRaw;

    const subtotalStr = subtotalRaw.toFixed(2);
    const discountStr = discountRaw.toFixed(2);
    const totalStr = totalRaw.toFixed(2);

    const body: CreateOrderBody = {
      order_number: orderNumber,
      payment_method: "bank_transfer",
      payment_status: "pending",
      coupon_code: paymentData.appliedCoupon?.code ?? undefined,
      notes: paymentData.notes ?? null,
      items,
      subtotal: subtotalStr,
      discount: discountStr,
      total: totalStr,
    };

    const createdOrder = await createOrder(body).unwrap();

    const amount =
      Number(
        createdOrder.final_amount ??
          createdOrder.total_amount ??
          totalRaw
      ) || 0;

    await createPaymentRequest({
      order_id: createdOrder.id,
      user_id: createdOrder.user_id ?? null,
      amount,
      currency: "TRY",
      payment_method: "bank_transfer",
      status: "pending",
      payment_proof: null,
    }).unwrap();

    // Eski davranışı koru: sepet / checkout cache temizliği
    sessionStorage.removeItem("checkoutData");
    sessionStorage.removeItem("havalepaymentData");
    localStorage.removeItem("guestCart");

    // Telegram bildirimi (RTK'dan gelen ayar ile kontrol)
    try {
      if (isPaymentTelegramEnabled) {
        await sendTelegramNotification({
          type: "new_payment_request",
          orderId: createdOrder.id,
          amount,
          currency: "TRY",
        }).unwrap();
      }
    } catch (e) {
      console.warn("Telegram notification error", e);
    }
  };

  const handlePaymentConfirm = async () => {
    setSubmitting(true);
    try {
      if (hasExistingOrder) {
        if (!order) {
          throw new Error("order_not_found");
        }
        await handleExistingOrderPaymentConfirm(order);
      } else {
        await handleNewOrderPaymentConfirm();
      }

      toast.success("Ödeme bildiriminiz alındı");
      navigate("/odeme-beklemede");
    } catch (err) {
      console.error(err);
      toast.error("Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render durumları ---
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center">Yükleniyor...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (
    (hasExistingOrder && (orderError || !order)) ||
    (!hasExistingOrder && !paymentData)
  ) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center">Ödeme bilgileri bulunamadı</p>
        </div>
        <Footer />
      </>
    );
  }

  const displayAmount = hasExistingOrder
    ? order?.final_amount ?? order?.total_amount
    : paymentData?.total;

  const displayOrderNumber = hasExistingOrder
    ? order?.order_number
    : "Ödeme onaylandıktan sonra oluşturulacak";

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              Havale/EFT Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-4">
                Lütfen aşağıdaki hesap bilgilerine ödemenizi yapın ve{" "}
                &quot;Ödemeyi Yaptım&quot; butonuna tıklayın.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Sipariş No</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">{displayOrderNumber}</p>
                  {hasExistingOrder && order?.order_number && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(order.order_number as string)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">
                  Ödenecek Tutar
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-primary">
                    {Number(displayAmount ?? 0).toFixed(2)} ₺
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        Number(displayAmount ?? 0).toString()
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {bankInfo && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <Label className="text-base font-semibold">
                    Banka Hesap Bilgileri
                  </Label>
                  <div className="whitespace-pre-wrap text-sm">
                    {bankInfo}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Önemli:</strong>{" "}
                  {hasExistingOrder
                    ? "Ödeme açıklamasına mutlaka sipariş numaranızı yazın."
                    : "Ödeme yaptıktan sonra 'Ödemeyi Yaptım' butonuna basın. Siparişiniz oluşturulacak ve admin onayından sonra ürününüz teslim edilecektir."}
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePaymentConfirm}
                disabled={submitting}
              >
                {submitting ? "Gönderiliyor..." : "Ödemeyi Yaptım"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default PaymentInfo;
