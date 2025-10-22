import { useEffect, useState } from "react";
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
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketReply {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  profiles: {
    full_name: string | null;
  };
}

const Support = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "medium",
    category: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/giris");
      return;
    }
    if (user) {
      fetchTickets();
    }
  }, [user, authLoading]);

  const fetchTickets = async () => {
    if (!user) return;

    const { data, error } = await metahub
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  const fetchReplies = async (ticketId: string) => {
    const { data, error } = await metahub
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      return;
    }

    // Fetch profile info separately for each reply
    const repliesWithProfiles = await Promise.all(
      (data || []).map(async (reply) => {
        const { data: profileData } = await metahub
          .from("profiles")
          .select("full_name")
          .eq("id", reply.user_id)
          .single();

        return {
          ...reply,
          profiles: profileData,
        };
      })
    );

    setReplies(repliesWithProfiles as any);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const { data: ticketData, error } = await metahub.from("support_tickets").insert([
      {
        user_id: user.id,
        ...newTicket,
      },
    ]).select().single();

    if (error) {
      toast.error("Ticket oluşturulamadı");
      console.error(error);
    } else {
      toast.success("Ticket oluşturuldu");

      // Send Telegram notification
      console.log('Attempting to send Telegram notification...');
      const { data: profile } = await metahub
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      console.log('Profile fetched:', profile);
      console.log('Ticket data:', ticketData);

      const telegramResult = await metahub.functions.invoke('send-telegram-notification', {
        body: {
          type: 'new_ticket',
          ticketId: ticketData.id,
          userName: profile?.full_name || 'Anonim'
        }
      });

      console.log('Telegram notification result:', telegramResult);

      if (telegramResult.error) {
        console.error('Telegram notification error:', telegramResult.error);
      }
      setNewTicket({
        subject: "",
        message: "",
        priority: "medium",
        category: "",
      });
      setShowNewTicket(false);
      fetchTickets();

      // Send telegram notification
      try {
        console.log('Attempting to send Telegram notification...');
        const { data: telegramSettings } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "new_ticket_telegram")
          .single();

        console.log('Telegram settings:', telegramSettings);

        if (telegramSettings?.value) {
          const { data: profileData } = await metahub
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          console.log('Invoking telegram notification function...');
          const result = await metahub.functions.invoke('send-telegram-notification', {
            body: {
              type: 'new_ticket',
              ticketId: ticketData.id,
              userName: profileData?.full_name || 'Kullanıcı'
            }
          });

          console.log('Telegram notification result:', result);
        } else {
          console.log('Telegram notifications disabled in settings');
        }
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError);
      }
    }
  };

  const handleSendReply = async () => {
    if (!user || !selectedTicket || !replyMessage.trim()) return;

    const { error } = await metahub.from("ticket_replies").insert([
      {
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: replyMessage,
        is_admin: false,
      },
    ]);

    if (error) {
      toast.error("Yanıt gönderilemedi");
      console.error(error);
    } else {
      // Kullanıcı cevap verdiğinde ticket'ı tekrar açık duruma al
      await metahub
        .from("support_tickets")
        .update({ status: "open" })
        .eq("id", selectedTicket.id);

      toast.success("Yanıt gönderildi");
      setReplyMessage("");
      fetchReplies(selectedTicket.id);
      fetchTickets(); // Ticket listesini güncelle
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchReplies(ticket.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "answered":
        return "bg-purple-100 text-purple-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Açık";
      case "answered":
        return "Cevaplandı";
      case "resolved":
        return "Çözüldü";
      case "closed":
        return "Kapalı";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low":
        return "Düşük";
      case "medium":
        return "Orta";
      case "high":
        return "Yüksek";
      case "urgent":
        return "Acil";
      default:
        return priority;
    }
  };

  if (authLoading || loading) {
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
            <Button onClick={() => setShowNewTicket(!showNewTicket)}>
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
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Konu * ({newTicket.subject.length}/80)</Label>
                        <Input
                          id="subject"
                          value={newTicket.subject}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 80) {
                              setNewTicket({ ...newTicket, subject: value });
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
                        <Label htmlFor="category">Kategori ({newTicket.category.length}/40)</Label>
                        <Input
                          id="category"
                          value={newTicket.category}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 40) {
                              setNewTicket({ ...newTicket, category: value });
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
                            setNewTicket({ ...newTicket, priority: value })
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
                        <Label htmlFor="message">Mesaj * ({newTicket.message.length}/2000)</Label>
                        <Textarea
                          id="message"
                          value={newTicket.message}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 2000) {
                              setNewTicket({ ...newTicket, message: value });
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
                        <Button type="submit" className="flex-1">
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
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {tickets.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Henüz ticket oluşturmadınız.
                      </p>
                    ) : (
                      <>
                        {tickets
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((ticket) => (
                            <Card
                              key={ticket.id}
                              className={`cursor-pointer hover:bg-accent ${selectedTicket?.id === ticket.id ? "bg-accent" : ""
                                }`}
                              onClick={() => handleTicketClick(ticket)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold">{ticket.subject}</h3>
                                  <Badge className={getStatusColor(ticket.status)}>
                                    {getStatusLabel(ticket.status)}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Badge
                                    variant="outline"
                                    className={getPriorityColor(ticket.priority)}
                                  >
                                    {getPriorityLabel(ticket.priority)}
                                  </Badge>
                                  {ticket.category && (
                                    <Badge variant="outline">{ticket.category}</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(ticket.created_at).toLocaleDateString("tr-TR")}
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
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.ceil(tickets.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(Math.min(Math.ceil(tickets.length / itemsPerPage), currentPage + 1))}
                            className={currentPage === Math.ceil(tickets.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                          {new Date(selectedTicket.created_at).toLocaleString(
                            "tr-TR"
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {getStatusLabel(selectedTicket.status)}
                        </Badge>
                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                          {getPriorityLabel(selectedTicket.priority)}
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
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-4 rounded-lg ${reply.is_admin ? "bg-primary/10" : "bg-muted"
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-sm">
                              {reply.is_admin
                                ? "Destek Ekibi"
                                : reply.profiles?.full_name || "Siz"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleString("tr-TR")}
                            </p>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                      <div className="flex gap-2">
                        <Textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Yanıtınızı yazın..."
                          rows={3}
                        />
                        <Button onClick={handleSendReply} size="icon">
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
