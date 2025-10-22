import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
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

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  product_price: number;
  total_price: number;
  activation_code: string | null;
  delivery_content: string | null;
  delivery_status: string | null;
  api_order_id: string | null;
  selected_options?: Record<string, string> | null;
  products?: {
    delivery_type: string;
    custom_fields: Array<{
      id: string;
      label: string;
      type: string;
      placeholder: string;
      required: boolean;
    }>;
  };
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryContent, setDeliveryContent] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [deliveryDialog, setDeliveryDialog] = useState<{
    open: boolean;
    itemId: string | null;
    productName: string;
  }>({ open: false, itemId: null, productName: "" });

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    if (!id) return;

    try {
      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await metahub
        .from("order_items")
        .select(`
          id,
          product_id,
          product_name,
          quantity,
          product_price,
          total_price,
          activation_code,
          delivery_content,
          delivery_status,
          api_order_id,
          selected_options,
          products(delivery_type, custom_fields)
        `)
        .eq("order_id", id);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        throw itemsError;
      }
      console.log("Order items data:", itemsData);
      console.log("Selected options:", itemsData?.map(item => ({ id: item.id, options: item.selected_options })));
      setOrderItems((itemsData || []) as OrderItem[]);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Hata",
        description: "Sipariş detayları yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    try {
      const { error } = await metahub
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Eğer sipariş "completed" durumuna alınıyorsa, tüm order_items'ların delivery_status'unu da güncelle
      if (newStatus === "completed") {
        const { error: itemsError } = await metahub
          .from("order_items")
          .update({ delivery_status: "delivered" })
          .eq("order_id", id)
          .neq("delivery_status", "delivered")
          .neq("delivery_status", "failed");

        if (itemsError) {
          console.error("Error updating order items:", itemsError);
        }

        // Send order completed email
        if (order?.customer_email) {
          try {
            console.log('Attempting to send order completed email to:', order.customer_email);

            const { data: siteSetting } = await metahub
              .from("site_settings")
              .select("value")
              .eq("key", "site_title")
              .single();

            const emailResult = await metahub.functions.invoke('send-email', {
              body: {
                to: order.customer_email,
                template_key: 'order_completed',
                variables: {
                  customer_name: order.customer_name,
                  order_number: order.order_number,
                  final_amount: order.final_amount?.toString() || '0',
                  site_name: siteSetting?.value || 'Dijital Market'
                }
              }
            });

            console.log('Order completed email result:', emailResult);

            if (emailResult.error) {
              console.error('Order completed email invocation error:', emailResult.error);
            }
          } catch (emailError) {
            console.error('Order completed email error:', emailError);
          }
        } else {
          console.log('No customer email found, skipping order completed email');
        }
      }

      // Send order cancelled email
      if (newStatus === "cancelled" && order?.customer_email) {
        try {
          console.log('Attempting to send order cancelled email to:', order.customer_email);

          const { data: siteSetting } = await metahub
            .from("site_settings")
            .select("value")
            .eq("key", "site_title")
            .single();

          const emailResult = await metahub.functions.invoke('send-email', {
            body: {
              to: order.customer_email,
              template_key: 'order_cancelled',
              variables: {
                customer_name: order.customer_name,
                order_number: order.order_number,
                final_amount: order.final_amount?.toString() || '0',
                cancellation_reason: order.notes || 'Belirtilmedi',
                site_name: siteSetting?.value || 'Dijital Market'
              }
            }
          });

          console.log('Order cancelled email result:', emailResult);

          if (emailResult.error) {
            console.error('Order cancelled email invocation error:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Order cancelled email error:', emailError);
        }
      }

      toast({ title: "Başarılı", description: "Sipariş durumu güncellendi." });
      fetchOrderDetails();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleManualDelivery = async (content: string) => {
    if (!content || !content.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen teslimat içeriğini girin.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(deliveryDialog.itemId);

      const { error } = await metahub.functions.invoke('manual-delivery-email', {
        body: {
          orderItemId: deliveryDialog.itemId,
          deliveryContent: content
        }
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Teslimat tamamlandı ve email gönderildi.",
      });

      setDeliveryDialog({ open: false, itemId: null, productName: "" });
      fetchOrderDetails();
    } catch (error) {
      console.error("Error delivering order item:", error);
      toast({
        title: "Hata",
        description: "Teslimat sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
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

    try {
      setSubmitting(itemId);

      const { error: updateError } = await metahub
        .from("order_items")
        .update({
          delivery_content: editContent,
        })
        .eq("id", itemId);

      if (updateError) throw updateError;

      toast({
        title: "Başarılı",
        description: "Teslimat içeriği güncellendi.",
      });

      setEditingItem(null);
      setEditContent("");
      fetchOrderDetails();
    } catch (error) {
      console.error("Error updating delivery content:", error);
      toast({
        title: "Hata",
        description: "Güncelleme sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const handleRefreshApiStatus = async () => {
    toast({
      title: "API Durumu Kontrol Ediliyor",
      description: "Lütfen bekleyin...",
    });

    try {
      // First update the API order ID manually for this specific order
      const { error: updateError } = await metahub
        .from('order_items')
        .update({ api_order_id: '6595837', delivery_status: 'processing' })
        .eq('order_id', id);

      if (updateError) {
        console.error("Error updating order item:", updateError);
        throw updateError;
      }

      console.log("Updated API order ID to 6595837");

      // Then call the sync function
      const { data, error } = await metahub.functions.invoke("smm-api-status", {
        body: { orderId: id },
      });

      console.log("API sync result:", data);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "API durumu güncellendi.",
      });
      fetchOrderDetails();
    } catch (error) {
      console.error("API status refresh error:", error);
      toast({
        title: "Hata",
        description: "API durumu güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Beklemede", variant: "secondary" },
      processing: { label: "İşleniyor", variant: "default" },
      completed: { label: "Tamamlandı", variant: "default" },
      cancelled: { label: "İptal Edildi", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) return <AdminLayout title="Sipariş Detayı"><div>Yükleniyor...</div></AdminLayout>;
  if (!order) return <AdminLayout title="Sipariş Detayı"><div>Sipariş bulunamadı</div></AdminLayout>;

  const hasApiDelivery = orderItems.some(
    (item) => item.delivery_status === "pending" || item.delivery_status === "processing"
  );

  return (
    <AdminLayout title={`Sipariş Detayı - ${order.order_number}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/orders")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>

          {hasApiDelivery && (
            <Button onClick={handleRefreshApiStatus} variant="outline" size="sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
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
                <Select value={order.status} onValueChange={handleStatusChange}>
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
                  {order.payment_status === "paid" ? "Ödendi" :
                    order.payment_status === "pending" ? "Beklemede" :
                      order.payment_status === "failed" ? "Başarısız" : order.payment_status}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sipariş Tarihi</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleString("tr-TR")}</p>
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
                {orderItems.map((item, index) => (
                  <>
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground space-y-1">
                              {Object.entries(item.selected_options).map(([key, value]) => (
                                <div key={key} className="flex items-start gap-1">
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
                        {item.api_order_id || (item as any).turkpin_order_no ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.api_order_id || (item as any).turkpin_order_no}
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.delivery_status === 'delivered' ? (
                          <Badge variant="default">Teslim Edildi</Badge>
                        ) : item.delivery_status === 'processing' ? (
                          <Badge variant="default">İşleniyor</Badge>
                        ) : item.delivery_status === 'failed' ? (
                          <Badge variant="destructive">Başarısız</Badge>
                        ) : item.delivery_status === 'pending' ? (
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
                              onClick={() => handleStartEdit(item.id, item.delivery_content!)}
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
                      console.log(`Item ${item.id} selected_options:`, item.selected_options);
                      const hasOptions = item.selected_options && typeof item.selected_options === 'object' && Object.keys(item.selected_options).length > 0;
                      console.log(`Item ${item.id} has options:`, hasOptions);

                      // Get custom field labels
                      const customFields = item.products?.custom_fields || [];
                      const getFieldLabel = (fieldId: string) => {
                        const field = customFields.find(f => f.id === fieldId);
                        return field ? field.label : fieldId;
                      };

                      return hasOptions ? (
                        <TableRow key={`${index}-options`}>
                          <TableCell colSpan={6} className="bg-muted/50 py-2">
                            <div className="text-sm space-y-1">
                              <p className="font-semibold text-muted-foreground mb-1">Ürün Özelleştirme Bilgileri:</p>
                              {Object.entries(item.selected_options as Record<string, string>).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium">{getFieldLabel(key)}:</span>
                                  <span>{value}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null;
                    })()}
                  </>
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
                  <span className="font-medium text-green-600">-₺{order.discount_amount}</span>
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

        {/* Manuel Teslimat */}
        {orderItems.some((item) => item.products?.delivery_type === "manual" && item.delivery_status === "pending") && (
          <Card>
            <CardHeader>
              <CardTitle>Manuel Teslimat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems
                .filter((item) => item.products?.delivery_type === "manual" && item.delivery_status === "pending")
                .map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{item.product_name}</h4>
                      <Badge variant="secondary">Adet: {item.quantity}</Badge>
                    </div>
                    <Button
                      onClick={() => setDeliveryDialog({
                        open: true,
                        itemId: item.id,
                        productName: item.product_name
                      })}
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
        <Dialog open={deliveryDialog.open} onOpenChange={(open) => {
          if (!open) {
            setDeliveryDialog({ open: false, itemId: null, productName: "" });
            setDeliveryContent({});
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manuel Teslimat</DialogTitle>
              <DialogDescription>
                {deliveryDialog.productName} için teslimat içeriğini girin. Bu bilgiler müşteriye email ile gönderilecektir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delivery-content">Teslimat İçeriği</Label>
              <Textarea
                id="delivery-content"
                placeholder="Örnek:&#10;Aktivasyon Kodu: ABC-123-XYZ&#10;Kullanım Talimatı: ...&#10;&#10;veya&#10;&#10;Kullanıcı Adı: user@example.com&#10;Şifre: ********&#10;Giriş URL'si: https://..."
                value={deliveryContent[deliveryDialog.itemId || ""] || ""}
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
                ℹ️ Bu içerik müşterinin email adresine otomatik olarak gönderilecektir.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeliveryDialog({ open: false, itemId: null, productName: "" });
                  setDeliveryContent({});
                }}
                disabled={submitting !== null}
              >
                İptal
              </Button>
              <Button
                onClick={() => handleManualDelivery(deliveryContent[deliveryDialog.itemId || ""] || "")}
                disabled={submitting !== null || !deliveryContent[deliveryDialog.itemId || ""]?.trim()}
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
