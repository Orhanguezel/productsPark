import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Copy, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";

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
  user_id: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  product_price: number;
  total_price: number;
  activation_code: string | null;
  delivery_content: string | null;
  delivery_status: string | null;
  selected_options?: Record<string, string> | null;
  product_id: string | null;
  products?: {
    file_url: string | null;
    delivery_type: string | null;
  };
}

export default function UserOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/giris");
        return;
      }
      if (id) {
        fetchOrderDetails();
      }
    }
  }, [id, user, authLoading]);

  const fetchOrderDetails = async () => {
    if (!id || !user) return;

    try {
      const { data: orderData, error: orderError } = await metahub
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (orderError) throw orderError;

      if (!orderData) {
        toast.error("Sipariş bulunamadı");
        navigate("/hesabim");
        return;
      }

      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await metahub
        .from("order_items")
        .select(`
          id, 
          product_name, 
          quantity, 
          product_price, 
          total_price, 
          activation_code, 
          delivery_content, 
          delivery_status, 
          selected_options,
          product_id,
          products(file_url, delivery_type)
        `)
        .eq("order_id", id);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        throw itemsError;
      }
      console.log("Order items fetched:", itemsData);
      setOrderItems((itemsData || []) as unknown as OrderItem[]);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Sipariş detayları yüklenirken bir hata oluştu.");
      navigate("/hesabim");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopyalandı!");
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          Yükleniyor...
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          Sipariş bulunamadı
        </div>
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/hesabim")}>
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
                    <div className="mt-1">{getStatusBadge(order.status)}</div>
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
                    {orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.product_name || 'Ürün Adı Bulunamadı'}
                            </div>
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
                          <div className="space-y-2">
                            {/* Dosya İndirme - Sadece ödeme yapıldıysa göster */}
                            {item.products?.file_url && (item.products?.delivery_type === 'auto_file' || item.products?.delivery_type === 'file') && order.payment_status === 'paid' && (
                              <Button
                                size="sm"
                                variant="default"
                                className="gradient-primary w-full"
                                onClick={() => {
                                  console.log("Download button clicked", {
                                    productName: item.product_name,
                                    fileUrl: item.products?.file_url,
                                    deliveryType: item.products?.delivery_type
                                  });
                                  const link = document.createElement('a');
                                  link.href = item.products!.file_url!;
                                  link.download = item.product_name;
                                  link.target = '_blank';
                                  link.click();
                                  toast.success('Dosya indiriliyor...');
                                }}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Dosyayı İndir
                              </Button>
                            )}
                            {item.products?.file_url && (item.products?.delivery_type === 'auto_file' || item.products?.delivery_type === 'file') && order.payment_status !== 'paid' && (
                              <div className="text-sm text-muted-foreground">
                                Ödeme onaylandıktan sonra indirebilirsiniz
                              </div>
                            )}

                            {/* Delivery Content - Sadece ödeme yapıldıysa göster */}
                            {item.delivery_content && order.payment_status === 'paid' && (
                              <div className="space-y-2">
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Teslimat Bilgileriniz
                                    </span>
                                  </div>
                                  <pre className="text-sm whitespace-pre-wrap font-mono bg-background p-3 rounded border">
                                    {item.delivery_content}
                                  </pre>
                                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                                    <p>✓ Ürün bilgileriniz hazır</p>
                                    <p>✓ Kopyala butonunu kullanarak bilgileri kopyalayabilirsiniz</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="w-full gradient-primary"
                                  onClick={() => copyToClipboard(item.delivery_content!)}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Bilgileri Kopyala
                                </Button>
                              </div>
                            )}

                            {/* Activation Code - Sadece ödeme yapıldıysa göster */}
                            {item.activation_code && order.payment_status === 'paid' && (
                              <div className="space-y-2">
                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded border block">
                                  {item.activation_code}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(item.activation_code!)}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Kopyala
                                </Button>
                              </div>
                            )}

                            {/* Ödeme bekleniyor mesajı */}
                            {order.payment_status !== 'paid' && !item.delivery_content && !item.activation_code && (
                              <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="font-medium">⏳ Ödeme Bekleniyor</p>
                                <p className="text-xs mt-1">Ödemeniz onaylandıktan sonra ürün bilgileriniz burada görünecektir.</p>
                              </div>
                            )}

                            {/* Teslimat Durumu Badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Durum:</span>
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
                            </div>

                            {!item.products?.file_url && !item.delivery_content && !item.activation_code && (
                              <span className="text-muted-foreground text-sm">Henüz teslim edilmedi</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 space-y-2">
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

            {order.notes && !order.order_number.startsWith('WALLET') && (
              <Card>
                <CardHeader>
                  <CardTitle>Notlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
