// =============================================================
// FILE: src/pages/admin/order/OrderDetail.tsx
// =============================================================
import { useMemo, useState, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Edit, X, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// RTK admin endpoints
import {
  useGetOrderAdminByIdQuery,
  useListOrderItemsAdminQuery,
  useUpdateOrderStatusAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/orders_admin.endpoints";

import { useGetSiteSettingAdminByKeyQuery } from "@/integrations/metahub/rtk/endpoints/admin/site_settings_admin.endpoints";

// Tipleri tek yerden al
import type {
  OrderView,
  OrderItemView,
} from "@/integrations/metahub/rtk/types/orders";

type Order = OrderView;
type OrderItem = OrderItemView;

const COL_COUNT = 7;

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: order,
    isLoading: orderLoading,
    refetch: refetchOrder,
  } = useGetOrderAdminByIdQuery(id as string, {
    skip: !id,
  });

  const {
    data: orderItemsRaw,
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useListOrderItemsAdminQuery(id as string, {
    skip: !id,
  });

  const [updateStatus, { isLoading: updatingStatus }] =
    useUpdateOrderStatusAdminMutation();

  // site_title ayarı (mail subject vs. için)
  const { data: siteTitleSetting } =
    useGetSiteSettingAdminByKeyQuery("site_title");

  const [deliveryContent, setDeliveryContent] = useState<
    Record<string, string>
  >({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [deliveryDialog, setDeliveryDialog] = useState<{
    open: boolean;
    itemId: string | null;
    productName: string;
  }>({ open: false, itemId: null, productName: "" });

  const loading = orderLoading || itemsLoading;

  const orderItems: OrderItem[] = useMemo(
    () => orderItemsRaw ?? [],
    [orderItemsRaw],
  );

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    if (!order) return;

    try {
      await updateStatus({
        id,
        body: { status: newStatus as any }, // OrderStatus union ile uyumlu
      }).unwrap();

      toast({
        title: "Başarılı",
        description: "Sipariş durumu güncellendi.",
      });

      // Durum değişince verileri tazele
      refetchOrder();
      refetchItems();

      // TODO:
      // Buraya Node backend'deki mail gönderim endpoint’ini ekleyebilirsin.
      // Örn:
      //  - status === 'completed' → "order_completed" maili
      //  - status === 'cancelled' → "order_cancelled" maili
      // Şu an sadece status + stok mantığı çalışıyor, mail kısmını sonra bağlarız.
    } catch (error: any) {
      console.error("Error updating order status:", error);
      const msg =
        error?.data?.error?.message === "insufficient_auto_stock"
          ? "Otomatik stok yetersiz. Ürün stokunu kontrol edin."
          : "Durum güncellenirken bir hata oluştu.";

      toast({
        title: "Hata",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // Manuel teslimat + delivery_content güncelleme kısımları
  // Şimdilik sadece FE tarafında kalıyor; backend endpointleri eklenince buraya bağlanacak.
  const handleManualDelivery = async (content: string) => {
    if (!content || !content.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen teslimat içeriğini girin.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Burayı Node backend'de /admin/orders/:id/items/:itemId/manual-delivery gibi
    // bir endpoint’e bağlayacağız. Şimdilik sadece uyarı verelim.
    toast({
      title: "TODO",
      description:
        "Manuel teslimat endpoint'i henüz Node backend'e taşınmadı. Backend hazır olunca burası bağlanacak.",
      variant: "destructive",
    });
  };

  const handleStartEdit = (itemId: string, currentContent: string) => {
    setEditingItem(itemId);
    setEditContent(currentContent || "");
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditContent("");
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Hata",
        description: "Teslimat içeriği boş olamaz.",
        variant: "destructive",
      });
      return;
    }

    // TODO: /admin/order_items/:id PATCH endpoint'i yazıldığında buraya bağla
    toast({
      title: "TODO",
      description:
        "Teslimat içeriğini güncelleyen admin endpoint'i henüz yok. Backend eklendiğinde burası da güncellenecek.",
      variant: "destructive",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      pending: { label: "Beklemede", variant: "secondary" },
      processing: { label: "İşleniyor", variant: "default" },
      completed: { label: "Tamamlandı", variant: "default" },
      cancelled: { label: "İptal Edildi", variant: "destructive" },
    };
    const config = statusMap[status] || {
      label: status,
      variant: "outline",
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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

  const hasApiDelivery = orderItems.some(
    (item) =>
      item.delivery_status === "pending" ||
      item.delivery_status === "processing",
  );

  return (
    <AdminLayout title={`Sipariş Detayı - ${order.order_number}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/orders")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>

          {hasApiDelivery && (
            <Button variant="outline" size="sm" disabled>
              {/* API durumu için Node backend entegrasyonu geldiğinde burayı da bağlarız */}
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
                  value={order.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[200px] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="processing">İşleniyor</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ödeme Durumu</p>
                <p className="font-medium">
                  {order.payment_status === "paid"
                    ? "Ödendi"
                    : order.payment_status === "pending"
                      ? "Beklemede"
                      : order.payment_status === "failed"
                        ? "Başarısız"
                        : order.payment_status}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sipariş Tarihi</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleString("tr-TR")}
                </p>
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
                {orderItems.map((item) => (
                  <Fragment key={item.id}>
                    <TableRow>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.product_name}
                          </div>
                          {item.selected_options &&
                            Object.keys(item.selected_options).length >
                            0 && (
                              <div className="mt-1 text-xs text-muted-foreground space-y-1">
                                {Object.entries(
                                  item.selected_options,
                                ).map(([key, value]) => (
                                  <div
                                    key={`${item.id}-${key}`}
                                    className="flex items-start gap-1"
                                  >
                                    <span className="font-medium">•</span>
                                    <span>{value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₺{item.product_price}</TableCell>
                      <TableCell>₺{item.total_price}</TableCell>
                      <TableCell>
                        {item.api_order_id || item.turkpin_order_no ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.api_order_id || item.turkpin_order_no}
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.delivery_status === "delivered" ? (
                          <Badge variant="default">Teslim Edildi</Badge>
                        ) : item.delivery_status === "processing" ? (
                          <Badge variant="default">İşleniyor</Badge>
                        ) : item.delivery_status === "failed" ? (
                          <Badge variant="destructive">Başarısız</Badge>
                        ) : item.delivery_status === "pending" ? (
                          <Badge variant="secondary">Beklemede</Badge>
                        ) : (
                          <Badge variant="outline">-</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {editingItem === item.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) =>
                                setEditContent(e.target.value)
                              }
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
                                handleStartEdit(
                                  item.id,
                                  item.delivery_content || "",
                                )
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

                    {(() => {
                      const hasOptions =
                        item.selected_options &&
                        typeof item.selected_options === "object" &&
                        Object.keys(item.selected_options).length > 0;

                      if (!hasOptions) return null;

                      const customFields =
                        (item.products as any)?.custom_fields || [];
                      const getFieldLabel = (fieldId: string) =>
                        customFields?.find((f: any) => f.id === fieldId)
                          ?.label || fieldId;

                      return (
                        <TableRow>
                          <TableCell
                            colSpan={COL_COUNT}
                            className="bg-muted/50 py-2"
                          >
                            <div className="text-sm space-y-1">
                              <p className="font-semibold text-muted-foreground mb-1">
                                Ürün Özelleştirme Bilgileri:
                              </p>
                              {Object.entries(
                                item.selected_options as Record<
                                  string,
                                  string
                                >,
                              ).map(([key, value]) => (
                                <div
                                  key={`${item.id}-detail-${key}`}
                                  className="flex gap-2"
                                >
                                  <span className="font-medium">
                                    {getFieldLabel(key)}:
                                  </span>
                                  <span>{value}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                  </Fragment>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 space-y-2 text-right">
              <div className="flex justify-end gap-4">
                <span className="text-muted-foreground">Ara Toplam:</span>
                <span className="font-medium">₺{order.total_amount}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-end gap-4">
                  <span className="text-muted-foreground">İndirim:</span>
                  <span className="font-medium text-green-600">
                    -₺{order.discount_amount}
                  </span>
                </div>
              )}
              <div className="flex justify-end gap-4 text-xl border-t pt-2">
                <span className="font-semibold">Toplam:</span>
                <span className="font-bold">₺{order.final_amount}</span>
              </div>
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

        {/* Manuel Teslimat (şimdilik sadece UI; backend hazır olunca bağlayacağız) */}
        {orderItems.some(
          (item) =>
            (item.products as any)?.delivery_type === "manual" &&
            item.delivery_status === "pending",
        ) && (
            <Card>
              <CardHeader>
                <CardTitle>Manuel Teslimat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems
                  .filter(
                    (item) =>
                      (item.products as any)?.delivery_type === "manual" &&
                      item.delivery_status === "pending",
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{item.product_name}</h4>
                        <Badge variant="secondary">
                          Adet: {item.quantity}
                        </Badge>
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

        {/* Manuel Teslimat Dialog */}
        <Dialog
          open={deliveryDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setDeliveryDialog({
                open: false,
                itemId: null,
                productName: "",
              });
              setDeliveryContent({});
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manuel Teslimat</DialogTitle>
              <DialogDescription>
                {deliveryDialog.productName} için teslimat içeriğini
                girin. Bu bilgiler müşteriye email ile gönderilecektir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delivery-content">Teslimat İçeriği</Label>
              <Textarea
                id="delivery-content"
                placeholder={`Örnek:\nAktivasyon Kodu: ABC-123-XYZ\nKullanım Talimatı: ...`}
                value={
                  deliveryContent[deliveryDialog.itemId || ""] || ""
                }
                onChange={(e) =>
                  setDeliveryContent((prev) => ({
                    ...prev,
                    [deliveryDialog.itemId || ""]: e.target.value,
                  }))
                }
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                ℹ️ Bu içerik müşterinin email adresine otomatik olarak
                gönderilecektir (backend entegrasyonu sonrası).
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeliveryDialog({
                    open: false,
                    itemId: null,
                    productName: "",
                  });
                  setDeliveryContent({});
                }}
                disabled={submitting !== null}
              >
                İptal
              </Button>
              <Button
                onClick={() =>
                  handleManualDelivery(
                    deliveryContent[deliveryDialog.itemId || ""] || "",
                  )
                }
                disabled={
                  submitting !== null ||
                  !deliveryContent[deliveryDialog.itemId || ""]?.trim()
                }
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Gönderiliyor..." : "Teslim Et ve Email Gönder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
