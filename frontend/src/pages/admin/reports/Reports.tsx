// =============================================================
// FILE: src/pages/admin/Reports.tsx  (FIXED - modular, no infinite loop)
// =============================================================
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Separator } from "@/components/ui/separator";

// ✅ RTK admin endpoints
import {
  useListOrdersAdminQuery,
  useListAllOrderItemsAdminQuery,
} from "@/integrations/metahub/rtk/endpoints/admin/orders_admin.endpoints";
import { useListUsersAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";
import type {
  OrderView,
  OrderItemView,
} from "@/integrations/metahub/rtk/types/orders";
import type { User } from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";

// ✅ RTK wallet endpoints
import { useListWalletTransactionsQuery } from "@/integrations/metahub/rtk/endpoints/wallet.endpoints";
import type { WalletTransaction } from "@/integrations/metahub/rtk/types/wallet";

// ✅ Local report types
import type {
  RevenueStats,
  OrderStats,
  UserStats,
  TopProduct,
  TopCustomer,
  OrderStatusStats,
} from "./types";

// ✅ Sections
import { OverviewSection } from "./OverviewSection";
import { RevenueSection } from "./RevenueSection";
import { OrdersSection } from "./OrdersSection";
import { ProductsSection } from "./ProductsSection";
import { UsersSection } from "./UsersSection";
import { WalletSection } from "./WalletSection";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Reports() {
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);
  const [orderStatusStats, setOrderStatusStats] =
    useState<OrderStatusStats | null>(null);

  const { toast } = useToast();

  // ---------- RTK: Orders & Users (Admin endpoints) ----------
  const {
    data: orders,
    isLoading: ordersLoading,
  } = useListOrdersAdminQuery({
    sort: "created_at",
    order: "desc",
    limit: 200,
  });

  const {
    data: orderItems,
    isLoading: orderItemsLoading,
  } = useListAllOrderItemsAdminQuery({
    limit: 5000,
  });

  const {
    data: users,
    isLoading: usersLoading,
  } = useListUsersAdminQuery({
    sort: "created_at",
    order: "desc",
    limit: 200,
  });

  // ---------- RTK: Wallet Transactions (Admin) ----------
  const {
    data: walletTransactions,
    isLoading: walletLoading,
  } = useListWalletTransactionsQuery({
    limit: 1000,
    order: "desc",
  });

  // ---------- Helpers ----------
  const buildDateRanges = () => {
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

    return {
      today,
      yesterday,
      last7Days,
      last30Days,
      lastMonthStart,
      lastMonthEnd,
    };
  };

  // ---------- Derive stats from orders (RTK) ----------
  useEffect(() => {
    if (!orders || orders.length === 0) {
      setRevenueStats({
        today: 0,
        yesterday: 0,
        last7Days: 0,
        last30Days: 0,
        lastMonth: 0,
        total: 0,
      });
      setOrderStats({
        today: 0,
        yesterday: 0,
        last7Days: 0,
        last30Days: 0,
        total: 0,
      });
      setOrderStatusStats({
        pending: 0,
        completed: 0,
        cancelled: 0,
        processing: 0,
      });
      setTopCustomers([]);
      return;
    }

    const {
      today,
      yesterday,
      last7Days,
      last30Days,
      lastMonthStart,
      lastMonthEnd,
    } = buildDateRanges();

    const toDate = (v: string) => new Date(v);

    // Sadece tamamlanmış siparişler üzerinden gelir istatistikleri
    const completedOrders = (orders as OrderView[]).filter(
      (o) => o.status === "completed",
    );

    const sumRevenue = (filterFn: (o: OrderView) => boolean) =>
      completedOrders
        .filter(filterFn)
        .reduce(
          (sum, o) => sum + Number((o as any).final_amount ?? 0),
          0,
        );

    const revenue: RevenueStats = {
      today: sumRevenue((o) => toDate(o.created_at) >= today),
      yesterday: sumRevenue((o) => {
        const d = toDate(o.created_at);
        return d >= yesterday && d < today;
      }),
      last7Days: sumRevenue((o) => toDate(o.created_at) >= last7Days),
      last30Days: sumRevenue((o) => toDate(o.created_at) >= last30Days),
      lastMonth: sumRevenue((o) => {
        const d = toDate(o.created_at);
        return d >= lastMonthStart && d <= lastMonthEnd;
      }),
      total: completedOrders.reduce(
        (sum, o) => sum + Number((o as any).final_amount ?? 0),
        0,
      ),
    };

    setRevenueStats(revenue);

    // Sipariş adet istatistikleri (tüm siparişler)
    const orderCounts: OrderStats = {
      today: orders.filter((o) => toDate(o.created_at) >= today).length,
      yesterday: orders.filter((o) => {
        const d = toDate(o.created_at);
        return d >= yesterday && d < today;
      }).length,
      last7Days: orders.filter((o) => toDate(o.created_at) >= last7Days).length,
      last30Days: orders.filter((o) => toDate(o.created_at) >= last30Days)
        .length,
      total: orders.length,
    };

    setOrderStats(orderCounts);

    // Sipariş durumu dağılımı
    const statusStats: OrderStatusStats = {
      pending: 0,
      completed: 0,
      cancelled: 0,
      processing: 0,
    };

    (orders as OrderView[]).forEach((o) => {
      switch (o.status) {
        case "pending":
          statusStats.pending += 1;
          break;
        case "completed":
          statusStats.completed += 1;
          break;
        case "cancelled":
          statusStats.cancelled += 1;
          break;
        case "processing":
          statusStats.processing += 1;
          break;
        default:
          break;
      }
    });

    setOrderStatusStats(statusStats);

    // En çok harcama yapan kullanıcılar (completed orders)
    const customerMap = new Map<
      string,
      { name: string; email: string; totalSpent: number; orderCount: number }
    >();

    completedOrders.forEach((o) => {
      const email = (o as any).customer_email as string | null | undefined;
      if (!email) return;

      const name = ((o as any).customer_name as string | null) ?? "Misafir";

      const existing =
        customerMap.get(email) ?? {
          name,
          email,
          totalSpent: 0,
          orderCount: 0,
        };

      customerMap.set(email, {
        ...existing,
        totalSpent: existing.totalSpent + Number((o as any).final_amount ?? 0),
        orderCount: existing.orderCount + 1,
      });
    });

    const customers: TopCustomer[] = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    setTopCustomers(customers);
  }, [orders]);

  // ---------- Derive user stats (RTK) ----------
  useEffect(() => {
    if (!users || users.length === 0) {
      setUserStats({
        today: 0,
        yesterday: 0,
        last7Days: 0,
        last30Days: 0,
        total: 0,
      });
      return;
    }

    const { today, yesterday, last7Days, last30Days } = buildDateRanges();
    const toDate = (v: string) => new Date(v);

    const stats: UserStats = {
      today: (users as User[]).filter((u) => toDate(u.created_at) >= today)
        .length,
      yesterday: (users as User[]).filter((u) => {
        const d = toDate(u.created_at);
        return d >= yesterday && d < today;
      }).length,
      last7Days: (users as User[]).filter((u) => toDate(u.created_at) >= last7Days)
        .length,
      last30Days: (users as User[]).filter((u) => toDate(u.created_at) >= last30Days)
        .length,
      total: users.length,
    };

    setUserStats(stats);
  }, [users]);

  // ---------- Wallet toplam bakiyeyi RTK üzerinden türet ----------
  useEffect(() => {
    if (!walletTransactions || walletTransactions.length === 0) {
      setTotalWalletBalance(0);
      return;
    }

    const total = (walletTransactions as WalletTransaction[]).reduce(
      (sum, t) => sum + Number(t.amount ?? 0),
      0,
    );
    setTotalWalletBalance(total);
  }, [walletTransactions]);

  // ---------- Top products (RTK: global order items) ----------
  useEffect(() => {
    if (!orderItems || orderItems.length === 0) {
      setTopProducts([]);
      return;
    }

    try {
      const productMap = new Map<string, { sales: number; revenue: number }>();

      (orderItems as OrderItemView[]).forEach((item) => {
        const key = item.product_name || "İsimsiz Ürün";
        const existing = productMap.get(key) ?? {
          sales: 0,
          revenue: 0,
        };

        productMap.set(key, {
          sales: existing.sales + Number(item.quantity ?? 0),
          revenue: existing.revenue + Number(item.total_price ?? 0),
        });
      });

      const products: TopProduct[] = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 50);

      setTopProducts(products);
    } catch (error) {
      console.error("Top products hesaplanırken hata:", error);
      toast({
        title: "Hata",
        description: "Ürün performans raporları hesaplanırken bir hata oluştu",
        variant: "destructive",
      });
      setTopProducts([]);
    }
  }, [orderItems, toast]);

  const loading =
    ordersLoading || usersLoading || walletLoading || orderItemsLoading;

  if (
    loading ||
    !revenueStats ||
    !orderStats ||
    !userStats ||
    !orderStatusStats
  ) {
    return (
      <AdminLayout title="Raporlar">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const revenueChartData = [
    { name: "Bugün", tutar: revenueStats.today || 0 },
    { name: "Dün", tutar: revenueStats.yesterday || 0 },
    { name: "Son 7 Gün", tutar: revenueStats.last7Days || 0 },
    { name: "Son 30 Gün", tutar: revenueStats.last30Days || 0 },
    { name: "Geçen Ay", tutar: revenueStats.lastMonth || 0 },
  ];

  const orderChartData = [
    { name: "Bugün", siparis: orderStats.today || 0 },
    { name: "Dün", siparis: orderStats.yesterday || 0 },
    { name: "Son 7 Gün", siparis: orderStats.last7Days || 0 },
    { name: "Son 30 Gün", siparis: orderStats.last30Days || 0 },
  ];

  const userChartData = [
    { name: "Bugün", kullanici: userStats.today || 0 },
    { name: "Dün", kullanici: userStats.yesterday || 0 },
    { name: "Son 7 Gün", kullanici: userStats.last7Days || 0 },
    { name: "Son 30 Gün", kullanici: userStats.last30Days || 0 },
  ];

  const avgOrderAmount =
    orderStats.total > 0 ? (revenueStats.total || 0) / orderStats.total : 0;

  return (
    <AdminLayout title="Raporlar">
      <div className="space-y-8">
        <OverviewSection
          revenueStats={revenueStats}
          orderStats={orderStats}
          userStats={userStats}
          totalWalletBalance={totalWalletBalance}
        />

        <Separator className="my-8" />

        <RevenueSection
          revenueStats={revenueStats}
          revenueChartData={revenueChartData}
        />

        <Separator className="my-8" />

        <OrdersSection
          orderStats={orderStats}
          orderStatusStats={orderStatusStats}
          orderChartData={orderChartData}
          colors={COLORS}
        />

        <Separator className="my-8" />

        <ProductsSection topProducts={topProducts} />

        <Separator className="my-8" />

        <UsersSection
          userStats={userStats}
          topCustomers={topCustomers}
          userChartData={userChartData}
        />

        <Separator className="my-8" />

        <WalletSection
          revenueStats={revenueStats}
          totalWalletBalance={totalWalletBalance}
          avgOrderAmount={avgOrderAmount}
          topCustomers={topCustomers}
        />
      </div>
    </AdminLayout>
  );
}
