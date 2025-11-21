// =============================================================
// FILE: src/components/admin/reports/WalletSection.tsx
// =============================================================
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RevenueStats, TopCustomer } from "./types";
import { TopCustomersTable } from "./TopCustomersTable";

interface WalletSectionProps {
  revenueStats: RevenueStats;
  totalWalletBalance: number;
  avgOrderAmount: number;
  topCustomers: TopCustomer[];
}

export function WalletSection({
  revenueStats,
  totalWalletBalance,
  avgOrderAmount,
  topCustomers,
}: WalletSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Bakiye & Ödeme Raporları</h2>

      <TopCustomersTable
        title="En Çok Harcama Yapan Kullanıcılar"
        customers={topCustomers}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Toplam Kullanıcı Bakiyeleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₺
              {totalWalletBalance.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Tüm kullanıcı cüzdanlarındaki toplam bakiye
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ödeme İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam Gelir</span>
                <span className="font-bold">
                  ₺
                  {(revenueStats.total ?? 0).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Ortalama Sipariş Tutarı
                </span>
                <span className="font-bold">
                  ₺
                  {avgOrderAmount.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
