// =============================================================
// FILE: src/pages/account/components/StatsCards.tsx  (FINAL)
// - walletBalance/totalSpent already numbers; no re-parsing
// =============================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Wallet, Key } from 'lucide-react';

export function StatsCards(props: {
  ordersCount: number;
  walletBalance: number;
  totalSpent: number;
  txLoading?: boolean;
}) {
  const { ordersCount, walletBalance, totalSpent, txLoading } = props;

  const bal = Number.isFinite(walletBalance) ? walletBalance : 0;
  const spent = Number.isFinite(totalSpent) ? totalSpent : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ordersCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mevcut Bakiye</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₺{bal.toFixed(2)}</div>
          {txLoading && (
            <div className="text-xs text-muted-foreground mt-1">İşlemler yükleniyor…</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Harcama</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₺{spent.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
