import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, CheckCircle } from "lucide-react";

const toStringOrNull = (v: unknown): string | null =>
  typeof v === "string" ? v : v == null ? null : String(v);

const truthy = (v: unknown) => v === true || v === "true" || v === "1" || v === 1;

const PaymentInfo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // orderId/order_id her ikisini de destekle
  const orderIdParam = searchParams.get("order_id") ?? searchParams.get("orderId") ?? null;

  const [order, setOrder] = useState<any>(null);
  const [bankInfo, setBankInfo] = useState<string | null>(null); // <- state tipi net
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    if (orderIdParam) {
      fetchOrderAndBankInfo(orderIdParam);
    } else {
      fetchBankInfoAndPaymentData();
    }
  }, [orderIdParam]);

  const fetchBankInfoAndPaymentData = async () => {
    try {
      const savedData = sessionStorage.getItem("havalepaymentData");
      if (!savedData) {
        toast.error("Ödeme bilgileri bulunamadı");
        navigate("/");
        return;
      }
      const data = JSON.parse(savedData);
      setPaymentData(data);

      const { data: bankData } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "bank_account_info")
        .single();

      // ❗ unknown -> string|null
      setBankInfo(toStringOrNull(bankData?.value));
    } catch (err) {
      console.error(err);
      toast.error("Bilgiler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderAndBankInfo = async (orderId: string) => {
    try {
      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: bankData } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "bank_account_info")
        .single();

      // ❗ unknown -> string|null (parantezle öncelik net)
      setBankInfo(toStringOrNull(bankData?.value));
    } catch (err) {
      console.error(err);
      toast.error("Bilgiler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(String(text));
    toast.success("Panoya kopyalandı");
  };

  const handlePaymentConfirm = async () => {
    if (order) return handleOldFlowPaymentConfirm();
    if (!paymentData) return;

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await metahub.auth.getUser();
      const orderNumber = `ORD${Date.now()}`;

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          customer_name: paymentData.customerName,
          customer_email: paymentData.customerEmail,
          customer_phone: paymentData.customerPhone || null,
          total_amount: Number(paymentData.subtotal ?? 0),
          discount_amount: Number(paymentData.discount ?? 0),
          final_amount: Number(paymentData.total ?? 0),
          status: "pending",
          payment_status: "pending",
          payment_method: "havale",
          coupon_id: paymentData.appliedCoupon?.id || null,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      if (paymentData.appliedCoupon?.id) {
        await metahub.rpc("exec_sql", {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${paymentData.appliedCoupon.id}'`,
        });
      }

      const orderItems = (paymentData.cartItems ?? []).map((item: any) => ({
        order_id: orderData.id,
        product_id: item.products.id,
        product_name: item.products.name,
        quantity: item.quantity,
        product_price: Number(item.products.price ?? 0),
        total_price: Number(item.products.price ?? 0) * Number(item.quantity ?? 0),
        selected_options: item.selected_options || null,
      }));
      if (orderItems.length) await metahub.from("order_items").insert(orderItems);

      const { error: prError } = await metahub.from("payment_requests").insert({
        order_id: orderData.id,
        user_id: orderData.user_id,
        amount: Number(orderData.final_amount ?? 0),
        currency: "TRY",
        payment_method: "havale",
        payment_proof: null,
        status: "pending",
      });
      if (prError) throw prError;

      sessionStorage.removeItem("checkoutData");
      sessionStorage.removeItem("havalepaymentData");
      localStorage.removeItem("guestCart");

      try {
        const { data: telegramSettings } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "new_payment_request_telegram")
          .single();
        if (truthy(telegramSettings?.value)) {
          await metahub.functions.invoke("send-telegram-notification", {
            body: { type: "new_payment_request", orderId: orderData.id },
          });
        }
      } catch (e) {
        console.warn("Telegram notification error", e);
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

  const handleOldFlowPaymentConfirm = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      const { error: prError } = await metahub
        .from("payment_requests")
        .insert({
          order_id: order.id,
          user_id: order.user_id,
          amount: Number(order.final_amount ?? 0),
          currency: "TRY",
          payment_method: "havale",
          payment_proof: null,
          status: "pending",
        })
        .select()
        .single();
      if (prError) throw prError;

      try {
        const { data: telegramSettings } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "new_payment_request_telegram")
          .single();
        if (truthy(telegramSettings?.value)) {
          await metahub.functions.invoke("send-telegram-notification", {
            body: { type: "new_payment_request", orderId: order.id },
          });
        }
      } catch (e) {
        console.warn("Telegram notification error", e);
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

  if (!order && !paymentData) {
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

  const displayAmount = order ? order.final_amount : paymentData?.total;
  const displayOrderNumber = order ? order.order_number : "Ödeme onaylandıktan sonra oluşturulacak";

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
                Lütfen aşağıdaki hesap bilgilerine ödemenizi yapın ve "Ödemeyi Yaptım" butonuna tıklayın.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Sipariş No</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm">{displayOrderNumber}</p>
                  {!!order && (
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.order_number)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Ödenecek Tutar</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-primary">{Number(displayAmount ?? 0)} ₺</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(Number(displayAmount ?? 0).toString())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {bankInfo && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <Label className="text-base font-semibold">Banka Hesap Bilgileri</Label>
                  <div className="whitespace-pre-wrap text-sm">{bankInfo}</div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Önemli:</strong>{" "}
                  {order
                    ? "Ödeme açıklamasına mutlaka sipariş numaranızı yazın."
                    : "Ödeme yaptıktan sonra 'Ödemeyi Yaptım' butonuna basın. Siparişiniz oluşturulacak ve admin onayından sonra ürününüz teslim edilecektir."}
                </p>
              </div>

              <Button className="w-full" size="lg" onClick={handlePaymentConfirm} disabled={submitting}>
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
