// =============================================================
// FILE: src/pages/account/components/UserOrderDetail.tsx
// FINAL — User order detail (RTK ile, HTML index hatası biter)
// - fetch() KALDIRILDI
// - backend: GET /orders/:id -> items response içinde var (ayrı /items yok)
// - user kendi siparişini görebilir: backend zaten user_id kontrol ediyor
// =============================================================

import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useAuth } from '@/hooks/useAuth';
import { useGetOrderByIdQuery } from '@/integrations/hooks';

import type { OrderItemView } from '@/integrations/types';
import { normalizeOrderItemList } from '@/integrations/types';

const safeLower = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .trim();

const money = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
  const x = Number.isFinite(n) ? n : 0;
  return `₺${x.toFixed(2)}`;
};

function getHttpStatus(err: unknown): number | undefined {
  // RTK Query error shape farklı olabilir; en yaygınlarını yakalıyoruz
  if (!err || typeof err !== 'object') return undefined;
  const e = err as any;
  return (
    e?.status ??
    e?.originalStatus ??
    e?.error?.status ??
    e?.data?.status ??
    e?.response?.status ??
    undefined
  );
}

export default function UserOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // auth yoksa çağırma; id yoksa çağırma
  const skip = !user?.id || !id;

  const { data, isLoading, isFetching, isError, error } = useGetOrderByIdQuery(String(id ?? ''), {
    skip,
  });

  // items backend response içinde
  const orderItems: OrderItemView[] = useMemo(() => {
    const raw = (data as any)?.items ?? [];
    return raw ? normalizeOrderItemList(raw) : [];
  }, [data]);

  const order = data as any;
  const isPaid = useMemo(
    () => safeLower(order?.payment_status) === 'paid',
    [order?.payment_status],
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/giris', { replace: true });
      return;
    }
    if (!id) {
      navigate('/hesabim', { replace: true });
      return;
    }
  }, [authLoading, user, id, navigate]);

  useEffect(() => {
    if (!isError) return;

    const st = getHttpStatus(error);
    if (st === 404) {
      toast.error('Sipariş bulunamadı');
      navigate('/hesabim', { replace: true });
      return;
    }
    if (st === 401) {
      toast.error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      navigate('/giris', { replace: true });
      return;
    }
    if (st === 403) {
      toast.error('Bu siparişe erişim izniniz yok.');
      navigate('/hesabim', { replace: true });
      return;
    }

    toast.error('Sipariş detayları yüklenirken bir hata oluştu.');
    navigate('/hesabim', { replace: true });
  }, [isError, error, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopyalandı!');
  };

  const getStatusBadge = (status: string) => {
    const s = safeLower(status);
    const statusMap: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pending: { label: 'Beklemede', variant: 'secondary' },
      processing: { label: 'İşleniyor', variant: 'default' },
      shipped: { label: 'Kargoda', variant: 'default' },
      completed: { label: 'Tamamlandı', variant: 'default' },
      cancelled: { label: 'İptal Edildi', variant: 'destructive' },
      refunded: { label: 'İade Edildi', variant: 'outline' },
      failed: { label: 'Başarısız', variant: 'destructive' },
    };
    const config = statusMap[s] || { label: status || '-', variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const paymentText = (ps: unknown) => {
    const s = safeLower(ps);
    if (s === 'paid') return 'Ödendi';
    if (s === 'unpaid' || s === 'pending') return 'Beklemede';
    if (s === 'failed') return 'Başarısız';
    if (s === 'refunded') return 'İade Edildi';
    if (s === 'partially_refunded') return 'Kısmi İade';
    return String(ps ?? '-');
  };

  if (authLoading || isLoading || isFetching) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">Yükleniyor...</div>
        <Footer />
      </div>
    );
  }

  // isError durumunda zaten redirect/toast var; burada fallback
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">Sipariş bulunamadı</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/hesabim')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Hesabıma Dön
              </Button>
            </div>

            <h1 className="text-3xl font-bold">Sipariş Detayı - {order.order_number}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sipariş Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Sipariş No</p>
                    <p className="font-medium">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Durum</p>
                    <div className="mt-1">{getStatusBadge(String(order.status))}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ödeme Durumu</p>
                    <p className="font-medium">{paymentText(order.payment_status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sipariş Tarihi</p>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Müşteri Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Ad Soyad</p>
                    <p className="font-medium">{order.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-posta</p>
                    <p className="font-medium">{order.customer_email || '-'}</p>
                  </div>
                  {order.customer_phone ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Telefon</p>
                      <p className="font-medium">{order.customer_phone}</p>
                    </div>
                  ) : null}
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
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {orderItems.map((item) => {
                      const dt = safeLower(item.products?.delivery_type);

                      return (
                        <TableRow key={String(item.id)}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product_name || '-'}</div>

                              {item.selected_options &&
                                Object.keys(item.selected_options).length > 0 && (
                                  <div className="mt-1 text-xs text-muted-foreground space-y-1">
                                    {Object.entries(item.selected_options).map(([k, v]) => (
                                      <div key={k} className="flex items-start gap-1">
                                        <span className="font-medium">•</span>
                                        <span>{String(v)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          </TableCell>

                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{money(item.unit_price)}</TableCell>
                          <TableCell>{money(item.total_price)}</TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              {/* Dosya İndirme */}
                              {item.products?.file_url && (dt === 'auto_file' || dt === 'file') ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="w-full"
                                    disabled={!isPaid}
                                    onClick={() => {
                                      if (!item.products?.file_url) return;
                                      const link = document.createElement('a');
                                      link.href = item.products.file_url;
                                      link.download = item.product_name || 'dosya';
                                      link.target = '_blank';
                                      link.click();
                                      toast.success('Dosya indiriliyor...');
                                    }}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Dosyayı İndir
                                  </Button>

                                  {!isPaid ? (
                                    <div className="text-sm text-muted-foreground">
                                      Ödeme onaylandıktan sonra indirebilirsiniz
                                    </div>
                                  ) : null}
                                </>
                              ) : null}

                              {/* Delivery Content */}
                              {item.delivery_content && isPaid ? (
                                <div className="space-y-2">
                                  <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-3 rounded border">
                                    {item.delivery_content}
                                  </pre>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => copyToClipboard(item.delivery_content || '')}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Bilgileri Kopyala
                                  </Button>
                                </div>
                              ) : null}

                              {/* Activation Code */}
                              {item.activation_code && isPaid ? (
                                <div className="space-y-2">
                                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded border block">
                                    {item.activation_code}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => copyToClipboard(item.activation_code || '')}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Kopyala
                                  </Button>
                                </div>
                              ) : null}

                              {!isPaid && !item.delivery_content && !item.activation_code ? (
                                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                  <p className="font-medium">Ödeme Bekleniyor</p>
                                  <p className="text-xs mt-1">
                                    Ödemeniz onaylandıktan sonra ürün bilgileriniz burada
                                    görünecektir.
                                  </p>
                                </div>
                              ) : null}

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Durum:</span>
                                {safeLower(item.delivery_status) === 'delivered' ? (
                                  <Badge variant="default">Teslim Edildi</Badge>
                                ) : safeLower(item.delivery_status) === 'processing' ? (
                                  <Badge variant="default">İşleniyor</Badge>
                                ) : safeLower(item.delivery_status) === 'failed' ? (
                                  <Badge variant="destructive">Başarısız</Badge>
                                ) : safeLower(item.delivery_status) === 'pending' ? (
                                  <Badge variant="secondary">Beklemede</Badge>
                                ) : (
                                  <Badge variant="outline">-</Badge>
                                )}
                              </div>

                              {!item.products?.file_url &&
                              !item.delivery_content &&
                              !item.activation_code ? (
                                <span className="text-muted-foreground text-sm">
                                  Henüz teslim edilmedi
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-end gap-4">
                    <span className="text-muted-foreground">Ara Toplam:</span>
                    <span className="font-medium">{money(order.subtotal)}</span>
                  </div>

                  {Number(order.discount || 0) > 0 ? (
                    <div className="flex justify-end gap-4">
                      <span className="text-muted-foreground">İndirim:</span>
                      <span className="font-medium text-green-600">-{money(order.discount)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-4 text-xl border-t pt-2">
                    <span className="font-semibold">Toplam:</span>
                    <span className="font-bold">{money(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.notes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Notlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{order.notes}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
