// =============================================================
// FILE: src/pages/admin/order/OrderDetail.tsx
// FINAL — Fix rules-of-hooks: no conditional hooks
// - itemsSubtotal useMemo moved ABOVE early returns
// =============================================================

import { useMemo, useState, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Edit, X, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// RTK admin endpoints
import {
  useGetOrderAdminByIdQuery,
  useListOrderItemsAdminQuery,
  useUpdateOrderStatusAdminMutation,
  useGetSiteSettingAdminByKeyQuery,
} from '@/integrations/hooks';

import type { OrderItemView, OrderStatus } from '@/integrations/types';

/* ---------------- helpers ---------------- */
const money = (v: number) => `₺${Number(v || 0).toLocaleString('tr-TR')}`;
const safeLower = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .trim();

const COL_COUNT = 7;

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: order,
    isLoading: orderLoading,
    refetch: refetchOrder,
  } = useGetOrderAdminByIdQuery(id as string, { skip: !id });

  const {
    data: orderItemsRaw,
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useListOrderItemsAdminQuery(id as string, { skip: !id });

  const [updateStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusAdminMutation();

  // site_title ayarı (mail subject vs. için) — şimdilik sadece okunuyor
  useGetSiteSettingAdminByKeyQuery('site_title');

  const [submitting, setSubmitting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [deliveryContent, setDeliveryContent] = useState<Record<string, string>>({});
  const [deliveryDialog, setDeliveryDialog] = useState<{
    open: boolean;
    itemId: string | null;
    productName: string;
  }>({ open: false, itemId: null, productName: '' });

  const loading = orderLoading || itemsLoading;

  // ✅ Hooks must be unconditional: compute derived values BEFORE any early return
  const orderItems: OrderItemView[] = useMemo(() => orderItemsRaw ?? [], [orderItemsRaw]);

  const hasApiDelivery = useMemo(() => {
    return orderItems.some((item) => {
      const st = safeLower(item.delivery_status);
      return st === 'pending' || st === 'processing';
    });
  }, [orderItems]);

  const itemsSubtotal = useMemo(() => {
    return orderItems.reduce((sum, it) => sum + Number(it.total_price || 0), 0);
  }, [orderItems]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !order) return;

    try {
      await updateStatus({
        id,
        body: { status: newStatus as OrderStatus },
      }).unwrap();

      toast({ title: 'Başarılı', description: 'Sipariş durumu güncellendi.' });

      refetchOrder();
      refetchItems();
    } catch (error: unknown) {
      console.error('Error updating order status:', error);
      const err = error as { data?: any };
      const msg =
        err?.data?.error?.message === 'insufficient_auto_stock'
          ? 'Otomatik stok yetersiz. Ürün stokunu kontrol edin.'
          : 'Durum güncellenirken bir hata oluştu.';

      toast({ title: 'Hata', description: msg, variant: 'destructive' });
    }
  };

  const handleManualDelivery = async (content: string) => {
    if (!content || !content.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen teslimat içeriğini girin.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'TODO',
      description:
        "Manuel teslimat endpoint'i henüz backend'e taşınmadı. Backend hazır olunca burası bağlanacak.",
      variant: 'destructive',
    });
  };

  const handleStartEdit = (itemId: string, currentContent: string) => {
    setEditingItem(itemId);
    setEditContent(currentContent || '');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditContent('');
  };

  const handleSaveEdit = async (_itemId: string) => {
    if (!editContent.trim()) {
      toast({
        title: 'Hata',
        description: 'Teslimat içeriği boş olamaz.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'TODO',
      description:
        "Teslimat içeriğini güncelleyen admin endpoint'i henüz yok. Backend eklendiğinde burası da güncellenecek.",
      variant: 'destructive',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pending: { label: 'Beklemede', variant: 'secondary' },
      processing: { label: 'İşleniyor', variant: 'default' },
      shipped: { label: 'Kargoda', variant: 'default' },
      completed: { label: 'Tamamlandı', variant: 'default' },
      cancelled: { label: 'İptal Edildi', variant: 'destructive' },
      refunded: { label: 'İade', variant: 'outline' },
      failed: { label: 'Başarısız', variant: 'destructive' },
    };

    const key = safeLower(status);
    const config = statusMap[key] || { label: status || '-', variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeliveryBadge = (deliveryStatus: string | null) => {
    const s = safeLower(deliveryStatus);
    if (s === 'delivered') return <Badge variant="default">Teslim Edildi</Badge>;
    if (s === 'processing') return <Badge variant="default">İşleniyor</Badge>;
    if (s === 'failed') return <Badge variant="destructive">Başarısız</Badge>;
    if (s === 'pending') return <Badge variant="secondary">Beklemede</Badge>;
    return <Badge variant="outline">-</Badge>;
  };

  // ✅ Early returns AFTER all hooks
  if (loading) {
    return (
      <AdminLayout title="Sipariş Detayı">
        <div>Yükleniyor...</div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Sipariş Detayı">
        <div>Sipariş bulunamadı</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Sipariş Detayı - ${order.order_number}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>

          {hasApiDelivery && (
            <Button variant="outline" size="sm" disabled>
              API Durumunu Güncelle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Ad Soyad</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-posta</p>
                <p className="font-medium">{order.customer_email}</p>
              </div>
              {order.customer_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sipariş Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Sipariş Durumu</p>
                <Select
                  value={String(order.status)}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[200px] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="processing">İşleniyor</SelectItem>
                    <SelectItem value="shipped">Kargoda</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                    <SelectItem value="refunded">İade</SelectItem>
                    <SelectItem value="failed">Başarısız</SelectItem>
                  </SelectContent>
                </Select>

                <div className="mt-2">{getStatusBadge(String(order.status))}</div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Ödeme Durumu</p>
                <p className="font-medium">
                  {safeLower(order.payment_status) === 'paid'
                    ? 'Ödendi'
                    : safeLower(order.payment_status) === 'unpaid'
                    ? 'Ödenmedi'
                    : safeLower(order.payment_status) === 'failed'
                    ? 'Başarısız'
                    : String(order.payment_status)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Sipariş Tarihi</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sipariş Kalemleri</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Toplam</TableHead>
                  <TableHead>API ID / Turkpin No</TableHead>
                  <TableHead>Teslimat Durumu</TableHead>
                  <TableHead>Teslim Edilen</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {orderItems.map((item) => {
                  const options = item.selected_options ?? null;
                  const hasOptions = !!options && Object.keys(options).length > 0;

                  return (
                    <Fragment key={item.id}>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product_name}</div>

                            {hasOptions && (
                              <div className="mt-1 text-xs text-muted-foreground space-y-1">
                                {Object.entries(options as Record<string, string>).map(
                                  ([key, value]) => (
                                    <div
                                      key={`${item.id}-${key}`}
                                      className="flex items-start gap-1"
                                    >
                                      <span className="font-medium">•</span>
                                      <span>{value}</span>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{money(item.unit_price)}</TableCell>
                        <TableCell>{money(item.total_price)}</TableCell>

                        <TableCell>
                          {item.api_order_id || item.turkpin_order_no ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {item.api_order_id || item.turkpin_order_no}
                            </code>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>

                        <TableCell>{getDeliveryBadge(item.delivery_status)}</TableCell>

                        <TableCell className="max-w-md">
                          {editingItem === item.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={6}
                                className="font-mono text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(item.id)}
                                  disabled={submitting === item.id}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Kaydet
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={submitting === item.id}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  İptal
                                </Button>
                              </div>
                            </div>
                          ) : item.delivery_content ? (
                            <div className="space-y-2">
                              <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-2 rounded">
                                {item.delivery_content}
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStartEdit(item.id, item.delivery_content || '')
                                }
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Düzenle
                              </Button>
                            </div>
                          ) : item.activation_code ? (
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {item.activation_code}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>

                      {hasOptions ? (
                        <TableRow>
                          <TableCell colSpan={COL_COUNT} className="bg-muted/50 py-2">
                            <div className="text-sm space-y-1">
                              <p className="font-semibold text-muted-foreground mb-1">
                                Ürün Özelleştirme Bilgileri:
                              </p>

                              {Object.entries(options as Record<string, string>).map(
                                ([fieldId, value]) => {
                                  const customFields = item.products?.custom_fields ?? null;
                                  const label =
                                    customFields?.find((f) => f.id === fieldId)?.label ?? fieldId;

                                  return (
                                    <div
                                      key={`${item.id}-detail-${fieldId}`}
                                      className="flex gap-2"
                                    >
                                      <span className="font-medium">{label}:</span>
                                      <span>{value}</span>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-6 space-y-2 text-right">
              <div className="flex justify-end gap-4">
                <span className="text-muted-foreground">Ara Toplam:</span>
                <span className="font-medium">{money(order.subtotal)}</span>
              </div>

              {Number(order.discount || 0) > 0 && (
                <div className="flex justify-end gap-4">
                  <span className="text-muted-foreground">İndirim:</span>
                  <span className="font-medium text-green-600">-{money(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-end gap-4 text-xl border-t pt-2">
                <span className="font-semibold">Toplam:</span>
                <span className="font-bold">{money(order.total)}</span>
              </div>

              {Math.abs(itemsSubtotal - Number(order.subtotal || 0)) > 0.01 && (
                <div className="text-xs text-muted-foreground">
                  Kalemler toplamı: {money(itemsSubtotal)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {orderItems.some(
          (item) =>
            safeLower(item.products?.delivery_type) === 'manual' &&
            safeLower(item.delivery_status) === 'pending',
        ) && (
          <Card>
            <CardHeader>
              <CardTitle>Manuel Teslimat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems
                .filter(
                  (item) =>
                    safeLower(item.products?.delivery_type) === 'manual' &&
                    safeLower(item.delivery_status) === 'pending',
                )
                .map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{item.product_name}</h4>
                      <Badge variant="secondary">Adet: {item.quantity}</Badge>
                    </div>
                    <Button
                      onClick={() =>
                        setDeliveryDialog({
                          open: true,
                          itemId: item.id,
                          productName: item.product_name,
                        })
                      }
                      disabled={submitting === item.id}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Teslim Et
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        <Dialog
          open={deliveryDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setDeliveryDialog({ open: false, itemId: null, productName: '' });
              setDeliveryContent({});
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manuel Teslimat</DialogTitle>
              <DialogDescription>
                {deliveryDialog.productName} için teslimat içeriğini girin. Bu bilgiler müşteriye
                email ile gönderilecektir.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="delivery-content">Teslimat İçeriği</Label>
              <Textarea
                id="delivery-content"
                placeholder={`Örnek:\nAktivasyon Kodu: ABC-123-XYZ\nKullanım Talimatı: ...`}
                value={deliveryContent[deliveryDialog.itemId || ''] || ''}
                onChange={(e) =>
                  setDeliveryContent((prev) => ({
                    ...prev,
                    [deliveryDialog.itemId || '']: e.target.value,
                  }))
                }
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Bu içerik müşterinin email adresine otomatik olarak gönderilecektir (backend
                entegrasyonu sonrası).
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeliveryDialog({ open: false, itemId: null, productName: '' });
                  setDeliveryContent({});
                }}
                disabled={submitting !== null}
              >
                İptal
              </Button>

              <Button
                onClick={() =>
                  handleManualDelivery(deliveryContent[deliveryDialog.itemId || ''] || '')
                }
                disabled={
                  submitting !== null ||
                  !(deliveryContent[deliveryDialog.itemId || ''] || '').trim()
                }
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Gönderiliyor...' : 'Teslim Et ve Email Gönder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
