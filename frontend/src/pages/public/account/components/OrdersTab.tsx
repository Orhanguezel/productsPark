// =============================================================
// FILE: src/pages/account/components/OrdersTab.tsx
// =============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { useAuth } from "@/hooks/useAuth";
import { useListOrdersByUserQuery } from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import { useGetMyProfileQuery } from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";
import type { OrderView as Order } from "@/integrations/metahub/db/types";

const itemsPerPage = 10;

export function OrdersTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ordersPage, setOrdersPage] = useState(1);

  const userId = user?.id ?? "";

  // Siparişler (RTK)
  const {
    data: ordersData,
    isLoading,
    isError,
  } = useListOrdersByUserQuery(userId, {
    skip: !userId,
  });

  // Müşteri bilgisi (RTK profil)
  const { data: profile } = useGetMyProfileQuery(undefined, {
    skip: !userId,
  });

  const orders: Order[] = ordersData ?? [];

  const pagedOrders = useMemo(() => {
    const start = (ordersPage - 1) * itemsPerPage;
    return orders.slice(start, start + itemsPerPage);
  }, [orders, ordersPage]);

  const handleOrderClick = (order: Order) => {
    navigate(`/siparis/${order.id}`);
  };

  if (!userId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Siparişlerinizi görmek için lütfen giriş yapın.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Siparişleriniz yükleniyor…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Siparişler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Henüz siparişiniz bulunmamaktadır.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {pagedOrders.map((order) => (
          <Card
            key={order.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleOrderClick(order)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                {/* Sol blok: sipariş no + müşteri bilgisi + tarih */}
                <div className="flex-1">
                  <p className="font-semibold">
                    {order.order_number || order.id}
                  </p>

                  {/* Müşteri bilgisi (profil + auth) */}
                  {(profile?.full_name || user?.email || profile?.phone) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile?.full_name && <span>{profile.full_name}</span>}
                      {user?.email && (
                        <span>
                          {profile?.full_name ? " • " : ""}
                          {user.email}
                        </span>
                      )}
                      {profile?.phone && (
                        <span>
                          {profile?.full_name || user?.email ? " • " : ""}
                          {profile.phone}
                        </span>
                      )}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>

                {/* Sağ blok: tutar + durumlar */}
                <div className="text-right">
                  <p className="font-bold">
                    ₺
                    {Number(
                      (order as any).final_amount ??
                        (order as any).total_amount ??
                        0
                    ).toFixed(2)}
                  </p>
                  <div className="text-sm flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "cancelled"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status === "completed"
                        ? "Tamamlandı"
                        : order.status === "pending"
                        ? "Beklemede"
                        : order.status === "processing"
                        ? "İşleniyor"
                        : order.status === "cancelled"
                        ? "İptal Edildi"
                        : order.status}
                    </span>

                    {order.payment_status === "pending" && (
                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        Ödeme Bekliyor
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Math.ceil(orders.length / itemsPerPage) > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                className={
                  ordersPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {Array.from(
              { length: Math.ceil(orders.length / itemsPerPage) },
              (_, i) => i + 1
            ).map((page) => (
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
                onClick={() =>
                  setOrdersPage((p) =>
                    Math.min(
                      Math.ceil(orders.length / itemsPerPage),
                      p + 1
                    )
                  )
                }
                className={
                  ordersPage === Math.ceil(orders.length / itemsPerPage)
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
