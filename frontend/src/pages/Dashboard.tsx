import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, Wallet, Key, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  final_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  product_names?: string;
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface Profile {
  full_name: string | null;
  wallet_balance: number;
  phone: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  activation_code: string | null;
  delivery_content: string | null;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketReply {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  profiles: {
    full_name: string | null;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [paytrCommission, setPaytrCommission] = useState(0);
  const [shopierCommission, setShopierCommission] = useState(0);
  const [paytrHavaleCommission, setPaytrHavaleCommission] = useState(0);

  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const itemsPerPage = 10;

  // Support states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "medium",
    category: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/giris");
      return;
    }
    if (user) {
      fetchDashboardData();
      fetchPaymentMethods();
    }
  }, [user, authLoading]);

  const fetchPaymentMethods = async () => {
    const { data: settingsData } = await metahub
      .from("site_settings")
      .select("key, value")
      .in("key", ["payment_methods", "paytr_enabled", "shopier_enabled", "paytr_commission", "shopier_commission", "paytr_havale_enabled", "paytr_havale_commission"]);

    const methods: any[] = [];

    if (settingsData) {
      const settingsMap = settingsData.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, any>);

      const paymentSettings = settingsMap.payment_methods as any;
      const paytrEnabled = settingsMap.paytr_enabled === true || settingsMap.paytr_enabled === 'true';
      const shopierEnabled = settingsMap.shopier_enabled === true || settingsMap.shopier_enabled === 'true';
      const paytrHavaleEnabled = settingsMap.paytr_havale_enabled === true || settingsMap.paytr_havale_enabled === 'true';

      // Set commission values
      setPaytrCommission(settingsMap.paytr_commission || 0);
      setShopierCommission(settingsMap.shopier_commission || 0);
      setPaytrHavaleCommission(settingsMap.paytr_havale_commission || 0);

      if (paymentSettings?.havale_enabled) {
        methods.push({
          id: "havale",
          name: "Havale",
          enabled: true,
          commission: 0,
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
          commission: 0,
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
          commission: settingsMap.paytr_commission || 0,
        });
      }

      if (paytrHavaleEnabled) {
        methods.push({
          id: "paytr_havale",
          name: "Havale/EFT (PayTR)",
          enabled: true,
          commission: settingsMap.paytr_havale_commission || 0,
        });
      }

      if (shopierEnabled) {
        methods.push({
          id: "shopier",
          name: "Kredi Kartı (Shopier)",
          enabled: true,
          commission: settingsMap.shopier_commission || 0,
        });
      }
    }

    setPaymentMethods(methods);
    if (methods.length > 0) {
      setSelectedPayment(methods[0].id);
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const [ordersData, profileData, allTransactionsData, ticketsData] = await Promise.all([
        metahub
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        metahub
          .from("profiles")
          .select("full_name, wallet_balance, phone")
          .eq("id", user.id)
          .single(),
        metahub
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        metahub
          .from("support_tickets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersData.data) {
        // Fetch product names for each order
        const ordersWithProducts = await Promise.all(
          ordersData.data.map(async (order) => {
            const { data: itemsData } = await metahub
              .from("order_items")
              .select("product_name")
              .eq("order_id", order.id);

            const productNames = itemsData?.map(item => item.product_name).join(", ") || "";
            console.log("Sipariş:", order.order_number, "Ürünler:", productNames);
            return { ...order, product_names: productNames };
          })
        );
        console.log("Tüm siparişler:", ordersWithProducts);
        setOrders(ordersWithProducts);
      }
      if (profileData.data) {
        setProfile(profileData.data);
        setFullName(profileData.data.full_name || "");
        setPhone(profileData.data.phone || "");
      }
      if (allTransactionsData.data) {
        setAllTransactions(allTransactionsData.data);
        setTransactions(allTransactionsData.data.slice(0, itemsPerPage));
      }
      if (ticketsData.data) setTickets(ticketsData.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: string) => {
    const { data, error } = await metahub
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      return;
    }

    const repliesWithProfiles = await Promise.all(
      (data || []).map(async (reply) => {
        const { data: profileData } = await metahub
          .from("profiles")
          .select("full_name")
          .eq("id", reply.user_id)
          .single();

        return {
          ...reply,
          profiles: profileData,
        };
      })
    );

    setReplies(repliesWithProfiles as any);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data: ticketData, error } = await metahub.from("support_tickets").insert([
      {
        user_id: user.id,
        ...newTicket,
      },
    ]).select().single();

    if (error) {
      toast.error("Ticket oluşturulamadı");
      console.error(error);
    } else {
      toast.success("Ticket oluşturuldu");

      // Send Telegram notification
      console.log('Attempting to send Telegram notification...');
      const { data: profile } = await metahub
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      console.log('Profile fetched:', profile);
      console.log('Ticket data:', ticketData);

      const telegramResult = await metahub.functions.invoke('send-telegram-notification', {
        body: {
          type: 'new_ticket',
          ticketId: ticketData.id,
          userName: profile?.full_name || 'Anonim'
        }
      });

      console.log('Telegram notification result:', telegramResult);

      if (telegramResult.error) {
        console.error('Telegram notification error:', telegramResult.error);
      }
      setNewTicket({
        subject: "",
        message: "",
        priority: "medium",
        category: "",
      });
      setShowNewTicket(false);
      fetchDashboardData();
    }
  };

  const handleSendReply = async () => {
    if (!user || !selectedTicket || !replyMessage.trim()) return;

    const { error } = await metahub.from("ticket_replies").insert([
      {
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: replyMessage,
        is_admin: false,
      },
    ]);

    if (error) {
      toast.error("Yanıt gönderilemedi");
      console.error(error);
    } else {
      toast.success("Yanıt gönderildi");
      setReplyMessage("");
      fetchReplies(selectedTicket.id);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchReplies(ticket.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      open: "Açık",
      in_progress: "İşlemde",
      resolved: "Çözüldü",
      closed: "Kapalı",
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getPriorityText = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: "Düşük",
      medium: "Orta",
      high: "Yüksek",
      urgent: "Acil",
    };
    return priorityMap[priority] || priority;
  };

  const handleOrderClick = (order: Order) => {
    navigate(`/siparis/${order.id}`);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    const { error } = await metahub
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Profil güncellenemedi");
    } else {
      toast.success("Profil güncellendi");
      fetchDashboardData();
    }
  };

  const handlePayTRPayment = async () => {
    if (!user) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);

    try {
      const orderNumber = `WALLET${Date.now()}`;
      const commission = (amount * paytrCommission) / 100;
      const finalTotal = amount + commission;

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profile?.full_name || "",
          customer_email: user.email || "",
          customer_phone: profile?.phone || null,
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

      const { data: tokenData, error: tokenError } = await metahub.functions.invoke('paytr-get-token', {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            payment_amount: finalTotal,
            final_amount: finalTotal,
            order_id: orderData.id,
            items: [{
              product_name: "Cüzdan Bakiye Yükleme",
              quantity: 1,
              total_price: amount,
            }],
          },
          customerInfo: {
            name: profile?.full_name || "",
            email: user.email || "",
            phone: profile?.phone || '05000000000',
            address: 'DİJİTAL ÜRÜN',
          },
        },
      });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || 'Token alınamadı');
      }

      navigate(`/odeme-iframe?token=${tokenData.token}&order_id=${orderData.order_number}`);
    } catch (error) {
      console.error('PayTR payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Ödeme başlatılamadı');
    } finally {
      setDepositing(false);
    }
  };

  const handleShopierPayment = async () => {
    if (!user) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);

    try {
      const orderNumber = `WALLET${Date.now()}`;
      const commission = (amount * shopierCommission) / 100;
      const finalTotal = amount + commission;

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profile?.full_name || "",
          customer_email: user.email || "",
          customer_phone: profile?.phone || null,
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

      const { data: paymentData, error: paymentError } = await metahub.functions.invoke('shopier-create-payment', {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            user_id: user.id,
            total_amount: amount,
            discount_amount: 0,
            final_amount: finalTotal,
            order_id: orderData.id,
            items: [{
              product_name: "Cüzdan Bakiye Yükleme",
              quantity: 1,
              price: amount,
              total_price: amount,
            }],
          },
          customerInfo: {
            name: profile?.full_name || "",
            email: user.email || "",
            phone: profile?.phone || '05000000000',
          },
        },
      });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || 'Ödeme oluşturulamadı');
      }

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
      toast.error(error instanceof Error ? error.message : 'Ödeme başlatılamadı');
      setDepositing(false);
    }
  };

  const handlePayTRHavalePayment = async () => {
    if (!user) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);

    try {
      const orderNumber = `WALLET${Date.now()}`;

      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profile?.full_name || "",
          customer_email: user.email || "",
          customer_phone: profile?.phone || null,
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

      const { data: tokenData, error: tokenError } = await metahub.functions.invoke('paytr-havale-get-token', {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            payment_amount: amount,
            order_id: orderData.id,
            items: [{
              product_name: "Cüzdan Bakiye Yükleme",
              quantity: 1,
              total_price: amount,
            }],
          },
          customerInfo: {
            name: profile?.full_name || "",
            email: user.email || "",
            phone: profile?.phone || '05000000000',
            address: 'DİJİTAL ÜRÜN',
          },
        },
      });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || 'Token alınamadı');
      }

      navigate(`/odeme-beklemede?order_id=${orderData.order_number}`);
    } catch (error) {
      console.error('PayTR Havale payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Ödeme başlatılamadı');
    } finally {
      setDepositing(false);
    }
  };

  const handleDeposit = async () => {
    if (!user || !depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Geçerli bir miktar girin");
      return;
    }

    // Fetch minimum balance limit
    const { data: settingsData } = await metahub
      .from("site_settings")
      .select("value")
      .eq("key", "min_balance_limit")
      .single();

    const minLimit = typeof settingsData?.value === 'number' ? settingsData.value : 10;
    const amount = parseFloat(depositAmount);

    if (amount < minLimit) {
      toast.error(`Minimum yükleme tutarı ${minLimit} ₺'dir`);
      return;
    }

    if (!selectedPayment) {
      toast.error("Ödeme yöntemi seçiniz");
      return;
    }

    // Handle payment based on selected method
    if (selectedPayment === "paytr") {
      await handlePayTRPayment();
    } else if (selectedPayment === "shopier") {
      await handleShopierPayment();
    } else if (selectedPayment === "paytr_havale") {
      await handlePayTRHavalePayment();
    } else if (selectedPayment === "havale" || selectedPayment === "eft") {
      // Redirect to payment info page for manual bank transfer
      try {
        toast.success("Ödeme bilgilerine yönlendiriliyorsunuz...");
        window.location.href = `/bakiye-odeme-bilgileri?amount=${depositAmount}`;
      } catch (error) {
        console.error("Deposit error:", error);
        toast.error("Bir hata oluştu");
      }
    }
  };

  if (authLoading || loading) {
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam Sipariş
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Mevcut Bakiye
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{profile?.wallet_balance?.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam Harcama
                </CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{orders.filter(o => o.status === 'completed').reduce((sum, o) =>
                    sum + o.final_amount, 0
                  ).toFixed(2)}
                </div>
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

                <TabsContent value="orders" className="space-y-4 mt-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Henüz siparişiniz bulunmamaktadır.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {orders
                          .slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage)
                          .map((order) => (
                            <Card
                              key={order.id}
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleOrderClick(order)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <p className="font-semibold">
                                      {order.order_number}
                                    </p>
                                    {order.product_names && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {order.product_names}
                                      </p>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {new Date(order.created_at).toLocaleDateString("tr-TR")}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">
                                      ₺{order.final_amount.toFixed(2)}
                                    </p>
                                    <div className="text-sm flex flex-col gap-1">
                                      <span
                                        className={`px-2 py-1 rounded text-xs ${order.status === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                          }`}
                                      >
                                        {order.status === "completed" ? "Tamamlandı" :
                                          order.status === "pending" ? "Beklemede" :
                                            order.status === "processing" ? "İşleniyor" :
                                              order.status === "cancelled" ? "İptal Edildi" : order.status}
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
                                onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                                className={ordersPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from({ length: Math.ceil(orders.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
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
                                onClick={() => setOrdersPage(p => Math.min(Math.ceil(orders.length / itemsPerPage), p + 1))}
                                className={ordersPage === Math.ceil(orders.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  )}
                </TabsContent>

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
                            <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
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
                                  <span className="font-semibold">₺{parseFloat(depositAmount).toFixed(2)}</span>
                                </div>
                                {(() => {
                                  const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
                                  const commission = selectedMethod?.commission || 0;
                                  const commissionAmount = (parseFloat(depositAmount) * commission) / 100;

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
                                          <span>₺{(parseFloat(depositAmount) + commissionAmount).toFixed(2)}</span>
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
                        disabled={depositing || paymentMethods.length === 0 || !depositAmount || parseFloat(depositAmount) <= 0 || !selectedPayment}
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
                      {allTransactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          İşlem geçmişi bulunmamaktadır.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {allTransactions
                              .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                              .map((transaction) => (
                                <div
                                  key={transaction.id}
                                  className="flex justify-between items-center border-b pb-2"
                                >
                                  <div>
                                    <p className="font-medium">
                                      {transaction.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(transaction.created_at).toLocaleString("tr-TR")}
                                    </p>
                                  </div>
                                  <p
                                    className={`font-bold ${transaction.amount > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                      }`}
                                  >
                                    {transaction.amount > 0 ? "+" : ""}₺
                                    {transaction.amount.toFixed(2)}
                                  </p>
                                </div>
                              ))}
                          </div>

                          {Math.ceil(allTransactions.length / itemsPerPage) > 1 && (
                            <Pagination className="mt-4">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() => setTransactionsPage(p => Math.max(1, p - 1))}
                                    className={transactionsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                                {Array.from({ length: Math.ceil(allTransactions.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
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
                                    onClick={() => setTransactionsPage(p => Math.min(Math.ceil(allTransactions.length / itemsPerPage), p + 1))}
                                    className={transactionsPage === Math.ceil(allTransactions.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                          value={user?.email || ""}
                          onChange={async (e) => {
                            const newEmail = e.target.value;
                            if (!newEmail) return;

                            const { error } = await metahub.auth.updateUser({
                              email: newEmail
                            });

                            if (error) {
                              toast.error("E-posta güncellenemedi: " + error.message);
                            } else {
                              toast.success("E-posta güncelleme bağlantısı gönderildi. Lütfen yeni e-posta adresinizi kontrol edin.");
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
                      <Button onClick={handleUpdateProfile} className="w-full">
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
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Yeni şifrenizi girin"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Şifrenizi tekrar girin"
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
                          const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

                          if (!newPassword || newPassword.length < 6) {
                            toast.error("Şifre en az 6 karakter olmalıdır");
                            return;
                          }

                          if (newPassword !== confirmPassword) {
                            toast.error("Şifreler eşleşmiyor");
                            return;
                          }

                          const { error } = await metahub.auth.updateUser({
                            password: newPassword
                          });

                          if (error) {
                            toast.error("Şifre güncellenemedi");
                          } else {
                            toast.success("Şifre başarıyla güncellendi");
                            (document.getElementById('newPassword') as HTMLInputElement).value = '';
                            (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
                          }
                        }}
                        className="w-full"
                      >
                        Şifreyi Güncelle
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="support" className="space-y-4 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Destek</h2>
                    <Button onClick={() => setShowNewTicket(!showNewTicket)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Yeni Ticket
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tickets List */}
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
                                      setNewTicket({ ...newTicket, subject: value });
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
                                      setNewTicket({ ...newTicket, category: value });
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
                                    setNewTicket({ ...newTicket, priority: value })
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
                                      setNewTicket({ ...newTicket, message: value });
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
                                <Button type="submit" className="flex-1">
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
                          <CardDescription>
                            Tüm destek talepleriniz ({tickets.length})
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {tickets.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              Henüz ticket oluşturmadınız.
                            </p>
                          ) : (
                            tickets.map((ticket) => (
                              <Card
                                key={ticket.id}
                                className={`cursor-pointer hover:bg-accent ${selectedTicket?.id === ticket.id ? "bg-accent" : ""
                                  }`}
                                onClick={() => handleTicketClick(ticket)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold">{ticket.subject}</h3>
                                    <Badge className={getStatusColor(ticket.status)}>
                                      {getStatusText(ticket.status)}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge
                                      variant="outline"
                                      className={getPriorityColor(ticket.priority)}
                                    >
                                      {getPriorityText(ticket.priority)}
                                    </Badge>
                                    {ticket.category && (
                                      <Badge variant="outline">{ticket.category}</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(ticket.created_at).toLocaleDateString("tr-TR")}
                                  </p>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Ticket Details */}
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
                            {/* Original Message */}
                            <div className="bg-muted p-4 rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">
                                {selectedTicket.message}
                              </p>
                            </div>

                            {/* Replies */}
                            <div className="space-y-4">
                              {replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className={`p-4 rounded-lg ${reply.is_admin ? "bg-primary/10" : "bg-muted"
                                    }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold text-sm">
                                      {reply.is_admin
                                        ? "Destek Ekibi"
                                        : reply.profiles?.full_name || "Siz"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(reply.created_at).toLocaleString("tr-TR")}
                                    </p>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {reply.message}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Reply Form */}
                            {selectedTicket.status !== "closed" && (
                              <div className="flex gap-2">
                                <Textarea
                                  value={replyMessage}
                                  onChange={(e) => setReplyMessage(e.target.value)}
                                  placeholder="Yanıtınızı yazın..."
                                  rows={3}
                                />
                                <Button onClick={handleSendReply} size="icon">
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
                              <p className="text-muted-foreground">
                                Görüntülemek için bir ticket seçin
                              </p>
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
