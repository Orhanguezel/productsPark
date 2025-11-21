// =============================================================
// FILE: src/pages/admin/order/OrderList.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/admin/AdminLayout";

// RTK admin endpoints
import {
  useListOrdersAdminQuery,
  useDeleteOrderAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/orders_admin.endpoints";

// Tipler
import type { OrderView } from "@/integrations/metahub/rtk/types/orders";

type Order = OrderView;

export default function OrderList() {
  const navigate = useNavigate();

  const {
    data: rawOrders,
    isLoading,
    refetch,
  } = useListOrdersAdminQuery();

  const [deleteOrder, { isLoading: deleting }] = useDeleteOrderAdminMutation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  // BE'den gelen tüm siparişleri al → sadece payment_status paid/completed olanları baz al
  useEffect(() => {
    const list = (rawOrders ?? []).filter(
      (o) =>
        o.payment_status === "paid" || o.payment_status === "completed",
    );
    setAllOrders(list);
  }, [rawOrders]);

  // Filtreler değiştikçe listeyi uygula
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPaymentStatus, searchQuery, allOrders]);

  const applyFilters = () => {
    let filtered = [...allOrders];

    // Sipariş durumu filtresi
    if (filterStatus !== "all") {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    // Ödeme durumu filtresi
    if (filterPaymentStatus !== "all") {
      filtered = filtered.filter(
        (o) => o.payment_status === filterPaymentStatus,
      );
    }

    // Arama filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.order_number.toLowerCase().includes(query) ||
          o.customer_name.toLowerCase().includes(query) ||
          o.customer_email.toLowerCase().includes(query),
      );
    }

    setOrders(filtered);
    setCurrentPage(1);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId).unwrap();
      toast.success("Sipariş silindi");
      refetch();
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error("Sipariş silinirken hata oluştu");
    }
  };

  const totalPages = useMemo(
    () => Math.ceil(orders.length / itemsPerPage),
    [orders.length, itemsPerPage],
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = useMemo(
    () => orders.slice(startIndex, startIndex + itemsPerPage),
    [orders, startIndex, itemsPerPage],
  );

  if (isLoading) {
    return (
      <AdminLayout title="Sipariş Yönetimi">
        <div>Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sipariş Yönetimi">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sipariş Yönetimi</h3>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Sipariş No, Müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sipariş Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="processing">Teslimat Bekliyor</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterPaymentStatus}
            onValueChange={setFilterPaymentStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ödeme Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Ödemeler</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="failed">Başarısız</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Ürün(ler)</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.order_number}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {order.customer_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer_email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">
                    Detayda görüntüleyin
                  </span>
                </TableCell>
                <TableCell>₺{order.final_amount}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      order.status === "completed"
                        ? "default"
                        : order.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {order.status === "completed"
                      ? "Tamamlandı"
                      : order.status === "pending"
                        ? "Beklemede"
                        : order.status === "processing"
                          ? "Teslimat Bekliyor"
                          : order.status === "cancelled"
                            ? "İptal Edildi"
                            : order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString(
                    "tr-TR",
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/orders/${order.id}`)
                      }
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Siparişi Sil
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu siparişi silmek istediğinizden emin
                            misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            İptal
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteOrder(order.id)
                            }
                          >
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1)
                      setCurrentPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AdminLayout>
  );
}
