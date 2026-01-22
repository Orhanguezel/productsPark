// =============================================================
// FILE: src/pages/admin/PaymentRequestList.tsx
// FINAL — Payment Requests Admin List (typesafe; PaymentRequestRow based)
// Fixes:
// - PaymentRequestAdmin import removed (not exported)
// - uses PaymentRequestRow + PaymentRequestStatus
// - orders join fields read via safe helpers (JsonObject tolerant)
// =============================================================

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

import {
  useListPaymentRequestsAdminQuery,
  useUpdatePaymentRequestAdminMutation,
  useUpdateOrderStatusAdminMutation,
  useDeleteOrderAdminMutation,
  useGetSiteSettingAdminByKeyQuery,
  useSendEmailMutation,
  useSendTelegramNotificationMutation,
} from '@/integrations/hooks';

import type {
  OrderStatus,
  PaymentStatus,
  PaymentRequestRow,
  PaymentRequestStatus,
  JsonObject,
} from '@/integrations/types';

/* ----------------------------- local helpers ----------------------------- */

const itemsPerPage = 10;

const normalizeBool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on', 'enabled'].includes(s);
  }
  return false;
};

const toStr = (v: unknown, fallback = ''): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return v == null ? fallback : String(v);
};

const toNum = (v: unknown, d = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : d;
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const pickOrderJoin = (orders: JsonObject | null | undefined) => {
  // orders join backend’de JsonObject olarak normalizePaymentRequestRow ile geliyor
  const o = (orders && isObj(orders) ? (orders as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >;

  const order_number = toStr(o.order_number ?? o.orderNo ?? o.number, '');
  const customer_name = toStr(o.customer_name ?? o.customerName ?? o.name, '');
  const customer_email = toStr(o.customer_email ?? o.customerEmail ?? o.email, '');

  // items join: order_items (array of objects)
  const order_items_raw = o.order_items ?? o.items ?? o.orderItems;
  const order_items: Array<{ product_name: string; quantity: number }> = Array.isArray(
    order_items_raw,
  )
    ? (order_items_raw as Array<unknown>).filter(isObj).map((it) => ({
        product_name: toStr((it as Record<string, unknown>).product_name ?? (it as any).name, ''),
        quantity: toNum((it as Record<string, unknown>).quantity ?? (it as any).qty, 0),
      }))
    : [];

  // legacy/various totals
  const final_amount = o.final_amount ?? o.total ?? o.total_amount ?? o.finalAmount ?? null;

  return { order_number, customer_name, customer_email, order_items, final_amount };
};

/* ----------------------------- view type ----------------------------- */

// Admin list endpoint join alanları varsa tolerant okuyacağız
type PaymentRequestView = PaymentRequestRow & {
  payment_method?: string;
  payment_proof?: string | null;
};

export default function PaymentRequestList() {
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequestView | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [busy, setBusy] = useState(false);

  // RTK — admin endpoint ile liste (order + items dahil)
  const {
    data: rawRequests = [],
    isLoading,
    isFetching,
    refetch,
  } = useListPaymentRequestsAdminQuery(
    {
      limit: 500,
      offset: 0,
      include: ['order', 'items'],
    },
    { refetchOnMountOrArgChange: true },
  );

  // If admin endpoint already normalizes to PaymentRequestRow, this is safe.
  const requests: PaymentRequestView[] = useMemo(
    () => rawRequests.map((r) => r as PaymentRequestView),
    [rawRequests],
  );

  // Site ayarları (title + telegram)
  const { data: siteTitleSetting } = useGetSiteSettingAdminByKeyQuery('site_title');
  const { data: telegramSetting } = useGetSiteSettingAdminByKeyQuery('new_order_telegram');

  const siteName = useMemo(() => {
    const v = (siteTitleSetting?.value as string | undefined)?.toString();
    return v && v.trim() ? v : 'Platform';
  }, [siteTitleSetting]);

  const telegramEnabled = useMemo(() => normalizeBool(telegramSetting?.value), [telegramSetting]);

  // Functions (email + telegram)
  const [sendEmail] = useSendEmailMutation();
  const [sendTelegramNotification] = useSendTelegramNotificationMutation();

  // Orders admin mutasyonları
  const [updateOrderStatusAdmin] = useUpdateOrderStatusAdminMutation();
  const [deleteOrderAdmin] = useDeleteOrderAdminMutation();

  // Payment request update
  const [updatePaymentRequestAdmin] = useUpdatePaymentRequestAdminMutation();

  const handleViewRequest = (request: PaymentRequestView) => {
    setSelectedRequest(request);
    setAdminNote(request.admin_note || '');
    setShowDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    const orderId = selectedRequest.order_id ?? null;
    if (!orderId) {
      toast.error('Bu ödeme kaydına bağlı sipariş bulunamadı.');
      return;
    }

    setBusy(true);
    try {
      // 1) Payment request status + admin_note
      await updatePaymentRequestAdmin({
        id: selectedRequest.id,
        body: {
          status: 'approved',
          admin_note: adminNote || null,
        },
      }).unwrap();

      // 2) Customer mail varsayılanları (orders join varsa)
      const joined = pickOrderJoin(selectedRequest.orders);
      const customerEmail = joined.customer_email || null;
      const customerName = joined.customer_name || 'Müşteri';
      const orderNumber = joined.order_number || '—';

      const finalAmountRaw = joined.final_amount ?? selectedRequest.amount;
      const finalAmount = toNum(finalAmountRaw, toNum(selectedRequest.amount, 0));

      if (customerEmail) {
        try {
          await sendEmail({
            to: customerEmail,
            template_key: 'order_received',
            variables: {
              customer_name: customerName,
              order_number: orderNumber,
              final_amount: String(finalAmount.toFixed(2)),
              status: 'İşleniyor',
              site_name: siteName,
            },
          }).unwrap();
        } catch (e) {
          console.warn('order_received email error', e);
        }
      }

      // 3) Sipariş durumu: processing / completed (şimdilik varsayım)
      const allItemsDelivered = true; // TODO: BE’den teslimat durumları geldikçe hesaplanır

      const newStatus: OrderStatus = allItemsDelivered ? 'completed' : 'processing';
      const newPaymentStatus: PaymentStatus = 'paid';

      await updateOrderStatusAdmin({
        id: orderId,
        body: {
          status: newStatus,
          payment_status: newPaymentStatus,
          note: 'Banka havale bildirimi admin tarafından onaylandı.',
        },
      }).unwrap();

      // 4) Telegram bildirimi
      if (telegramEnabled) {
        try {
          await sendTelegramNotification({
            type: 'new_order',
            orderId,
            order_number: orderNumber,
            amount: finalAmount,
            currency: selectedRequest.currency,
          }).unwrap();
        } catch (e) {
          console.warn('Telegram notify error', e);
        }
      }

      toast.success('Ödeme onaylandı ve sipariş işleme alındı');
      setShowDialog(false);
      await refetch();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Ödeme onaylanırken hata oluştu');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    const orderId = selectedRequest.order_id ?? null;
    if (!orderId) {
      toast.error('Bu ödeme kaydına bağlı sipariş bulunamadı.');
      return;
    }

    setBusy(true);
    try {
      // 1) Payment request durumu + admin_note
      await updatePaymentRequestAdmin({
        id: selectedRequest.id,
        body: {
          status: 'rejected',
          admin_note: adminNote || null,
        },
      }).unwrap();

      // 2) Siparişi sil (admin endpoint)
      await deleteOrderAdmin(orderId).unwrap();

      toast.success('Ödeme reddedildi ve sipariş silindi');
      setShowDialog(false);
      await refetch();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Ödeme reddedilirken hata oluştu');
    } finally {
      setBusy(false);
    }
  };

  const getStatusBadge = (status: PaymentRequestStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Reddedildi</Badge>;
      case 'pending':
        return <Badge variant="secondary">Bekliyor</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-600">Ödendi</Badge>;
      case 'failed':
        return <Badge variant="destructive">Başarısız</Badge>;
      case 'cancelled':
        return <Badge variant="outline">İptal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(requests.length / itemsPerPage)),
    [requests.length],
  );

  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);

  const paginatedRequests = useMemo(
    () => requests.slice(startIndex, startIndex + itemsPerPage),
    [requests, startIndex],
  );

  if (isLoading || isFetching) {
    return (
      <AdminLayout title="Ödeme Bildirimleri">
        <div className="flex items-center justify-center h-64">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Ödeme Bildirimleri">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ödeme İstekleri ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürünler</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedRequests.map((request) => {
                  const joined = pickOrderJoin(request.orders);
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{joined.order_number || '-'}</TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{joined.customer_name || '-'}</p>
                          <p className="text-sm text-muted-foreground">
                            {joined.customer_email || '-'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {(joined.order_items ?? []).length ? (
                            joined.order_items.map((item, idx) => (
                              <p key={idx} className="text-sm">
                                {item.product_name} x{item.quantity}
                              </p>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">-</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>₺{toNum(request.amount, 0).toFixed(2)}</TableCell>

                      <TableCell>{getStatusBadge(request.status)}</TableCell>

                      <TableCell>
                        {request.created_at
                          ? new Date(request.created_at).toLocaleString('tr-TR')
                          : '-'}
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const page = idx + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detay dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ödeme Bildirimi Detayı</DialogTitle>
            </DialogHeader>

            {selectedRequest &&
              (() => {
                const joined = pickOrderJoin(selectedRequest.orders);
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Sipariş No</Label>
                        <p className="font-semibold">{joined.order_number || '-'}</p>
                      </div>

                      <div>
                        <Label>Tutar</Label>
                        <p className="font-semibold">
                          ₺{toNum(selectedRequest.amount, 0).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <Label>Müşteri</Label>
                        <p>{joined.customer_name || '-'}</p>
                        <p className="text-sm text-muted-foreground">
                          {joined.customer_email || '-'}
                        </p>
                      </div>

                      <div>
                        <Label>Para Birimi</Label>
                        <p className="uppercase">{toStr(selectedRequest.currency, '-')}</p>
                      </div>
                    </div>

                    {(selectedRequest as any).payment_proof ? (
                      <div>
                        <Label>Dekont/Makbuz</Label>
                        <img
                          src={String((selectedRequest as any).payment_proof)}
                          alt="Payment Proof"
                          className="mt-2 max-w-full rounded-lg border"
                        />
                      </div>
                    ) : null}

                    <div>
                      <Label>Admin Notu</Label>
                      <Textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Not ekleyin..."
                        rows={3}
                      />
                    </div>

                    {selectedRequest.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleApprove}
                          className="flex-1"
                          variant="default"
                          disabled={busy}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Onayla
                        </Button>

                        <Button
                          onClick={handleReject}
                          className="flex-1"
                          variant="destructive"
                          disabled={busy}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reddet
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
