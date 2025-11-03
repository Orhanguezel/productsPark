// src/components/FakeOrderCounter.tsx

import { useState, useEffect } from "react";
import { metahub } from "@/integrations/metahub/client";

interface CounterData {
  total_sales: number;
  total_orders: number;
  active_users: number;
}

export const FakeOrderCounter = () => {
  const [counters, setCounters] = useState<CounterData>({
    total_sales: 0,
    total_orders: 0,
    active_users: 0
  });

  useEffect(() => {
    fetchCounters();

    // Subscribe to real-time order updates
    const channel = metahub
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order:', payload);
          setCounters(prev => ({
            total_sales: prev.total_sales + (payload.new.final_amount || 0),
            total_orders: prev.total_orders + 1,
            active_users: prev.active_users
          }));
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const fetchCounters = async () => {
    try {
      const { data: orders, error } = await metahub
        .from("orders")
        .select("final_amount");

      if (error) throw error;

      const totalSales = orders?.reduce((sum, order) => sum + (order.final_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;

      // Simulate active users (could be from profiles table with recent activity)
      const activeUsers = Math.floor(Math.random() * 50) + 10;

      setCounters({
        total_sales: totalSales,
        total_orders: totalOrders,
        active_users: activeUsers
      });
    } catch (error) {
      console.error("Error fetching counters:", error);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Toplam Satış</p>
          <p className="text-2xl font-bold text-primary">
            ₺{counters.total_sales.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
          <p className="text-2xl font-bold text-primary">
            {counters.total_orders.toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
          <p className="text-2xl font-bold text-primary">
            {counters.active_users}
          </p>
        </div>
      </div>
    </div>
  );
};
