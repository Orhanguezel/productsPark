// =============================================================
// FILE: src/pages/admin/users/UserEdit.tsx
// FINAL — User Edit (Admin)
// - Wallet Admin endpoints: /admin/wallet/* (via RTK wallet.admin.endpoints.ts)
// - Safer balance display: prefer backend balance; fallback to computed if backend missing
// - strict-ish helpers, no risky casts beyond unavoidable UI integration
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import {
  useAdminGetQuery,
  useAdminUpdateUserMutation,
  useAdminSetRolesMutation,
  useAdminSetPasswordMutation,
  useAdminRemoveUserMutation,

  // wallet admin (aliased exports)
  useAdjustUserWalletMutation,
  useListWalletTransactionsQuery,
  useStatusQuery,
  useListOrdersAdminQuery,
  useListSupportTicketsAdminQuery,
} from '@/integrations/hooks';

import type { AdminUserView, WalletTransaction, SupportTicket } from '@/integrations/types';

/* ----------------------------- helpers ----------------------------- */

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const s = v.trim();
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : 0;
};

type RoleName = 'admin' | 'moderator' | 'user';

type UserProfile = {
  id: string;
  full_name: string | null;
  wallet_balance: number | null; // nullable to detect "missing"
  is_active: boolean;
  created_at: string | null;
  email: string | null;
  role: RoleName;
};

type UserEditFormData = {
  full_name: string;
  email: string;
  password: string;
  is_active: boolean;
};

const ROLE_WEIGHT: Record<RoleName, number> = { admin: 3, moderator: 2, user: 1 };

const toRoleName = (x: unknown): RoleName | null => {
  const s = String(x ?? '').toLowerCase();
  return s === 'admin' || s === 'moderator' || s === 'user' ? (s as RoleName) : null;
};

function pickPrimaryRole(roles?: unknown): RoleName {
  let arr: RoleName[] = [];

  if (Array.isArray(roles)) {
    arr = roles.map(toRoleName).filter(Boolean) as RoleName[];
  } else if (typeof roles === 'string' && roles.trim()) {
    try {
      const parsed: unknown = JSON.parse(roles);
      if (Array.isArray(parsed)) arr = parsed.map(toRoleName).filter(Boolean) as RoleName[];
      else {
        const single = toRoleName(parsed);
        if (single) arr = [single];
      }
    } catch {
      const single = toRoleName(roles);
      if (single) arr = [single];
    }
  }

  if (!arr.length) return 'user';

  let best: RoleName = 'user';
  for (const r of arr) if (ROLE_WEIGHT[r] > ROLE_WEIGHT[best]) best = r;
  return best;
}

function safeDateTR(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isFinite(d.valueOf()) ? d.toLocaleDateString('tr-TR') : '-';
}

function safeDateTimeTR(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isFinite(d.valueOf()) ? d.toLocaleString('tr-TR') : '-';
}

/* ----------------------------- component ----------------------------- */

