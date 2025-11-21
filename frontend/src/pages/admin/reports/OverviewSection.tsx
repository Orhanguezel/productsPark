// =============================================================
// FILE: src/components/admin/reports/OverviewSection.tsx
// =============================================================
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import type {
  RevenueStats,
  OrderStats,
  UserStats,
} from "./types";

interface OverviewSectionProps {
  revenueStats: RevenueStats;
  orderStats: OrderStats;
  userStats: UserStats;
  totalWalletBalance: number;
}

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
            <CardTitle className="text-sm font-medium">
              Toplam Gelir
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺
              {(revenueStats.total ?? 0).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Son 30 Gün: ₺
              {(revenueStats.last30Days ?? 0).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        {/* Toplam Sipariş */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Sipariş
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Bugün: {orderStats.today} sipariş
            </p>
          </CardContent>
        </Card>

        {/* Toplam Kullanıcı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Kullanıcı
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Bugün: {userStats.today} yeni kayıt
            </p>
          </CardContent>
        </Card>

        {/* Toplam Bakiye */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Bakiye
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺
              {totalWalletBalance.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Kullanıcı cüzdanları toplamı
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
