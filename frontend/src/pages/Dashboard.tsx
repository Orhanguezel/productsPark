// =============================================================
// FILE: src/pages/account/Dashboard.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Wallet, Key, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";

// RTK endpoints
import {
  useListOrdersByUserQuery,
} from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import {
  useListWalletTransactionsQuery,
  type WalletTransaction as WalletTxn,
} from "@/integrations/metahub/rtk/endpoints/wallet.endpoints";
import {
  useGetMyProfileQuery,
  useUpsertMyProfileMutation,
  type Profile,
} from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";
import {
  useListSupportTicketsQuery,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketMutation,
} from "@/integrations/metahub/rtk/endpoints/support_tickets.endpoints";
import {
  useListTicketRepliesByTicketQuery,
  useCreateTicketReplyMutation,
} from "@/integrations/metahub/rtk/endpoints/ticket_replies.endpoints";
import type {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
  TicketReply,
} from "@/integrations/metahub/db/types/support";
import type { OrderView as Order } from "@/integrations/metahub/db/types";

/* ---------------- Local types ---------------- */

type PaymentMethodId = "havale" | "eft" | "paytr" | "paytr_havale" | "shopier";

type PaymentMethod = {
  id: PaymentMethodId;
  name: string;
  enabled: boolean;
  commission: number;
  iban?: string;
  account_holder?: string;
  bank_name?: string;
};

type SiteSettingRow = { key: string; value: unknown };

type TicketReplyUI = TicketReply & { display_name: string };

/* ---------------- Component ---------------- */

