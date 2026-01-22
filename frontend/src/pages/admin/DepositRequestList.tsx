// =============================================================
// FILE: src/pages/admin/wallet/DepositRequestList.tsx
// FINAL — Wallet Deposit Requests (Admin)
// - Shows backend-provided user_full_name primarily (JOINed in BE)
// - Optional fallback to admin users list
// - NO debug text, NO id display
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';

import {
  useListWalletDepositRequestsAdminQuery,
  useUpdateWalletDepositRequestAdminMutation,
  useAdminListQuery,
} from '@/integrations/hooks';

import type {
  WalletDepositRequest,
  WalletDepositStatus,
  AdminUserView,
} from '@/integrations/types';

/* ---------------- helpers ---------------- */

const money = (v: number) => `${Number(v || 0).toLocaleString('tr-TR')} ₺`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (s: unknown) => typeof s === 'string' && UUID_RE.test(s);

type StatusFilter = 'all' | WalletDepositStatus;

type Row = WalletDepositRequest & {
  user_full_name?: string | null; // backend join
  user_email?: string | null; // backend join
};

type Obj = Record<string, unknown>;
const isObject = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

const pluckUsersArray = (res: unknown): AdminUserView[] => {
  if (Array.isArray(res)) return res as AdminUserView[];

  if (isObject(res)) {
    const o = res as Obj;
    const keys = ['data', 'items', 'rows', 'result', 'users'] as const;

    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v as AdminUserView[];
    }

    const data = o['data'];
    if (isObject(data)) {
      const d = data as Obj;
      for (const k of keys) {
        const v = d[k];
        if (Array.isArray(v)) return v as AdminUserView[];
      }
    }
  }

  return [];
};

const cleanLabel = (v: unknown): string => {
  const s = String(v ?? '').trim();
  return s;
};

export default function DepositRequestList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const {
    data: requestsRaw = [],
    isFetching,
    refetch,
  } = useListWalletDepositRequestsAdminQuery(
    statusFilter === 'all' ? { order: 'desc' } : { order: 'desc', status: statusFilter },
  );

  const requests = requestsRaw as Row[];

  const [updateReq, { isLoading: isUpdating }] = useUpdateWalletDepositRequestAdminMutation();

  // Optional fallback: only if backend didn't provide user_full_name
  const needUserFallback = useMemo(
    () => requests.some((r) => !cleanLabel(r.user_full_name)),
    [requests],
  );

  const userIds = useMemo(() => {
    if (!needUserFallback) return [];
    const ids = requests.map((r) => r.user_id).filter((x) => isUuid(x));
    return Array.from(new Set(ids));
  }, [requests, needUserFallback]);

  const { data: usersAllRaw, isFetching: isUsersLoading } = useAdminListQuery(
    userIds.length > 0 ? { limit: 200, offset: 0, sort: 'created_at', order: 'desc' } : undefined,
    { skip: userIds.length === 0 },
  );

  const usersAll = useMemo(() => pluckUsersArray(usersAllRaw), [usersAllRaw]);

  const userMap = useMemo(() => {
    const m = new Map<string, AdminUserView>();
    if (!usersAll.length || userIds.length === 0) return m;

    const need = new Set(userIds);
    for (const u of usersAll) {
      if (u?.id && need.has(u.id)) m.set(u.id, u);
    }
    return m;
  }, [usersAll, userIds]);

  const displayUser = (r: Row): string => {
    // 1) Backend join wins
    const joined = cleanLabel(r.user_full_name);
    if (joined) return joined;

    // 2) Fallback: admin users list
    const u = userMap.get(r.user_id);
    const full = cleanLabel((u as any)?.full_name);
    if (full) return full;

    const email = cleanLabel((u as any)?.email);
    if (email) return email;

    // 3) Last fallback: do NOT show id
    return 'Kullanıcı';
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const totalPages = Math.max(1, Math.ceil(requests.length / perPage));
  const pageItems = requests.slice((currentPage - 1) * perPage, currentPage * perPage);

  const getStatusBadge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Beklemede</Badge>;
      case 'approved':
        return <Badge variant="default">Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await updateReq({
        id: requestId,
        patch: { status, admin_notes: adminNote.trim() ? adminNote.trim() : null },
      }).unwrap();

      toast.success(status === 'approved' ? 'İstek onaylandı' : 'İstek reddedildi');
      setSelectedId(null);
      setAdminNote('');
      refetch();
    } catch (e: unknown) {
      console.error('update error:', e);
      const err = e as { status?: number; data?: { message?: string }; message?: string };
      const statusCode = err?.status ?? 0;

      if (statusCode === 401 || statusCode === 403) {
        toast.error('Yetkisiz. Lütfen admin oturumun açık olduğundan emin ol.');
      } else {
        toast.error(err?.data?.message || err?.message || 'İstek güncellenirken hata oluştu.');
      }
    }
  };

  const loading = isFetching || (needUserFallback && isUsersLoading);

  return (
    <AdminLayout title="Bakiye Yükleme İstekleri">
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
          size="sm"
        >
          Tümü
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('pending')}
          size="sm"
        >
          Beklemede
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('approved')}
          size="sm"
        >
          Onaylandı
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('rejected')}
          size="sm"
        >
          Reddedildi
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yükleme İstekleri</CardTitle>
        </CardHeader>

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Yükleniyor…
                  </TableCell>
                </TableRow>
              ) : pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Henüz istek yok
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((r) => {
                  const st = (r.status || '').toLowerCase();
                  const showActions = st !== 'approved' && st !== 'rejected';
                  const userLabel = displayUser(r);

                  return (
                    <TableRow key={r.id}>
                      <TableCell>{userLabel}</TableCell>
                      <TableCell>{money(r.amount)}</TableCell>
                      <TableCell>{r.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleString('tr-TR')}</TableCell>

                      <TableCell className="text-right">
                        <Dialog
                          open={selectedId === r.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setSelectedId(r.id);
                              setAdminNote(r.admin_notes ?? '');
                            } else {
                              setSelectedId(null);
                              setAdminNote('');
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="Detay">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>

                          <DialogContent aria-describedby="wdr-dialog-desc">
                            <DialogHeader>
                              <DialogTitle>İstek Detayları</DialogTitle>
                              <DialogDescription id="wdr-dialog-desc" className="sr-only">
                                Bakiye yükleme isteği detayları
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div>
                                <Label>Kullanıcı</Label>
                                <p className="text-sm">{userLabel}</p>
                              </div>

                              <div>
                                <Label>Tutar</Label>
                                <p className="text-sm">{money(r.amount)}</p>
                              </div>

                              <div>
                                <Label>Ödeme Yöntemi</Label>
                                <p className="text-sm">{r.payment_method}</p>
                              </div>

                              {r.payment_proof && (
                                <div>
                                  <Label>Dekont</Label>
                                  <img
                                    src={r.payment_proof}
                                    alt="Dekont"
                                    className="mt-2 max-w-full rounded border"
                                  />
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
                                    onClick={() => handleUpdateStatus(r.id, 'approved')}
                                    disabled={isUpdating}
                                  >
                                    Onayla
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleUpdateStatus(r.id, 'rejected')}
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
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === p}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(p);
                  }}
                >
                  {p}
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
    </AdminLayout>
  );
}
