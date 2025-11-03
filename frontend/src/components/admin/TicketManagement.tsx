// =============================================================
// FILE: src/components/support/TicketManagement.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import {
  useListSupportTicketsQuery,
  useUpdateSupportTicketMutation,
} from "@/integrations/metahub/rtk/endpoints/support_tickets.endpoints";
import {
  useListTicketRepliesByTicketQuery,
  useCreateTicketReplyMutation,
} from "@/integrations/metahub/rtk/endpoints/ticket_replies.endpoints";

import type {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
  TicketReply,
} from "@/integrations/metahub/db/types/support";

/** Admin ile aynı status sabitleri */
const STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  WAITING_RESPONSE: "waiting_response",
  CLOSED: "closed",
} as const satisfies Record<string, SupportTicketStatus>;

const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const satisfies Record<string, SupportTicketPriority>;

/** Badge/metin eşlemesi */
const statusText: Record<SupportTicketStatus, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  waiting_response: "Yanıt bekliyor",
  closed: "Kapalı",
};

const getStatusColor = (s: SupportTicketStatus | string) => {
  switch (s) {
    case STATUS.OPEN: return "bg-blue-100 text-blue-800";
    case STATUS.IN_PROGRESS: return "bg-amber-100 text-amber-800";
    case STATUS.WAITING_RESPONSE: return "bg-purple-100 text-purple-800";
    case STATUS.CLOSED: return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (p: SupportTicketPriority | string) => {
  switch (p) {
    case PRIORITY.URGENT: return "bg-red-100 text-red-800";
    case PRIORITY.HIGH: return "bg-orange-100 text-orange-800";
    case PRIORITY.MEDIUM: return "bg-yellow-100 text-yellow-800";
    case PRIORITY.LOW: return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export function TicketManagement() {
  const { user } = useAuth();

  const {
    data: tickets = [],
    isLoading,
    refetch: refetchTickets,
  } = useListSupportTicketsQuery({
    sort: "created_at",
    order: "desc",
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTicket: SupportTicket | null = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId]
  );

  const {
    data: replies = [],
    refetch: refetchReplies,
    isFetching: repliesLoading,
  } = useListTicketRepliesByTicketQuery(selectedId ?? "", {
    skip: !selectedId,
  });

  const [updateSupportTicket] = useUpdateSupportTicketMutation();
  const [createReply, { isLoading: sendingReply }] =
    useCreateTicketReplyMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (!dialogOpen) {
      setSelectedId(null);
      setReplyMessage("");
    }
  }, [dialogOpen]);

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedId(ticket.id);
    setDialogOpen(true);
  };

  const handleStatusChange = async (
    ticketId: string,
    newStatus: SupportTicketStatus
  ) => {
    try {
      await updateSupportTicket({ id: ticketId, patch: { status: newStatus } }).unwrap();
      toast.success("Durum güncellendi");
      refetchTickets();
    } catch (e) {
      console.error(e);
      toast.error("Durum güncellenemedi");
    }
  };

  const handleSendReply = async () => {
    if (!user || !selectedTicket || !replyMessage.trim()) return;

    try {
      // 1) Yanıtı oluştur
      await createReply({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: replyMessage.trim(),
        is_admin: true,
      }).unwrap();

      // 2) Admin cevap sonrası akış: "waiting_response"
      if (selectedTicket.status !== STATUS.CLOSED) {
        await updateSupportTicket({
          id: selectedTicket.id,
          patch: { status: STATUS.WAITING_RESPONSE },
        }).unwrap();
      }

      // 3) Opsiyonel e-posta bildirimi
      try {
        const result = await metahub.functions.invoke<{ success?: boolean; error?: string }>(
          "send-email",
          {
            body: {
              userId: selectedTicket.user_id,
              template_key: "ticket_replied",
              variables: {
                ticket_subject: selectedTicket.subject,
                reply_message: replyMessage.trim(),
                user_name: "Kullanıcı",
                ticket_id: selectedTicket.id,
                site_name: "Platform",
              },
            },
          }
        );
        if (result.error) {
          console.error("Ticket reply email invocation error:", result.error);
        }
      } catch (emailErr) {
        console.error("Ticket reply email exception:", emailErr);
      }

      toast.success("Yanıt gönderildi");
      setReplyMessage("");
      refetchReplies();
      refetchTickets();
    } catch (err) {
      console.error(err);
      toast.error("Yanıt gönderilemedi");
    }
  };

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Destek Ticketları</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Konu</TableHead>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Öncelik</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                Ticket bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>
                  {ticket.category ? (
                    <Badge variant="outline">{ticket.category}</Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={ticket.status}
                    onValueChange={(val) =>
                      handleStatusChange(ticket.id, val as SupportTicketStatus)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={STATUS.OPEN}>{statusText[STATUS.OPEN]}</SelectItem>
                      <SelectItem value={STATUS.IN_PROGRESS}>{statusText[STATUS.IN_PROGRESS]}</SelectItem>
                      <SelectItem value={STATUS.WAITING_RESPONSE}>{statusText[STATUS.WAITING_RESPONSE]}</SelectItem>
                      <SelectItem value={STATUS.CLOSED}>{statusText[STATUS.CLOSED]}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {new Date(ticket.created_at).toLocaleDateString("tr-TR")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTicketClick(ticket)}
                  >
                    Görüntüle
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTicket?.subject}
              <div className="flex gap-2 mt-2">
                <Badge className={getStatusColor(selectedTicket?.status || "")}>
                  {selectedTicket ? statusText[selectedTicket.status] : ""}
                </Badge>
                <Badge className={getPriorityColor(selectedTicket?.priority || "")}>
                  {selectedTicket?.priority}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Original Message */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Kullanıcı</p>
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(selectedTicket.created_at).toLocaleString("tr-TR")}
                </p>
              </div>

              {/* Replies */}
              <div className="space-y-4">
                {repliesLoading ? (
                  <div className="text-sm text-muted-foreground">Yanıtlar yükleniyor…</div>
                ) : (
                  replies.map((reply: TicketReply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg ${
                        reply.is_admin ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-sm">
                          {reply.is_admin ? "Destek Ekibi (Siz)" : "Kullanıcı"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reply.created_at).toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== STATUS.CLOSED && (
                <div className="flex gap-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Yanıt yazın..."
                    rows={3}
                  />
                  <Button onClick={handleSendReply} size="icon" disabled={sendingReply}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
