// =============================================================
// FILE: src/components/admin/reports/OrdersSection.tsx
// =============================================================
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { OrderStats, OrderStatusStats } from "./types";

interface OrdersSectionProps {
  orderStats: OrderStats;
  orderStatusStats: OrderStatusStats;
  orderChartData: { name: string; siparis: number }[];
  colors: string[];
}

export function OrdersSection({
  orderStats,
  orderStatusStats,
  orderChartData,
  colors,
}: OrdersSectionProps) {
  const orderStatusData = [
    {
      name: "Beklemede",
      value: orderStatusStats.pending || 0,
      color: colors[0],
    },
    {
      name: "Tamamlandı",
      value: orderStatusStats.completed || 0,
      color: colors[1],
    },
    {
      name: "İptal Edildi",
      value: orderStatusStats.cancelled || 0,
      color: colors[2],
    },
    {
      name: "İşleniyor",
      value: orderStatusStats.processing || 0,
      color: colors[3],
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Sipariş Analizleri</h2>
      <Card>
        <CardHeader>
          <CardTitle>Sipariş Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={orderChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-foreground"
                stroke="hsl(var(--foreground))"
              />
              <YAxis
                className="text-foreground"
                stroke="hsl(var(--foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
              <Line
                type="monotone"
                dataKey="siparis"
                stroke="hsl(var(--primary))"
                name="Sipariş Sayısı"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bugün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.yesterday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son 7 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.last7Days}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son 30 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.last30Days}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sipariş Durumu Dağılımı */}
      <Card>
        <CardHeader>
          <CardTitle>Sipariş Durumu Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center space-y-4">
              {orderStatusData.map((status, index) => (
                <div
                  key={status.name}
                  className="flex items-center justify-between p-3 border border-border rounded bg-card"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                  </span>
                  <span className="font-bold text-foreground">
                    {status.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
