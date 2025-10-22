import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  user_id: string;
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

export function TicketManagement() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data, error } = await metahub
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Ticketlar yüklenemedi");
      console.error(error);
    } else {
      setTickets((data as any) || []);
    }
    setLoading(false);
  };

  const fetchReplies = async (ticketId: string) => {
    const { data, error } = await metahub
      .from("ticket_replies")
      .select(`
        *,
        profiles (full_name)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
    } else {
      setReplies((data as any) || []);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchReplies(ticket.id);
    setDialogOpen(true);
  };

  const handleSendReply = async () => {
    console.log('handleSendReply called!');
    console.log('User:', user);
    console.log('Selected ticket:', selectedTicket);
    console.log('Reply message:', replyMessage);

    if (!user || !selectedTicket || !replyMessage.trim()) {
      console.log('Early return - missing data');
      return;
    }

    const { error } = await metahub.from("ticket_replies").insert([
      {
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: replyMessage,
        is_admin: true,
      },
    ]);

    if (error) {
      toast.error("Yanıt gönderilemedi");
      console.error(error);
    } else {
      // Admin cevap verdiğinde ticket'ı cevaplandı durumuna al
      await metahub
        .from("support_tickets")
        .update({ status: "answered" })
        .eq("id", selectedTicket.id);

      toast.success("Yanıt gönderildi");
      setReplyMessage("");
      fetchReplies(selectedTicket.id);
      fetchTickets(); // Ticket listesini güncelle

      // Send ticket replied email
      try {
        console.log('Attempting to send ticket reply email...');
        console.log('User ID:', selectedTicket.user_id);
        console.log('Ticket subject:', selectedTicket.subject);

        const result = await metahub.functions.invoke('send-email', {
          body: {
            userId: selectedTicket.user_id,
            template_key: 'ticket_replied',
            variables: {
              ticket_subject: selectedTicket.subject,
              reply_message: replyMessage,
              user_name: 'Kullanıcı',
              ticket_id: selectedTicket.id,
              site_name: 'Platform'
            }
          }
        });

        console.log('Email send result:', result);

        if (result.error) {
          console.error('Ticket reply email invocation error:', result.error);
        }
      } catch (emailError) {
        console.error('Ticket reply email exception:', emailError);
      }
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const { error } = await metahub
      .from("support_tickets")
      .update({ status: newStatus })
      .eq("id", ticketId);

    if (error) {
      toast.error("Durum güncellenemedi");
      console.error(error);
    } else {
      toast.success("Durum güncellendi");
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    }
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

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

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
                    onValueChange={(value) =>
                      handleStatusChange(ticket.id, value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Açık</SelectItem>
                      <SelectItem value="answered">Cevaplandı</SelectItem>
                      <SelectItem value="resolved">Çözüldü</SelectItem>
                      <SelectItem value="closed">Kapalı</SelectItem>
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
                  {selectedTicket?.status}
                </Badge>
                <Badge
                  className={getPriorityColor(selectedTicket?.priority || "")}
                >
                  {selectedTicket?.priority}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Original Message */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">
                  Kullanıcı
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedTicket.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(selectedTicket.created_at).toLocaleString("tr-TR")}
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
                          ? "Destek Ekibi (Siz)"
                          : reply.profiles?.full_name || "Kullanıcı"}
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
                    placeholder="Yanıt yazın..."
                    rows={3}
                  />
                  <Button onClick={handleSendReply} size="icon">
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
