// =============================================================
// FILE: src/components/admin/products/form/sections/UsedStockList.tsx
// =============================================================
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UsedItem = {
  id: string;
  stock_content?: string;
  used_at?: string | null;
  order?: { order_number: string; customer_name: string; customer_email?: string | null } | null;
};

export default function UsedStockList({ list }: { list: UsedItem[] }) {
  if (!list?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kullanılan Stoklar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground">Toplam teslim edilen:</span>
            <span className="font-semibold">{list.length} adet</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {list.map((stock, index) => (
              <div key={stock.id} className="p-3 bg-muted rounded-lg border text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">#{index + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {stock.used_at ? new Date(stock.used_at).toLocaleString("tr-TR") : "-"}
                  </span>
                </div>

                {stock.order && (
                  <div className="text-xs space-y-1 border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sipariş No:</span>
                      <span className="font-semibold">{stock.order.order_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Müşteri:</span>
                      <span className="font-medium">{stock.order.customer_name}</span>
                    </div>
                    {stock.order.customer_email && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">E-posta:</span>
                        <span className="text-xs">{stock.order.customer_email}</span>
                      </div>
                    )}
                  </div>
                )}

                <pre className="text-xs font-mono bg-background p-2 rounded border overflow-x-auto">
                  {stock.stock_content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
