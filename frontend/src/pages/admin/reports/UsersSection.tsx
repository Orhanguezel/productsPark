// =============================================================
// FILE: src/components/admin/reports/UsersSection.tsx
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
import type { UserStats, TopCustomer } from "./types";
import { TopCustomersTable } from "./TopCustomersTable";

interface UsersSectionProps {
  userStats: UserStats;
  topCustomers: TopCustomer[];
  userChartData: { name: string; kullanici: number }[];
}

export function UsersSection({
  userStats,
  topCustomers,
  userChartData,
}: UsersSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Kullanıcı Analizleri</h2>
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userChartData}>
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
                dataKey="kullanici"
                fill="hsl(var(--primary))"
                name="Yeni Kullanıcı"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bugün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.yesterday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son 7 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.last7Days}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son 30 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.last30Days}</div>
          </CardContent>
        </Card>
      </div>

      <TopCustomersTable
        title="En Çok Harcama Yapan Kullanıcılar"
        customers={topCustomers}
      />
    </div>
  );
}
