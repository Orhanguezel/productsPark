// =============================================================
// FILE: src/components/admin/reports/RevenueSection.tsx
// =============================================================
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RevenueStats } from "./types";

interface RevenueSectionProps {
  revenueStats: RevenueStats;
  revenueChartData: { name: string; tutar: number }[];
}

export function RevenueSection({
  revenueStats,
  revenueChartData,
}: RevenueSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gelir Raporları</h2>
      <Card>
        <CardHeader>
          <CardTitle>Gelir Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
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
              <Bar
                dataKey="tutar"
                fill="hsl(var(--primary))"
                name="Gelir (₺)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bugün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺
              {(revenueStats.today ?? 0).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son 7 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺
              {(revenueStats.last7Days ?? 0).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son 30 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺
              {(revenueStats.last30Days ?? 0).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
