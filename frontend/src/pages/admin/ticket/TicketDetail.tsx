// =============================================================
// FILE: src/pages/admin/ticket/TicketDetail.tsx
// FINAL — Ticket Detail (Admin)
// - Owner + Replies: resolve users by ids (not q)
// - Single adminList call for all needed ids
// - Maps (no index assumptions) + null-safe label formatting
// - STATUS UX RULE:
//    * closed -> Kapalı
//    * else if has replies -> İşlemde
//    * else -> Açık
//   "waiting_response" UI'da kullanılmaz / gösterilmez
// =============================================================

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetSupportTicketAdminByIdQuery,
  useUpdateSupportTicketAdminMutation,
  useListTicketRepliesAdminQuery,
  useCreateTicketReplyAdminMutation,
  useAdminListQuery,
} from '@/integrations/hooks';

import type {
  AdminUserView,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/integrations/types';

// UI’da sadece 3 status gösteriyoruz
type UiStatus = 'open' | 'in_progress' | 'closed';

const statusText: Record<UiStatus, string> = {
  open: 'Açık',
  in_progress: 'İşlemde',
  closed: 'Kapalı',
};

const statusBadge = (s: UiStatus) => {
  switch (s) {
    case 'open':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-amber-100 text-amber-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
  }
};

const priorityText: Record<SupportTicketPriority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

const priorityBadge = (p: SupportTicketPriority) => {
  switch (p) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
  }
};

const formatAdminUser = (u?: AdminUserView | null, fallbackId?: string | null) => {
  const id = (fallbackId ?? '').trim();
  if (!u) return id || '-';

  const full = (u.full_name ?? '').trim();
  const email = (u.email ?? '').trim();

  if (full && email) return `${full} (${email})`;
  if (full) return full;
  if (email) return email;
  return id || u.id || '-';
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
    isLoading: isRepliesLoading,
    refetch: refetchReplies,
  } = useListTicketRepliesAdminQuery(id!, { skip: !id });

  const [updateTicket, { isLoading: isUpdating }] = useUpdateSupportTicketAdminMutation();
  const [createReply, { isLoading: isSending }] = useCreateTicketReplyAdminMutation();

  // ---------- Collect all user ids we need (owner + reply users) ----------
  const ownerId = ticket?.user_id ?? null;

  const replyUserIds = useMemo(() => {
    const ids = (replies ?? [])
      .map((r) => r.user_id)
      .filter((x): x is string => typeof x === 'string' && x.trim() !== '');
    return ids;
  }, [replies]);

  const neededUserIds = useMemo(() => {
    const set = new Set<string>();
    if (ownerId && ownerId.trim()) set.add(ownerId.trim());
    replyUserIds.forEach((x) => set.add(x.trim()));
    return Array.from(set);
  }, [ownerId, replyUserIds]);

  const { data: usersMini = [] } = useAdminListQuery(
    neededUserIds.length ? { ids: neededUserIds } : undefined,
    { skip: neededUserIds.length === 0 },
  );

  const userMap = useMemo(() => {
    const m = new Map<string, AdminUserView>();
    (usersMini as AdminUserView[]).forEach((u) => m.set(u.id, u));
    return m;
  }, [usersMini]);

  const ownerLabel = useMemo(() => {
    const u = ownerId ? (userMap.get(ownerId) ?? null) : null;
    return formatAdminUser(u, ownerId);
  }, [userMap, ownerId]);

  const formatReplyUser = (replyUserId: string | null, isAdmin: boolean) => {
    if (isAdmin) return 'Admin';
    if (!replyUserId) return 'Kullanıcı';
    const u = userMap.get(replyUserId) ?? null;
    return formatAdminUser(u, replyUserId);
  };

  // ---------- STATUS UX RULE (core fix) ----------
  const hasReplies = (replies?.length ?? 0) > 0;

  const effectiveStatus: UiStatus = useMemo(() => {
    if (!ticket) return 'open';
    if (ticket.status === 'closed') return 'closed';
    // ticket.status open / in_progress / waiting_response -> UI kuralı:
    // cevap varsa -> işlemde, yoksa -> açık
    return hasReplies ? 'in_progress' : 'open';
  }, [ticket, hasReplies]);

  // ---------- Reply composer ----------
  const [replyMessage, setReplyMessage] = useState('');

  const handleStatusChange = async (newStatus: UiStatus) => {
    if (!id) return;

    // UI'da waiting_response yok. Backend'e map:
    // open -> open
    // in_progress -> in_progress
    // closed -> closed
    const patchStatus: SupportTicketStatus = newStatus;

    try {
      await updateTicket({ id, patch: { status: patchStatus } }).unwrap();
      toast.success('Durum güncellendi');
      refetchTicket();
    } catch {
      toast.error('Durum güncellenemedi');
    }
  };

  const handleSendReply = async () => {
    if (!id || !replyMessage.trim()) return;

    try {
      await createReply({ ticket_id: id, message: replyMessage.trim() }).unwrap();

      // UI kuralı gereği: cevap atıldıysa kapalı değilse "işlemde" olsun
      // (Backend zaten doğru set etmiyor olabilir; FE tarafında bunu garanti ediyoruz.)
      if (ticket?.status !== 'closed' && ticket?.status !== 'in_progress') {
        try {
          await updateTicket({ id, patch: { status: 'in_progress' } }).unwrap();
        } catch {
          // sessiz geç: ana işlem reply gönderimi
        }
      }

      await Promise.all([refetchReplies(), refetchTicket()]);
      setReplyMessage('');
      toast.success('Cevap gönderildi');
    } catch {
      toast.error('Cevap gönderilemedi');
    }
  };

  // ---------- UI ----------
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
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <Button variant="outline" onClick={() => navigate('/admin/tickets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>

        <Card className="max-w-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap md:flex-nowrap">
              <div className="space-y-2 min-w-0">
                <CardTitle className="break-words overflow-wrap:anywhere">
                  {ticket.subject}
                </CardTitle>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusBadge(effectiveStatus)}>
                    {statusText[effectiveStatus]}
                  </Badge>

                  <Badge className={priorityBadge(ticket.priority)}>
                    {priorityText[ticket.priority]}
                  </Badge>

                  <span className="text-sm text-muted-foreground">
                    {ticket.category ?? 'Genel'}
                  </span>
                </div>
              </div>

              <Select
                value={effectiveStatus}
                onValueChange={(v) => handleStatusChange(v as UiStatus)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[200px] shrink-0">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="open">Açık</SelectItem>
                  <SelectItem value="in_progress">İşlemde</SelectItem>
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
                Tarih: {new Date(ticket.created_at).toLocaleString('tr-TR')}
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
              <p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>
            ) : replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Henüz cevap yok</p>
            ) : (
              replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg w-full max-w-full overflow-hidden ${
                    reply.is_admin ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <p className="text-sm font-medium break-words overflow-wrap:anywhere">
                      {formatReplyUser(reply.user_id, reply.is_admin)}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(reply.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>

                  <p className="text-sm whitespace-pre-wrap break-words overflow-wrap:anywhere">
                    {reply.message}
                  </p>
                </div>
              ))
            )}

            {effectiveStatus !== 'closed' && (
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
                  {isSending ? 'Gönderiliyor...' : 'Cevap Gönder'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
