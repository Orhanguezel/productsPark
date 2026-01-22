// =============================================================
// FILE: src/pages/account/components/OrdersTab.tsx
// FINAL — Customer orders list (blog-style navigation, ID-only)
// - backend GET /orders/:id sadece "id" (UUID) bekler
// - order_number ile detail fetch edemezsin (404)
// - bu yüzden route param yalnızca id
// =============================================================

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { useAuth } from '@/hooks/useAuth';
import { useGetMyProfileQuery } from '@/integrations/hooks';
import type { OrderView as Order } from '@/integrations/types';

const itemsPerPage = 10;

export interface OrdersTabProps {
  orders: Order[];
}

const safeLower = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .trim();

const moneyTry = (v: unknown): string => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
  const x = Number.isFinite(n) ? n : 0;
  return `₺${x.toFixed(2)}`;
};

function statusBadgeClass(status: string): string {
  switch (safeLower(status)) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function statusLabel(status: string): string {
  switch (safeLower(status)) {
    case 'completed':
      return 'Tamamlandı';
    case 'pending':
      return 'Beklemede';
    case 'processing':
      return 'İşleniyor';
    case 'shipped':
      return 'Kargoda';
    case 'cancelled':
      return 'İptal Edildi';
    case 'refunded':
      return 'İade';
    case 'failed':
      return 'Başarısız';
    default:
      return status || '-';
  }
}

function paymentBadge(paymentStatus: unknown): { show: boolean; className: string; label: string } {
  const ps = safeLower(paymentStatus);

  if (!ps) return { show: false, className: '', label: '' };

  if (ps === 'paid')
    return { show: true, className: 'bg-green-100 text-green-800', label: 'Ödendi' };
  if (ps === 'unpaid')
    return { show: true, className: 'bg-orange-100 text-orange-800', label: 'Ödeme Bekliyor' };
  if (ps === 'failed')
    return { show: true, className: 'bg-red-100 text-red-800', label: 'Ödeme Başarısız' };
  if (ps === 'refunded')
    return { show: true, className: 'bg-gray-100 text-gray-800', label: 'İade Edildi' };
  if (ps === 'partially_refunded')
    return { show: true, className: 'bg-gray-100 text-gray-800', label: 'Kısmi İade' };

  return { show: true, className: 'bg-gray-100 text-gray-800', label: String(paymentStatus) };
}

/** backend GET /orders/:id -> id (uuid) şart */
function orderRoute(order: Order): string {
  const id = String(order.id ?? '').trim();
  return id ? `/siparis/${encodeURIComponent(id)}` : '';
}

export function OrdersTab({ orders }: OrdersTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ordersPage, setOrdersPage] = useState(1);

  const { data: profile } = useGetMyProfileQuery(undefined, { skip: !user?.id });

  const pagedOrders = useMemo(() => {
    const start = (ordersPage - 1) * itemsPerPage;
    return orders.slice(start, start + itemsPerPage);
  }, [orders, ordersPage]);

  if (!orders.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Henüz siparişiniz bulunmamaktadır.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));

  return (
    <>
      <div className="space-y-4">
        {pagedOrders.map((order) => {
          const pay = paymentBadge(order.payment_status);
          const route = orderRoute(order);
          const clickable = !!route;

          return (
            <Card
              key={String(order.id || order.order_number)}
              className={`transition-colors ${
                clickable ? 'cursor-pointer hover:bg-accent' : 'opacity-60'
              }`}
              onClick={() => {
                if (route) navigate(route);
              }}
              role={clickable ? 'button' : undefined}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold">{order.order_number || order.id || '-'}</p>

                    {(profile?.full_name || user?.email || profile?.phone) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile?.full_name && <span>{profile.full_name}</span>}
                        {user?.email && (
                          <span>
                            {profile?.full_name ? ' • ' : ''}
                            {user.email}
                          </span>
                        )}
                        {profile?.phone && (
                          <span>
                            {profile?.full_name || user?.email ? ' • ' : ''}
                            {profile.phone}
                          </span>
                        )}
                      </p>
                    )}

                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">{moneyTry(order.total)}</p>

                    <div className="text-sm flex flex-col gap-1 items-end">
                      <span
                        className={`px-2 py-1 rounded text-xs ${statusBadgeClass(
                          String(order.status),
                        )}`}
                      >
                        {statusLabel(String(order.status))}
                      </span>

                      {pay.show && (
                        <span className={`px-2 py-1 rounded text-xs ${pay.className}`}>
                          {pay.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                className={ordersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setOrdersPage(page)}
                  isActive={ordersPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setOrdersPage((p) => Math.min(totalPages, p + 1))}
                className={
                  ordersPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
