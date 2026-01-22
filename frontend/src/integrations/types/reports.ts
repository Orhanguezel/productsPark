// =============================================================
// FILE: src/integrations/types/reports.ts
// FINAL — Reports/Dashboard stats types (central)
// - exactOptionalPropertyTypes safe
// - Central chart point shapes (no ad-hoc keys like tutar/siparis/kullanici)
// =============================================================

import type { OrderStatus } from '@/integrations/types';

/* -------------------- summary cards -------------------- */

export type RevenueStats = {
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
  lastMonth: number;
  total: number;
};

export type OrderStats = {
  total: number;
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
};

export type UserStats = {
  total: number;
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
};

/* -------------------- top lists -------------------- */

export type TopProduct = {
  name: string;
  sales: number;
  revenue: number;
};

export type TopCustomer = {
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
};

/* -------------------- distributions -------------------- */

export type OrderStatusStats = Partial<Record<OrderStatus, number>>;

/* -------------------- chart points (central) -------------------- */

export type RevenueChartPoint = { name: string; amount: number };
export type OrdersChartPoint = { name: string; orders: number };
export type UsersChartPoint = { name: string; users: number };
