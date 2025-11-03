// src/pages/admin/tickets/TicketDetail.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

import {
  useGetSupportTicketAdminByIdQuery,
  useUpdateSupportTicketAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/support_admin.endpoints";
import {
  useListTicketRepliesAdminQuery,
  useCreateTicketReplyAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/ticket_replies_admin.endpoints";
import type { SupportTicketStatus, SupportTicketPriority } from "@/integrations/metahub/db/types/support";

const statusText: Record<SupportTicketStatus, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  waiting_response: "Yanıt bekliyor",
  closed: "Kapalı",
};

const statusBadge = (s: SupportTicketStatus) => {
  switch (s) {
    case "open": return "bg-blue-100 text-blue-800";
    case "in_progress": return "bg-amber-100 text-amber-800";
    case "waiting_response": return "bg-purple-100 text-purple-800";
    case "closed": return "bg-gray-100 text-gray-800";
  }
};

const priorityText: Record<SupportTicketPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};
const priorityBadge = (p: SupportTicketPriority) => {
  switch (p) {
    case "urgent": return "bg-red-500";
    case "high": return "bg-orange-500";
    case "medium": return "bg-yellow-500";
    case "low": return "bg-green-500";
  }
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: ticket, isLoading, refetch: refetchTicket } =
    useGetSupportTicketAdminByIdQuery(id!, { skip: !id });

  const { data: replies = [], refetch: refetchReplies, isLoading: isRepliesLoading } =
    useListTicketRepliesAdminQuery(id!, { skip: !id });

  const [updateTicket, { isLoading: isUpdating }] = useUpdateSupportTicketAdminMutation();
  const [createReply, { isLoading: isSending }] = useCreateTicketReplyAdminMutation();

  const [replyMessage, setReplyMessage] = useState("");

  const handleStatusChange = async (newStatus: SupportTicketStatus) => {
    if (!id) return;
    try {
      await updateTicket({ id, patch: { status: newStatus } }).unwrap();
      toast.success("Durum güncellendi");
      refetchTicket();
    } catch (e) {
      toast.error("Durum güncellenemedi");
    }
  };

  const handleSendReply = async () => {
    if (!id || !replyMessage.trim()) return;
    try {
      await createReply({ ticket_id: id, message: replyMessage.trim() }).unwrap();
      // BE admin.reply → waiting_response'a çekiyor; ticket'ı da yenileyelim:
      await Promise.all([refetchReplies(), refetchTicket()]);
      setReplyMessage("");
      toast.success("Cevap gönderildi");
    } catch (e) {
      toast.error("Cevap gönderilemedi");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Ticket Detayı">
        <div className="flex items-center justify-center py-8">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  if (!ticket) {
    return (
      <AdminLayout title="Ticket Detayı">
        <div className="flex items-center justify-center py-8">Ticket bulunamadı</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Ticket Detayı">
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/admin/tickets")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle>{ticket.subject}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={statusBadge(ticket.status)}>{statusText[ticket.status]}</Badge>
                  <Badge className={priorityBadge(ticket.priority)}>{priorityText[ticket.priority]}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {/* category şemada opsiyonel; null olabilir */}
                    {ticket.category ?? "Genel"}
                  </span>
                </div>
              </div>

              <Select
                value={ticket.status}
                onValueChange={(v) => handleStatusChange(v as SupportTicketStatus)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Açık</SelectItem>
                  <SelectItem value="in_progress">İşlemde</SelectItem>
                  <SelectItem value="waiting_response">Yanıt bekliyor</SelectItem>
                  <SelectItem value="closed">Kapalı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Kullanıcı:</p>
              <p className="text-sm text-muted-foreground">
                {ticket.user_id /* elimizde sadece user_id var; isim/email join FE’den kaldırıldı */}
              </p>
              <p className="text-sm text-muted-foreground">
                Tarih: {new Date(ticket.created_at).toLocaleString("tr-TR")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Mesaj:</p>
              <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cevaplar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRepliesLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>
            ) : replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Henüz cevap yok</p>
            ) : (
              replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg ${reply.is_admin ? "bg-primary/10" : "bg-muted"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{reply.is_admin ? "Admin" : reply.user_id ?? "Kullanıcı"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reply.created_at).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                </div>
              ))
            )}

            {ticket.status !== "closed" && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Cevabınızı yazın..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSendReply} disabled={isSending || !replyMessage.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  {isSending ? "Gönderiliyor..." : "Cevap Gönder"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
