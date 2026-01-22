// =============================================================
// FILE: src/pages/admin/order/OrderList.tsx
// FINAL — Order list shows all orders (no hidden paid filter)
// - uses include=user so customer/user name/email are populated when backend supports it
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminLayout } from '@/components/admin/AdminLayout';

import { useListOrdersAdminQuery, useDeleteOrderAdminMutation } from '@/integrations/hooks';
import type { OrderView } from '@/integrations/types';

/* ---------------- helpers ---------------- */
const safeLower = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .trim();
const money = (v: number) => `₺${Number(v || 0).toLocaleString('tr-TR')}`;

type Order = OrderView;

export default function OrderList() {
  const navigate = useNavigate();

  const {
    data: rawOrders,
    isLoading,
    refetch,
  } = useListOrdersAdminQuery({
    include: ['user'],
    limit: 200,
    offset: 0,
    sort: 'created_at',
    order: 'desc',
  });
  const [deleteOrder, { isLoading: deleting }] = useDeleteOrderAdminMutation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const itemsPerPage = 10;

  // ✅ do NOT silently filter paid here
  useEffect(() => {
    setAllOrders(rawOrders ?? []);
  }, [rawOrders]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPaymentStatus, searchQuery, allOrders]);

  const applyFilters = () => {
    let filtered = [...allOrders];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((o) => safeLower(o.status) === safeLower(filterStatus));
    }

    if (filterPaymentStatus !== 'all') {
      filtered = filtered.filter(
        (o) => safeLower(o.payment_status) === safeLower(filterPaymentStatus),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((o) => {
        return (
          safeLower(o.order_number).includes(q) ||
          safeLower(o.customer_name).includes(q) ||
          safeLower(o.customer_email).includes(q)
        );
      });
    }

    setOrders(filtered);
    setCurrentPage(1);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId).unwrap();
      toast.success('Sipariş silindi');
      refetch();
    } catch (error: unknown) {
      console.error('Error deleting order:', error);
      toast.error('Sipariş silinirken hata oluştu');
    }
  };

  const totalPages = useMemo(() => {
    const n = Math.ceil(orders.length / itemsPerPage);
    return Math.max(1, n);
  }, [orders.length, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedOrders = useMemo(() => {
    return orders.slice(startIndex, startIndex + itemsPerPage);
  }, [orders, startIndex, itemsPerPage]);

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Sipariş No, Müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Sipariş Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="processing">Teslimat Bekliyor</SelectItem>
              <SelectItem value="shipped">Kargoda</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal Edildi</SelectItem>
              <SelectItem value="refunded">İade</SelectItem>
              <SelectItem value="failed">Başarısız</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Ödeme Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Ödemeler</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="unpaid">Ödenmedi</SelectItem>
              <SelectItem value="failed">Başarısız</SelectItem>
              <SelectItem value="refunded">İade</SelectItem>
              <SelectItem value="partially_refunded">Kısmi İade</SelectItem>
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
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const st = safeLower(order.status);

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>

                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name || '-'}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_email || '-'}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-muted-foreground text-xs">Detayda görüntüleyin</span>
                    </TableCell>

                    <TableCell>{money(order.total)}</TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          st === 'completed'
                            ? 'default'
                            : st === 'cancelled' || st === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {st === 'completed'
                          ? 'Tamamlandı'
                          : st === 'pending'
                            ? 'Beklemede'
                            : st === 'processing'
                              ? 'Teslimat Bekliyor'
                              : st === 'shipped'
                                ? 'Kargoda'
                                : st === 'cancelled'
                                  ? 'İptal Edildi'
                                  : st === 'refunded'
                                    ? 'İade'
                                    : st === 'failed'
                                      ? 'Başarısız'
                                      : String(order.status)}
                      </Badge>
                    </TableCell>

                    <TableCell>{new Date(order.created_at).toLocaleDateString('tr-TR')}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deleting}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Siparişi Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri
                                alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
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
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
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
