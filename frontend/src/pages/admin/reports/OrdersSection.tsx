// =============================================================
// FILE: src/components/admin/reports/OrdersSection.tsx
// FINAL — fixed imports (OrderStats now comes from orders.ts)
// - No local OrderStats definition
// - No SortOrder import (unused) => removed
// =============================================================

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  type TooltipProps,
} from 'recharts';

import type { OrderStats, OrderStatus, OrderStatusStats } from '@/integrations/types';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

export type OrdersChartPoint = { name: string; orders: number };

const ORDER_STATUS_META: ReadonlyArray<{
  key: OrderStatus;
  label: string;
  colorIndex: number;
}> = [
  { key: 'pending', label: 'Beklemede', colorIndex: 0 },
  { key: 'processing', label: 'İşleniyor', colorIndex: 3 },
  { key: 'completed', label: 'Tamamlandı', colorIndex: 1 },
  { key: 'cancelled', label: 'İptal Edildi', colorIndex: 2 },
] as const;

type OrdersSectionProps = {
  orderStats: OrderStats;
  orderStatusStats: OrderStatusStats;
  orderChartData: OrdersChartPoint[];
  colors: string[];
};

type StatusPieItem = {
  key: OrderStatus;
  name: string;
  value: number;
  color: string;
};

const safeNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const pickColor = (colors: string[], idx: number): string => {
  const c = colors[idx];
  if (typeof c === 'string' && c.trim()) return c;
  return 'hsl(var(--primary))';
};

function OrdersTooltip(props: TooltipProps<ValueType, NameType>) {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;

  const first = payload[0];
  const val =
    typeof first?.value === 'number' || typeof first?.value === 'string' ? first.value : undefined;

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        color: 'hsl(var(--foreground))',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{String(label ?? '')}</div>
      <div style={{ opacity: 0.9 }}>
        {String(first?.name ?? 'Sipariş')}: {String(val ?? '')}
      </div>
    </div>
  );
}

export function OrdersSection({
  orderStats,
  orderStatusStats,
  orderChartData,
  colors,
}: OrdersSectionProps) {
  const orderStatusData: StatusPieItem[] = React.useMemo(() => {
    return ORDER_STATUS_META.map((m) => ({
      key: m.key,
      name: m.label,
      value: safeNum(orderStatusStats?.[m.key]),
      color: pickColor(colors, m.colorIndex),
    }));
  }, [orderStatusStats, colors]);

  const orderStatusDataNonZero = React.useMemo(
    () => orderStatusData.filter((x) => x.value > 0),
    [orderStatusData],
  );

  const pieData = orderStatusDataNonZero.length ? orderStatusDataNonZero : orderStatusData;

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
              <XAxis dataKey="name" className="text-foreground" stroke="hsl(var(--foreground))" />
              <YAxis className="text-foreground" stroke="hsl(var(--foreground))" />
              <Tooltip content={<OrdersTooltip />} />
              <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
              <Line
                type="monotone"
                dataKey="orders"
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
            <div className="text-2xl font-bold">{safeNum(orderStats.today)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeNum(orderStats.yesterday)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son 7 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeNum(orderStats.last7Days)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son 30 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeNum(orderStats.last30Days)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş Durumu Dağılımı</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: StatusPieItem) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center space-y-4">
              {pieData.map((status) => (
                <div
                  key={status.key}
                  className="flex items-center justify-between p-3 border border-border rounded bg-card"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <span
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: status.color }}
                      aria-hidden="true"
                    />
                    {status.name}
                  </span>
                  <span className="font-bold text-foreground">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
