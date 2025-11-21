// =============================================================
// FILE: src/components/admin/reports/ProductsSection.tsx
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TopProduct } from "./types";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface ProductsSectionProps {
  topProducts: TopProduct[];
}

export function ProductsSection({ topProducts }: ProductsSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Ürün Performans Raporları</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>En Çok Satılan Ürünler (Adet)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts.slice(0, 5)} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  type="number"
                  className="text-foreground"
                  stroke="hsl(var(--foreground))"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
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
                <Bar
                  dataKey="sales"
                  fill="hsl(var(--primary))"
                  name="Satış Adedi"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En Çok Gelir Getiren Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProducts.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    `${entry.name}: ₺${entry.revenue.toFixed(0)}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {topProducts.slice(0, 5).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ürün Satış Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-foreground font-semibold">
                    Ürün Adı
                  </th>
                  <th className="text-right py-2 text-foreground font-semibold">
                    Satış Adedi
                  </th>
                  <th className="text-right py-2 text-foreground font-semibold">
                    Toplam Gelir
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="py-2 text-foreground">
                      {product.name}
                    </td>
                    <td className="text-right py-2 text-foreground">
                      {product.sales}
                    </td>
                    <td className="text-right py-2 text-foreground">
                      ₺
                      {product.revenue.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
