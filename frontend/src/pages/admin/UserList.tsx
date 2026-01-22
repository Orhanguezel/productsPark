// =============================================================
// FILE: src/pages/admin/UserList.tsx
// FINAL — Users list (Admin)
// - AdminUserView.email is string | null => UIUser.email nullable
// - created_at nullable tolerant + safe date formatting
// - wallet_balance tolerant (missing -> 0)
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

import { useAdminListQuery } from '@/integrations/hooks';
import type { AdminUserView, UserRoleName } from '@/integrations/types';

/* ---------------- helpers ---------------- */

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number((v.replace?.(',', '.') ?? v).trim());
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const safeDateTR = (iso: string | null): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isFinite(d.valueOf()) ? d.toLocaleDateString('tr-TR') : '-';
};

// UI tipi (tabloda gösterilecek alanlar)
interface UIUser {
  id: string;
  email: string | null;
  full_name: string | null;
  wallet_balance: number;
  is_active: boolean;
  created_at: string | null;
  role: UserRoleName;
}

// rol önceliği
const ROLE_WEIGHT: Record<UserRoleName, number> = {
  admin: 3,
  moderator: 2,
  user: 1,
};

function pickPrimaryRole(roles: ReadonlyArray<string> | undefined | null): UserRoleName {
  if (!roles || roles.length === 0) return 'user';

  let best: UserRoleName = 'user';
  for (const r of roles) {
    const rr = String(r).toLowerCase() as UserRoleName;
    if (rr in ROLE_WEIGHT && ROLE_WEIGHT[rr] > ROLE_WEIGHT[best]) best = rr;
  }
  return best;
}

export default function UserList() {
  const navigate = useNavigate();

  const {
    data: adminData,
    isFetching,
    isError,
    error,
  } = useAdminListQuery({
    limit: 200,
    sort: 'created_at',
    order: 'desc',
  });

  // Hata durumlarını kullanıcıya göster
  useEffect(() => {
    if (!isError) return;
    const code = (error as { status?: number })?.status;
    if (code === 401) toast.error('Giriş yapmalısınız.');
    else if (code === 403) toast.error('Bu sayfayı görmek için yetkiniz (admin) yok.');
    else toast.error('Kullanıcılar yüklenirken hata oluştu.');
  }, [isError, error]);

  // Admin API'den gelen veriyi UI modeline map et
  const users: UIUser[] = useMemo(() => {
    const rows = Array.isArray(adminData) ? adminData : [];
    return rows.map(
      (u: AdminUserView): UIUser => ({
        id: u.id,
        email: u.email ?? null,
        full_name: u.full_name ?? null,
        wallet_balance: toNum((u as any).wallet_balance ?? 0),
        is_active: Boolean(u.is_active),
        created_at: u.created_at ?? null,
        role: pickPrimaryRole(u.roles ?? null),
      }),
    );
  }, [adminData]);

  // Arama + sayfalama
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const email = (u.email ?? '').toLowerCase();
      const name = (u.full_name ?? '').toLowerCase();
      return email.includes(q) || name.includes(q);
    });
  }, [users, searchTerm]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout title="Kullanıcı Yönetimi">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Email veya isim ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <p>Yükleniyor...</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'Belirtilmemiş'}
                      </TableCell>

                      <TableCell>{user.email || '-'}</TableCell>

                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin'
                            ? 'Admin'
                            : user.role === 'moderator'
                            ? 'Moderatör'
                            : 'Kullanıcı'}
                        </Badge>
                      </TableCell>

                      <TableCell>₺{user.wallet_balance.toFixed(2)}</TableCell>

                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>

                      <TableCell>{safeDateTR(user.created_at)}</TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Görüntüle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
