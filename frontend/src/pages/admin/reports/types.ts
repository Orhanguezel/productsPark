// =============================================================
// FILE: src/components/admin/reports/types.ts
// =============================================================

export interface RevenueStats {
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
  lastMonth: number;
  total: number;
}

export interface OrderStats {
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
  total: number;
}

export interface UserStats {
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
  total: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export interface TopCustomer {
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
}

export interface OrderStatusStats {
  pending: number;
  completed: number;
  cancelled: number;
  processing: number;
}
