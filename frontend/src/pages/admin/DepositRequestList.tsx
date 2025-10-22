import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { toast } from "sonner";

interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  proof_image_url: string | null;
  admin_note: string | null;
  created_at: string;
  user_full_name?: string;
}

export default function DepositRequestList() {
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("wallet_deposit_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user details for each request
      const requestsWithUsers = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await metahub
            .from("profiles")
            .select("full_name")
            .eq("id", request.user_id)
            .single();

          return {
            ...request,
            user_full_name: profile?.full_name || "Bilinmeyen",
          };
        })
      );

      setRequests(requestsWithUsers);
    } catch (error: any) {
      console.error("Error fetching deposit requests:", error);
      toast.error("İstekler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      // Update request status
      const { error: updateError } = await metahub
        .from("wallet_deposit_requests")
        .update({ status, admin_note: adminNote })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // If approved, update user's wallet balance
      if (status === "approved") {
        const { data: profile, error: profileError } = await metahub
          .from("profiles")
          .select("wallet_balance, full_name")
          .eq("id", request.user_id)
          .single();

        if (profileError) throw profileError;

        const newBalance = (profile.wallet_balance || 0) + request.amount;

        const { error: balanceError } = await metahub
          .from("profiles")
          .update({ wallet_balance: newBalance })
          .eq("id", request.user_id);

        if (balanceError) throw balanceError;

        // Create wallet transaction
        await metahub.from("wallet_transactions").insert([
          {
            user_id: request.user_id,
            amount: request.amount,
            type: "deposit",
            description: `Bakiye yükleme onaylandı - ${request.payment_method}`,
          },
        ]);

        // Send telegram notification
        try {
          console.log('Checking telegram notification settings for deposit_approved');

          const { data: telegramSettings } = await metahub
            .from("site_settings")
            .select("value")
            .eq("key", "deposit_approved_telegram")
            .single();

          console.log('Deposit telegram setting:', telegramSettings?.value);

          // Handle both boolean and string values
          const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

          if (isEnabled) {
            console.log('Sending telegram notification for deposit approval');

            const telegramResult = await metahub.functions.invoke('send-telegram-notification', {
              body: {
                type: 'deposit_approved',
                depositId: requestId,
                amount: request.amount,
                userName: profile?.full_name || 'Kullanıcı'
              }
            });

            console.log('Telegram notification result:', telegramResult);

            if (telegramResult.error) {
              console.error('Telegram notification error:', telegramResult.error);
            }
          } else {
            console.log('Telegram notifications disabled for deposit_approved');
          }
        } catch (telegramError) {
          console.error('Telegram notification exception:', telegramError);
        }

        // Send deposit success email
        const { data: userAuth } = await metahub.auth.admin.getUserById(request.user_id);
        if (userAuth?.user?.email) {
          try {
            console.log('Sending deposit success email to:', userAuth.user.email);

            const { data: siteSetting } = await metahub
              .from("site_settings")
              .select("value")
              .eq("key", "site_title")
              .single();

            const emailResult = await metahub.functions.invoke('send-email', {
              body: {
                to: userAuth.user.email,
                template_key: 'deposit_success',
                variables: {
                  user_name: profile?.full_name || 'Kullanıcı',
                  amount: request.amount.toString(),
                  new_balance: newBalance.toString(),
                  site_name: siteSetting?.value || 'Dijital Market'
                }
              }
            });

            console.log('Deposit success email result:', emailResult);

            if (emailResult.error) {
              console.error('Deposit success email error:', emailResult.error);
            }
          } catch (emailError) {
            console.error('Deposit success email exception:', emailError);
          }
        }
      }

      toast.success(
        status === "approved" ? "İstek onaylandı ve bakiye eklendi" : "İstek reddedildi"
      );
      setSelectedRequest(null);
      setAdminNote("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error updating request:", error);
      toast.error("İstek güncellenirken hata oluştu");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Beklemede</Badge>;
      case "approved":
        return <Badge variant="default">Onaylandı</Badge>;
      case "rejected":
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Bakiye Yükleme İstekleri">
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout title="Bakiye Yükleme İstekleri">
      <Card>
        <CardHeader>
          <CardTitle>Yükleme İstekleri</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Ödeme Yöntemi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Henüz istek yok
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.user_full_name}</TableCell>
                    <TableCell>{request.amount} ₺</TableCell>
                    <TableCell>{request.payment_method}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog
                        open={selectedRequest?.id === request.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setSelectedRequest(request);
                            setAdminNote(request.admin_note || "");
                          } else {
                            setSelectedRequest(null);
                            setAdminNote("");
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>İstek Detayları</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Kullanıcı</Label>
                              <p className="text-sm">{request.user_full_name}</p>
                            </div>
                            <div>
                              <Label>Tutar</Label>
                              <p className="text-sm">{request.amount} ₺</p>
                            </div>
                            <div>
                              <Label>Ödeme Yöntemi</Label>
                              <p className="text-sm">{request.payment_method}</p>
                            </div>
                            {request.proof_image_url && (
                              <div>
                                <Label>Dekont</Label>
                                <img
                                  src={request.proof_image_url}
                                  alt="Dekont"
                                  className="mt-2 max-w-full rounded border"
                                />
                              </div>
                            )}
                            <div>
                              <Label htmlFor="admin_note">Admin Notu</Label>
                              <Textarea
                                id="admin_note"
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                rows={3}
                              />
                            </div>
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  onClick={() => handleUpdateStatus(request.id, "approved")}
                                  className="flex-1"
                                >
                                  Onayla
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleUpdateStatus(request.id, "rejected")}
                                  className="flex-1"
                                >
                                  Reddet
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
    </AdminLayout>
  );
}
