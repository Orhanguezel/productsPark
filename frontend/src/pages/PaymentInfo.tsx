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

const PaymentInfo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    // Eğer orderId varsa (eski akış - PayTR Havale), order bilgilerini çek
    if (orderId) {
      fetchOrderAndBankInfo();
    } else {
      // Yeni akış - Normal Havale/EFT (sipariş henüz oluşturulmadı)
      fetchBankInfoAndPaymentData();
    }
  }, [orderId]);

  const fetchBankInfoAndPaymentData = async () => {
    try {
      // sessionStorage'dan payment bilgilerini al
      const savedData = sessionStorage.getItem('havalepaymentData');
      if (!savedData) {
        toast.error("Ödeme bilgileri bulunamadı");
        navigate("/");
        return;
      }

      const data = JSON.parse(savedData);
      setPaymentData(data);

      // Banka bilgilerini çek
      const { data: bankData } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "bank_account_info")
        .single();

      if (bankData?.value) {
        setBankInfo(bankData.value);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Bilgiler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderAndBankInfo = async () => {
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch bank transfer info
      const { data: bankData } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "bank_account_info")
        .single();

      if (bankData?.value) {
        setBankInfo(bankData.value);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Bilgiler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandı");
  };

  const handlePaymentConfirm = async () => {
    // Eğer order varsa eski akış (PayTR Havale)
    if (order) {
      return handleOldFlowPaymentConfirm();
    }

    // Yeni akış - Normal Havale/EFT (sipariş şimdi oluşturulacak)
    if (!paymentData) return;

    setSubmitting(true);
    try {
      console.log('Creating order for havale/eft payment...');

      // Kullanıcı bilgisini al
      const { data: { user } } = await metahub.auth.getUser();
      console.log('Current user:', user?.id);

      // Sipariş oluştur
      const orderNumber = `ORD${Date.now()}`;

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          customer_name: paymentData.customerName,
          customer_email: paymentData.customerEmail,
          customer_phone: paymentData.customerPhone || null,
          total_amount: paymentData.subtotal,
          discount_amount: paymentData.discount,
          final_amount: paymentData.total,
          status: "pending",
          payment_status: "pending",
          payment_method: paymentData.paymentMethod,
          coupon_id: paymentData.appliedCoupon?.id || null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', orderData);

      // Update coupon if applied
      if (paymentData.appliedCoupon) {
        await metahub.rpc('exec_sql', {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${paymentData.appliedCoupon.id}'`
        });
      }

      console.log('Order created:', orderData.id);

      // Sipariş kalemlerini oluştur
      const orderItems = paymentData.cartItems.map((item: any) => ({
        order_id: orderData.id,
        product_id: item.products.id,
        product_name: item.products.name,
        quantity: item.quantity,
        product_price: item.products.price,
        total_price: item.products.price * item.quantity,
        selected_options: item.selected_options || null,
      }));

      await metahub.from("order_items").insert(orderItems);

      console.log('Order items created');

      // Payment request oluştur
      const { data: paymentRequestData, error: prError } = await metahub
        .from("payment_requests")
        .insert({
          order_id: orderData.id,
          user_id: orderData.user_id,
          amount: orderData.final_amount,
          payment_method: "havale",
          proof_image_url: null,
          status: "pending",
        })
        .select()
        .single();

      if (prError) throw prError;

      // Sepeti temizle
      sessionStorage.removeItem('checkoutData');
      sessionStorage.removeItem('havalepaymentData');
      localStorage.removeItem('guestCart');

      // Telegram bildirimi gönder
      try {
        console.log('Checking telegram notification settings...');
        const { data: telegramSettings } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "new_payment_request_telegram")
          .single();

        const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

        if (isEnabled && paymentRequestData) {
          console.log('Invoking telegram notification...');
          await metahub.functions.invoke("send-telegram-notification", {
            body: {
              type: "new_payment_request",
              paymentRequestId: paymentRequestData.id,
            },
          });
        }
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError);
      }

      toast.success("Ödeme bildirimi gönderildi");
      navigate("/odeme-beklemede");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOldFlowPaymentConfirm = async () => {
    if (!order) return;

    setSubmitting(true);
    try {
      // Create payment request
      const { data: paymentRequestData, error: prError } = await metahub
        .from("payment_requests")
        .insert({
          order_id: order.id,
          user_id: order.user_id,
          amount: order.final_amount,
          payment_method: "havale",
          proof_image_url: null,
          status: "pending",
        })
        .select()
        .single();

      if (prError) throw prError;

      // Send telegram notification
      try {
        console.log('Checking telegram notification settings...');
        const { data: telegramSettings } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "new_payment_request_telegram")
          .single();

        console.log('Telegram settings:', telegramSettings);
        console.log('Payment request data:', paymentRequestData);

        const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

        if (isEnabled && paymentRequestData) {
          console.log('Invoking telegram notification...');
          const result = await metahub.functions.invoke("send-telegram-notification", {
            body: {
              type: "new_payment_request",
              paymentRequestId: paymentRequestData.id,
            },
          });
          console.log('Telegram notification result:', result);
        } else {
          console.log('Telegram notification not sent - Enabled:', isEnabled, 'Has data:', !!paymentRequestData);
        }
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError);
      }

      toast.success("Ödeme bildirimi gönderildi");
      navigate("/odeme-beklemede");
    } catch (error) {
      console.error("Error:", error);
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

  // Tutar ve sipariş numarası bilgisini belirle
  const displayAmount = order ? order.final_amount : paymentData?.total;
  const displayOrderNumber = order ? order.order_number : `Ödeme onaylandıktan sonra oluşturulacak`;

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
                  {order && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(order.order_number)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Ödenecek Tutar</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-primary">{displayAmount} ₺</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(displayAmount.toString())}
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
                  <strong>Önemli:</strong> {order ? 'Ödeme açıklamasına mutlaka sipariş numaranızı yazın.' : 'Ödeme yaptıktan sonra "Ödemeyi Yaptım" butonuna basın. Siparişiniz oluşturulacak ve admin onayından sonra ürününüz teslim edilecektir.'}
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
