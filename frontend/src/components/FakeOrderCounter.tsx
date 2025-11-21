// src/components/FakeOrderCounter.tsx

import { useMemo } from "react";
import { useListOrdersQuery } from "@/integrations/metahub/rtk/endpoints/orders.endpoints";

interface CounterData {
  total_sales: number;
  total_orders: number;
  active_users: number;
}

export const FakeOrderCounter = () => {
  // Tüm siparişleri (veya ihtiyaç halinde filtreli) çek
  const { data: orders = [], isLoading } = useListOrdersQuery({});

  const counters: CounterData = useMemo(() => {
    if (!orders.length) {
      return {
        total_sales: 0,
        total_orders: 0,
        active_users: 0,
      };
    }

    const total_sales = orders.reduce((sum, order) => {
      // normalizeOrder zaten final_amount dolduruyor
      const amount =
        typeof order.final_amount === "number"
          ? order.final_amount
          : typeof order.total_amount === "number"
          ? order.total_amount
          : 0;

      return sum + amount;
    }, 0);

    const total_orders = orders.length;

    // Aktif kullanıcı: benzersiz user_id sayısı (fallback: sipariş sayısına göre tahmin)
    const userIds = new Set(
      orders
        .map((o) => o.user_id)
        .filter((id): id is string => typeof id === "string" && id.trim() !== ""),
    );
    const active_users =
      userIds.size > 0
        ? userIds.size
        : Math.max(1, Math.floor(total_orders * 0.3));

    return {
      total_sales,
      total_orders,
      active_users,
    };
  }, [orders]);

  const totalSalesText = `₺${counters.total_sales.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const totalOrdersText = counters.total_orders.toLocaleString("tr-TR");

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Toplam Satış</p>
          <p className="text-2xl font-bold text-primary">
            {isLoading ? "Yükleniyor..." : totalSalesText}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
          <p className="text-2xl font-bold text-primary">
            {isLoading ? "—" : totalOrdersText}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
          <p className="text-2xl font-bold text-primary">
            {isLoading ? "—" : counters.active_users}
          </p>
        </div>
      </div>
    </div>
  );
};
