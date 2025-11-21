// =============================================================
// FILE: src/pages/admin/Admin.tsx  (UPDATED - Users from RTK)
// =============================================================
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, Users, DollarSign, Clock, Eye } from "lucide-react";
import { TicketManagement } from "@/components/admin/TicketManagement";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ✅ RTK auth.status
import { useStatusQuery } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
// ✅ RTK orders
import { useListOrdersQuery } from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
// ✅ RTK admin users
import { useListUsersAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Auth status (is_admin + role bilgisi)
  const { data: statusData, isLoading: statusLoading } = useStatusQuery();

  const [activeTab, setActiveTab] = useState("dashboard");

  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    last7DaysRevenue: 0,
    last30DaysRevenue: 0,
    allTimeRevenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // ✅ isAdmin artık RTK auth + user.roles üzerinden derive ediliyor
  const isAdmin: boolean = (() => {
    // 1) /auth/status yanıtı
    if (statusData?.is_admin) return true;
    if (statusData?.user?.role === "admin") return true;

    // 2) useAuth içindeki user.role / user.roles
    const role = user?.role;
    if (role === "admin") return true;
    if (typeof role === "string" && role.toLowerCase() === "admin") return true;

    if (Array.isArray(user?.roles)) {
      if (user.roles.some((r) => String(r).toLowerCase() === "admin")) {
        return true;
      }
    }

    return false;
  })();

  // ✅ Tüm siparişleri RTK'dan çek (admin listeleme)
  const {
    data: orders = [],
    isLoading: ordersLoading,
  } = useListOrdersQuery(
    {
      sort: "created_at",
      order: "desc",
    },
    {
      skip: !user || !isAdmin,
    }
  );

  // ✅ Toplam kullanıcılar (admin users RTK)
  const {
    data: users = [],
    isLoading: usersLoading,
  } = useListUsersAdminQuery(
    // params yok → tüm kullanıcılar
    undefined,
    {
      skip: !user || !isAdmin,
    }
  );

  // Navigate to specific pages based on tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== "dashboard") {
      navigate(`/admin/${tab}`);
    }
  };

  // ---------- Guard: login + admin kontrolü ----------
  useEffect(() => {
    if (authLoading || statusLoading) return;

    // Login değilse → giriş sayfası
    if (!user) {
      navigate("/giris", { replace: true });
      return;
    }

    // Login ama admin değilse → ana sayfa
    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [authLoading, statusLoading, user, isAdmin, navigate]);

  // ---------- Stats + Açık siparişler (RTK orders + RTK users üzerinden) ----------
  useEffect(() => {
    if (!isAdmin) {
      setStats((prev) => ({
        ...prev,
        todayOrders: 0,
        pendingOrders: 0,
        todayRevenue: 0,
        yesterdayRevenue: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        last7DaysRevenue: 0,
        last30DaysRevenue: 0,
        allTimeRevenue: 0,
        totalUsers: 0,
      }));
      setRecentOrders([]);
      return;
    }

    const totalUsers = users.length;

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const lastDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    );
    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(last7DaysStart.getDate() - 7);
    const last30DaysStart = new Date(todayStart);
    last30DaysStart.setDate(last30DaysStart.getDate() - 30);

    const allOrders = (orders ?? []) as any[];

    // ✅ Sadece ödenmiş siparişleri gelir hesabına kat (paid + olası legacy completed)
    const paidOrders = allOrders.filter(
      (order) =>
        order.payment_status === "paid" ||
        order.payment_status === "completed"
    );

    const todayOrdersArr = paidOrders.filter(
      (order) => new Date(order.created_at) >= todayStart
    );

    const pendingOrdersArr = allOrders.filter(
      (order) => order.status === "pending"
    );

    const sumFinalAmount = (arr: any[]) =>
      arr.reduce(
        (sum, order) => sum + Number(order.final_amount ?? 0),
        0
      );

    const todayRevenue = sumFinalAmount(todayOrdersArr);

    const yesterdayOrdersArr = paidOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterdayStart && orderDate < todayStart;
    });
    const yesterdayRevenue = sumFinalAmount(yesterdayOrdersArr);

    const thisMonthOrders = paidOrders.filter(
      (order) => new Date(order.created_at) >= firstDayOfMonth
    );
    const thisMonthRevenue = sumFinalAmount(thisMonthOrders);

    const lastMonthOrders = paidOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= firstDayOfLastMonth && orderDate <= lastDayOfLastMonth;
    });
    const lastMonthRevenue = sumFinalAmount(lastMonthOrders);

    const last7DaysOrders = paidOrders.filter(
      (order) => new Date(order.created_at) >= last7DaysStart
    );
    const last7DaysRevenue = sumFinalAmount(last7DaysOrders);

    const last30DaysOrders = paidOrders.filter(
      (order) => new Date(order.created_at) >= last30DaysStart
    );
    const last30DaysRevenue = sumFinalAmount(last30DaysOrders);

    const allTimeRevenue = sumFinalAmount(paidOrders);

    setStats({
      todayOrders: todayOrdersArr.length,
      pendingOrders: pendingOrdersArr.length,
      totalUsers,
      todayRevenue,
      yesterdayRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      last7DaysRevenue,
      last30DaysRevenue,
      allTimeRevenue,
    });

    // Açık siparişler (pending + processing)
    const openOrders = allOrders.filter(
      (order) => order.status === "pending" || order.status === "processing"
    );

    setRecentOrders(openOrders.slice(0, 10));
  }, [orders, users, isAdmin]);

  // Global loading state
  if (authLoading || statusLoading || ordersLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  // Guard: kullanıcı yoksa veya admin değilse (navigate effect zaten çalışıyor)
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center px-6 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold ml-4">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "products" && "Ürün Yönetimi"}
              {activeTab === "orders" && "Sipariş Yönetimi"}
              {activeTab === "categories" && "Kategori Yönetimi"}
              {activeTab === "blog" && "Blog Yönetimi"}
              {activeTab === "coupons" && "Kupon Yönetimi"}
              {activeTab === "codes" && "Aktivasyon Kod Yönetimi"}
              {activeTab === "tickets" && "Destek Yönetimi"}
            </h1>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Bugünkü Sipariş
                      </CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.todayOrders}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Açık Sipariş
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.pendingOrders}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify_between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Toplam Kullanıcı
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalUsers}
                      </div>
                    </CardContent>
                  </Card>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:bg-accent transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Bugünkü Gelir
                          </CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatPrice(stats.todayRevenue)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Detaylar için tıklayın
                          </p>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Gelir Detayları</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Dün</span>
                          <span className="text-sm font-bold">
                            {formatPrice(stats.yesterdayRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Bugün</span>
                          <span className="text-sm font-bold text-primary">
                            {formatPrice(stats.todayRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Bu Ay</span>
                          <span className="text-sm font-bold">
                            {formatPrice(stats.thisMonthRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Geçen Ay</span>
                          <span className="text-sm font-bold">
                            {formatPrice(stats.lastMonthRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">
                            Son 7 Gün
                          </span>
                          <span className="text-sm font-bold">
                            {formatPrice(stats.last7DaysRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">
                            Son 30 Gün
                          </span>
                          <span className="text-sm font-bold">
                            {formatPrice(stats.last30DaysRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium">
                            Tüm Zamanlar
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {formatPrice(stats.allTimeRevenue)}
                          </span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Açık Siparişler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentOrders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Henüz sipariş bulunmamaktadır.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sipariş No</TableHead>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>Ürün(ler)</TableHead>
                            <TableHead>Tutar</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead className="text-right">
                              İşlemler
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentOrders.map((order: any) => {
                            const firstItem = order.order_items?.[0];
                            const additionalItems =
                              (order.order_items?.length || 0) - 1;

                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">
                                  {order.order_number}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {order.customer_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {order.customer_email}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {firstItem ? (
                                    <div className="text-sm">
                                      <div className="font-medium">
                                        {firstItem.product_name}
                                      </div>
                                      {additionalItems > 0 && (
                                        <div className="text-muted-foreground">
                                          +{additionalItems} ürün
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  ₺{order.final_amount}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      order.status === "completed"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      order.status === "processing"
                                        ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                                        : ""
                                    }
                                  >
                                    {order.status === "completed"
                                      ? "Tamamlandı"
                                      : order.status === "pending"
                                      ? "Beklemede"
                                      : order.status === "processing"
                                      ? "Teslimat Bekliyor"
                                      : order.status === "cancelled"
                                      ? "İptal Edildi"
                                      : order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    order.created_at
                                  ).toLocaleDateString("tr-TR")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      navigate(`/admin/orders/${order.id}`)
                                    }
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "tickets" && <TicketManagement />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
