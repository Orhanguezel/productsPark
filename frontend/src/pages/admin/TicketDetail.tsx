import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
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

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
}

interface TicketReply {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
  user_name?: string;
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
      fetchReplies();
    }
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("support_tickets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch profile separately
      const { data: profileData } = await metahub
        .from("profiles")
        .select("full_name")
        .eq("id", data.user_id)
        .single();

      setTicket({
        ...data,
        user_email: "N/A", // Email görünmesi gerekmiyorsa kaldırabiliriz
        user_name: profileData?.full_name || "N/A",
      });
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
      toast.error("Ticket yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const { data, error } = await metahub
        .from("ticket_replies")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

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
            user_name: profileData?.full_name || "Anonim",
          };
        })
      );

      setReplies(repliesWithProfiles);
    } catch (error: any) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !id) return;

    try {
      setSending(true);
      const { data: { user } } = await metahub.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { error } = await metahub.from("ticket_replies").insert({
        ticket_id: id,
        user_id: user.id,
        message: replyMessage.trim(),
        is_admin: true,
      });

      if (error) throw error;

      // Admin cevap verdiğinde ticket'ı cevaplandı durumuna al
      await metahub
        .from("support_tickets")
        .update({ status: "answered" })
        .eq("id", id);

      // Send email notification to user
      if (ticket?.user_id) {
        try {
          console.log('Sending ticket reply email to user:', ticket.user_id);

          const emailResult = await metahub.functions.invoke('send-email', {
            body: {
              userId: ticket.user_id,
              template_key: 'ticket_replied',
              variables: {
                user_name: ticket.user_name || 'Kullanıcı',
                ticket_id: ticket.id,
                ticket_subject: ticket.subject,
                reply_message: replyMessage.trim(),
                site_name: 'Platform'
              }
            }
          });

          console.log('Ticket reply email result:', emailResult);

          if (emailResult.error) {
            console.error('Ticket reply email error:', emailResult.error);
          }
        } catch (err) {
          console.error('Ticket reply email exception:', err);
        }
      }

      toast.success("Cevap gönderildi");
      setReplyMessage("");
      fetchReplies();
      fetchTicketDetails();
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error("Cevap gönderilirken hata oluştu");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    try {
      const { error } = await metahub
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("Durum güncellendi");
      fetchTicketDetails();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Durum güncellenirken hata oluştu");
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

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      open: "Açık",
      answered: "Cevaplandı",
      resolved: "Çözüldü",
      closed: "Kapalı",
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityText = (priority: string) => {
    const priorityMap: Record<string, string> = {
      urgent: "Acil",
      high: "Yüksek",
      medium: "Orta",
      low: "Düşük",
    };
    return priorityMap[priority] || priority;
  };

  if (loading) {
    return (
      <AdminLayout title="Ticket Detayı">
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!ticket) {
    return (
      <AdminLayout title="Ticket Detayı">
        <div className="flex items-center justify-center py-8">
          <p>Ticket bulunamadı</p>
        </div>
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
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle>{ticket.subject}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {getStatusText(ticket.status)}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {getPriorityText(ticket.priority)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {ticket.category || "Genel"}
                  </span>
                </div>
              </div>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Açık</SelectItem>
                  <SelectItem value="answered">Cevaplandı</SelectItem>
                  <SelectItem value="resolved">Çözüldü</SelectItem>
                  <SelectItem value="closed">Kapalı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Kullanıcı Bilgileri:</p>
              <p className="text-sm text-muted-foreground">
                {ticket.user_name} ({ticket.user_email})
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
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz cevap yok
              </p>
            ) : (
              replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg ${reply.is_admin ? "bg-primary/10" : "bg-muted"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {reply.is_admin ? "Admin" : reply.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reply.created_at).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                </div>
              ))
            )}

            {ticket.status !== "resolved" && ticket.status !== "closed" && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Cevabınızı yazın..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSendReply} disabled={sending || !replyMessage.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? "Gönderiliyor..." : "Cevap Gönder"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
