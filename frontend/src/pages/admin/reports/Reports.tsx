// =============================================================
// FILE: src/pages/admin/Reports.tsx
// FINAL — modular, no infinite loop, central types, no any
// FIX: null-safe date parsing for users + uses normalized types (OrderView.total etc.)
// =============================================================

import * as React from 'react';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Separator } from '@/components/ui/separator';

// ✅ RTK admin endpoints
import {
  useListOrdersAdminQuery,
  useListAllOrderItemsAdminQuery,
  useAdminListQuery,
  useListWalletTransactionsQuery,
} from '@/integrations/hooks';

import type {
  OrderView,
  OrderItemView,
  OrderStatus,
  AdminUserView,
  WalletTransaction,
  RevenueStats,
  OrderStats,
  UserStats,
  TopProduct,
  TopCustomer,
  OrderStatusStats,
  RevenueChartPoint,
  OrdersChartPoint,
  UsersChartPoint,
} from '@/integrations/types';

// ✅ Sections (adjust paths if needed)
import { OverviewSection } from './OverviewSection';
import { RevenueSection } from './RevenueSection';
import { OrdersSection } from './OrdersSection';
import { ProductsSection } from './ProductsSection';
import { UsersSection } from './UsersSection';
import { WalletSection } from './WalletSection';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
] as const;

const safeNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const toDateSafe = (iso: string | null | undefined): Date => {
  if (!iso || !String(iso).trim()) return new Date(0);
  const d = new Date(String(iso));
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
};

function buildDateRanges() {
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

  return { today, yesterday, last7Days, last30Days, lastMonthStart, lastMonthEnd };
}

