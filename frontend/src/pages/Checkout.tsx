import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

interface CheckoutData {
  cartItems: any[];
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: any;
}

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  iban?: string;
  account_holder?: string;
  bank_name?: string;
}

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
  const [guestOrderEnabled, setGuestOrderEnabled] = useState(false);
  const [paytrCommission, setPaytrCommission] = useState(0);
  const [shopierCommission, setShopierCommission] = useState(0);
  const [paytrHavaleEnabled, setPaytrHavaleEnabled] = useState(false);
  const [paytrHavaleCommission, setPaytrHavaleCommission] = useState(0);

  useEffect(() => {
    const initCheckout = async () => {
      // Get checkout data from session
      const data = sessionStorage.getItem('checkoutData');
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
        await fetchUserProfile();
        await fetchPaymentMethods();
      } catch (error) {
        console.error("Checkout data parse error:", error);
        toast.error("Bir hata oluştu");
        navigate("/sepet", { replace: true });
      }
    };

    const checkGuestOrderSetting = async () => {
      const { data } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "guest_order_enabled")
        .maybeSingle();

      setGuestOrderEnabled(data?.value === true || data?.value === "true");
    };

    // Wait for auth to load
    if (authLoading) {
      console.log("Auth loading...");
      return;
    }

    checkGuestOrderSetting();

    if (!user) {
      console.log("No user - checking guest order setting");
      // Will check guest order setting and continue if enabled
      initCheckout();
      return;
    }

    initCheckout();
  }, [authLoading, user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data } = await metahub
      .from("profiles")
      .select("full_name, wallet_balance, phone")
      .eq("id", user.id)
      .single();

    if (data) {
      setCustomerName(data.full_name || "");
      setCustomerEmail(user.email || "");
      setCustomerPhone(data.phone || "");
      setWalletBalance(data.wallet_balance || 0);
    }
  };

  const fetchPaymentMethods = async () => {
    const { data: settingsData } = await metahub
      .from("site_settings")
      .select("key, value")
      .in("key", ["payment_methods", "paytr_enabled", "shopier_enabled", "paytr_commission", "shopier_commission", "paytr_havale_enabled", "paytr_havale_commission"]);

    const methods: PaymentMethod[] = [];

    if (settingsData) {
      const settingsMap = settingsData.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, any>);

      const paymentSettings = settingsMap.payment_methods as any;
      const paytrEnabled = settingsMap.paytr_enabled === true || settingsMap.paytr_enabled === 'true';
      const shopierEnabled = settingsMap.shopier_enabled === true || settingsMap.shopier_enabled === 'true';
      const paytrHavaleEnabledSetting = settingsMap.paytr_havale_enabled === true || settingsMap.paytr_havale_enabled === 'true';

      // Set commission values
      setPaytrCommission(settingsMap.paytr_commission || 0);
      setShopierCommission(settingsMap.shopier_commission || 0);
      setPaytrHavaleCommission(settingsMap.paytr_havale_commission || 0);
      setPaytrHavaleEnabled(paytrHavaleEnabledSetting);

      // For guest users, only allow bank transfer/EFT/PayTR/Shopier
      if (!user) {
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
        // For logged in users, show all methods
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
    }

    // Default method for guests: havale/eft only
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
      setSelectedPayment(methods[0].id);
    }
  };

  const handleHavalePayment = async () => {
    if (!checkoutData) return;

    setLoading(true);

    try {
      console.log('=== HAVALE PAYMENT FLOW ===');
      console.log('Saving checkout data and redirecting to payment info page...');

      // Checkout bilgilerini sessionStorage'a kaydet
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
      };

      sessionStorage.setItem('havalepaymentData', JSON.stringify(paymentData));

      console.log('Payment data saved, redirecting to payment info page...');

      // Havale bilgileri sayfasına yönlendir (sipariş henüz oluşturulmadı)
      navigate('/odeme-bilgileri');

    } catch (error) {
      console.error('Havale payment error:', error);
      const errorMessage = error?.message || 'Bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayTRPayment = async () => {
    if (!checkoutData) return;

    setLoading(true);

    try {

      // Create order first
      const orderNumber = `ORD${Date.now()}`;

      const commission = (checkoutData.total * paytrCommission) / 100;
      const finalTotal = checkoutData.total + commission;

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          total_amount: checkoutData.subtotal,
          discount_amount: checkoutData.discount,
          final_amount: finalTotal,
          status: "pending",
          payment_status: "pending",
          payment_method: "paytr",
          coupon_id: checkoutData.appliedCoupon?.id || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update coupon used count if coupon was applied
      if (checkoutData.appliedCoupon) {
        await metahub.rpc('exec_sql', {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${checkoutData.appliedCoupon.id}'`
        });
      }

      // Create order items
      const orderItems = checkoutData.cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.products.id,
        product_name: item.products.name,
        quantity: item.quantity,
        product_price: item.products.price,
        total_price: item.products.price * item.quantity,
        selected_options: item.selected_options || null,
      }));

      await metahub.from("order_items").insert(orderItems);

      // Get PayTR token
      const { data: tokenData, error: tokenError } = await metahub.functions.invoke('paytr-get-token', {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            payment_amount: finalTotal,
            final_amount: finalTotal,
            order_id: orderData.id,
            items: checkoutData.cartItems.map((item) => ({
              product_name: item.products.name,
              quantity: item.quantity,
              total_price: item.products.price * item.quantity,
            })),
          },
          customerInfo: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || '05000000000',
            address: 'DİJİTAL ÜRÜN',
          },
        },
      });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || 'Token alınamadı');
      }

      console.log('PayTR token received:', tokenData.token);

      // Redirect to payment iframe page
      navigate(`/odeme-iframe?token=${tokenData.token}&order_id=${orderData.order_number}`);

    } catch (error) {
      console.error('PayTR payment error:', error);
      const errorMessage = error?.message || 'Ödeme başlatılamadı';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleShopierPayment = async () => {
    if (!checkoutData) return;

    setLoading(true);

    try {
      // Create order first
      const orderNumber = `ORD${Date.now()}`;
      const commission = (checkoutData.total * shopierCommission) / 100;
      const finalTotal = checkoutData.total + commission;

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          total_amount: checkoutData.subtotal,
          discount_amount: checkoutData.discount,
          final_amount: finalTotal,
          status: "pending",
          payment_status: "pending",
          payment_method: "shopier",
          coupon_id: checkoutData.appliedCoupon?.id || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update coupon used count if coupon was applied
      if (checkoutData.appliedCoupon) {
        await metahub.rpc('exec_sql', {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${checkoutData.appliedCoupon.id}'`
        });
      }

      // Create order items
      const orderItems = checkoutData.cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.products.id,
        product_name: item.products.name,
        quantity: item.quantity,
        product_price: item.products.price,
        total_price: item.products.price * item.quantity,
        selected_options: item.selected_options || null,
      }));

      await metahub.from("order_items").insert(orderItems);

      // Create Shopier payment form
      const { data: paymentData, error: paymentError } = await metahub.functions.invoke('shopier-create-payment', {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            user_id: user?.id || null,
            total_amount: checkoutData.subtotal,
            discount_amount: checkoutData.discount,
            final_amount: finalTotal,
            order_id: orderData.id,
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
            phone: customerPhone || '05000000000',
          },
        },
      });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || 'Ödeme oluşturulamadı');
      }

      console.log('Shopier payment form created');

      // Create a form and submit to Shopier
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentData.form_action;

      Object.keys(paymentData.form_data).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentData.form_data[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (error) {
      console.error('Shopier payment error:', error);
      const errorMessage = error?.message || 'Ödeme başlatılamadı';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handlePayTRHavalePayment = async () => {
    if (!checkoutData) return;

    setLoading(true);

    try {
      // Create order first
      const orderNumber = `ORD${Date.now()}`;

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          total_amount: checkoutData.subtotal,
          discount_amount: checkoutData.discount,
          final_amount: checkoutData.total,
          status: "pending",
          payment_status: "pending",
          payment_method: "paytr_havale",
          coupon_id: checkoutData.appliedCoupon?.id || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update coupon used count if coupon was applied
      if (checkoutData.appliedCoupon) {
        await metahub.rpc('exec_sql', {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${checkoutData.appliedCoupon.id}'`
        });
      }

      // Create order items
      const orderItems = checkoutData.cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.products.id,
        product_name: item.products.name,
        quantity: item.quantity,
        product_price: item.products.price,
        total_price: item.products.price * item.quantity,
        selected_options: item.selected_options || null,
      }));

      await metahub.from("order_items").insert(orderItems);

      // Get PayTR Havale token
      const { data: tokenData, error: tokenError } = await metahub.functions.invoke('paytr-havale-get-token', {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            payment_amount: checkoutData.total,
            final_amount: checkoutData.total,
            order_id: orderData.id,
            items: checkoutData.cartItems.map((item) => ({
              product_name: item.products.name,
              quantity: item.quantity,
              total_price: item.products.price * item.quantity,
            })),
          },
          customerInfo: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || '05000000000',
            address: 'DİJİTAL ÜRÜN',
          },
        },
      });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || 'Token alınamadı');
      }

      console.log('PayTR Havale token received:', tokenData.token);

      // Redirect to payment iframe page
      navigate(`/odeme-iframe?token=${tokenData.token}&order_id=${orderData.order_number}&type=havale`);

    } catch (error) {
      console.error('PayTR Havale payment error:', error);
      const errorMessage = error?.message || 'Ödeme başlatılamadı';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



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

    // For havale/eft, handle separately - create order and redirect to payment info
    if (selectedPayment === "havale" || selectedPayment === "eft") {
      await handleHavalePayment();
      return;
    }

    // For PayTR, create order and get token
    if (selectedPayment === "paytr") {
      await handlePayTRPayment();
      return;
    }

    // For PayTR Havale/EFT
    if (selectedPayment === "paytr_havale") {
      await handlePayTRHavalePayment();
      return;
    }

    // For Shopier, create order and redirect to payment
    if (selectedPayment === "shopier") {
      await handleShopierPayment();
      return;
    }

    if (selectedPayment === "wallet" && walletBalance < checkoutData.total) {
      toast.error("Yetersiz cüzdan bakiyesi");
      return;
    }

    try {
      setLoading(true);

      // Check if any product has manual delivery
      const hasManualDelivery = checkoutData.cartItems.some(
        (item) => item.products.delivery_type === "manual"
      );

      console.log("=== ORDER STATUS LOGIC ===");
      console.log("Cart items:", checkoutData.cartItems);
      console.log("Has manual delivery:", hasManualDelivery);
      console.log("Payment method:", selectedPayment);

      // Create order
      const orderNumber = `ORD${Date.now()}`;

      // Determine order status based on payment method and delivery type
      let orderStatus = "pending";
      const hasApiDelivery = checkoutData.cartItems.some(
        (item) => item.products.delivery_type === "api"
      );
      const hasFileDelivery = checkoutData.cartItems.some(
        (item) => item.products.delivery_type === "auto_file" || item.products.delivery_type === "file"
      );
      const hasStockDelivery = checkoutData.cartItems.some(
        (item) => item.products.delivery_type === "auto_stock"
      );

      if (selectedPayment === "wallet") {
        // If API delivery, keep as processing until API confirms
        if (hasApiDelivery) {
          orderStatus = "processing";
        } else if (hasManualDelivery) {
          orderStatus = "processing";
        } else if (hasFileDelivery || hasStockDelivery) {
          // Auto file and stock deliveries are instant - set to completed
          orderStatus = "completed";
        } else {
          orderStatus = "completed";
        }
      }

      console.log("Final order status:", orderStatus);
      console.log("Has API delivery:", hasApiDelivery);
      console.log("Has manual delivery:", hasManualDelivery);
      console.log("Has file delivery:", hasFileDelivery);
      console.log("Has stock delivery:", hasStockDelivery);
      console.log("=== END ORDER STATUS LOGIC ===");

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          total_amount: checkoutData.subtotal,
          discount_amount: checkoutData.discount,
          final_amount: checkoutData.total,
          status: orderStatus,
          payment_status: selectedPayment === "wallet" ? "paid" : "pending",
          payment_method: selectedPayment,
          coupon_id: checkoutData.appliedCoupon?.id || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update coupon used count if coupon was applied
      if (checkoutData.appliedCoupon) {
        await metahub.rpc('exec_sql', {
          sql: `UPDATE coupons SET used_count = used_count + 1 WHERE id = '${checkoutData.appliedCoupon.id}'`
        });
      }

      // Send telegram notification only if payment is not pending (wallet or instant payment)
      if (selectedPayment === "wallet" || orderData.payment_status === "paid") {
        try {
          const { data: telegramSettings } = await metahub
            .from("site_settings")
            .select("value")
            .eq("key", "new_order_telegram")
            .single();

          // Handle both boolean and string values
          const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

          if (isEnabled) {
            await metahub.functions.invoke('send-telegram-notification', {
              body: {
                type: 'new_order',
                orderId: orderData.id
              }
            });
          }
        } catch (telegramError) {
          console.error('Telegram notification error:', telegramError);
        }
      }

      // Send order received email
      try {
        const { data: siteSetting } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "site_title")
          .single();

        await metahub.functions.invoke('send-email', {
          body: {
            to: customerEmail,
            template_key: 'order_received',
            variables: {
              customer_name: customerName,
              order_number: orderNumber,
              final_amount: checkoutData.total.toString(),
              status: 'Beklemede',
              site_name: siteSetting?.value || 'Dijital Market'
            }
          }
        });
      } catch (emailError) {
        console.error('Order received email error:', emailError);
        // Don't fail the order if email fails
      }

      // Create order items
      const orderItems = checkoutData.cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.products.id,
        product_name: item.products.name,
        quantity: item.quantity,
        product_price: item.products.price,
        total_price: item.products.price * item.quantity,
        selected_options: item.selected_options || null,
      }));

      console.log("Creating order items:", orderItems);

      const { data: insertedItems, error: itemsError } = await metahub
        .from("order_items")
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      console.log("=== AUTO DELIVERY DEBUG ===");
      console.log("Payment method:", selectedPayment);
      console.log("Order status:", orderData.status);
      console.log("Inserted items:", insertedItems);

      // For wallet payments or completed orders, process auto delivery
      if (selectedPayment === "wallet" || orderData.status === "completed") {
        console.log("Processing auto delivery...");

        for (const item of insertedItems) {
          const cartItem = checkoutData.cartItems.find(
            (ci) => ci.products.id === item.product_id
          );

          console.log("Cart item for", item.product_name, ":", cartItem);
          console.log("Delivery type:", cartItem?.products.delivery_type);

          // Auto file delivery - mark as delivered immediately
          if (cartItem?.products.delivery_type === "auto_file" || cartItem?.products.delivery_type === "file") {
            console.log("Auto file delivery for", item.product_name);
            await metahub
              .from("order_items")
              .update({
                delivery_status: "delivered"
              })
              .eq("id", item.id);
          }
          // Turkpin Epin/TopUp delivery
          else if ((cartItem?.products.product_type === "epin" || cartItem?.products.product_type === "topup") &&
            cartItem?.products.auto_delivery_enabled &&
            cartItem?.products.api_provider_id) {
            console.log("Sending Turkpin order for", item.product_name);
            try {
              const { data: turkpinResult, error: turkpinError } = await metahub.functions.invoke('turkpin-create-order', {
                body: {
                  orderItemId: item.id,
                  providerId: cartItem.products.api_provider_id,
                  gameId: (cartItem.products as any).epin_game_id,
                  productId: (cartItem.products as any).epin_product_id,
                  quantity: item.quantity,
                  orderType: cartItem.products.product_type,
                  preOrder: (cartItem.products as any).pre_order_enabled || false,
                }
              });

              if (turkpinError) {
                console.error("Turkpin order failed:", turkpinError);
                await metahub
                  .from("order_items")
                  .update({
                    delivery_status: "failed",
                    delivery_error: turkpinError.message
                  })
                  .eq("id", item.id);
              } else {
                console.log("Turkpin order success:", turkpinResult);
              }
            } catch (error) {
              console.error("Turkpin order error:", error);
            }
          }
          // SMM API delivery
          else if (cartItem?.products.delivery_type === "api" && cartItem?.products.api_provider_id && cartItem?.products.api_product_id) {
            console.log("Sending order to API for", item.product_name);
            try {
              const customFields = (item.selected_options as any) || {};
              let link = "";
              if (customFields) {
                for (const key in customFields) {
                  if (customFields[key]) {
                    link = customFields[key];
                    break;
                  }
                }
              }

              if (!link) {
                console.error("No link/username provided for API order");
                await metahub
                  .from("order_items")
                  .update({
                    delivery_status: "failed",
                    delivery_error: "Link/Kullanıcı adı bilgisi eksik"
                  })
                  .eq("id", item.id);
                continue;
              }

              const apiQuantity = (cartItem.products as any).api_quantity || 1;

              console.log("API order details:", {
                orderItemId: item.id,
                apiProviderId: cartItem.products.api_provider_id,
                apiProductId: cartItem.products.api_product_id,
                link: link,
                quantity: apiQuantity
              });

              const { data: apiResult, error: apiError } = await metahub.functions.invoke('smm-api-order', {
                body: {
                  orderItemId: item.id,
                  apiProviderId: cartItem.products.api_provider_id,
                  apiProductId: cartItem.products.api_product_id,
                  link: link,
                  quantity: apiQuantity,
                }
              });

              if (apiError) {
                console.error("API order failed:", apiError);
                await metahub
                  .from("order_items")
                  .update({
                    delivery_status: "failed",
                    delivery_error: apiError.message
                  })
                  .eq("id", item.id);
              } else {
                console.log("API order success:", apiResult);
              }
            } catch (error) {
              console.error("API order error:", error);
            }
          }
          // Auto stock delivery
          else if (cartItem?.products.delivery_type === "auto_stock") {
            console.log("Calling assign_stock_to_order for", item.product_name);
            try {
              const { data: stockResult, error: stockError } = await metahub.rpc("assign_stock_to_order", {
                p_order_item_id: item.id,
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              });

              console.log("Stock assignment result:", stockResult);
              console.log("Stock assignment error:", stockError);

              if (stockError) {
                console.error("Stock assignment failed:", stockError);
                continue;
              }

              const { data: productData } = await metahub
                .from("products")
                .select("stock_quantity")
                .eq("id", item.product_id)
                .single();

              if (productData) {
                const newStock = Math.max(0, productData.stock_quantity - item.quantity);
                const { error: updateError } = await metahub
                  .from("products")
                  .update({ stock_quantity: newStock })
                  .eq("id", item.product_id);

                if (updateError) {
                  console.error("Stock quantity update failed:", updateError);
                } else {
                  console.log("Stock quantity updated:", productData.stock_quantity, "->", newStock);
                }
              }
            } catch (error) {
              console.error("Stock assignment error:", error);
            }
          } else {
            console.log("Skipping auto delivery - delivery_type:", cartItem?.products.delivery_type);
          }
        }
      } else {
        console.log("Skipping auto delivery - not wallet payment");
      }
      console.log("=== END AUTO DELIVERY DEBUG ===");

      if (selectedPayment === "wallet" && user) {
        // Deduct from wallet
        await metahub
          .from("profiles")
          .update({ wallet_balance: walletBalance - checkoutData.total })
          .eq("id", user.id);

        // Create transaction
        await metahub.from("wallet_transactions").insert({
          user_id: user.id,
          order_id: orderData.id,
          type: "debit",
          amount: -checkoutData.total,
          description: `Sipariş ödemesi - ${orderNumber}`,
        });

        // Clear cart and session
        if (user) {
          await metahub.from("cart_items").delete().eq("user_id", user.id);
        } else {
          // Clear guest cart from localStorage
          localStorage.removeItem('guestCart');
        }
        sessionStorage.removeItem('checkoutData');

        navigate("/odeme-basarili");
      } else {
        // Create payment request
        const { data: paymentRequestData } = await metahub.from("payment_requests").insert({
          order_id: orderData.id,
          user_id: user?.id || null,
          amount: checkoutData.total,
          payment_method: selectedPayment,
          proof_image_url: null,
          status: "pending",
        }).select().single();

        // Send telegram notification for payment request
        try {
          const { data: telegramSettings } = await metahub
            .from("site_settings")
            .select("value")
            .eq("key", "new_payment_request_telegram")
            .single();

          // Handle both boolean and string values
          const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

          if (isEnabled && paymentRequestData) {
            await metahub.functions.invoke('send-telegram-notification', {
              body: {
                type: 'new_payment_request',
                paymentRequestId: paymentRequestData.id
              }
            });
          }
        } catch (telegramError) {
          console.error('Telegram notification error:', telegramError);
        }

        // Clear cart and session
        if (user) {
          await metahub.from("cart_items").delete().eq("user_id", user.id);
        } else {
          // Clear guest cart from localStorage
          localStorage.removeItem('guestCart');
        }
        sessionStorage.removeItem('checkoutData');

        navigate("/odeme-bildirimi");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Sipariş oluşturulurken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

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

  const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);

  // Calculate commission based on selected payment method
  const commission = selectedPayment === "paytr"
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
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Müşteri Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ad Soyad"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="E-posta"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="5XX XXX XX XX"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Ödeme Yöntemi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="cursor-pointer font-semibold">
                            {method.name}
                          </Label>
                        </div>

                        {selectedPayment === method.id && method.id === "wallet" && (
                          <div className="ml-6 mt-2 text-sm">
                            <p className="text-muted-foreground">
                              Mevcut Bakiye: <span className="font-bold">{formatPrice(walletBalance)}</span>
                            </p>
                            {walletBalance < finalTotal && (
                              <p className="text-destructive mt-1">Yetersiz bakiye</p>
                            )}
                          </div>
                        )}

                        {selectedPayment === method.id && (method.id === "havale" || method.id === "eft") && (
                          <div className="ml-6 mt-3">
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Sipariş oluşturduktan sonra ödeme bilgilerini göreceksiniz.
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedPayment === method.id && method.id === "paytr" && loading && (
                          <div className="ml-6 mt-3 text-center py-8">
                            <p className="text-muted-foreground">Ödeme sayfası hazırlanıyor...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {checkoutData.cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.products.name} x{item.quantity}
                        </span>
                        <span>{formatPrice(item.products.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ara Toplam</span>
                      <span className="font-semibold">{formatPrice(checkoutData.subtotal)}</span>
                    </div>
                    {checkoutData.discount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>İndirim</span>
                        <span>-{formatPrice(checkoutData.discount)}</span>
                      </div>
                    )}
                    {commission > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Ödeme Komisyonu ({
                          selectedPayment === "paytr" ? paytrCommission :
                            selectedPayment === "paytr_havale" ? paytrHavaleCommission :
                              shopierCommission
                        }%)</span>
                        <span>+{formatPrice(commission)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Toplam</span>
                      <span className="text-primary">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={loading || (selectedPayment === "wallet" && walletBalance < finalTotal)}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? "İşleniyor..." :
                      selectedPayment === "paytr" ? "Kredi Kartı ile Öde" :
                        selectedPayment === "paytr_havale" ? "Havale/EFT ile Öde" :
                          "Ödemeyi Tamamla"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
