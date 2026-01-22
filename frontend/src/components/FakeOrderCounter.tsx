// =============================================================
// FILE: src/components/FakeOrderCounter.tsx
// FINAL — Order counters (RTK + OrderView aligned, strict-safe)
// - uses OrderView.total (normalized final amount)
// - no legacy final_amount/total_amount access
// =============================================================

import React, { useMemo } from 'react';
import { useListOrdersQuery } from '@/integrations/hooks';
import type { OrderView } from '@/integrations/types';

type CounterData = {
  total_sales: number;
  total_orders: number;
  active_users: number;
};

export const FakeOrderCounter: React.FC = () => {
  // Public orders list (params optional; {} da olur ama void daha temiz)
  const { data, isLoading, isFetching } = useListOrdersQuery(undefined);

  const orders: OrderView[] = useMemo(
    () => (Array.isArray(data) ? (data as OrderView[]) : []),
    [data],
  );

  const counters: CounterData = useMemo(() => {
    const total_orders = orders.length;

    const total_sales = orders.reduce((sum, order) => {
      // OrderView.total = final_amount (legacy) normalize edilmiş alan
      const amount = Number.isFinite(order.total) ? order.total : 0;
      return sum + amount;
    }, 0);

    const userIds = new Set(
      orders.map((o) => o.user_id).filter((id) => typeof id === 'string' && id.trim() !== ''),
    );

    const active_users =
      userIds.size > 0 ? userIds.size : Math.max(0, Math.floor(total_orders * 0.3));

    return { total_sales, total_orders, active_users };
  }, [orders]);

  const loading = isLoading || isFetching;

  const totalSalesText = `₺${counters.total_sales.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const totalOrdersText = counters.total_orders.toLocaleString('tr-TR');

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Toplam Satış</p>
          <p className="text-2xl font-bold text-primary">
            {loading ? 'Yükleniyor...' : totalSalesText}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
          <p className="text-2xl font-bold text-primary">{loading ? '—' : totalOrdersText}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
          <p className="text-2xl font-bold text-primary">
            {loading ? '—' : counters.active_users.toLocaleString('tr-TR')}
          </p>
        </div>
      </div>
    </div>
  );
};