export default function Reports() {
  const { toast } = useToast();

  // ---------- RTK: Orders & Users (Admin endpoints) ----------
  const { data: orders = [], isLoading: ordersLoading } = useListOrdersAdminQuery({
    sort: 'created_at',
    order: 'desc',
    limit: 200,
  });

  const { data: orderItems = [], isLoading: orderItemsLoading } = useListAllOrderItemsAdminQuery({
    limit: 5000,
  });

  const { data: users = [], isLoading: usersLoading } = useAdminListQuery({
    sort: 'created_at',
    order: 'desc',
    limit: 200,
  });

  // ---------- RTK: Wallet Transactions (Admin) ----------
  const { data: walletTransactions = [], isLoading: walletLoading } =
    useListWalletTransactionsQuery({
      limit: 1000,
      order: 'desc',
    });

  const ranges = useMemo(() => buildDateRanges(), []);

  // ---------- Derived: Revenue / Orders / Status / Top customers ----------
  const derivedOrders = useMemo(() => {
    const emptyRevenue: RevenueStats = {
      today: 0,
      yesterday: 0,
      last7Days: 0,
      last30Days: 0,
      lastMonth: 0,
      total: 0,
    };

    const emptyOrders: OrderStats = {
      today: 0,
      yesterday: 0,
      last7Days: 0,
      last30Days: 0,
      total: 0,
    };

    const emptyStatus: OrderStatusStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };

    if (!orders.length) {
      return {
        revenueStats: emptyRevenue,
        orderStats: emptyOrders,
        orderStatusStats: emptyStatus,
        topCustomers: [] as TopCustomer[],
      };
    }

    const { today, yesterday, last7Days, last30Days, lastMonthStart, lastMonthEnd } = ranges;
    const typedOrders = orders as OrderView[];

    // Revenue: only completed; use normalized OrderView.total
    const completedOrders = typedOrders.filter((o) => o.status === 'completed');

    const sumRevenue = (filterFn: (o: OrderView) => boolean): number =>
      completedOrders.filter(filterFn).reduce((sum, o) => sum + safeNum(o.total), 0);

    const revenueStats: RevenueStats = {
      today: sumRevenue((o) => toDateSafe(o.created_at) >= today),
      yesterday: sumRevenue((o) => {
        const d = toDateSafe(o.created_at);
        return d >= yesterday && d < today;
      }),
      last7Days: sumRevenue((o) => toDateSafe(o.created_at) >= last7Days),
      last30Days: sumRevenue((o) => toDateSafe(o.created_at) >= last30Days),
      lastMonth: sumRevenue((o) => {
        const d = toDateSafe(o.created_at);
        return d >= lastMonthStart && d <= lastMonthEnd;
      }),
      total: completedOrders.reduce((sum, o) => sum + safeNum(o.total), 0),
    };

    const orderStats: OrderStats = {
      today: typedOrders.filter((o) => toDateSafe(o.created_at) >= today).length,
      yesterday: typedOrders.filter((o) => {
        const d = toDateSafe(o.created_at);
        return d >= yesterday && d < today;
      }).length,
      last7Days: typedOrders.filter((o) => toDateSafe(o.created_at) >= last7Days).length,
      last30Days: typedOrders.filter((o) => toDateSafe(o.created_at) >= last30Days).length,
      total: typedOrders.length,
    };

    const orderStatusStats: OrderStatusStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };

    typedOrders.forEach((o) => {
      const s = o.status as OrderStatus | string;
      if (s === 'pending') orderStatusStats.pending = (orderStatusStats.pending ?? 0) + 1;
      else if (s === 'processing')
        orderStatusStats.processing = (orderStatusStats.processing ?? 0) + 1;
      else if (s === 'completed')
        orderStatusStats.completed = (orderStatusStats.completed ?? 0) + 1;
      else if (s === 'cancelled')
        orderStatusStats.cancelled = (orderStatusStats.cancelled ?? 0) + 1;
    });

    const customerMap = new Map<
      string,
      { name: string; email: string; totalSpent: number; orderCount: number }
    >();

    completedOrders.forEach((o) => {
      const email = (o.customer_email || '').trim();
      if (!email) return;

      const name = (o.customer_name || 'Misafir').trim() || 'Misafir';
      const existing = customerMap.get(email) ?? { name, email, totalSpent: 0, orderCount: 0 };

      customerMap.set(email, {
        ...existing,
        totalSpent: existing.totalSpent + safeNum(o.total),
        orderCount: existing.orderCount + 1,
      });
    });

    const topCustomers: TopCustomer[] = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return { revenueStats, orderStats, orderStatusStats, topCustomers };
  }, [orders, ranges]);

  const userStats: UserStats = useMemo(() => {
    const empty: UserStats = { today: 0, yesterday: 0, last7Days: 0, last30Days: 0, total: 0 };
    if (!users.length) return empty;

    const { today, yesterday, last7Days, last30Days } = ranges;
    const typedUsers = users as AdminUserView[];

    return {
      today: typedUsers.filter((u) => toDateSafe(u.created_at) >= today).length,
      yesterday: typedUsers.filter((u) => {
        const d = toDateSafe(u.created_at);
        return d >= yesterday && d < today;
      }).length,
      last7Days: typedUsers.filter((u) => toDateSafe(u.created_at) >= last7Days).length,
      last30Days: typedUsers.filter((u) => toDateSafe(u.created_at) >= last30Days).length,
      total: typedUsers.length,
    };
  }, [users, ranges]);

  const totalWalletBalance: number = useMemo(() => {
    if (!walletTransactions.length) return 0;
    const typed = walletTransactions as WalletTransaction[];
    return typed.reduce((sum, t) => sum + safeNum(t.amount), 0);
  }, [walletTransactions]);

  const topProducts: TopProduct[] = useMemo(() => {
    if (!orderItems.length) return [];

    try {
      const typedItems = orderItems as OrderItemView[];
      const productMap = new Map<string, { sales: number; revenue: number }>();

      typedItems.forEach((item) => {
        const name = (item.product_name || 'İsimsiz Ürün').trim() || 'İsimsiz Ürün';
        const existing = productMap.get(name) ?? { sales: 0, revenue: 0 };

        productMap.set(name, {
          sales: existing.sales + safeNum(item.quantity),
          revenue: existing.revenue + safeNum(item.total_price),
        });
      });

      return Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 50);
    } catch (error) {
      console.error('Top products hesaplanırken hata:', error);
      toast({
        title: 'Hata',
        description: 'Ürün performans raporları hesaplanırken bir hata oluştu',
        variant: 'destructive',
      });
      return [];
    }
  }, [orderItems, toast]);

  const loading = ordersLoading || usersLoading || walletLoading || orderItemsLoading;

  if (loading) {
    return (
      <AdminLayout title="Raporlar">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const revenueChartData: RevenueChartPoint[] = [
    { name: 'Bugün', amount: derivedOrders.revenueStats.today },
    { name: 'Dün', amount: derivedOrders.revenueStats.yesterday },
    { name: 'Son 7 Gün', amount: derivedOrders.revenueStats.last7Days },
    { name: 'Son 30 Gün', amount: derivedOrders.revenueStats.last30Days },
    { name: 'Geçen Ay', amount: derivedOrders.revenueStats.lastMonth },
  ];

  const orderChartData: OrdersChartPoint[] = [
    { name: 'Bugün', orders: derivedOrders.orderStats.today },
    { name: 'Dün', orders: derivedOrders.orderStats.yesterday },
    { name: 'Son 7 Gün', orders: derivedOrders.orderStats.last7Days },
    { name: 'Son 30 Gün', orders: derivedOrders.orderStats.last30Days },
  ];

  const userChartData: UsersChartPoint[] = [
    { name: 'Bugün', users: userStats.today },
    { name: 'Dün', users: userStats.yesterday },
    { name: 'Son 7 Gün', users: userStats.last7Days },
    { name: 'Son 30 Gün', users: userStats.last30Days },
  ];

  const avgOrderAmount =
    derivedOrders.orderStats.total > 0
      ? derivedOrders.revenueStats.total / derivedOrders.orderStats.total
      : 0;

  return (
    <AdminLayout title="Raporlar">
      <div className="space-y-8">
        <OverviewSection
          revenueStats={derivedOrders.revenueStats}
          orderStats={derivedOrders.orderStats}
          userStats={userStats}
          totalWalletBalance={totalWalletBalance}
        />

        <Separator className="my-8" />

        <RevenueSection
          revenueStats={derivedOrders.revenueStats}
          revenueChartData={revenueChartData}
        />

        <Separator className="my-8" />

        <OrdersSection
          orderStats={derivedOrders.orderStats}
          orderStatusStats={derivedOrders.orderStatusStats}
          orderChartData={orderChartData}
          colors={[...COLORS]}
        />

        <Separator className="my-8" />

        <ProductsSection topProducts={topProducts} />

        <Separator className="my-8" />

        <UsersSection
          userStats={userStats}
          topCustomers={derivedOrders.topCustomers}
          userChartData={userChartData}
        />

        <Separator className="my-8" />

        <WalletSection
          revenueStats={derivedOrders.revenueStats}
          totalWalletBalance={totalWalletBalance}
          avgOrderAmount={avgOrderAmount}
          topCustomers={derivedOrders.topCustomers}
        />
      </div>
    </AdminLayout>
  );
}
