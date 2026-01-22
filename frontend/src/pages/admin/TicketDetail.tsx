import { useState, useMemo } from "react";
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
  useListTicketRepliesAdminQuery,
  useCreateTicketReplyAdminMutation,
  useAdminListQuery,
} from '@/integrations/hooks';


import type {
  SupportTicketStatus,
  SupportTicketPriority,
} from "@/integrations/types";

const statusText: Record<SupportTicketStatus, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  waiting_response: "Yanıt bekliyor",
  closed: "Kapalı",
};

const statusBadge = (s: SupportTicketStatus) => {
  switch (s) {
    case "open":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-amber-100 text-amber-800";
    case "waiting_response":
      return "bg-purple-100 text-purple-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
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
    case "urgent":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
  }
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: ticket,
    isLoading,
    refetch: refetchTicket,
  } = useGetSupportTicketAdminByIdQuery(id!, { skip: !id });

  const {
    data: replies = [],
    refetch: refetchReplies,
    isLoading: isRepliesLoading,
  } = useListTicketRepliesAdminQuery(id!, { skip: !id });

  const [updateTicket, { isLoading: isUpdating }] =
    useUpdateSupportTicketAdminMutation();
  const [createReply, { isLoading: isSending }] =
    useCreateTicketReplyAdminMutation();

  // === Ticket sahibinin ismi/emaili ===
  const ownerId = ticket?.user_id ?? null;
  const { data: ownerMini = [] } = useAdminListQuery(
    { q: ownerId ?? '' },
    { skip: !ownerId }
  );
  const owner = ownerMini[0];
  const ownerLabel = useMemo(() => {
    if (!owner) return ownerId ?? "-";
    return owner.full_name ? `${owner.full_name} (${owner.email})` : owner.email;
  }, [owner, ownerId]);

  const [replyMessage, setReplyMessage] = useState("");

  const handleStatusChange = async (newStatus: SupportTicketStatus) => {
    if (!id) return;
    try {
      await updateTicket({ id, patch: { status: newStatus } }).unwrap();
      toast.success("Durum güncellendi");
      refetchTicket();
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  const handleSendReply = async () => {
    if (!id || !replyMessage.trim()) return;
    try {
      // Admin reply → BE tarafında:
      //  - ticket_replies kaydı oluşturuluyor
      //  - ticket.status = "waiting_response" yapılıyor
      await createReply({
        ticket_id: id,
        message: replyMessage.trim(),
        // user_id göndermiyoruz; admin reply olduğu için BE is_admin=true + user_id=null kaydediyor
      }).unwrap();

      // Detay sayfası ve cevap listesi güncellensin
      await Promise.all([refetchReplies(), refetchTicket()]);

      setReplyMessage("");
      toast.success("Cevap gönderildi");
    } catch {
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
        <div className="flex items-center justify-center py-8">
          Ticket bulunamadı
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Ticket Detayı">
      {/* Sayfa genelinde yatay taşmayı kapat */}
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <Button variant="outline" onClick={() => navigate("/admin/tickets")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>

        <Card className="max-w-full">
          <CardHeader>
            {/* Başlık + durum seçici satırı */}
            <div className="flex items-start justify-between gap-4 flex-wrap md:flex-nowrap">
              <div className="space-y-2 min-w-0">
                <CardTitle className="break-words overflow-wrap:anywhere">
                  {ticket.subject}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusBadge(ticket.status)}>
                    {statusText[ticket.status]}
                  </Badge>
                  <Badge className={priorityBadge(ticket.priority)}>
                    {priorityText[ticket.priority]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {ticket.category ?? "Genel"}
                  </span>
                </div>
              </div>

              <Select
                value={ticket.status}
                onValueChange={(v) =>
                  handleStatusChange(v as SupportTicketStatus)
                }
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[200px] shrink-0">
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
            <div className="max-w-full">
              <p className="text-sm font-medium">Kullanıcı:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words overflow-wrap:anywhere">
                {ownerLabel}
              </p>
              <p className="text-sm text-muted-foreground">
                Tarih: {new Date(ticket.created_at).toLocaleString("tr-TR")}
              </p>
            </div>

            <div className="max-w-full">
              <p className="text-sm font-medium mb-2">Mesaj:</p>
              <p className="text-sm whitespace-pre-wrap break-words overflow-wrap:anywhere">
                {ticket.message}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-full">
          <CardHeader>
            <CardTitle>Cevaplar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRepliesLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Yükleniyor...
              </p>
            ) : replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz cevap yok
              </p>
            ) : (
              replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg w-full max-w-full overflow-hidden ${
                    reply.is_admin ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <p className="text-sm font-medium break-words overflow-wrap:anywhere">
                      {reply.is_admin ? "Admin" : reply.user_id ?? "Kullanıcı"}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(reply.created_at).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words overflow-wrap:anywhere">
                    {reply.message}
                  </p>
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
                  className="w-full"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={isSending || !replyMessage.trim()}
                  className="w-full sm:w-auto"
                >
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
