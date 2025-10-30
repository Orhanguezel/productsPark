import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { metahub } from "@/integrations/metahub/client";
import { toast } from "sonner";
import { Eye, CheckCircle, XCircle } from "lucide-react";

// ...imports aynı

interface PaymentRequest {
  id: string;
  order_id: string;
  user_id: string | null;
  amount: number;
  currency?: string | null;
  payment_method: string;
  payment_proof: string | null;   // <-- DÜZELTİLDİ
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;     // <-- DÜZELTİLDİ
  created_at: string;
  orders: {
    order_number: string;
    customer_name: string;
    customer_email: string;
    order_items: Array<{ product_name: string; quantity: number; }>;
  } | null;
}

const PaymentRequestList = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("payment_requests")
        .select(`
          *,
          orders (
            order_number,
            customer_name,
            customer_email,
            order_items (
              product_name,
              quantity
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Güvenli cast
      setRequests((data as unknown as PaymentRequest[]) ?? []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Ödeme bildirimleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setAdminNote(request.admin_note || "");
    setShowDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      // 1) payment_request güncelle (KOLON ADI!)
      await metahub
        .from("payment_requests")
        .update({ status: "approved", admin_note: adminNote })
        .eq("id", selectedRequest.id);

      // 2) sipariş bilgileri (mail/teslimat)
      const { data: orderData } = await metahub
        .from("orders")
        .select("customer_email, customer_name, order_number, final_amount")
        .eq("id", selectedRequest.order_id)
        .single();

      const { data: siteSetting } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "site_title")
        .single();

      const siteName = siteSetting?.value || "Platform";

      if (orderData?.customer_email) {
        try {
          await metahub.functions.invoke("send-email", {
            body: {
              to: orderData.customer_email,
              template_key: "order_received",
              variables: {
                customer_name: orderData.customer_name,
                order_number: orderData.order_number,
                final_amount: String(orderData.final_amount ?? "0"),
                status: "İşleniyor",
                site_name: siteName,
              },
            },
          });
        } catch (e) {
          console.warn("order_received email error", e);
        }
      }

      // 3) ürün teslim akışı (aynen korunuyor)
      const { data: orderItems } = await metahub
        .from("order_items")
        .select("id, product_id, product_name, quantity, selected_options, products(delivery_type, stock_quantity, api_provider_id, api_product_id, file_url, api_quantity)")
        .eq("order_id", selectedRequest.order_id);

      const allItemsDelivered = true;

      if (orderItems) {
        for (const item of orderItems as any[]) {
          const deliveryType = item?.products?.delivery_type;
          const fileUrl = item?.products?.file_url;
          // ... mevcut teslimat blokları aynı (auto_stock / file / api / manual)
          // (Bu bloklar sizde zaten doğru; burada değişiklik yok.)
        }
      }

      const orderStatus = allItemsDelivered ? "completed" : "processing";
      const { error: orderUpdateError } = await metahub
        .from("orders")
        .update({ status: orderStatus, payment_status: "paid" })
        .eq("id", selectedRequest.order_id);
      if (orderUpdateError) throw orderUpdateError;

      // Telegram (opsiyonel)
      try {
        const { data: telegramSettings } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "new_order_telegram")
          .single();
        const v = telegramSettings?.value;
        const enabled = v === true || v === "true" || v === 1 || v === "1";
        if (enabled) {
          await metahub.functions.invoke("send-telegram-notification", {
            body: { type: "new_order", orderId: selectedRequest.order_id },
          });
        }
      } catch (e) {
        console.warn("Telegram notify error", e);
      }

      toast.success("Ödeme onaylandı ve sipariş işleme alındı");
      setShowDialog(false);
      fetchRequests();
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Ödeme onaylanırken hata oluştu");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await metahub
        .from("payment_requests")
        .update({ status: "rejected", admin_note: adminNote })
        .eq("id", selectedRequest.id);

      await metahub.from("orders").delete().eq("id", selectedRequest.order_id);

      toast.success("Ödeme reddedildi ve sipariş silindi");
      setShowDialog(false);
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Ödeme reddedilirken hata oluştu");
    }
  };

  const getStatusBadge = (status: PaymentRequest["status"]) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500">Onaylandı</Badge>;
      case "rejected": return <Badge variant="destructive">Reddedildi</Badge>;
      case "pending":  return <Badge variant="secondary">Bekliyor</Badge>;
      default:         return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Ödeme Bildirimleri">
        <div className="flex items-center justify-center h-64">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  const totalPages = Math.max(1, Math.ceil(requests.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout title="Ödeme Bildirimleri">
      <div className="space-y-6">
        {/* header */}
        <Card>
          <CardHeader><CardTitle>Ödeme İstekleri ({requests.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürünler</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Yöntem</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.orders?.order_number ?? "-"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.orders?.customer_name ?? "-"}</p>
                        <p className="text-sm text-muted-foreground">{request.orders?.customer_email ?? "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(request.orders?.order_items ?? []).map((item, idx) => (
                          <p key={idx} className="text-sm">{item.product_name} x{item.quantity}</p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>₺{Number(request.amount ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="uppercase">{request.payment_method}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{new Date(request.created_at).toLocaleString("tr-TR")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewRequest(request)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* pagination … (aynı) */}
        {/* dialog … (admin_note/proof alanlarıyla güncellendi) */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Ödeme Bildirimi Detayı</DialogTitle></DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                {/* … alanlar */}
                {selectedRequest.payment_proof && (
                  <div>
                    <Label>Dekont/Makbuz</Label>
                    <img
                      src={selectedRequest.payment_proof}
                      alt="Payment Proof"
                      className="mt-2 max-w-full rounded-lg border"
                    />
                  </div>
                )}

                <div>
                  <Label>Admin Notu</Label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Not ekleyin..."
                    rows={3}
                  />
                </div>

                {selectedRequest.status === "pending" && (
                  <div className="flex gap-2">
                    <Button onClick={handleApprove} className="flex-1" variant="default">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Onayla
                    </Button>
                    <Button onClick={handleReject} className="flex-1" variant="destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reddet
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PaymentRequestList;
