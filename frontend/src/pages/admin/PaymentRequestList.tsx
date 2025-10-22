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

interface PaymentRequest {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  proof_image_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  orders: {
    order_number: string;
    customer_name: string;
    customer_email: string;
    order_items: Array<{
      product_name: string;
      quantity: number;
    }>;
  };
}

const PaymentRequestList = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
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
      setRequests(data || []);
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
      console.log('=== PAYMENT APPROVAL STARTED ===');
      console.log('Payment request:', selectedRequest);

      // Update payment request status
      await metahub
        .from("payment_requests")
        .update({ status: "approved", admin_note: adminNote })
        .eq("id", selectedRequest.id);

      // Get order details for emails
      const { data: orderData } = await metahub
        .from("orders")
        .select("customer_email, customer_name, order_number, final_amount")
        .eq("id", selectedRequest.order_id)
        .single();

      // Get site name for emails
      const { data: siteSetting } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "site_title")
        .single();

      const siteName = siteSetting?.value || 'Platform';

      // Send order received email
      if (orderData?.customer_email) {
        try {
          await metahub.functions.invoke('send-email', {
            body: {
              to: orderData.customer_email,
              template_key: 'order_received',
              variables: {
                customer_name: orderData.customer_name,
                order_number: orderData.order_number,
                final_amount: orderData.final_amount?.toString() || '0',
                status: 'İşleniyor',
                site_name: siteName
              }
            }
          });
          console.log('Order received email sent');
        } catch (emailError) {
          console.error('Error sending order received email:', emailError);
        }
      }

      // Get order items to process auto stock delivery and check delivery types
      const { data: orderItems } = await metahub
        .from("order_items")
        .select("id, product_id, product_name, quantity, selected_options, products(delivery_type, stock_quantity, api_provider_id, api_product_id, file_url, api_quantity)")
        .eq("order_id", selectedRequest.order_id);

      console.log('Order items:', orderItems);

      let allItemsDelivered = true;

      // Process delivery based on type
      if (orderItems) {
        for (const item of orderItems) {
          const deliveryType = (item.products as any)?.delivery_type;
          const fileUrl = (item.products as any)?.file_url;

          console.log(`Processing item ${item.id}, delivery type: ${deliveryType}, file_url: ${fileUrl}`);

          if (deliveryType === "auto_stock") {
            // Auto stock - assign from stock
            try {
              console.log('Assigning stock for item:', item.id);
              await metahub.rpc("assign_stock_to_order", {
                p_order_item_id: item.id,
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              });

              const currentStock = (item.products as any)?.stock_quantity || 0;
              await metahub
                .from("products")
                .update({ stock_quantity: currentStock - item.quantity })
                .eq("id", item.product_id);

              console.log('Stock assigned successfully');

              // Fetch updated item to get delivery_content and send email
              const { data: updatedItem } = await metahub
                .from('order_items')
                .select('delivery_content')
                .eq('id', item.id)
                .single();

              if (orderData?.customer_email && updatedItem?.delivery_content) {
                try {
                  await metahub.functions.invoke('send-email', {
                    body: {
                      to: orderData.customer_email,
                      template_key: 'order_item_delivery',
                      variables: {
                        customer_name: orderData.customer_name,
                        order_number: orderData.order_number,
                        product_name: item.product_name,
                        delivery_content: updatedItem.delivery_content,
                        site_name: siteName
                      }
                    }
                  }).catch(err => console.error('Stock delivery email error:', err));

                  console.log('Stock delivery email sent to:', orderData.customer_email);
                } catch (emailError) {
                  console.error('Error sending stock delivery email:', emailError);
                }
              }
            } catch (error) {
              console.error("Stock assignment error:", error);
              allItemsDelivered = false;
            }
          } else if (deliveryType === "file") {
            // File delivery - mark as delivered
            console.log('Marking file item as delivered:', item.id);
            await metahub
              .from("order_items")
              .update({ delivery_status: "delivered" })
              .eq("id", item.id);

            console.log('File item marked as delivered');

            // Send file delivery email
            if (orderData?.customer_email) {
              try {
                await metahub.functions.invoke('send-email', {
                  body: {
                    to: orderData.customer_email,
                    template_key: 'order_item_delivery',
                    variables: {
                      customer_name: orderData.customer_name,
                      order_number: orderData.order_number,
                      product_name: item.product_name,
                      delivery_content: fileUrl || 'Dosya indirilmek üzere hazır',
                      site_name: siteName
                    }
                  }
                }).catch(err => console.error('File delivery email error:', err));

                console.log('File delivery email sent to:', orderData.customer_email);
              } catch (emailError) {
                console.error('Error sending file delivery email:', emailError);
              }
            }
          } else if (deliveryType === "api") {
            // API delivery - send to API provider
            try {
              const apiProviderId = (item.products as any)?.api_provider_id;
              const apiProductId = (item.products as any)?.api_product_id;
              const apiQuantity = (item.products as any)?.api_quantity || item.quantity;
              const selectedOptions = (item as any).selected_options;

              // Extract link from selected_options (field names are dynamic)
              let link = '';
              if (selectedOptions) {
                const values = Object.values(selectedOptions);
                if (values.length > 0) {
                  link = values[0] as string;
                }
              }

              console.log('Processing API order:', { apiProviderId, apiProductId, apiQuantity, link, selectedOptions });

              if (apiProviderId && apiProductId) {
                // Call SMM API to create order
                const { data, error: apiError } = await metahub.functions.invoke('smm-api-order', {
                  body: {
                    orderItemId: item.id,
                    apiProviderId: apiProviderId,
                    apiProductId: apiProductId,
                    link: link,
                    quantity: apiQuantity
                  }
                });

                if (apiError) {
                  console.error('API order error:', apiError);
                  toast.error(`API siparişi oluşturulamadı: ${apiError.message}`);
                  allItemsDelivered = false;
                } else {
                  console.log('API order created, marked as processing');
                  // Keep order as processing until API confirms delivery
                  allItemsDelivered = false;
                }
              }
            } catch (error) {
              console.error("API order error:", error);
              toast.error("API siparişi oluşturulurken hata oluştu");
              allItemsDelivered = false;
            }
          } else if (deliveryType === "manual") {
            // Manual delivery - admin must manually deliver
            console.log('Manual delivery - keeping as processing');
            allItemsDelivered = false;
          }
        }
      }

      console.log('All items delivered:', allItemsDelivered);

      // Update order status - completed if all items delivered, otherwise processing
      const orderStatus = allItemsDelivered ? "completed" : "processing";
      console.log('Updating order status to:', orderStatus);

      const { data: updatedOrder, error: orderUpdateError } = await metahub
        .from("orders")
        .update({
          status: orderStatus,
          payment_status: "paid"
        })
        .eq("id", selectedRequest.order_id)
        .select();

      if (orderUpdateError) {
        console.error('Order update error:', orderUpdateError);
        throw orderUpdateError;
      }

      console.log('Order updated successfully:', updatedOrder);

      // Send order completed email if all items delivered
      if (allItemsDelivered && orderData?.customer_email) {
        try {
          await metahub.functions.invoke('send-email', {
            body: {
              to: orderData.customer_email,
              template_key: 'order_completed',
              variables: {
                customer_name: orderData.customer_name,
                order_number: orderData.order_number,
                final_amount: orderData.final_amount?.toString() || '0',
                site_name: siteName
              }
            }
          }).catch(err => console.error('Order completed email error:', err));

          console.log('Order completed email sent to:', orderData.customer_email);
        } catch (emailError) {
          console.error('Error sending order completed email:', emailError);
        }
      }

      // Send telegram notification for approved order
      try {
        const { data: telegramSettings } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "new_order_telegram")
          .single();

        // Handle both boolean and string values
        const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

        if (isEnabled) {
          await metahub.functions.invoke('send-telegram-notification', {
            body: {
              type: 'new_order',
              orderId: selectedRequest.order_id
            }
          });
        }
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError);
      }

      toast.success("Ödeme onaylandı ve stoklar teslim edildi");
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
      // Update payment request status
      await metahub
        .from("payment_requests")
        .update({ status: "rejected", admin_note: adminNote })
        .eq("id", selectedRequest.id);

      // Delete order
      await metahub.from("orders").delete().eq("id", selectedRequest.order_id);

      toast.success("Ödeme reddedildi ve sipariş silindi");
      setShowDialog(false);
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Ödeme reddedilirken hata oluştu");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Onaylandı</Badge>;
      case "rejected":
        return <Badge variant="destructive">Reddedildi</Badge>;
      case "pending":
        return <Badge variant="secondary">Bekliyor</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Ödeme Bildirimleri">
        <div className="flex items-center justify-center h-64">
          Yükleniyor...
        </div>
      </AdminLayout>
    );
  }

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout title="Ödeme Bildirimleri">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ödeme Bildirimleri</h1>
          <p className="text-muted-foreground">
            Bekleyen ödeme bildirimlerini yönetin
          </p>
        </div>

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
                  <TableHead>Yöntem</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.orders.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.orders.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.orders.customer_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {request.orders.order_items.map((item, idx) => (
                          <p key={idx} className="text-sm">
                            {item.product_name} x{item.quantity}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>₺{request.amount.toFixed(2)}</TableCell>
                    <TableCell className="uppercase">{request.payment_method}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString("tr-TR")}
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
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
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ödeme Bildirimi Detayı</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sipariş No</Label>
                  <p className="font-medium">{selectedRequest.orders.order_number}</p>
                </div>
                <div>
                  <Label>Tutar</Label>
                  <p className="font-medium">₺{selectedRequest.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Müşteri</Label>
                  <p className="font-medium">{selectedRequest.orders.customer_name}</p>
                </div>
                <div>
                  <Label>Ödeme Yöntemi</Label>
                  <p className="font-medium uppercase">{selectedRequest.payment_method}</p>
                </div>
                <div>
                  <Label>Durum</Label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label>Tarih</Label>
                  <p className="font-medium">
                    {new Date(selectedRequest.created_at).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>

              {selectedRequest.proof_image_url && (
                <div>
                  <Label>Dekont/Makbuz</Label>
                  <img
                    src={selectedRequest.proof_image_url}
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
                  <Button
                    onClick={handleApprove}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Onayla
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reddet
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PaymentRequestList;
