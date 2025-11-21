// =============================================================
// FILE: src/pages/admin/orders/OrderManagement.tsx
// =============================================================
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { OrderView, OrderItemView } from "@/integrations/metahub/rtk/types/orders";
import {
  useListOrdersAdminQuery,
  useListOrderItemsAdminQuery,
  useUpdateOrderStatusAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/orders_admin.endpoints";
import type { OrderStatus } from "@/integrations/metahub/rtk/endpoints/admin/orders_admin.endpoints";

export const OrderManagement = () => {
  // Liste RTK’den
  const {
    data: orders = [],
    isLoading: listLoading,
    isFetching: listFetching,
  } = useListOrdersAdminQuery({
    sort: "created_at",
    order: "desc",
  });

  const [updateStatus, { isLoading: updatingStatus }] =
    useUpdateOrderStatusAdminMutation();

  const [selectedOrder, setSelectedOrder] = useState<OrderView | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Seçili siparişin kalemleri (RTK)
  const {
    data: orderItems = [],
    isLoading: itemsLoading,
  } = useListOrderItemsAdminQuery(activeOrderId ?? "", {
    skip: !activeOrderId,
  });

  const globalLoading = listLoading || listFetching || updatingStatus;

  const handleViewOrder = (order: OrderView) => {
    setSelectedOrder(order);
    setActiveOrderId(order.id);
    setDialogOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({
        id: orderId,
        body: { status: newStatus as OrderStatus },
      }).unwrap();

      // Dialog açıkken badge güncel kalsın
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: newStatus } : prev
      );

      toast({
        title: "Başarılı",
        description: "Sipariş durumu güncellendi.",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      pending: { label: "Beklemede", variant: "secondary" },
      processing: { label: "İşleniyor", variant: "default" },
      completed: { label: "Tamamlandı", variant: "default" },
      cancelled: { label: "İptal Edildi", variant: "destructive" },
      paid: { label: "Ödendi", variant: "default" },
      refunded: { label: "İade Edildi", variant: "outline" },
      failed: { label: "Başarısız", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (globalLoading && orders.length === 0) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sipariş Yönetimi</h3>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sipariş No</TableHead>
            <TableHead>Müşteri</TableHead>
            <TableHead>Tutar</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {order.order_number}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{order.customer_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.customer_email}
                  </div>
                </div>
              </TableCell>
              <TableCell>₺{order.final_amount}</TableCell>
              <TableCell>
                <Select
                  value={order.status}
                  onValueChange={(value) =>
                    handleStatusChange(order.id, value)
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="processing">İşleniyor</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                    {/* İstersen ileride bunları da açarsın
                    <SelectItem value="paid">Ödendi</SelectItem>
                    <SelectItem value="refunded">İade Edildi</SelectItem>
                    <SelectItem value="failed">Başarısız</SelectItem>
                    */}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("tr-TR")
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {orders.length === 0 && !globalLoading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-sm">
                Henüz sipariş yok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setActiveOrderId(null);
            // dialog kapanınca items hook’u skip’e düşer
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Sipariş Detayı - {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Müşteri & durum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Müşteri</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm">{selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.customer_phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durum</p>
                  {getStatusBadge(selectedOrder.status)}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ödeme: {selectedOrder.payment_status}
                  </p>
                </div>
              </div>

              {/* Sipariş Kalemleri */}
              <div>
                <h4 className="font-semibold mb-2">Sipariş Kalemleri</h4>

                {itemsLoading && (
                  <p className="text-sm text-muted-foreground">
                    Kalemler yükleniyor...
                  </p>
                )}

                {!itemsLoading && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ürün</TableHead>
                        <TableHead>Adet</TableHead>
                        <TableHead>Fiyat</TableHead>
                        <TableHead>Toplam</TableHead>
                        <TableHead>Aktivasyon Kodu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item: OrderItemView) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₺{item.product_price}</TableCell>
                          <TableCell>₺{item.total_price}</TableCell>
                          <TableCell>
                            {item.activation_code || "-"}
                          </TableCell>
                        </TableRow>
                      ))}

                      {orderItems.length === 0 && !itemsLoading && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-4 text-sm"
                          >
                            Bu sipariş için kalem bulunamadı.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Toplam */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">Toplam Tutar:</span>
                <span className="text-2xl font-bold">
                  ₺{selectedOrder.final_amount}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
