import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { metahub } from "@/integrations/metahub/client";
import { Loader2, TrendingUp, ShoppingCart, Package, Users, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface RevenueStats {
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
  lastMonth: number;
  total: number;
}

interface OrderStats {
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
  total: number;
}

interface UserStats {
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
  total: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface TopCustomer {
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
}

interface OrderStatusStats {
  pending: number;
  completed: number;
  cancelled: number;
  processing: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);
  const [orderStatusStats, setOrderStatusStats] = useState<OrderStatusStats | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRevenueStats(),
        fetchOrderStats(),
        fetchUserStats(),
        fetchTopProducts(),
        fetchTopCustomers(),
        fetchWalletStats(),
        fetchOrderStatusStats()
      ]);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Raporlar yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueStats = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const { data: orders } = await metahub
      .from("orders")
      .select("final_amount, created_at, status")
      .eq("status", "completed");

    if (orders) {
      const stats: RevenueStats = {
        today: orders.filter(o => new Date(o.created_at) >= today).reduce((sum, o) => sum + Number(o.final_amount), 0),
        yesterday: orders.filter(o => {
          const date = new Date(o.created_at);
          return date >= yesterday && date < today;
        }).reduce((sum, o) => sum + Number(o.final_amount), 0),
        last7Days: orders.filter(o => new Date(o.created_at) >= last7Days).reduce((sum, o) => sum + Number(o.final_amount), 0),
        last30Days: orders.filter(o => new Date(o.created_at) >= last30Days).reduce((sum, o) => sum + Number(o.final_amount), 0),
        lastMonth: orders.filter(o => {
          const date = new Date(o.created_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        }).reduce((sum, o) => sum + Number(o.final_amount), 0),
        total: orders.reduce((sum, o) => sum + Number(o.final_amount), 0)
      };
      setRevenueStats(stats);
    }
  };

  const fetchOrderStats = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const { data: orders } = await metahub
      .from("orders")
      .select("id, created_at");

    if (orders) {
      const stats: OrderStats = {
        today: orders.filter(o => new Date(o.created_at) >= today).length,
        yesterday: orders.filter(o => {
          const date = new Date(o.created_at);
          return date >= yesterday && date < today;
        }).length,
        last7Days: orders.filter(o => new Date(o.created_at) >= last7Days).length,
        last30Days: orders.filter(o => new Date(o.created_at) >= last30Days).length,
        total: orders.length
      };
      setOrderStats(stats);
    }
  };

  const fetchUserStats = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const { data: profiles } = await metahub
      .from("profiles")
      .select("id, created_at");

    if (profiles) {
      const stats: UserStats = {
        today: profiles.filter(p => new Date(p.created_at) >= today).length,
        yesterday: profiles.filter(p => {
          const date = new Date(p.created_at);
          return date >= yesterday && date < today;
        }).length,
        last7Days: profiles.filter(p => new Date(p.created_at) >= last7Days).length,
        last30Days: profiles.filter(p => new Date(p.created_at) >= last30Days).length,
        total: profiles.length
      };
      setUserStats(stats);
    }
  };

  const fetchTopProducts = async () => {
    const { data: orderItems } = await metahub
      .from("order_items")
      .select("product_name, quantity, total_price");

    if (orderItems) {
      const productMap = new Map<string, { sales: number; revenue: number }>();

      orderItems.forEach(item => {
        const existing = productMap.get(item.product_name) || { sales: 0, revenue: 0 };
        productMap.set(item.product_name, {
          sales: existing.sales + item.quantity,
          revenue: existing.revenue + Number(item.total_price)
        });
      });

      const products = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      setTopProducts(products);
    }
  };

  const fetchTopCustomers = async () => {
    const { data: orders } = await metahub
      .from("orders")
      .select("user_id, customer_name, customer_email, final_amount")
      .eq("status", "completed");

    if (orders) {
      const customerMap = new Map<string, { name: string; email: string; totalSpent: number; orderCount: number }>();

      orders.forEach(order => {
        if (!order.customer_email) return; // Skip orders without email
        const key = order.customer_email;
        const existing = customerMap.get(key) || {
          name: order.customer_name || "Misafir",
          email: order.customer_email,
          totalSpent: 0,
          orderCount: 0
        };
        customerMap.set(key, {
          ...existing,
          totalSpent: existing.totalSpent + Number(order.final_amount),
          orderCount: existing.orderCount + 1
        });
      });

      const customers = Array.from(customerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      setTopCustomers(customers);
    }
  };

  const fetchWalletStats = async () => {
    const { data: profiles } = await metahub
      .from("profiles")
      .select("wallet_balance");

    if (profiles) {
      const total = profiles.reduce((sum, p) => sum + Number(p.wallet_balance || 0), 0);
      setTotalWalletBalance(total);
    }
  };

  const fetchOrderStatusStats = async () => {
    const { data: orders } = await metahub
      .from("orders")
      .select("status");

    if (orders) {
      const stats: OrderStatusStats = {
        pending: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        processing: orders.filter(o => o.status === 'processing').length,
      };
      setOrderStatusStats(stats);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Raporlar">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const revenueChartData = [
    { name: 'Bugün', tutar: revenueStats?.today || 0 },
    { name: 'Dün', tutar: revenueStats?.yesterday || 0 },
    { name: 'Son 7 Gün', tutar: revenueStats?.last7Days || 0 },
    { name: 'Son 30 Gün', tutar: revenueStats?.last30Days || 0 },
    { name: 'Geçen Ay', tutar: revenueStats?.lastMonth || 0 },
  ];

  const orderChartData = [
    { name: 'Bugün', siparis: orderStats?.today || 0 },
    { name: 'Dün', siparis: orderStats?.yesterday || 0 },
    { name: 'Son 7 Gün', siparis: orderStats?.last7Days || 0 },
    { name: 'Son 30 Gün', siparis: orderStats?.last30Days || 0 },
  ];

  const userChartData = [
    { name: 'Bugün', kullanici: userStats?.today || 0 },
    { name: 'Dün', kullanici: userStats?.yesterday || 0 },
    { name: 'Son 7 Gün', kullanici: userStats?.last7Days || 0 },
    { name: 'Son 30 Gün', kullanici: userStats?.last30Days || 0 },
  ];

  const orderStatusData = [
    { name: 'Beklemede', value: orderStatusStats?.pending || 0, color: COLORS[0] },
    { name: 'Tamamlandı', value: orderStatusStats?.completed || 0, color: COLORS[1] },
    { name: 'İptal Edildi', value: orderStatusStats?.cancelled || 0, color: COLORS[2] },
    { name: 'İşleniyor', value: orderStatusStats?.processing || 0, color: COLORS[3] },
  ];

  return (
    <AdminLayout title="Raporlar">
      <div className="space-y-8">
        {/* Genel Bakış */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Genel Bakış</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{revenueStats?.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Son 30 Gün: ₺{revenueStats?.last30Days.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.total}</div>
                <p className="text-xs text-muted-foreground">Bugün: {orderStats?.today} sipariş</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.total}</div>
                <p className="text-xs text-muted-foreground">Bugün: {userStats?.today} yeni kayıt</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Bakiye</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{totalWalletBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Kullanıcı cüzdanları toplamı</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Gelir Raporları */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Gelir Raporları</h2>
          <Card>
            <CardHeader>
              <CardTitle>Gelir Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-foreground" stroke="hsl(var(--foreground))" />
                  <YAxis className="text-foreground" stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="tutar" fill="hsl(var(--primary))" name="Gelir (₺)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bugün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{revenueStats?.today.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Son 7 Gün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{revenueStats?.last7Days.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Son 30 Gün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{revenueStats?.last30Days.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Sipariş Analizleri */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Sipariş Analizleri</h2>
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={orderChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-foreground" stroke="hsl(var(--foreground))" />
                  <YAxis className="text-foreground" stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="siparis" stroke="hsl(var(--primary))" name="Sipariş Sayısı" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bugün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.today}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.yesterday}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Son 7 Gün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.last7Days}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Son 30 Gün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.last30Days}</div>
              </CardContent>
            </Card>
          </div>

          {/* Sipariş Durumu Dağılımı */}
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Durumu Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => {
                        return `${entry.name}: ${entry.value}`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col justify-center space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded bg-card">
                    <span className="flex items-center gap-2 text-foreground">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[0] }}></div>
                      Beklemede
                    </span>
                    <span className="font-bold text-foreground">{orderStatusStats?.pending}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded bg-card">
                    <span className="flex items-center gap-2 text-foreground">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[1] }}></div>
                      Tamamlandı
                    </span>
                    <span className="font-bold text-foreground">{orderStatusStats?.completed}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded bg-card">
                    <span className="flex items-center gap-2 text-foreground">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[2] }}></div>
                      İptal Edildi
                    </span>
                    <span className="font-bold text-foreground">{orderStatusStats?.cancelled}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded bg-card">
                    <span className="flex items-center gap-2 text-foreground">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[3] }}></div>
                      İşleniyor
                    </span>
                    <span className="font-bold text-foreground">{orderStatusStats?.processing}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Ürün Performans Raporları */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Ürün Performans Raporları</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>En Çok Satılan Ürünler (Adet)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-foreground" stroke="hsl(var(--foreground))" />
                    <YAxis dataKey="name" type="category" width={150} className="text-foreground" stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" name="Satış Adedi" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>En Çok Gelir Getiren Ürünler</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topProducts.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ₺${entry.revenue.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {topProducts.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ürün Satış Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground font-semibold">Ürün Adı</th>
                      <th className="text-right py-2 text-foreground font-semibold">Satış Adedi</th>
                      <th className="text-right py-2 text-foreground font-semibold">Toplam Gelir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-2 text-foreground">{product.name}</td>
                        <td className="text-right py-2 text-foreground">{product.sales}</td>
                        <td className="text-right py-2 text-foreground">₺{product.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Kullanıcı Analizleri */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Kullanıcı Analizleri</h2>
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-foreground" stroke="hsl(var(--foreground))" />
                  <YAxis className="text-foreground" stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="kullanici" fill="hsl(var(--primary))" name="Yeni Kullanıcı" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bugün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.today}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.yesterday}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Son 7 Gün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.last7Days}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Son 30 Gün</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.last30Days}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>En Çok Harcama Yapan Kullanıcılar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground font-semibold">Ad Soyad</th>
                      <th className="text-left py-2 text-foreground font-semibold">E-posta</th>
                      <th className="text-right py-2 text-foreground font-semibold">Sipariş Sayısı</th>
                      <th className="text-right py-2 text-foreground font-semibold">Toplam Harcama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-2 text-foreground">{customer.name}</td>
                        <td className="py-2 text-foreground">{customer.email}</td>
                        <td className="text-right py-2 text-foreground">{customer.orderCount}</td>
                        <td className="text-right py-2 text-foreground">₺{customer.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Bakiye & Ödeme Raporları */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Bakiye & Ödeme Raporları</h2>

          <Card>
            <CardHeader>
              <CardTitle>En Çok Harcama Yapan Kullanıcılar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground font-semibold">Ad Soyad</th>
                      <th className="text-left py-2 text-foreground font-semibold">E-posta</th>
                      <th className="text-right py-2 text-foreground font-semibold">Sipariş Sayısı</th>
                      <th className="text-right py-2 text-foreground font-semibold">Toplam Harcama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-2 text-foreground">{customer.name}</td>
                        <td className="py-2 text-foreground">{customer.email}</td>
                        <td className="text-right py-2 text-foreground">{customer.orderCount}</td>
                        <td className="text-right py-2 text-foreground">₺{customer.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Toplam Kullanıcı Bakiyeleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₺{totalWalletBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                <p className="text-sm text-muted-foreground mt-2">Tüm kullanıcı cüzdanlarındaki toplam bakiye</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ödeme İstatistikleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam Gelir</span>
                    <span className="font-bold">₺{revenueStats?.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ortalama Sipariş Tutarı</span>
                    <span className="font-bold">₺{orderStats?.total ? (revenueStats?.total || 0) / orderStats.total : 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
