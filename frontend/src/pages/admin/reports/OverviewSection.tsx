// =============================================================
// FILE: src/components/admin/reports/OverviewSection.tsx
// FINAL — Overview cards (dynamic, central types only)
// - Uses RevenueStats/UserStats/OrderStats from '@/integrations/types'
// - No hardcoded 0s
// =============================================================

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users, Wallet } from 'lucide-react';

import type { RevenueStats, OrderStats, UserStats } from '@/integrations/types';

type OverviewSectionProps = {
  revenueStats: RevenueStats;
  orderStats: OrderStats;
  userStats: UserStats;
  totalWalletBalance: number;
};

const moneyTR = (v: unknown): string => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : 0;

  const safe = Number.isFinite(n) ? n : 0;

  return safe.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
};

const intTR = (v: unknown): string => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : 0;

  const safe = Number.isFinite(n) ? n : 0;
  return Math.trunc(safe).toLocaleString('tr-TR');
};

export function OverviewSection({
  revenueStats,
  orderStats,
  userStats,
  totalWalletBalance,
}: OverviewSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Genel Bakış</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Toplam Gelir */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">₺{moneyTR(revenueStats.total)}</div>
            <p className="text-xs text-muted-foreground">
              Son 30 Gün: ₺{moneyTR(revenueStats.last30Days)}
            </p>
          </CardContent>
        </Card>

        {/* Toplam Sipariş */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{intTR(orderStats.total)}</div>
            <p className="text-xs text-muted-foreground">
              Bugün: {intTR(orderStats.today)} sipariş
            </p>
          </CardContent>
        </Card>

        {/* Toplam Kullanıcı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{intTR(userStats.total)}</div>
            <p className="text-xs text-muted-foreground">
              Bugün: {intTR(userStats.today)} yeni kayıt
            </p>
          </CardContent>
        </Card>

        {/* Toplam Bakiye */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bakiye</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">₺{moneyTR(totalWalletBalance)}</div>
            <p className="text-xs text-muted-foreground">Kullanıcı cüzdanları toplamı</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
