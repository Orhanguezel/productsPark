// =============================================================
// FILE: src/pages/admin/Admin.tsx
// FINAL — Admin gate uses ONLY useAuth().isAdmin (single source of truth)
// - No statusData.user.roles assumptions
// - Guard is stable and strict
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useAuth } from '@/hooks/useAuth';
import { ShoppingBag, Users, DollarSign, Clock, Eye } from 'lucide-react';

import { TicketManagement } from '@/components/admin/TicketManagement';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import type { MenuValue } from '@/components/admin/AdminSidebar';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useListOrdersQuery, useAdminListQuery } from '@/integrations/hooks';

const Admin = () => {
  const navigate = useNavigate();

  // ✅ Single source of truth
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<MenuValue>('dashboard');

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

  // ✅ Orders (admin list)
  const { data: orders = [], isLoading: ordersLoading } = useListOrdersQuery(
    { sort: 'created_at', order: 'desc' },
    { skip: !user || !isAdmin },
  );

  // ✅ Users (admin users list)
  const { data: users = [], isLoading: usersLoading } = useAdminListQuery(undefined, {
    skip: !user || !isAdmin,
  });

  const handleTabChange = (tab: MenuValue) => {
    setActiveTab(tab);
    if (tab !== 'dashboard') navigate(`/admin/${tab}`);
  };

  // ---------- Guard: login + admin ----------
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/giris', { replace: true });
      return;
    }

    if (!isAdmin) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, isAdmin, navigate]);

  // ---------- Stats ----------
  useEffect(() => {
    if (!isAdmin) {
      setStats({
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
      setRecentOrders([]);
      return;
    }

    const totalUsers = Array.isArray(users) ? users.length : 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(last7DaysStart.getDate() - 7);

    const last30DaysStart = new Date(todayStart);
    last30DaysStart.setDate(last30DaysStart.getDate() - 30);

    const allOrders = (orders ?? []) as any[];

    const paidOrders = allOrders.filter((o) => {
      const ps = String(o?.payment_status ?? '').toLowerCase();
      return ps === 'paid' || ps === 'completed'; // legacy safety
    });

    const toDate = (v: any) => {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const sumFinalAmount = (arr: any[]) =>
      arr.reduce((sum, o) => sum + Number(o?.final_amount ?? 0), 0);

    const todayOrdersArr = paidOrders.filter((o) => {
      const d = toDate(o?.created_at);
      return d ? d >= todayStart : false;
    });

    const pendingOrdersArr = allOrders.filter((o) => String(o?.status) === 'pending');

    const yesterdayOrdersArr = paidOrders.filter((o) => {
      const d = toDate(o?.created_at);
      return d ? d >= yesterdayStart && d < todayStart : false;
    });

    const thisMonthOrders = paidOrders.filter((o) => {
      const d = toDate(o?.created_at);
      return d ? d >= firstDayOfMonth : false;
    });

    const lastMonthOrders = paidOrders.filter((o) => {
      const d = toDate(o?.created_at);
      return d ? d >= firstDayOfLastMonth && d <= lastDayOfLastMonth : false;
    });

    const last7DaysOrders = paidOrders.filter((o) => {
      const d = toDate(o?.created_at);
      return d ? d >= last7DaysStart : false;
    });

    const last30DaysOrders = paidOrders.filter((o) => {
      const d = toDate(o?.created_at);
      return d ? d >= last30DaysStart : false;
    });

    setStats({
      todayOrders: todayOrdersArr.length,
      pendingOrders: pendingOrdersArr.length,
      totalUsers,
      todayRevenue: sumFinalAmount(todayOrdersArr),
      yesterdayRevenue: sumFinalAmount(yesterdayOrdersArr),
      thisMonthRevenue: sumFinalAmount(thisMonthOrders),
      lastMonthRevenue: sumFinalAmount(lastMonthOrders),
      last7DaysRevenue: sumFinalAmount(last7DaysOrders),
      last30DaysRevenue: sumFinalAmount(last30DaysOrders),
      allTimeRevenue: sumFinalAmount(paidOrders),
    });

    const openOrders = allOrders.filter((o) => {
      const st = String(o?.status ?? '').toLowerCase();
      return st === 'pending' || st === 'processing';
    });

    setRecentOrders(openOrders.slice(0, 10));
  }, [orders, users, isAdmin]);

  if (authLoading || ordersLoading || usersLoading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!user || !isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center px-6 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold ml-4">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'products' && 'Ürün Yönetimi'}
              {activeTab === 'orders' && 'Sipariş Yönetimi'}
              {activeTab === 'categories' && 'Kategori Yönetimi'}
              {activeTab === 'blog' && 'Blog Yönetimi'}
              {activeTab === 'coupons' && 'Kupon Yönetimi'}
              {activeTab === 'tickets' && 'Destek Yönetimi'}
            </h1>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bugünkü Sipariş</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.todayOrders}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Açık Sipariş</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                  </Card>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:bg-accent transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Bugünkü Gelir</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatPrice(stats.todayRevenue)}</div>
                          <p className="text-xs text-muted-foreground mt-1">Detaylar için tıklayın</p>
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
                          <span className="text-sm font-bold">{formatPrice(stats.yesterdayRevenue)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Bugün</span>
                          <span className="text-sm font-bold text-primary">{formatPrice(stats.todayRevenue)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Bu Ay</span>
                          <span className="text-sm font-bold">{formatPrice(stats.thisMonthRevenue)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Geçen Ay</span>
                          <span className="text-sm font-bold">{formatPrice(stats.lastMonthRevenue)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Son 7 Gün</span>
                          <span className="text-sm font-bold">{formatPrice(stats.last7DaysRevenue)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Son 30 Gün</span>
                          <span className="text-sm font-bold">{formatPrice(stats.last30DaysRevenue)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium">Tüm Zamanlar</span>
                          <span className="text-sm font-bold text-green-600">{formatPrice(stats.allTimeRevenue)}</span>
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
                            <TableHead className="text-right">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {recentOrders.map((order: any) => {
                            const firstItem = order?.order_items?.[0];
                            const additionalItems = (order?.order_items?.length || 0) - 1;

                            const created = new Date(order?.created_at);
                            const dateText = Number.isNaN(created.getTime())
                              ? '-'
                              : created.toLocaleDateString('tr-TR');

                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.order_number}</TableCell>

                                <TableCell>
                                  <div>
                                    <div className="font-medium">{order.customer_name}</div>
                                    <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  {firstItem ? (
                                    <div className="text-sm">
                                      <div className="font-medium">{firstItem.product_name}</div>
                                      {additionalItems > 0 && (
                                        <div className="text-muted-foreground">+{additionalItems} ürün</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>

                                <TableCell>{formatPrice(Number(order?.final_amount ?? 0))}</TableCell>

                                <TableCell>
                                  <Badge
                                    variant={order.status === 'completed' ? 'default' : 'secondary'}
                                    className={
                                      order.status === 'processing'
                                        ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700'
                                        : ''
                                    }
                                  >
                                    {order.status === 'completed'
                                      ? 'Tamamlandı'
                                      : order.status === 'pending'
                                      ? 'Beklemede'
                                      : order.status === 'processing'
                                      ? 'Teslimat Bekliyor'
                                      : order.status === 'cancelled'
                                      ? 'İptal Edildi'
                                      : String(order.status ?? '-')}
                                  </Badge>
                                </TableCell>

                                <TableCell>{dateText}</TableCell>

                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/orders/${order.id}`)}
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

            {activeTab === 'tickets' && <TicketManagement />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
