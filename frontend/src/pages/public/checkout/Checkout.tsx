// =============================================================
// FILE: src/pages/public/Checkout.tsx
// =============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";

import {
  CheckoutCustomerInfoCard,
} from "./components/CheckoutCustomerInfoCard";
import {
  CheckoutPaymentMethodsCard,
} from "./components/CheckoutPaymentMethodsCard";
import {
  CheckoutOrderSummaryCard,
} from "./components/CheckoutOrderSummaryCard";
import type {
  CheckoutData,
  PaymentMethod,
} from "./components/types";

import {
  useListSiteSettingsQuery,
  useGetSiteSettingByKeyQuery,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";
import {
  useCreateOrderMutation,
  type CreateOrderBody,
  type CreateOrderItemBody,
} from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import { useGetMyProfileQuery } from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";
import { useCreatePaymentRequestMutation } from "@/integrations/metahub/rtk/endpoints/payment_requests.endpoints";

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(false);

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState(0);

  const [paytrCommission, setPaytrCommission] = useState(0);
  const [shopierCommission, setShopierCommission] = useState(0);
  const [paytrHavaleCommission, setPaytrHavaleCommission] = useState(0);

  // ---- RTK: site_settings ----
  const { data: settingsData } = useListSiteSettingsQuery(undefined);
  const { data: siteTitleSetting } = useGetSiteSettingByKeyQuery("site_title");
  const { data: newOrderTelegramSetting } =
    useGetSiteSettingByKeyQuery("new_order_telegram");
  const { data: newPaymentRequestTelegramSetting } =
    useGetSiteSettingByKeyQuery("new_payment_request_telegram");

  // ---- RTK: profile (wallet + phone) ----
  const { data: profileData } = useGetMyProfileQuery();

  // ---- RTK: orders + payment_requests ----
  const [createOrder] = useCreateOrderMutation();
  const [createPaymentRequest] = useCreatePaymentRequestMutation();

  // ----------------------------------------------------------
  // 1) İlk yükleme: checkoutData
  // ----------------------------------------------------------
  useEffect(() => {
    const initCheckout = async () => {
      const data = sessionStorage.getItem("checkoutData");
      console.log("Checkout - sessionStorage data:", data);

      if (!data) {
        console.log("No checkout data found");
        toast.error("Sepetinizde ürün bulunmuyor");
        navigate("/sepet", { replace: true });
        return;
      }

      try {
        const parsedData = JSON.parse(data);
        console.log("Parsed checkout data:", parsedData);

        if (!parsedData.cartItems || parsedData.cartItems.length === 0) {
          console.log("Cart is empty");
          toast.error("Sepetinizde ürün bulunmuyor");
          navigate("/sepet", { replace: true });
          return;
        }

        setCheckoutData(parsedData);
      } catch (error) {
        console.error("Checkout data parse error:", error);
        toast.error("Bir hata oluştu");
        navigate("/sepet", { replace: true });
      }
    };

    if (authLoading) {
      console.log("Auth loading...");
      return;
    }

    void initCheckout();
  }, [authLoading, navigate]);

  // ----------------------------------------------------------
  // 2) Profil bilgisi RTK → customer + wallet
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user || !profileData) return;

    setCustomerName(profileData.full_name ?? "");
    setCustomerEmail(user.email ?? "");
    setCustomerPhone(profileData.phone ?? "");
    setWalletBalance(profileData.wallet_balance ?? 0);
  }, [user, profileData]);

  // ----------------------------------------------------------
  // 3) site_settings RTK → paymentMethods + komisyonlar
  // ----------------------------------------------------------
  useEffect(() => {
    if (!settingsData) return;

    const settingsMap = settingsData.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, any>);

    const paymentSettings = (settingsMap.payment_methods ?? {}) as any;

    const paytrEnabled =
      settingsMap.paytr_enabled === true ||
      settingsMap.paytr_enabled === "true";
    const shopierEnabled =
      settingsMap.shopier_enabled === true ||
      settingsMap.shopier_enabled === "true";
    const paytrHavaleEnabledSetting =
      settingsMap.paytr_havale_enabled === true ||
      settingsMap.paytr_havale_enabled === "true";

    setPaytrCommission(Number(settingsMap.paytr_commission ?? 0) || 0);
    setShopierCommission(Number(settingsMap.shopier_commission ?? 0) || 0);
    setPaytrHavaleCommission(
      Number(settingsMap.paytr_havale_commission ?? 0) || 0
    );

    const methods: PaymentMethod[] = [];

    if (!user) {
      // Guest
      if (paymentSettings?.havale_enabled) {
        methods.push({
          id: "havale",
          name: "Havale",
          enabled: true,
          iban: paymentSettings.havale_iban,
          account_holder: paymentSettings.havale_account_holder,
          bank_name: paymentSettings.havale_bank_name,
        });
      }

      if (paymentSettings?.eft_enabled) {
        methods.push({
          id: "eft",
          name: "EFT",
          enabled: true,
          iban: paymentSettings.eft_iban,
          account_holder: paymentSettings.eft_account_holder,
          bank_name: paymentSettings.eft_bank_name,
        });
      }

      if (paytrEnabled) {
        methods.push({
          id: "paytr",
          name: "Kredi Kartı (PayTR)",
          enabled: true,
        });
      }

      if (paytrHavaleEnabledSetting) {
        methods.push({
          id: "paytr_havale",
          name: "Havale/EFT (PayTR)",
          enabled: true,
        });
      }

      if (shopierEnabled) {
        methods.push({
          id: "shopier",
          name: "Kredi Kartı (Shopier)",
          enabled: true,
        });
      }
    } else {
      // Logged-in
      if (paymentSettings?.wallet_enabled !== false) {
        methods.push({
          id: "wallet",
          name: "Cüzdan",
          enabled: true,
        });
      }

      if (paymentSettings?.havale_enabled) {
        methods.push({
          id: "havale",
          name: "Havale",
          enabled: true,
          iban: paymentSettings.havale_iban,
          account_holder: paymentSettings.havale_account_holder,
          bank_name: paymentSettings.havale_bank_name,
        });
      }

      if (paymentSettings?.eft_enabled) {
        methods.push({
          id: "eft",
          name: "EFT",
          enabled: true,
          iban: paymentSettings.eft_iban,
          account_holder: paymentSettings.eft_account_holder,
          bank_name: paymentSettings.eft_bank_name,
        });
      }

      if (paytrEnabled) {
        methods.push({
          id: "paytr",
          name: "Kredi Kartı (PayTR)",
          enabled: true,
        });
      }

      if (paytrHavaleEnabledSetting) {
        methods.push({
          id: "paytr_havale",
          name: "Havale/EFT (PayTR)",
          enabled: true,
        });
      }

      if (shopierEnabled) {
        methods.push({
          id: "shopier",
          name: "Kredi Kartı (Shopier)",
          enabled: true,
        });
      }
    }

    if (methods.length === 0 && !user) {
      toast.error("Üyeliksiz siparişler için banka havalesi aktif değil");
    } else if (methods.length === 0) {
      methods.push({
        id: "wallet",
        name: "Cüzdan",
        enabled: true,
      });
    }

    setPaymentMethods(methods);
    if (methods.length > 0) {
      setSelectedPayment((prev) => prev || methods[0].id);
    }
  }, [settingsData, user]);

  // ----------------------------------------------------------
  // 4) Yardımcı: checkoutData → RTK CreateOrderItemBody[]
  // ----------------------------------------------------------
  const buildOrderItems = (): CreateOrderItemBody[] => {
    if (!checkoutData) return [];

    return checkoutData.cartItems.map((item) => {
      const priceNum = Number(item.products.price ?? 0);
      const quantityNum = Number(item.quantity ?? 1);
      const totalNum = priceNum * quantityNum;

      return {
        product_id: item.products.id,
        product_name: item.products.name,
        quantity: quantityNum,
        price: priceNum.toFixed(2),
        total: totalNum.toFixed(2),
        options: item.selected_options ?? null,
      };
    });
  };

  // ----------------------------------------------------------
  // 5) Ödeme handler'ları (HAVALE → PaymentInfo sayfası)
  // ----------------------------------------------------------
  const handleHavalePayment = async () => {
    if (!checkoutData) return;

    setLoading(true);

    try {
      console.log("=== HAVALE PAYMENT FLOW ===");

      const paymentData = {
        customerName,
        customerEmail,
        customerPhone,
        cartItems: checkoutData.cartItems,
        subtotal: checkoutData.subtotal,
        discount: checkoutData.discount,
        total: checkoutData.total,
        appliedCoupon: checkoutData.appliedCoupon,
        paymentMethod: selectedPayment,
        notes: checkoutData.notes,
      };

      sessionStorage.setItem(
        "havalepaymentData",
        JSON.stringify(paymentData)
      );

      navigate("/odeme-bilgileri");
    } catch (error: any) {
      console.error("Havale payment error:", error);
      const errorMessage = error?.message || "Bir hata oluştu";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayTRPayment = async () => {
    if (!checkoutData) return;

    setLoading(true);

    try {
      const orderNumber = `ORD${Date.now()}`;

      const commission = (checkoutData.total * paytrCommission) / 100;
      const finalTotal = checkoutData.total + commission;

      const items = buildOrderItems();

      const body: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: "paytr",
        payment_status: "pending",
        coupon_code: checkoutData.appliedCoupon?.code ?? undefined,
        notes: checkoutData.notes ?? null,
        items,
        subtotal: checkoutData.subtotal,
        discount: checkoutData.discount,
        total: finalTotal,
      };

      const order = await createOrder(body).unwrap();

      if (checkoutData.appliedCoupon) {
        await metahub.rpc("exec_sql", {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${checkoutData.appliedCoupon.id}'`,
        });
      }

      const { data: tokenData, error: tokenError } =
        await metahub.functions.invoke("paytr-get-token", {
          body: {
            orderData: {
              merchant_oid: orderNumber,
              payment_amount: finalTotal,
              final_amount: finalTotal,
              order_id: order.id,
              items: checkoutData.cartItems.map((item) => ({
                product_name: item.products.name,
                quantity: item.quantity,
                total_price: item.products.price * item.quantity,
              })),
            },
            customerInfo: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone || "05000000000",
              address: "DİJİTAL ÜRÜN",
            },
          },
        });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || "Token alınamadı");
      }

      console.log("PayTR token received:", tokenData.token);

      navigate(
        `/odeme-iframe?token=${tokenData.token}&order_id=${order.order_number}`
      );
    } catch (error: any) {
      console.error("PayTR payment error:", error);
      const errorMessage = error?.message || "Ödeme başlatılamadı";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleShopierPayment = async () => {
    if (!checkoutData) return;

    setLoading(true);

    try {
      const orderNumber = `ORD${Date.now()}`;
      const commission = (checkoutData.total * shopierCommission) / 100;
      const finalTotal = checkoutData.total + commission;

      const items = buildOrderItems();

      const body: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: "shopier",
        payment_status: "pending",
        coupon_code: checkoutData.appliedCoupon?.code ?? undefined,
        notes: checkoutData.notes ?? null,
        items,
        subtotal: checkoutData.subtotal,
        discount: checkoutData.discount,
        total: finalTotal,
      };

      const order = await createOrder(body).unwrap();

      if (checkoutData.appliedCoupon) {
        await metahub.rpc("exec_sql", {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${checkoutData.appliedCoupon.id}'`,
        });
      }

      const { data: paymentData, error: paymentError } =
        await metahub.functions.invoke("shopier-create-payment", {
          body: {
            orderData: {
              merchant_oid: orderNumber,
              user_id: user?.id || null,
              total_amount: checkoutData.subtotal,
              discount_amount: checkoutData.discount,
              final_amount: finalTotal,
              order_id: order.id,
              items: checkoutData.cartItems.map((item) => ({
                product_name: item.products.name,
                quantity: item.quantity,
                price: item.products.price,
                total_price: item.products.price * item.quantity,
              })),
            },
            customerInfo: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone || "05000000000",
            },
          },
        });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || "Ödeme oluşturulamadı");
      }

      console.log("Shopier payment form created");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentData.form_action;

      Object.keys(paymentData.form_data).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = paymentData.form_data[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      console.error("Shopier payment error:", error);
      const errorMessage = error?.message || "Ödeme başlatılamadı";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handlePayTRHavalePayment = async () => {
    if (!checkoutData) return;

    setLoading(true);

    try {
      const orderNumber = `ORD${Date.now()}`;

      const items = buildOrderItems();

      const body: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: "paytr_havale",
        payment_status: "pending",
        coupon_code: checkoutData.appliedCoupon?.code ?? undefined,
        notes: checkoutData.notes ?? null,
        items,
        subtotal: checkoutData.subtotal,
        discount: checkoutData.discount,
        total: checkoutData.total,
      };

      const order = await createOrder(body).unwrap();

      if (checkoutData.appliedCoupon) {
        await metahub.rpc("exec_sql", {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${checkoutData.appliedCoupon.id}'`,
        });
      }

      const { data: tokenData, error: tokenError } =
        await metahub.functions.invoke("paytr-havale-get-token", {
          body: {
            orderData: {
              merchant_oid: orderNumber,
              payment_amount: checkoutData.total,
              final_amount: checkoutData.total,
              order_id: order.id,
              items: checkoutData.cartItems.map((item) => ({
                product_name: item.products.name,
                quantity: item.quantity,
                total_price: item.products.price * item.quantity,
              })),
            },
            customerInfo: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone || "05000000000",
              address: "DİJİTAL ÜRÜN",
            },
          },
        });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || "Token alınamadı");
      }

      console.log("PayTR Havale token received:", tokenData.token);

      navigate(
        `/odeme-iframe?token=${tokenData.token}&order_id=${order.order_number}&type=havale`
      );
    } catch (error: any) {
      console.error("PayTR Havale payment error:", error);
      const errorMessage = error?.message || "Ödeme başlatılamadı";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
// 6) Ana submit
// ----------------------------------------------------------
const handleSubmit = async () => {
  if (!checkoutData) return;

  if (!customerName.trim()) {
    toast.error("Lütfen ad soyad girin");
    return;
  }

  if (!customerEmail.trim()) {
    toast.error("Lütfen e-posta adresinizi girin");
    return;
  }

  if (!customerPhone.trim()) {
    toast.error("Lütfen telefon numaranızı girin");
    return;
  }

  // Havale/EFT → PaymentInfo sayfası
  if (selectedPayment === "havale" || selectedPayment === "eft") {
    await handleHavalePayment();
    return;
  }

  // PayTR kart
  if (selectedPayment === "paytr") {
    await handlePayTRPayment();
    return;
  }

  // PayTR havale
  if (selectedPayment === "paytr_havale") {
    await handlePayTRHavalePayment();
    return;
  }

  // Shopier
  if (selectedPayment === "shopier") {
    await handleShopierPayment();
    return;
  }

  // Cüzdan bakiyesi kontrolü
  if (selectedPayment === "wallet" && walletBalance < checkoutData.total) {
    toast.error("Yetersiz cüzdan bakiyesi");
    return;
  }

  try {
    setLoading(true);

    const hasManualDelivery = checkoutData.cartItems.some(
      (item) => item.products.delivery_type === "manual"
    );
    const hasApiDelivery = checkoutData.cartItems.some(
      (item) => item.products.delivery_type === "api"
    );
    const hasFileDelivery = checkoutData.cartItems.some(
      (item) =>
        item.products.delivery_type === "auto_file" ||
        item.products.delivery_type === "file"
    );
    const hasStockDelivery = checkoutData.cartItems.some(
      (item) => item.products.delivery_type === "auto_stock"
    );

    let orderStatus = "pending";
    if (selectedPayment === "wallet") {
      if (hasApiDelivery) {
        orderStatus = "processing";
      } else if (hasManualDelivery) {
        orderStatus = "processing";
      } else if (hasFileDelivery || hasStockDelivery) {
        orderStatus = "completed";
      } else {
        orderStatus = "completed";
      }
    }

    const orderNumber = `ORD${Date.now()}`;
    const items = buildOrderItems();

    // 👇 BURASI: değişken camelCase, payload'da açıkça map ediyoruz
    let paymentMethod: CreateOrderBody["payment_method"] = "wallet";
    if (selectedPayment !== "wallet") {
      paymentMethod = "bank_transfer";
    }

    const body: CreateOrderBody = {
      order_number: orderNumber,
      payment_method: paymentMethod, // 👈 shorthand DEĞİL
      payment_status: selectedPayment === "wallet" ? "paid" : "pending",
      coupon_code: checkoutData.appliedCoupon?.code ?? undefined,
      notes: checkoutData.notes ?? null,
      items,
      subtotal: checkoutData.subtotal,
      discount: checkoutData.discount,
      total: checkoutData.total,
    };

    const order = await createOrder(body).unwrap();

    if (checkoutData.appliedCoupon) {
      await metahub.rpc("exec_sql", {
        sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${checkoutData.appliedCoupon.id}'`,
      });
    }

    // Telegram new_order (RTK site_settings)
    const isNewOrderTelegramEnabled =
      newOrderTelegramSetting?.value === true ||
      newOrderTelegramSetting?.value === "true";

    if (
      selectedPayment === "wallet" ||
      order.payment_status === "paid"
    ) {
      try {
        if (isNewOrderTelegramEnabled) {
          await metahub.functions.invoke("send-telegram-notification", {
            body: {
              type: "new_order",
              orderId: order.id,
            },
          });
        }
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError);
      }
    }

    // Order received email – site_title RTK'dan
    try {
      const siteTitle =
        (siteTitleSetting?.value as string) || "Dijital Market";

      await metahub.functions.invoke("send-email", {
        body: {
          to: customerEmail,
          template_key: "order_received",
          variables: {
            customer_name: customerName,
            order_number: orderNumber,
            final_amount: checkoutData.total.toString(),
            status:
              selectedPayment === "wallet"
                ? "Ödendi"
                : "Beklemede",
            site_name: siteTitle,
          },
        },
      });
    } catch (emailError) {
      console.error("Order received email error:", emailError);
    }

    // ⚠ order_items & auto-delivery FE'den çıkarıldı, BE tarafı ilgileniyor.

    if (selectedPayment === "wallet" && user) {
      await metahub
        .from("profiles")
        .update({ wallet_balance: walletBalance - checkoutData.total })
        .eq("id", user.id);

      await metahub.from("wallet_transactions").insert({
        user_id: user.id,
        order_id: order.id,
        type: "debit",
        amount: -checkoutData.total,
        description: `Sipariş ödemesi - ${orderNumber}`,
      });

      if (user) {
        await metahub.from("cart_items").delete().eq("user_id", user.id);
      } else {
        localStorage.removeItem("guestCart");
      }
      sessionStorage.removeItem("checkoutData");

      navigate("/odeme-basarili");
    } else {
      // 👇 Burayı da aynı değişkenle güncelliyoruz
      const amount = checkoutData.total;

      const paymentReq = await createPaymentRequest({
        order_id: order.id,
        user_id: user?.id ?? null,
        amount,
        currency: "TRY",
        payment_method: paymentMethod, // 👈 burada da paymentMethod
        payment_proof: null,
        status: "pending",
      }).unwrap();

      const isPaymentTelegramEnabled =
        newPaymentRequestTelegramSetting?.value === true ||
        newPaymentRequestTelegramSetting?.value === "true";

      try {
        if (isPaymentTelegramEnabled && paymentReq) {
          await metahub.functions.invoke("send-telegram-notification", {
            body: {
              type: "new_payment_request",
              paymentRequestId: paymentReq.id,
            },
          });
        }
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError);
      }

      if (user) {
        await metahub.from("cart_items").delete().eq("user_id", user.id);
      } else {
        localStorage.removeItem("guestCart");
      }
      sessionStorage.removeItem("checkoutData");

      navigate("/odeme-bildirimi");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    toast.error("Sipariş oluşturulurken hata oluştu");
  } finally {
    setLoading(false);
  }
};


  // ----------------------------------------------------------
  // 7) Render
  // ----------------------------------------------------------
  if (authLoading || !checkoutData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          Yükleniyor...
        </div>
        <Footer />
      </div>
    );
  }

  const commission =
    selectedPayment === "paytr"
      ? (checkoutData.total * paytrCommission) / 100
      : selectedPayment === "paytr_havale"
      ? (checkoutData.total * paytrHavaleCommission) / 100
      : selectedPayment === "shopier"
      ? (checkoutData.total * shopierCommission) / 100
      : 0;

  const finalTotal = checkoutData.total + commission;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/sepet")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sepete Dön
          </Button>

          <h1 className="text-4xl font-bold mb-8">Ödeme</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
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

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <CheckoutOrderSummaryCard
                checkoutData={checkoutData}
                selectedPayment={selectedPayment}
                paytrCommission={paytrCommission}
                shopierCommission={shopierCommission}
                paytrHavaleCommission={paytrHavaleCommission}
                commission={commission}
                finalTotal={finalTotal}
                onSubmit={handleSubmit}
                loading={loading}
                walletBalance={walletBalance}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
