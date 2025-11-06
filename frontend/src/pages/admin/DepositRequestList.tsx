import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import {
  useListWalletDepositRequestsQuery,
  useUpdateWalletDepositRequestMutation,
} from "@/integrations/metahub/rtk/endpoints/wallet.endpoints";
import { useListUsersAdminMiniQuery } from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";

import type {
  WalletDepositRequest,
  WalletDepositStatus,
} from "@/integrations/metahub/db/types/wallet";

/* ---------------- helpers ---------------- */
const money = (v: number) => `${v.toLocaleString("tr-TR")} ₺`;
const isUuid = (s: unknown) => typeof s === "string" && s.length >= 8;

type UserMini = { id: string; full_name: string | null; email: string };
type Row = WalletDepositRequest & { user_full_name: string };

/* status filtresi için tür */
type StatusFilter = "all" | WalletDepositStatus;

export default function DepositRequestList() {
  /* ---- UI state ---- */
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  /* ---- RTK: İstekleri çek ---- */
  const { data: requests = [], isFetching, refetch } = useListWalletDepositRequestsQuery(
    statusFilter === "all" ? { order: "desc" } : { order: "desc", status: statusFilter }
  );
  const [updateReq, { isLoading: isUpdating }] = useUpdateWalletDepositRequestMutation();

  /* ---- Kullanıcı id'lerini çıkar ---- */
  const userIds = useMemo(
    () => Array.from(new Set(requests.map((r) => r.user_id).filter((x) => isUuid(x)))),
    [requests]
  );

  /* ---- BE admin/users mini ile isimleri çek ---- */
  const { data: usersMini = [], isFetching: isUsersLoading } =
    useListUsersAdminMiniQuery(userIds, { skip: userIds.length === 0 });

  const userMap = useMemo(() => {
    const m = new Map<string, UserMini>();
    usersMini.forEach((u) => m.set(u.id, u));
    return m;
  }, [usersMini]);

  const displayUser = (id: string) => {
    const u = userMap.get(id);
    if (u?.full_name && u.full_name.trim()) return u.full_name;
    if (u?.email) return u.email;
    return isUuid(id) ? `${id.slice(0, 6)}…${id.slice(-4)}` : "Bilinmeyen";
  };

  const rows: Row[] = useMemo(
    () => requests.map((r) => ({ ...r, user_full_name: displayUser(r.user_id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests, userMap]
  );

  /* ---- sayfalama ---- */
  useEffect(() => { setCurrentPage(1); }, [statusFilter]);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageItems = rows.slice((currentPage - 1) * perPage, currentPage * perPage);

  /* ---- mount'ta tazele ---- */
  useEffect(() => { refetch(); }, [refetch]);

  const getStatusBadge = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "pending": return <Badge variant="secondary">Beklemede</Badge>;
      case "approved": return <Badge variant="default">Onaylandı</Badge>;
      case "rejected": return <Badge variant="destructive">Reddedildi</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  /* ---- onay/red: sadece BE PATCH ---- */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const handleUpdateStatus = async (requestId: string, status: "approved" | "rejected") => {
    try {
      await updateReq({ id: requestId, patch: { status, admin_notes: adminNote || null } }).unwrap();
      toast.success(status === "approved" ? "İstek onaylandı" : "İstek reddedildi");
      setSelectedId(null);
      setAdminNote("");
      refetch();
    } catch (e: any) {
      console.error("update error:", e);
      const statusCode = e?.status ?? 0;
      if (statusCode === 401 || statusCode === 403) {
        toast.error("Yetkisiz. Lütfen admin oturumun açık olduğundan emin ol.");
      } else {
        toast.error("İstek güncellenirken hata oluştu (500). Sunucu logunu kontrol et.");
      }
    }
  };

  return (
    <AdminLayout title="Bakiye Yükleme İstekleri">
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => setStatusFilter("all")}
          size="sm"
        >
          Tümü
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          onClick={() => setStatusFilter("pending")}
          size="sm"
        >
          Beklemede
        </Button>
        <Button
          variant={statusFilter === "approved" ? "default" : "outline"}
          onClick={() => setStatusFilter("approved")}
          size="sm"
        >
          Onaylandı
        </Button>
        <Button
          variant={statusFilter === "rejected" ? "default" : "outline"}
          onClick={() => setStatusFilter("rejected")}
          size="sm"
        >
          Reddedildi
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Yükleme İstekleri</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Ödeme Yöntemi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isFetching || isUsersLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Yükleniyor…</TableCell></TableRow>
              ) : pageItems.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">Henüz istek yok</TableCell></TableRow>
              ) : (
                pageItems.map((r) => {
                  const st = (r.status || "").toLowerCase();
                  const showActions = st !== "approved" && st !== "rejected";
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.user_full_name}</TableCell>
                      <TableCell>{money(r.amount)}</TableCell>
                      <TableCell>{r.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleString("tr-TR")}</TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={selectedId === r.id}
                          onOpenChange={(open) => {
                            if (open) { setSelectedId(r.id); setAdminNote(r.admin_notes ?? ""); }
                            else { setSelectedId(null); setAdminNote(""); }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </DialogTrigger>

                          {/* A11y: Description eklendi */}
                          <DialogContent aria-describedby="wdr-dialog-desc">
                            <DialogHeader>
                              <DialogTitle>İstek Detayları</DialogTitle>
                              <DialogDescription id="wdr-dialog-desc" className="sr-only">
                                Bakiye yükleme isteği detayları
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div><Label>Kullanıcı</Label><p className="text-sm">{r.user_full_name}</p></div>
                              <div><Label>Tutar</Label><p className="text-sm">{money(r.amount)}</p></div>
                              <div><Label>Ödeme Yöntemi</Label><p className="text-sm">{r.payment_method}</p></div>

                              {r.payment_proof && (
                                <div>
                                  <Label>Dekont</Label>
                                  <img src={r.payment_proof} alt="Dekont" className="mt-2 max-w-full rounded border" />
                                </div>
                              )}

                              <div>
                                <Label htmlFor="admin_note">Admin Notu</Label>
                                <Textarea
                                  id="admin_note"
                                  value={adminNote}
                                  onChange={(e) => setAdminNote(e.target.value)}
                                  rows={3}
                                />
                              </div>

                              {showActions && (
                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1"
                                    onClick={() => handleUpdateStatus(r.id, "approved")}
                                    disabled={isUpdating}
                                  >
                                    Onayla
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleUpdateStatus(r.id, "rejected")}
                                    disabled={isUpdating}
                                  >
                                    Reddet
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)); }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === p}
                  onClick={(e) => { e.preventDefault(); setCurrentPage(p); }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </AdminLayout>
  );
}