export default function UserEdit() {
  const { id } = useParams();
  const userId = typeof id === 'string' && id.trim() ? id.trim() : '';
  const navigate = useNavigate();

  // session -> self guard
  const { data: status } = useStatusQuery();
  const meId = status?.user?.id ?? null;

  // admin user
  const {
    data: adminUser,
    isFetching: adminFetching,
    isError: adminError,
    refetch: refetchAdmin,
  } = useAdminGetQuery({ id: userId }, { skip: !userId });

  const [user, setUser] = useState<UserProfile | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'add' | 'subtract'>('add');
  const [balanceDescription, setBalanceDescription] = useState('');

  const [adjustWallet, { isLoading: adjusting }] = useAdjustUserWalletMutation();

  const [removeUser, { isLoading: removing }] = useAdminRemoveUserMutation();
  const [setRoles, { isLoading: rolesSaving }] = useAdminSetRolesMutation();
  const [updateUser, { isLoading: updatingUser }] = useAdminUpdateUserMutation();
  const [setPassword, { isLoading: passwordSaving }] = useAdminSetPasswordMutation();

  const [editForm, setEditForm] = useState<UserEditFormData>({
    full_name: '',
    email: '',
    password: '',
    is_active: true,
  });

  const [selectedRole, setSelectedRole] = useState<RoleName>('user');

  // wallet txns (admin)
  const { data: walletTxns = [], isLoading: walletTxLoading } = useListWalletTransactionsQuery(
    userId ? { user_id: userId, order: 'desc' } : undefined,
    { skip: !userId },
  );

  // orders
  const { data: orders = [], isLoading: ordersLoading } = useListOrdersAdminQuery(
    userId ? { user_id: userId, limit: 10, sort: 'created_at', order: 'desc' } : undefined,
    { skip: !userId },
  );

  // tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useListSupportTicketsAdminQuery(
    userId ? { user_id: userId, limit: 50, sort: 'created_at', order: 'desc' } : undefined,
    { skip: !userId },
  );

  // normalize admin user -> UI
  useEffect(() => {
    if (!adminUser) return;

    const au = adminUser as AdminUserView;
    const primaryRole = pickPrimaryRole((au as any).roles);

    // wallet_balance could be missing/null depending on backend view
    const rawBal = (au as any).wallet_balance;
    const wallet_balance = rawBal === null || typeof rawBal === 'undefined' ? null : toNum(rawBal);

    const normalized: UserProfile = {
      id: String(au.id ?? userId),
      email: au.email ?? null,
      full_name: au.full_name ?? null,
      wallet_balance,
      is_active: !!au.is_active,
      created_at: au.created_at ?? null,
      role: primaryRole,
    };

    setUser(normalized);
    setSelectedRole(primaryRole);

    setEditForm({
      full_name: normalized.full_name ?? '',
      email: normalized.email ?? '',
      password: '',
      is_active: normalized.is_active,
    });
  }, [adminUser, userId]);

  // computed balance from txns (fallback only)
  const computedFromTxns = useMemo(() => {
    return walletTxns.reduce((sum: number, t: WalletTransaction) => sum + toNum(t.amount), 0);
  }, [walletTxns]);

  // ✅ Prefer backend balance if present; fallback to computed
  const displayBalance = useMemo(() => {
    const backend = user?.wallet_balance;
    if (typeof backend === 'number' && Number.isFinite(backend)) return backend;
    return computedFromTxns;
  }, [user?.wallet_balance, computedFromTxns]);

  const isSelf = !!(meId && user && meId === user.id);

  const handleSave = async () => {
    if (!user || !userId) return;

    try {
      setSaving(true);

      const emailOrNull = editForm.email.trim() ? editForm.email.trim() : null;

      await updateUser({
        id: userId,
        full_name: editForm.full_name.trim() ? editForm.full_name.trim() : null,
        email: emailOrNull,
        is_active: !!editForm.is_active,
      } as any).unwrap();

      if (editForm.password.trim()) {
        await setPassword({ id: userId, password: editForm.password.trim() }).unwrap();
      }

      toast.success('Kullanıcı güncellendi');
      setEditForm((p) => ({ ...p, password: '' }));
      await refetchAdmin();
    } catch (err: any) {
      console.error(err);
      toast.error('Kullanıcı güncellenirken hata: ' + (err?.data?.message || err?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleSave = async () => {
    if (!user || !userId) return;

    if (isSelf && selectedRole !== 'admin') {
      toast.error('Kendi rolünüzü admin dışına düşüremezsiniz.');
      setSelectedRole(user.role);
      return;
    }

    try {
      await setRoles({ id: userId, roles: [selectedRole] }).unwrap();
      toast.success('Rol güncellendi');
      await refetchAdmin();
    } catch (err: any) {
      console.error(err);
      toast.error('Rol güncellenemedi: ' + (err?.data?.message || err?.message || ''));
    }
  };

  const handleBalanceUpdate = async () => {
    if (!user || !userId) return;

    const amt = toNum(balanceAmount);
    if (!amt || amt <= 0) {
      toast.error('Geçerli bir miktar girin');
      return;
    }

    try {
      setSaving(true);

      const delta = balanceType === 'add' ? amt : -amt;

      const res = await adjustWallet({
        id: userId,
        amount: delta,
        description:
          balanceDescription.trim() ||
          `Admin tarafından ${balanceType === 'add' ? 'eklendi' : 'çıkarıldı'}`,
      }).unwrap();

      const nextBal = toNum((res as any).balance);
      setUser((u) => (u ? { ...u, wallet_balance: nextBal } : u));

      toast.success(`Bakiye güncellendi: ₺${nextBal.toFixed(2)}`);
      setBalanceAmount('');
      setBalanceDescription('');
      await refetchAdmin();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || err?.message || 'Bakiye güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    if (isSelf) {
      toast.error('Kendi hesabınızı silemezsiniz.');
      return;
    }

    try {
      setDeleting(true);
      await removeUser({ id: user.id }).unwrap();
      toast.success('Kullanıcı başarıyla silindi');
      navigate('/admin/users');
    } catch (err: any) {
      console.error(err);
      toast.error('Kullanıcı silinirken hata: ' + (err?.data?.message || err?.message || ''));
    } finally {
      setDeleting(false);
    }
  };

  const busy =
    adminFetching ||
    saving ||
    updatingUser ||
    passwordSaving ||
    rolesSaving ||
    deleting ||
    removing;

  if (adminFetching || !user) {
    return (
      <AdminLayout title="Kullanıcı Düzenle">
        <div className="flex items-center justify-center py-8">
          <p>{adminError ? 'Kullanıcı bulunamadı' : 'Yükleniyor...'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kullanıcı Düzenle">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={busy || isSelf}
                title={isSelf ? 'Kendi hesabınızı silemezsiniz' : undefined}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isSelf ? 'Kendi hesabın' : deleting ? 'Siliniyor...' : 'Kullanıcıyı Sil'}
              </Button>
            </AlertDialogTrigger>

            {!isSelf && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kullanıcıyı Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Kullanıcının tüm verileri kalıcı olarak silinecektir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteUser}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Evet, Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            )}
          </AlertDialog>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profil Bilgileri</TabsTrigger>
            <TabsTrigger value="orders">Siparişler</TabsTrigger>
            <TabsTrigger value="wallet">Bakiye Geçmişi</TabsTrigger>
            <TabsTrigger value="tickets">Destek Talepleri</TabsTrigger>
          </TabsList>

          {/* ---------- PROFIL TAB ---------- */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Bilgileri</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Ad Soyad</Label>
                    <Input
                      id="full_name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                    {!editForm.email.trim() && (
                      <p className="text-xs text-muted-foreground">
                        Boş ise kaydederken null gönderilir.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Yeni Şifre (boş bırakılabilir)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Şifreyi değiştirmek için girin"
                    />
                    <p className="text-xs text-muted-foreground">
                      Şifreyi değiştirmek istemiyorsanız boş bırakın
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Mevcut Rol</Label>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'moderator'
                          ? 'Moderatör'
                          : 'Kullanıcı'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_active">Hesap Durumu</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={editForm.is_active}
                        onCheckedChange={(checked) =>
                          setEditForm({ ...editForm, is_active: checked })
                        }
                      />
                      <span>{editForm.is_active ? 'Aktif' : 'Pasif'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Kayıt Tarihi</Label>
                    <p>{safeDateTR(user.created_at)}</p>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={busy}>
                  <Save className="mr-2 h-4 w-4" />
                  {busy ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </CardContent>
            </Card>

            {/* ROL YÖNETİMİ */}
            <Card>
              <CardHeader>
                <CardTitle>Rol Yönetimi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleSelect">Rol Seç</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(v) => setSelectedRole(v as RoleName)}
                    >
                      <SelectTrigger id="roleSelect">
                        <SelectValue placeholder="Rol seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderatör</SelectItem>
                        <SelectItem value="user">Kullanıcı</SelectItem>
                      </SelectContent>
                    </Select>

                    {isSelf && selectedRole !== 'admin' && (
                      <p className="text-xs text-red-600">
                        Kendi rolünüzü admin dışına düşüremezsiniz.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRoleSave}
                    disabled={
                      busy || user.role === selectedRole || (isSelf && selectedRole !== 'admin')
                    }
                  >
                    {rolesSaving ? 'Rol Kaydediliyor...' : 'Rolü Kaydet'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setSelectedRole(user.role)}
                    disabled={busy || selectedRole === user.role}
                  >
                    Sıfırla
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* BAKİYE YÖNETİMİ */}
            <Card>
              <CardHeader>
                <CardTitle>Bakiye Yönetimi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mevcut Bakiye</Label>
                    <p className="text-2xl font-bold">₺{displayBalance.toFixed(2)}</p>
                    {walletTxLoading && (
                      <p className="text-xs text-muted-foreground">İşlemler yükleniyor…</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balanceType">İşlem Tipi</Label>
                    <Select
                      value={balanceType}
                      onValueChange={(v) => setBalanceType(v as 'add' | 'subtract')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Bakiye Ekle</SelectItem>
                        <SelectItem value="subtract">Bakiye Çıkar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balanceAmount">Miktar (₺)</Label>
                    <Input
                      id="balanceAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balanceDescription">Açıklama (Opsiyonel)</Label>
                  <Input
                    id="balanceDescription"
                    placeholder="İşlem açıklaması"
                    value={balanceDescription}
                    onChange={(e) => setBalanceDescription(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleBalanceUpdate}
                  disabled={busy || adjusting || !balanceAmount}
                  variant={balanceType === 'add' ? 'default' : 'destructive'}
                  className="w-full"
                >
                  {adjusting
                    ? 'İşleniyor...'
                    : balanceType === 'add'
                      ? 'Bakiye Ekle'
                      : 'Bakiye Çıkar'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------- SIPARISLER TAB ---------- */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Son Siparişler</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Tarih</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {ordersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Siparişler yükleniyor…
                        </TableCell>
                      </TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          Sipariş bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((o: any) => (
                        <TableRow
                          key={o.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/orders/${o.id}`)}
                        >
                          <TableCell>{o.order_number}</TableCell>
                          <TableCell>₺{toNum(o.final_amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge>
                              {o.status === 'completed'
                                ? 'Tamamlandı'
                                : o.status === 'pending'
                                  ? 'Beklemede'
                                  : o.status === 'processing'
                                    ? 'İşleniyor'
                                    : o.status === 'cancelled'
                                      ? 'İptal Edildi'
                                      : String(o.status ?? '-')}
                            </Badge>
                          </TableCell>
                          <TableCell>{safeDateTR(o.created_at ?? null)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------- WALLET TAB ---------- */}
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bakiye İşlemleri</CardTitle>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Mevcut Bakiye</p>
                    <p className="text-lg font-semibold">₺{displayBalance.toFixed(2)}</p>
                    {walletTxLoading && (
                      <p className="text-[11px] text-muted-foreground">İşlemler yükleniyor…</p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tip</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Tarih</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {walletTxLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          İşlemler yükleniyor…
                        </TableCell>
                      </TableRow>
                    ) : walletTxns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          İşlem bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      walletTxns.map((t: WalletTransaction) => {
                        const amt = toNum(t.amount);
                        return (
                          <TableRow key={t.id}>
                            <TableCell>
                              <Badge>{String((t as any).type ?? '-')}</Badge>
                            </TableCell>
                            <TableCell className={amt > 0 ? 'text-green-600' : 'text-red-600'}>
                              {amt > 0 ? '+' : '-'}₺{Math.abs(amt).toFixed(2)}
                            </TableCell>
                            <TableCell>{(t as any).description || '-'}</TableCell>
                            <TableCell>{safeDateTimeTR((t as any).created_at ?? null)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------- TICKETS TAB ---------- */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Destek Talepleri</CardTitle>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Konu</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Öncelik</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {ticketsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          Destek talepleri yükleniyor…
                        </TableCell>
                      </TableRow>
                    ) : tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Destek talebi bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      (tickets as SupportTicket[]).map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.subject}</TableCell>
                          <TableCell>
                            <Badge>
                              {t.status === 'open'
                                ? 'Açık'
                                : t.status === 'closed'
                                  ? 'Kapalı'
                                  : t.status === 'in_progress'
                                    ? 'Devam Ediyor'
                                    : t.status === 'waiting_response'
                                      ? 'Yanıt Bekliyor'
                                      : String(t.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                t.priority === 'high' || t.priority === 'urgent'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {t.priority === 'urgent'
                                ? 'Acil'
                                : t.priority === 'high'
                                  ? 'Yüksek'
                                  : t.priority === 'medium'
                                    ? 'Orta'
                                    : t.priority === 'low'
                                      ? 'Düşük'
                                      : String(t.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>{t.category || '-'}</TableCell>
                          <TableCell>{safeDateTR(t.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/tickets/${t.id}`)}
                            >
                              Detay
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
