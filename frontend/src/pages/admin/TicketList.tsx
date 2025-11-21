// src/pages/admin/tickets/TicketList.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  useListSupportTicketsAdminQuery,
  useUpdateSupportTicketAdminMutation,
  useDeleteSupportTicketAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/support_admin.endpoints";
import { useListUsersAdminMiniQuery } from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";

import type {
  SupportTicket, SupportTicketStatus, SupportTicketPriority
} from "@/integrations/metahub/rtk/types/support";

type FilterStatus = SupportTicketStatus | "all";

const priorityText: Record<SupportTicketPriority, string> = {
  urgent: "Acil",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
};
const priorityColor = (p: SupportTicketPriority) => {
  switch (p) {
    case "urgent": return "bg-red-500";
    case "high": return "bg-orange-500";
    case "medium": return "bg-yellow-500";
    case "low": return "bg-green-500";
  }
};

export default function TicketList() {
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("open");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: allTickets = [], isLoading, refetch } = useListSupportTicketsAdminQuery(
    { ...(filterStatus !== "all" ? { status: filterStatus as SupportTicketStatus } : {}) },
  );

  const tickets = allTickets as SupportTicket[];

  const filtered = useMemo(
    () => (filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus)),
    [tickets, filterStatus],
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  useEffect(() => { setCurrentPage(1); }, [filterStatus]);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // sayfadaki user_id’ler için mini user bilgisi
  const pageUserIds = useMemo(
    () => Array.from(new Set(paginated.map(t => t.user_id).filter(Boolean))),
    [paginated]
  );
  const { data: miniUsers = [] } = useListUsersAdminMiniQuery(pageUserIds, {
    skip: pageUserIds.length === 0,
  });
  const userMap = useMemo(() => {
    const m = new Map<string, { id: string; full_name: string | null; email: string }>();
    for (const u of miniUsers) m.set(u.id, u);
    return m;
  }, [miniUsers]);

  const formatUser = (userId: string) => {
    const u = userMap.get(userId);
    if (!u) return userId;
    return u.full_name ? `${u.full_name} (${u.email})` : u.email;
  };

  const [updateTicket] = useUpdateSupportTicketAdminMutation();
  const [deleteTicket] = useDeleteSupportTicketAdminMutation();

  const handleStatusChange = async (ticketId: string, newStatus: SupportTicketStatus) => {
    try {
      await updateTicket({ id: ticketId, patch: { status: newStatus } }).unwrap();
      toast.success("Durum güncellendi");
      refetch();
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  const handleDelete = async (ticketId: string) => {
    try {
      await deleteTicket(ticketId).unwrap();
      toast.success("Destek talebi silindi");
      refetch();
    } catch {
      toast.error("Destek talebi silinemedi");
    }
  };

  return (
    <AdminLayout title="Destek Yönetimi">
      <div className="space-y-4 max-w-full overflow-x-hidden">
        {/* Sekmeler */}
        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)} className="w-full">
          <TabsList className="w-full flex flex-wrap gap-2">
            <TabsTrigger value="open">Açık</TabsTrigger>
            <TabsTrigger value="in_progress">İşlemde</TabsTrigger>
            <TabsTrigger value="waiting_response">Yanıt bekliyor</TabsTrigger>
            <TabsTrigger value="closed">Kapalı</TabsTrigger>
            <TabsTrigger value="all">Tümü</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">Yükleniyor...</div>
        ) : (
          <>
            {/* === Desktop / Tablet (md+) → Tablo === */}
            <div className="relative w-full overflow-x-auto rounded-lg border hidden md:block">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Konu</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Ticket bulunamadı</TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium max-w-[480px] whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {t.subject}
                        </TableCell>

                        <TableCell className="max-w-[280px] whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {formatUser(t.user_id)}
                        </TableCell>

                        <TableCell>
                          <Badge className={priorityColor(t.priority)}>{priorityText[t.priority]}</Badge>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={t.status}
                            onValueChange={(v) => handleStatusChange(t.id, v as SupportTicketStatus)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Açık</SelectItem>
                              <SelectItem value="in_progress">İşlemde</SelectItem>
                              <SelectItem value="waiting_response">Yanıt bekliyor</SelectItem>
                              <SelectItem value="closed">Kapalı</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>{new Date(t.created_at).toLocaleDateString("tr-TR")}</TableCell>

                        <TableCell className="text-right min-w-[190px]">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Görüntüle
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Destek Talebini Sil</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu destek talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(t.id)}>
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* === Mobile (<md) → Kart listesi === */}
            <div className="md:hidden space-y-3">
              {paginated.length === 0 ? (
                <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground">
                  Ticket bulunamadı
                </div>
              ) : (
                paginated.map((t) => (
                  <div key={t.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {t.subject}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {formatUser(t.user_id)}
                        </p>
                      </div>
                      <Badge className={priorityColor(t.priority)}>{priorityText[t.priority]}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={t.status}
                        onValueChange={(v) => handleStatusChange(t.id, v as SupportTicketStatus)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Açık</SelectItem>
                          <SelectItem value="in_progress">İşlemde</SelectItem>
                          <SelectItem value="waiting_response">Yanıt bekliyor</SelectItem>
                          <SelectItem value="closed">Kapalı</SelectItem>
                        </SelectContent>
                      </Select>

                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(t.created_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Destek Talebini Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu destek talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(t.id)}>
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.max(1, p - 1));
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
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AdminLayout>
  );
}
