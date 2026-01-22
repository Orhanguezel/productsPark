// =============================================================
// FILE: src/components/admin/reports/UsersSection.tsx
// FINAL — Users reports section (central types, no repetition)
// - Uses ONLY types from '@/integrations/types' (reports.ts)
// - Chart point: UsersChartPoint { name, count }
// - Typed tooltip (no any)
// =============================================================

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';

import type { UserStats, TopCustomer, UsersChartPoint } from '@/integrations/types';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

import { TopCustomersTable } from './TopCustomersTable';

type UsersSectionProps = {
  userStats: UserStats;
  topCustomers: TopCustomer[];
  userChartData: UsersChartPoint[];
};

const safeNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

function UsersTooltip(props: TooltipProps<ValueType, NameType>) {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;

  const first = payload[0];
  const raw = first?.value;
  const value = typeof raw === 'number' || typeof raw === 'string' ? safeNum(raw) : 0;

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
        {String(first?.name ?? 'Yeni Kullanıcı')}: {String(value)}
      </div>
    </div>
  );
}

type StatCardProps = { title: string; value: number };

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{safeNum(value)}</div>
      </CardContent>
    </Card>
  );
}

export function UsersSection({ userStats, topCustomers, userChartData }: UsersSectionProps) {
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
              <XAxis dataKey="name" className="text-foreground" stroke="hsl(var(--foreground))" />
              <YAxis className="text-foreground" stroke="hsl(var(--foreground))" />
              <Tooltip content={<UsersTooltip />} />
              <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Yeni Kullanıcı" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Bugün" value={userStats.today} />
        <StatCard title="Dün" value={userStats.yesterday} />
        <StatCard title="Son 7 Gün" value={userStats.last7Days} />
        <StatCard title="Son 30 Gün" value={userStats.last30Days} />
      </div>

      <TopCustomersTable title="En Çok Harcama Yapan Kullanıcılar" customers={topCustomers} />
    </div>
  );
}
