// =============================================================
// FILE: src/pages/account/components/Support/SupportTab.tsx
// =============================================================
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import {
  useListSupportTicketsQuery,
  useCreateSupportTicketMutation,
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
} from "@/integrations/metahub/rtk/types/support";
import { useSendTelegramNotificationMutation } from "@/integrations/metahub/rtk/endpoints/functions.endpoints";

type TicketReplyUI = TicketReply & { display_name: string };

const getStatusColor = (status: SupportTicketStatus | string) => {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-amber-100 text-amber-800";
    case "waiting_response":
      return "bg-purple-100 text-purple-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: SupportTicketStatus | string) =>
  (
    {
      open: "Açık",
      in_progress: "İşlemde",
      waiting_response: "Yanıt bekliyor",
      closed: "Kapalı",
    } as const
  )[status] ?? status;

const getPriorityColor = (p: SupportTicketPriority | string) => {
  switch (p) {
    case "low":
      return "bg-gray-100 text-gray-800";
    case "medium":
      return "bg-blue-100 text-blue-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "urgent":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityText = (p: SupportTicketPriority | string) =>
  (
    {
      low: "Düşük",
      medium: "Orta",
      high: "Yüksek",
      urgent: "Acil",
    } as const
  )[p] ?? p;

export function SupportTab() {
  const { user } = useAuth();

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useListSupportTicketsQuery(
    { user_id: user?.id, sort: "created_at", order: "desc" },
    { skip: !user?.id }
  );

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );

  const {
    data: repliesRaw = [],
    isLoading: repliesLoading,
    refetch: refetchReplies,
  } = useListTicketRepliesByTicketQuery(selectedTicket?.id ?? "", {
    skip: !selectedTicket?.id,
  });

  const [createTicket, { isLoading: creatingTicket }] =
    useCreateSupportTicketMutation();
  const [createReply, { isLoading: sendingReply }] =
    useCreateTicketReplyMutation();
  const [, { isLoading: updatingTicket }] = useUpdateSupportTicketMutation();

  const [sendTelegramNotification] = useSendTelegramNotificationMutation();

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [newTicket, setNewTicket] = useState<{
    subject: string;
    message: string;
    priority: SupportTicketPriority | "medium";
    category: string;
  }>({
    subject: "",
    message: "",
    priority: "medium",
    category: "",
  });

  const replies: TicketReplyUI[] = useMemo(
    () =>
      repliesRaw.map((r) => ({
        ...r,
        display_name: r.is_admin ? "Destek Ekibi" : "Siz",
      })),
    [repliesRaw]
  );

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const created = await createTicket({
        user_id: user.id,
        subject: newTicket.subject,
        message: newTicket.message,
        priority: newTicket.priority as SupportTicketPriority,
        category: newTicket.category || null,
      }).unwrap();

      // Opsiyonel Telegram bildirimi (RTK üzerinden)
      try {
        await sendTelegramNotification({
          type: "new_ticket",
          ticketId: created.id,
          userName: user.email || "Anonim",
        }).unwrap();
      } catch {
        // opsiyonel, sessiz geç
      }

      setNewTicket({
        subject: "",
        message: "",
        priority: "medium",
        category: "",
      });
      setShowNewTicket(false);
      toast.success("Ticket oluşturuldu");
      refetchTickets();
    } catch (err) {
      console.error(err);
      toast.error("Ticket oluşturulamadı");
    }
  };

  const handleSendReply = async () => {
    if (!user || !selectedTicket || !replyMessage.trim()) return;

    try {
      // Public endpoint → backend kullanıcı rolünü algılıyor:
      //  - Kullanıcı yanıtı → ticket.status = "in_progress"
      await createReply({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: replyMessage.trim(),
        is_admin: false,
      }).unwrap();

      setReplyMessage("");
      toast.success("Yanıt gönderildi");

      // Liste ve reply'leri yenile
      await Promise.all([refetchReplies(), refetchTickets()]);

      // Detay panelindeki seçili ticket da yeni statüye çekilsin
      setSelectedTicket((prev) =>
        prev && prev.id === selectedTicket.id
          ? { ...prev, status: "in_progress" }
          : prev
      );
    } catch (e) {
      console.error(e);
      toast.error("Yanıt gönderilemedi");
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Destek</h2>
        <Button onClick={() => setShowNewTicket((v) => !v)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Yeni Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* list */}
        <div className="lg:col-span-1 space-y-4">
          {showNewTicket && (
            <Card>
              <CardHeader>
                <CardTitle>Yeni Ticket Oluştur</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Konu * ({newTicket.subject.length}/80)
                    </Label>
                    <Input
                      id="subject"
                      value={newTicket.subject}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 80) {
                          setNewTicket((s) => ({ ...s, subject: value }));
                        } else {
                          toast.error("Konu 80 karakterden uzun olamaz");
                        }
                      }}
                      required
                      placeholder="Sorun başlığı"
                      maxLength={80}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Kategori ({newTicket.category.length}/40)
                    </Label>
                    <Input
                      id="category"
                      value={newTicket.category}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 40) {
                          setNewTicket((s) => ({ ...s, category: value }));
                        } else {
                          toast.error("Kategori 40 karakterden uzun olamaz");
                        }
                      }}
                      placeholder="Ürün, Ödeme, Teknik vb."
                      maxLength={40}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Öncelik</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) =>
                        setNewTicket((s) => ({
                          ...s,
                          priority: value as SupportTicketPriority,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Düşük</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="urgent">Acil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Mesaj * ({newTicket.message.length}/2000)
                    </Label>
                    <Textarea
                      id="message"
                      value={newTicket.message}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 2000) {
                          setNewTicket((s) => ({ ...s, message: value }));
                        } else {
                          toast.error("Mesaj 2000 karakterden uzun olamaz");
                        }
                      }}
                      required
                      placeholder="Sorununuzu detaylıca açıklayın"
                      rows={5}
                      maxLength={2000}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={creatingTicket}
                    >
                      Oluştur
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewTicket(false)}
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Ticket Listesi</CardTitle>
              <CardDescription>
                Tüm destek talepleriniz ({tickets.length})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {ticketsLoading || tickets.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {ticketsLoading
                    ? "Yükleniyor..."
                    : "Henüz ticket oluşturmadınız."}
                </p>
              ) : (
                tickets.map((t) => (
                  <Card
                    key={t.id}
                    className={`cursor-pointer hover:bg-accent ${
                      selectedTicket?.id === t.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedTicket(t)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{t.subject}</h3>
                        <Badge className={getStatusColor(t.status)}>
                          {getStatusText(t.status)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className={getPriorityColor(t.priority)}
                        >
                          {getPriorityText(t.priority)}
                        </Badge>
                        {t.category && (
                          <Badge variant="outline">{t.category}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(t.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedTicket.subject}</CardTitle>
                    <CardDescription>
                      {new Date(
                        selectedTicket.created_at
                      ).toLocaleString("tr-TR")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {getStatusText(selectedTicket.status)}
                    </Badge>
                    <Badge
                      className={getPriorityColor(selectedTicket.priority)}
                    >
                      {getPriorityText(selectedTicket.priority)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedTicket.message}
                  </p>
                </div>

                <div className="space-y-4">
                  {repliesLoading ? (
                    <div className="text-sm text-muted-foreground">
                      Yanıtlar yükleniyor…
                    </div>
                  ) : replies.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Henüz yanıt yok
                    </div>
                  ) : (
                    replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-lg ${
                          reply.is_admin ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-sm">
                            {reply.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              reply.created_at
                            ).toLocaleString("tr-TR")}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {selectedTicket.status !== "closed" && (
                  <div className="flex gap-2">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Yanıtınızı yazın..."
                      rows={3}
                    />
                    <Button
                      onClick={handleSendReply}
                      size="icon"
                      disabled={sendingReply || updatingTicket}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Görüntülemek için bir ticket seçin
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
