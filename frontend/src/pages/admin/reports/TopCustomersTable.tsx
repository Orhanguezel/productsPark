// =============================================================
// FILE: src/components/admin/reports/TopCustomersTable.tsx
// =============================================================
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TopCustomer } from "./types";

interface TopCustomersTableProps {
  title: string;
  customers: TopCustomer[];
}

export function TopCustomersTable({ title, customers }: TopCustomersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-foreground font-semibold">
                  Ad Soyad
                </th>
                <th className="text-left py-2 text-foreground font-semibold">
                  E-posta
                </th>
                <th className="text-right py-2 text-foreground font-semibold">
                  Sipariş Sayısı
                </th>
                <th className="text-right py-2 text-foreground font-semibold">
                  Toplam Harcama
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="py-2 text-foreground">{customer.name}</td>
                  <td className="py-2 text-foreground">{customer.email}</td>
                  <td className="text-right py-2 text-foreground">
                    {customer.orderCount}
                  </td>
                  <td className="text-right py-2 text-foreground">
                    ₺
                    {customer.totalSpent.toLocaleString("tr-TR", {
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
  );
}
