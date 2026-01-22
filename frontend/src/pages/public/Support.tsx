import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import {
  useListSupportTicketsQuery,
  useCreateSupportTicketMutation,
  useListTicketRepliesByTicketQuery,
  useCreateTicketReplyMutation,
  useSendTelegramNotificationMutation
} from "@/integrations/hooks";

import type {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
  TicketReply,
} from "@/integrations/types";

/* --------- Status/Priority sözlükleri (admin ile birebir) --------- */

const STATUS_TEXT: Record<SupportTicketStatus, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  waiting_response: "Yanıt bekliyor",
  closed: "Kapalı",
};

const statusBadge = (s: SupportTicketStatus | string) => {
  switch (s) {
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

const PRIORITY_TEXT: Record<SupportTicketPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

const priorityBadge = (p: SupportTicketPriority | string) => {
  switch (p) {
    case "urgent":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/* ------------------------------- Page ------------------------------- */

const Support = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [newTicket, setNewTicket] = useState<{
    subject: string;
    message: string;
    priority: SupportTicketPriority;
    category: string;
  }>({
    subject: "",
    message: "",
    priority: "medium",
    category: "",
  });

  // Kullanıcı yoksa login’e yönlendir
  useEffect(() => {
    if (!authLoading && !user) navigate("/giris");
  }, [authLoading, user, navigate]);

  // Kullanıcıya ait ticket listesi (server-side filter)
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useListSupportTicketsQuery(
    user
      ? { user_id: user.id, sort: "created_at", order: "desc" }
      : ({} as any),
    { skip: !user }
  );

  // Seçili ticket
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTicket: SupportTicket | null = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId]
  );

  // Seçili ticket’ın cevapları
  const {
    data: replies = [],
    isFetching: repliesLoading,
    refetch: refetchReplies,
  } = useListTicketRepliesByTicketQuery(selectedId ?? "", {
    skip: !selectedId,
  });

  // Mutations
  const [createTicket, { isLoading: creating }] =
    useCreateSupportTicketMutation();
  const [createReply, { isLoading: sendingReply }] =
    useCreateTicketReplyMutation();
  const [sendTelegramNotification] = useSendTelegramNotificationMutation();

  // Ticket kartına tıklama
  const handleTicketClick = (t: SupportTicket) => {
    setSelectedId(t.id);
  };

  // Yeni ticket oluşturma
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const created = await createTicket({
        user_id: user.id,
        subject: newTicket.subject.trim(),
        message: newTicket.message.trim(),
        priority: newTicket.priority,
        category: newTicket.category ? newTicket.category.trim() : null,
      }).unwrap();

      toast.success("Ticket oluşturuldu");
      setNewTicket({
        subject: "",
        message: "",
        priority: "medium",
        category: "",
      });
      setShowNewTicket(false);
      await refetchTickets();
      setSelectedId(created.id);

      // Opsiyonel Telegram bildirimi (RTK mutation)
      try {
        await sendTelegramNotification({
          type: "new_ticket",
          ticketId: created.id,
          userName: user.email ?? "Kullanıcı",
        }).unwrap();
      } catch (te) {
        console.error("Telegram notification error:", te);
      }
    } catch (err) {
      console.error(err);
      toast.error("Ticket oluşturulamadı");
    }
  };

  // Yanıt gönderme (kullanıcı → is_admin: false)
  const handleSendReply = async () => {
    if (!user || !selectedTicket || !replyMessage.trim()) return;

    try {
      await createReply({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: replyMessage.trim(),
        is_admin: false,
      }).unwrap();

      toast.success("Yanıt gönderildi");
      setReplyMessage("");
      await Promise.all([refetchReplies(), refetchTickets()]);
    } catch (e) {
      console.error(e);
      toast.error("Yanıt gönderilemedi");
    }
  };

  // Liste/pagination
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tickets.slice(start, start + itemsPerPage);
  }, [tickets, currentPage]);

  if (authLoading || ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Destek</h1>
            <Button onClick={() => setShowNewTicket((s) => !s)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Yeni Ticket
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-1 space-y-4">
              {showNewTicket && (
                <Card>
                  <CardHeader>
                    <CardTitle>Yeni Ticket Oluştur</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleCreateTicket}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="subject">
                          Konu * ({newTicket.subject.length}/80)
                        </Label>
                        <Input
                          id="subject"
                          value={newTicket.subject}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v.length <= 80)
                              setNewTicket((s) => ({
                                ...s,
                                subject: v,
                              }));
                            else
                              toast.error(
                                "Konu 80 karakterden uzun olamaz"
                              );
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
                            const v = e.target.value;
                            if (v.length <= 40)
                              setNewTicket((s) => ({
                                ...s,
                                category: v,
                              }));
                            else
                              toast.error(
                                "Kategori 40 karakterden uzun olamaz"
                              );
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
                              priority:
                                value as SupportTicketPriority,
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
                            const v = e.target.value;
                            if (v.length <= 2000)
                              setNewTicket((s) => ({
                                ...s,
                                message: v,
                              }));
                            else
                              toast.error(
                                "Mesaj 2000 karakterden uzun olamaz"
                              );
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
                          disabled={creating}
                        >
                          {creating
                            ? "Oluşturuluyor..."
                            : "Oluştur"}
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
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {tickets.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Henüz ticket oluşturmadınız.
                      </p>
                    ) : (
                      <>
                        {paginated.map((ticket) => (
                          <Card
                            key={ticket.id}
                            className={`cursor-pointer hover:bg-accent ${
                              selectedId === ticket.id
                                ? "bg-accent"
                                : ""
                            }`}
                            onClick={() => handleTicketClick(ticket)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">
                                  {ticket.subject}
                                </h3>
                                <Badge
                                  className={statusBadge(
                                    ticket.status
                                  )}
                                >
                                  {STATUS_TEXT[ticket.status]}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Badge
                                  variant="outline"
                                  className={priorityBadge(
                                    ticket.priority
                                  )}
                                >
                                  {PRIORITY_TEXT[ticket.priority]}
                                </Badge>
                                {ticket.category && (
                                  <Badge variant="outline">
                                    {ticket.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(
                                  ticket.created_at
                                ).toLocaleDateString("tr-TR")}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Pagination */}
                  {tickets.length > itemsPerPage && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage((p) =>
                                Math.max(1, p - 1)
                              );
                            }}
                          />
                        </PaginationItem>
                        {Array.from(
                          {
                            length: Math.ceil(
                              tickets.length / itemsPerPage
                            ),
                          },
                          (_, i) => i + 1
                        ).map((page) => (
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
                              setCurrentPage((p) =>
                                Math.min(
                                  Math.ceil(
                                    tickets.length / itemsPerPage
                                  ),
                                  p + 1
                                )
                              );
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ticket Details */}
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
                        <Badge
                          className={statusBadge(
                            selectedTicket.status
                          )}
                        >
                          {STATUS_TEXT[selectedTicket.status]}
                        </Badge>
                        <Badge
                          className={priorityBadge(
                            selectedTicket.priority
                          )}
                        >
                          {PRIORITY_TEXT[selectedTicket.priority]}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Original Message */}
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                    </div>

                    {/* Replies */}
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
                        replies.map((reply: TicketReply) => (
                          <div
                            key={reply.id}
                            className={`p-4 rounded-lg ${
                              reply.is_admin
                                ? "bg-primary/10"
                                : "bg-muted"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold text-sm">
                                {reply.is_admin
                                  ? "Destek Ekibi"
                                  : "Siz"}
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

                    {/* Reply Form */}
                    {selectedTicket.status !== "closed" && (
                      <div className="flex gap-2">
                        <Textarea
                          value={replyMessage}
                          onChange={(e) =>
                            setReplyMessage(e.target.value)
                          }
                          placeholder="Yanıtınızı yazın..."
                          rows={3}
                        />
                        <Button
                          onClick={handleSendReply}
                          size="icon"
                          disabled={
                            sendingReply || !replyMessage.trim()
                          }
                          title={
                            !replyMessage.trim()
                              ? "Mesaj yazın"
                              : "Gönder"
                          }
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
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Support;