const itemsPerPage = 10;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // --- Payment methods + deposit state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId | "">("");
  const [paytrCommission, setPaytrCommission] = useState(0);
  const [shopierCommission, setShopierCommission] = useState(0);
  const [paytrHavaleCommission, setPaytrHavaleCommission] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  // --- Pagination
  const [ordersPage, setOrdersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);

  // --- Profile edit
  const { data: profileData, isLoading: profileLoading } = useGetMyProfileQuery();
  const [upsertProfile, { isLoading: upsertingProfile }] = useUpsertMyProfileMutation();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // --- Orders
  const {
    data: orders = [],
    isLoading: ordersLoading,
  } = useListOrdersByUserQuery(user?.id ?? "", { skip: !user?.id });

  // product name’leri göstermek için basit bir yardımcı state
  const [productNamesByOrder, setProductNamesByOrder] = useState<Record<string, string>>({});

  // --- Wallet txns
  const {
    data: walletTxns = [],
    isLoading: txLoading,
  } = useListWalletTransactionsQuery(
    { user_id: user?.id, order: "desc" },
    { skip: !user?.id }
  );

  // --- Support tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useListSupportTicketsQuery(
    { user_id: user?.id, sort: "created_at", order: "desc" },
    { skip: !user?.id }
  );

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const {
    data: repliesRaw = [],
    isLoading: repliesLoading,
    refetch: refetchReplies,
  } = useListTicketRepliesByTicketQuery(selectedTicket?.id ?? "", {
    skip: !selectedTicket?.id,
  });

  const [createTicket, { isLoading: creatingTicket }] = useCreateSupportTicketMutation();
  const [createReply, { isLoading: sendingReply }] = useCreateTicketReplyMutation();
  const [updateTicket, { isLoading: updatingTicket }] = useUpdateSupportTicketMutation();

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [newTicket, setNewTicket] = useState<{
    subject: string;
    message: string;
    priority: SupportTicketPriority | "medium";
    category: string;
  }>({ subject: "", message: "", priority: "medium", category: "" });

  /* --------------- Effects --------------- */

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/giris");
  }, [authLoading, user, navigate]);

  // Fill profile edit fields
  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name ?? "");
      setPhone(profileData.phone ?? "");
    }
  }, [profileData]);

  // Fetch product names for each order (no RTK endpoint provided for items)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!orders.length) {
        setProductNamesByOrder({});
        return;
      }
      const entries = await Promise.all(
        orders.map(async (o) => {
          const { data: items } = await metahub
            .from("order_items")
            .select("product_name")
            .eq("order_id", o.id);
          const names = (items ?? []).map((it: { product_name: string }) => it.product_name).join(", ");
          return [o.id, names] as const;
        })
      );
      if (!cancelled) {
        setProductNamesByOrder(Object.fromEntries(entries));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [orders]);

  // Load payment methods from site_settings (no RTK for settings yet)
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const { data: settings } = await metahub
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "payment_methods",
          "paytr_enabled",
          "shopier_enabled",
          "paytr_commission",
          "shopier_commission",
          "paytr_havale_enabled",
          "paytr_havale_commission",
        ]);

      const methods: PaymentMethod[] = [];
      if (settings && Array.isArray(settings)) {
        const map = settings.reduce<Record<string, unknown>>((acc, row: SiteSettingRow) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
        const paymentSettings = map["payment_methods"] as Record<string, unknown> | undefined;

        const bool = (v: unknown) => v === true || v === "true";
        const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

        const paytrEnabled = bool(map["paytr_enabled"]);
        const shopierEnabled = bool(map["shopier_enabled"]);
        const paytrHavaleEnabled = bool(map["paytr_havale_enabled"]);

        const paytrComm = num(map["paytr_commission"]);
        const shopierComm = num(map["shopier_commission"]);
        const paytrHavaleComm = num(map["paytr_havale_commission"]);

        setPaytrCommission(paytrComm);
        setShopierCommission(shopierComm);
        setPaytrHavaleCommission(paytrHavaleComm);

        if (paymentSettings && typeof paymentSettings === "object") {
          const get = <T,>(k: string, d: T): T =>
            (paymentSettings as Record<string, unknown>)[k] as T ?? d;

          if (get("havale_enabled", false)) {
            methods.push({
              id: "havale",
              name: "Havale",
              enabled: true,
              commission: 0,
              iban: get<string | undefined>("havale_iban", undefined),
              account_holder: get<string | undefined>("havale_account_holder", undefined),
              bank_name: get<string | undefined>("havale_bank_name", undefined),
            });
          }
          if (get("eft_enabled", false)) {
            methods.push({
              id: "eft",
              name: "EFT",
              enabled: true,
              commission: 0,
              iban: get<string | undefined>("eft_iban", undefined),
              account_holder: get<string | undefined>("eft_account_holder", undefined),
              bank_name: get<string | undefined>("eft_bank_name", undefined),
            });
          }
        }

        if (paytrEnabled) {
          methods.push({ id: "paytr", name: "Kredi Kartı (PayTR)", enabled: true, commission: paytrComm });
        }
        if (paytrHavaleEnabled) {
          methods.push({ id: "paytr_havale", name: "Havale/EFT (PayTR)", enabled: true, commission: paytrHavaleComm });
        }
        if (shopierEnabled) {
          methods.push({ id: "shopier", name: "Kredi Kartı (Shopier)", enabled: true, commission: shopierComm });
        }
      }
      setPaymentMethods(methods);
      if (methods.length > 0) setSelectedPayment(methods[0].id);
    };
    if (user) fetchPaymentMethods();
  }, [user]);

  /* --------------- Derived --------------- */

  const loading =
    authLoading || profileLoading || ordersLoading || txLoading || ticketsLoading;

  const totalSpent = useMemo(
    () =>
      orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + Number(o.final_amount ?? 0), 0),
    [orders]
  );

  const pagedOrders = useMemo(() => {
    const start = (ordersPage - 1) * itemsPerPage;
    return orders.slice(start, start + itemsPerPage);
  }, [orders, ordersPage]);

  const pagedTxns: WalletTxn[] = useMemo(() => {
    const start = (transactionsPage - 1) * itemsPerPage;
    return walletTxns.slice(start, start + itemsPerPage);
  }, [walletTxns, transactionsPage]);

  const replies: TicketReplyUI[] = useMemo(
    () =>
      repliesRaw.map((r) => ({
        ...r,
        display_name: r.is_admin ? "Destek Ekibi" : "Siz",
      })),
    [repliesRaw]
  );

  /* --------------- Helpers --------------- */

  const getStatusColor = (status: SupportTicketStatus | string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-amber-100 text-amber-800";
      case "waiting_response":
        return "bg-purple-100 text-purple-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: SupportTicketStatus | string) => {
    const map: Record<string, string> = {
      open: "Açık",
      in_progress: "İşlemde",
      waiting_response: "Yanıt bekliyor",
      closed: "Kapalı",
    };
    return map[status] ?? status;
  };

  const getPriorityColor = (p: SupportTicketPriority | string) => {
    switch (p) {
      case "low":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (p: SupportTicketPriority | string) => {
    const map: Record<string, string> = {
      low: "Düşük",
      medium: "Orta",
      high: "Yüksek",
      urgent: "Acil",
    };
    return map[p] ?? p;
  };

  /* --------------- Handlers --------------- */

  const handleOrderClick = (order: Order) => {
    navigate(`/siparis/${order.id}`);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await upsertProfile({ profile: { full_name: fullName, phone } }).unwrap();
      toast.success("Profil güncellendi");
    } catch {
      toast.error("Profil güncellenemedi");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const created = await createTicket({
        user_id: user.id,
        subject: newTicket.subject,
        message: newTicket.message,
        priority: newTicket.priority as SupportTicketPriority,
        category: newTicket.category || null,
      }).unwrap();

      // Telegram bildirimi (opsiyonel)
      try {
        await metahub.functions.invoke("send-telegram-notification", {
          body: {
            type: "new_ticket",
            ticketId: created.id,
            userName: profileData?.full_name || "Anonim",
          },
        });
      } catch (_) {
        // sessiz
      }

      setNewTicket({ subject: "", message: "", priority: "medium", category: "" });
      setShowNewTicket(false);
      toast.success("Ticket oluşturuldu");
      refetchTickets();
    } catch (err) {
      console.error(err);
      toast.error("Ticket oluşturulamadı");
    }
  };

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleSendReply = async () => {
    if (!user || !selectedTicket || !replyMessage.trim()) return;
    try {
      await createReply({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: replyMessage.trim(),
        is_admin: false,
      }).unwrap();

      // Kullanıcı cevapladı → durumu "in_progress" yapalım (admin paneliyle uyumlu)
      try {
        // await updateTicket({ id: selectedTicket.id, patch: { status: "in_progress" } }).unwrap();
      } catch {
        // BE zaten kendi güncelliyorsa sessizce geç
        
      }

      setReplyMessage("");
      toast.success("Yanıt gönderildi");
      await Promise.all([refetchReplies(), refetchTickets()]);
    } catch (e) {
      console.error(e);
      toast.error("Yanıt gönderilemedi");
    }
  };

  const handleDeposit = async () => {
    if (!user || !depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Geçerli bir miktar girin");
      return;
    }

    // Min limit
    const { data: minRow } = await metahub
      .from("site_settings")
      .select("value")
      .eq("key", "min_balance_limit")
      .single();

    const minLimit =
      typeof minRow?.value === "number" ? (minRow.value as number) : 10;
    const amount = parseFloat(depositAmount);
    if (amount < minLimit) {
      toast.error(`Minimum yükleme tutarı ${minLimit} ₺'dir`);
      return;
    }

    if (!selectedPayment) {
      toast.error("Ödeme yöntemi seçiniz");
      return;
    }

    if (selectedPayment === "paytr") {
      await handlePayTRPayment();
    } else if (selectedPayment === "shopier") {
      await handleShopierPayment();
    } else if (selectedPayment === "paytr_havale") {
      await handlePayTRHavalePayment();
    } else if (selectedPayment === "havale" || selectedPayment === "eft") {
      toast.success("Ödeme bilgilerine yönlendiriliyorsunuz...");
      window.location.href = `/bakiye-odeme-bilgileri?amount=${depositAmount}`;
    }
  };

  const handlePayTRPayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;
      const commission = (amount * paytrCommission) / 100;
      const finalTotal = amount + commission;

      const { data: orderRow, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profileData.full_name ?? "",
          customer_email: user.email ?? "",
          customer_phone: profileData.phone ?? null,
          total_amount: amount,
          discount_amount: 0,
          final_amount: finalTotal,
          status: "pending",
          payment_status: "pending",
          payment_method: "paytr",
          notes: "Cüzdan bakiye yükleme",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { data: tokenData, error: tokenError } = await metahub.functions.invoke("paytr-get-token", {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            payment_amount: finalTotal,
            final_amount: finalTotal,
            order_id: orderRow.id,
            items: [{
              product_name: "Cüzdan Bakiye Yükleme",
              quantity: 1,
              total_price: amount,
            }],
          },
          customerInfo: {
            name: profileData.full_name ?? "",
            email: user.email ?? "",
            phone: profileData.phone ?? "05000000000",
            address: "DİJİTAL ÜRÜN",
          },
        },
      });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || "Token alınamadı");
      }

      navigate(`/odeme-iframe?token=${tokenData.token}&order_id=${orderRow.order_number}`);
    } catch (e) {
      console.error("PayTR payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
    } finally {
      setDepositing(false);
    }
  };

  const handleShopierPayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;
      const commission = (amount * shopierCommission) / 100;
      const finalTotal = amount + commission;

      const { data: orderRow, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profileData.full_name ?? "",
          customer_email: user.email ?? "",
          customer_phone: profileData.phone ?? null,
          total_amount: amount,
          discount_amount: 0,
          final_amount: finalTotal,
          status: "pending",
          payment_status: "pending",
          payment_method: "shopier",
          notes: "Cüzdan bakiye yükleme",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { data: paymentData, error: paymentError } = await metahub.functions.invoke("shopier-create-payment", {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            user_id: user.id,
            total_amount: amount,
            discount_amount: 0,
            final_amount: finalTotal,
            order_id: orderRow.id,
            items: [{
              product_name: "Cüzdan Bakiye Yükleme",
              quantity: 1,
              price: amount,
              total_price: amount,
            }],
          },
          customerInfo: {
            name: profileData.full_name ?? "",
            email: user.email ?? "",
            phone: profileData.phone ?? "05000000000",
          },
        },
      });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || "Ödeme oluşturulamadı");
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentData.form_action;

      Object.keys(paymentData.form_data).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(paymentData.form_data[key]);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      console.error("Shopier payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
      setDepositing(false);
    }
  };

  const handlePayTRHavalePayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;

      const { data: orderRow, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profileData.full_name ?? "",
          customer_email: user.email ?? "",
          customer_phone: profileData.phone ?? null,
          total_amount: amount,
          discount_amount: 0,
          final_amount: amount,
          status: "pending",
          payment_status: "pending",
          payment_method: "paytr_havale",
          notes: "Cüzdan bakiye yükleme",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { data: tokenData, error: tokenError } = await metahub.functions.invoke("paytr-havale-get-token", {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            payment_amount: amount,
            order_id: orderRow.id,
            items: [{
              product_name: "Cüzdan Bakiye Yükleme",
              quantity: 1,
              total_price: amount,
            }],
          },
          customerInfo: {
            name: profileData.full_name ?? "",
            email: user.email ?? "",
            phone: profileData.phone ?? "05000000000",
            address: "DİJİTAL ÜRÜN",
          },
        },
      });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || "Token alınamadı");
      }

      navigate(`/odeme-beklemede?order_id=${orderRow.order_number}`);
    } catch (e) {
      console.error("PayTR Havale payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
    } finally {
      setDepositing(false);
    }
  };

  /* --------------- Render --------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Hesabım</h1>

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mevcut Bakiye</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{(profileData?.wallet_balance ?? 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Harcama</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{totalSpent.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hesap Yönetimi</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="orders">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="orders">Siparişlerim</TabsTrigger>
                  <TabsTrigger value="wallet">Cüzdan</TabsTrigger>
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="support">Destek</TabsTrigger>
                </TabsList>

                {/* Orders */}
                <TabsContent value="orders" className="space-y-4 mt-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Henüz siparişiniz bulunmamaktadır.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {pagedOrders.map((order) => (
                          <Card
                            key={order.id}
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => handleOrderClick(order)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="font-semibold">{order.order_number}</p>
                                  {productNamesByOrder[order.id] && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {productNamesByOrder[order.id]}
                                    </p>
                                  )}
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {new Date(order.created_at).toLocaleDateString("tr-TR")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">₺{Number(order.final_amount ?? 0).toFixed(2)}</p>
                                  <div className="text-sm flex flex-col gap-1">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        order.status === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : order.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : order.status === "processing"
                                          ? "bg-blue-100 text-blue-800"
                                          : order.status === "cancelled"
                                          ? "bg-gray-100 text-gray-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {order.status === "completed"
                                        ? "Tamamlandı"
                                        : order.status === "pending"
                                        ? "Beklemede"
                                        : order.status === "processing"
                                        ? "İşleniyor"
                                        : order.status === "cancelled"
                                        ? "İptal Edildi"
                                        : order.status}
                                    </span>
                                    {order.payment_status === "pending" && (
                                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                                        Ödeme Bekliyor
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {Math.ceil(orders.length / itemsPerPage) > 1 && (
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                                className={ordersPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from(
                              { length: Math.ceil(orders.length / itemsPerPage) },
                              (_, i) => i + 1
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setOrdersPage(page)}
                                  isActive={ordersPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setOrdersPage((p) =>
                                    Math.min(Math.ceil(orders.length / itemsPerPage), p + 1)
                                  )
                                }
                                className={
                                  ordersPage === Math.ceil(orders.length / itemsPerPage)
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Wallet */}
                <TabsContent value="wallet" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bakiye Yükle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Miktar (₺)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="100"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>

                      <div className="space-y-4">
                        <Label>Ödeme Yöntemi</Label>
                        {paymentMethods.length === 0 ? (
                          <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                            Aktif ödeme yöntemi bulunamadı. Lütfen yönetici ile iletişime geçin.
                          </div>
                        ) : (
                          <>
                            <RadioGroup value={selectedPayment} onValueChange={(v) => setSelectedPayment(v as PaymentMethodId)}>
                              {paymentMethods.map((method) => (
                                <div key={method.id} className="flex items-center space-x-2">
                                  <RadioGroupItem value={method.id} id={method.id} />
                                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                    {method.name}
                                    {method.commission > 0 && (
                                      <span className="text-sm text-muted-foreground ml-2">
                                        (Komisyon: %{method.commission})
                                      </span>
                                    )}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>

                            {depositAmount && parseFloat(depositAmount) > 0 && (
                              <div className="p-4 bg-muted rounded-md space-y-2">
                                <div className="flex justify-between">
                                  <span>Yüklenecek Miktar:</span>
                                  <span className="font-semibold">
                                    ₺{parseFloat(depositAmount).toFixed(2)}
                                  </span>
                                </div>
                                {(() => {
                                  const selected = paymentMethods.find((m) => m.id === selectedPayment);
                                  const commission = selected?.commission ?? 0;
                                  const commissionAmount =
                                    (parseFloat(depositAmount) * commission) / 100;

                                  if (commission > 0) {
                                    return (
                                      <>
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                          <span>Komisyon (%{commission}):</span>
                                          <span>₺{commissionAmount.toFixed(2)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-bold">
                                          <span>Toplam Ödenecek:</span>
                                          <span>
                                            ₺{(parseFloat(depositAmount) + commissionAmount).toFixed(2)}
                                          </span>
                                        </div>
                                      </>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <Button
                        onClick={handleDeposit}
                        className="w-full"
                        disabled={
                          depositing ||
                          paymentMethods.length === 0 ||
                          !depositAmount ||
                          parseFloat(depositAmount) <= 0 ||
                          !selectedPayment
                        }
                      >
                        {depositing ? "İşleniyor..." : "Bakiye Yükle"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Son İşlemler</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {walletTxns.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          İşlem geçmişi bulunmamaktadır.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {pagedTxns.map((txn) => (
                              <div key={txn.id} className="flex justify-between items-center border-b pb-2">
                                <div>
                                  <p className="font-medium">{txn.description ?? ""}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(txn.created_at).toLocaleString("tr-TR")}
                                  </p>
                                </div>
                                <p
                                  className={`font-bold ${
                                    txn.amount > 0 ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {txn.amount > 0 ? "+" : ""}₺{txn.amount.toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>

                          {Math.ceil(walletTxns.length / itemsPerPage) > 1 && (
                            <Pagination className="mt-4">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() =>
                                      setTransactionsPage((p) => Math.max(1, p - 1))
                                    }
                                    className={
                                      transactionsPage === 1
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                    }
                                  />
                                </PaginationItem>
                                {Array.from(
                                  { length: Math.ceil(walletTxns.length / itemsPerPage) },
                                  (_, i) => i + 1
                                ).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setTransactionsPage(page)}
                                      isActive={transactionsPage === page}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() =>
                                      setTransactionsPage((p) =>
                                        Math.min(
                                          Math.ceil(walletTxns.length / itemsPerPage),
                                          p + 1
                                        )
                                      )
                                    }
                                    className={
                                      transactionsPage ===
                                      Math.ceil(walletTxns.length / itemsPerPage)
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                    }
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Profile */}
                <TabsContent value="profile" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profil Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email ?? ""}
                          onChange={async (e) => {
                            const newEmail = e.target.value;
                            if (!newEmail) return;
                            const { error } = await metahub.auth.updateUser({ email: newEmail });
                            if (error) {
                              toast.error("E-posta güncellenemedi: " + error.message);
                            } else {
                              toast.success(
                                "E-posta güncelleme bağlantısı gönderildi. Lütfen yeni e-posta adresinizi kontrol edin."
                              );
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          E-posta değişikliği için doğrulama linki gönderilecektir.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Ad Soyad</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon Numarası</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+90 5XX XXX XX XX"
                        />
                      </div>

                      <Button
                        onClick={handleUpdateProfile}
                        disabled={upsertingProfile}
                        className="w-full"
                      >
                        Profili Güncelle
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Şifre Değiştir</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Yeni Şifre</Label>
                        <Input id="newPassword" type="password" placeholder="Yeni şifrenizi girin" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                        <Input id="confirmPassword" type="password" placeholder="Şifrenizi tekrar girin" />
                      </div>
                      <Button
                        onClick={async () => {
                          const newPassword = (document.getElementById("newPassword") as HTMLInputElement).value;
                          const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;

                          if (!newPassword || newPassword.length < 6) {
                            toast.error("Şifre en az 6 karakter olmalıdır");
                            return;
                          }
                          if (newPassword !== confirmPassword) {
                            toast.error("Şifreler eşleşmiyor");
                            return;
                          }

                          const { error } = await metahub.auth.updateUser({ password: newPassword });
                          if (error) {
                            toast.error("Şifre güncellenemedi");
                          } else {
                            toast.success("Şifre başarıyla güncellendi");
                            (document.getElementById("newPassword") as HTMLInputElement).value = "";
                            (document.getElementById("confirmPassword") as HTMLInputElement).value = "";
                          }
                        }}
                        className="w-full"
                      >
                        Şifreyi Güncelle
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Support */}
                <TabsContent value="support" className="space-y-4 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Destek</h2>
                    <Button onClick={() => setShowNewTicket((v) => !v)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Yeni Ticket
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* list */}
                    <div className="lg:col-span-1 space-y-4">
                      {showNewTicket && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Yeni Ticket Oluştur</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleCreateTicket} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="subject">Konu * ({newTicket.subject.length}/80)</Label>
                                <Input
                                  id="subject"
                                  value={newTicket.subject}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length <= 80) {
                                      setNewTicket((s) => ({ ...s, subject: value }));
                                    } else {
                                      toast.error("Konu 80 karakterden uzun olamaz");
                                    }
                                  }}
                                  required
                                  placeholder="Sorun başlığı"
                                  maxLength={80}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="category">Kategori ({newTicket.category.length}/40)</Label>
                                <Input
                                  id="category"
                                  value={newTicket.category}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length <= 40) {
                                      setNewTicket((s) => ({ ...s, category: value }));
                                    } else {
                                      toast.error("Kategori 40 karakterden uzun olamaz");
                                    }
                                  }}
                                  placeholder="Ürün, Ödeme, Teknik vb."
                                  maxLength={40}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="priority">Öncelik</Label>
                                <Select
                                  value={newTicket.priority}
                                  onValueChange={(value) =>
                                    setNewTicket((s) => ({
                                      ...s,
                                      priority: value as SupportTicketPriority,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Düşük</SelectItem>
                                    <SelectItem value="medium">Orta</SelectItem>
                                    <SelectItem value="high">Yüksek</SelectItem>
                                    <SelectItem value="urgent">Acil</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="message">Mesaj * ({newTicket.message.length}/2000)</Label>
                                <Textarea
                                  id="message"
                                  value={newTicket.message}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length <= 2000) {
                                      setNewTicket((s) => ({ ...s, message: value }));
                                    } else {
                                      toast.error("Mesaj 2000 karakterden uzun olamaz");
                                    }
                                  }}
                                  required
                                  placeholder="Sorununuzu detaylıca açıklayın"
                                  rows={5}
                                  maxLength={2000}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button type="submit" className="flex-1" disabled={creatingTicket}>
                                  Oluştur
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowNewTicket(false)}
                                >
                                  İptal
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}

                      <Card>
                        <CardHeader>
                          <CardTitle>Ticket Listesi</CardTitle>
                          <CardDescription>Tüm destek talepleriniz ({tickets.length})</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {tickets.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              Henüz ticket oluşturmadınız.
                            </p>
                          ) : (
                            tickets.map((t) => (
                              <Card
                                key={t.id}
                                className={`cursor-pointer hover:bg-accent ${
                                  selectedTicket?.id === t.id ? "bg-accent" : ""
                                }`}
                                onClick={() => handleTicketClick(t)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold">{t.subject}</h3>
                                    <Badge className={getStatusColor(t.status)}>
                                      {getStatusText(t.status)}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className={getPriorityColor(t.priority)}>
                                      {getPriorityText(t.priority)}
                                    </Badge>
                                    {t.category && <Badge variant="outline">{t.category}</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(t.created_at).toLocaleDateString("tr-TR")}
                                  </p>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* details */}
                    <div className="lg:col-span-2">
                      {selectedTicket ? (
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{selectedTicket.subject}</CardTitle>
                                <CardDescription>
                                  {new Date(selectedTicket.created_at).toLocaleString("tr-TR")}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getStatusColor(selectedTicket.status)}>
                                  {getStatusText(selectedTicket.status)}
                                </Badge>
                                <Badge className={getPriorityColor(selectedTicket.priority)}>
                                  {getPriorityText(selectedTicket.priority)}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Original */}
                            <div className="bg-muted p-4 rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                            </div>

                            {/* Replies */}
                            <div className="space-y-4">
                              {repliesLoading ? (
                                <div className="text-sm text-muted-foreground">Yanıtlar yükleniyor…</div>
                              ) : replies.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Henüz yanıt yok</div>
                              ) : (
                                replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className={`p-4 rounded-lg ${
                                      reply.is_admin ? "bg-primary/10" : "bg-muted"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-semibold text-sm">{reply.display_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(reply.created_at).toLocaleString("tr-TR")}
                                      </p>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Reply form */}
                            {selectedTicket.status !== "closed" && (
                              <div className="flex gap-2">
                                <Textarea
                                  value={replyMessage}
                                  onChange={(e) => setReplyMessage(e.target.value)}
                                  placeholder="Yanıtınızı yazın..."
                                  rows={3}
                                />
                                <Button onClick={handleSendReply} size="icon" disabled={sendingReply || updatingTicket}>
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent className="flex items-center justify-center py-16">
                            <div className="text-center">
                              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-muted-foreground">Görüntülemek için bir ticket seçin</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
