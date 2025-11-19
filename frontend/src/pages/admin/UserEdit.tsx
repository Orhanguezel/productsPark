// src/pages/admin/users/UserEdit.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";

// RTK hooks (admin & auth)
import {
  useDeleteUserAdminMutation,
  useGetUserAdminQuery,
  useSetUserRolesAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";
import { useStatusQuery } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
import {
  useAdjustUserWalletMutation,
  useListWalletTransactionsQuery, // ✅ admin wallet txns
} from "@/integrations/metahub/rtk/endpoints/wallet.endpoints";

import type { WalletTransaction } from "@/integrations/metahub/db/types/wallet";

type RoleName = "admin" | "moderator" | "user";

type UserProfile = {
  id: string;
  full_name: string | null;
  wallet_balance: number;
  is_active: boolean;
  created_at: string;
  email: string;
  role: RoleName;
};

type UserEditFormData = {
  full_name: string;
  email: string;
  password: string;
  is_active: boolean;
};

type Order = {
  id: string;
  order_number: string;
  final_amount: number | string;
  status: string;
  created_at: string;
};

type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
};

/* -------- helpers -------- */
const toNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace?.(",", ".") ?? v);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const ROLE_WEIGHT: Record<RoleName, number> = {
  admin: 3,
  moderator: 2,
  user: 1,
};
const toRoleName = (x: unknown): RoleName | null => {
  const s = String(x ?? "").toLowerCase();
  return s === "admin" || s === "moderator" || s === "user"
    ? (s as RoleName)
    : null;
};
function pickPrimaryRole(roles?: unknown): RoleName {
  let arr: RoleName[] = [];
  if (Array.isArray(roles)) {
    arr = roles.map(toRoleName).filter(Boolean) as RoleName[];
  } else if (typeof roles === "string" && roles.trim()) {
    try {
      const parsed = JSON.parse(roles);
      if (Array.isArray(parsed))
        arr = parsed.map(toRoleName).filter(Boolean) as RoleName[];
      else {
        const single = toRoleName(parsed);
        if (single) arr = [single];
      }
    } catch {
      const single = toRoleName(roles);
      if (single) arr = [single];
    }
  }
  if (arr.length === 0) return "user";
  let best: RoleName = "user";
  for (const r of arr) if (ROLE_WEIGHT[r] > ROLE_WEIGHT[best]) best = r;
  return best;
}

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  // oturum bilgisi -> self-delete & self-demote guard
  const { data: status } = useStatusQuery();
  const meId = status?.user?.id ?? null;

  // admin endpointten (RLS yok) kullanıcıyı çek
  const {
    data: adminUser,
    isFetching: adminFetching,
    isError: adminError,
    refetch: refetchAdmin,
  } = useGetUserAdminQuery(id ?? "", { skip: !id });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState<"add" | "subtract">("add");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [adjustWallet, { isLoading: adjusting }] = useAdjustUserWalletMutation();

  const [deleteUserAdmin] = useDeleteUserAdminMutation();
  const [setUserRolesAdmin, { isLoading: rolesSaving }] =
    useSetUserRolesAdminMutation();

  const [editForm, setEditForm] = useState<UserEditFormData>({
    full_name: "",
    email: "",
    password: "",
    is_active: true,
  });

  // Rol yönetimi UI state
  const [selectedRole, setSelectedRole] = useState<RoleName>("user");

  // ✅ Admin wallet transactions (RTK) — tüm bakiye & geçmiş buradan
  const {
    data: walletTxns = [],
    isLoading: walletTxLoading,
  } = useListWalletTransactionsQuery(
    id
      ? {
          user_id: id,
          order: "desc",
          // limit: 200, // istersen limit ekleyebilirsin
        }
      : undefined,
    {
      skip: !id,
    }
  );

  // admin endpoint verisini UI modeline yaz
  useEffect(() => {
    if (!adminUser) return;
    const primaryRole = pickPrimaryRole(adminUser.roles as unknown);

    // BE'den gelen wallet_balance alanını oku; yoksa 0 göster
    const walletBalance = toNum((adminUser as any).wallet_balance ?? 0);

    const normalized: UserProfile = {
      id: adminUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
      wallet_balance: walletBalance,
      is_active: adminUser.is_active,
      created_at: adminUser.created_at,
      role: primaryRole,
    };
    setUser(normalized);
    setSelectedRole(primaryRole);
    setEditForm({
      full_name: normalized.full_name ?? "",
      email: normalized.email ?? "",
      password: "",
      is_active: normalized.is_active,
    });
  }, [adminUser]);

  // Diğer tablolar (orders + tickets) — Supabase direkt
  useEffect(() => {
    if (!id) return;

    const fetchOrders = async () => {
      try {
        const { data, error } = await metahub
          .from("orders")
          .select("id, order_number, final_amount, status, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        setOrders((data ?? []) as Order[]);
      } catch {
        toast.error("Siparişler yüklenirken hata oluştu");
      }
    };

    const fetchTickets = async () => {
      try {
        const { data, error } = await metahub
          .from("support_tickets")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setTickets((data ?? []) as SupportTicket[]);
      } catch {
        toast.error("Destek talepleri yüklenirken hata oluştu");
      }
    };

    void fetchOrders();
    void fetchTickets();
  }, [id]);

  // ✅ Bakiye: txn toplamından hesapla, backend ile uyuşmuyorsa tx'ni göster
  const computedFromTxns = useMemo(
    () => walletTxns.reduce((sum, t) => sum + toNum(t.amount), 0),
    [walletTxns]
  );
  const backendBalance = user?.wallet_balance ?? 0;
  const displayBalance =
    Math.abs(backendBalance - computedFromTxns) > 0.009
      ? computedFromTxns
      : backendBalance;

  const handleSave = async () => {
    if (!user || !id) return;
    try {
      setSaving(true);

      const { error: profileError } = await metahub
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          is_active: editForm.is_active ? 1 : 0,
        })
        .eq("id", id);
      if (profileError) throw profileError;

      if (editForm.password) {
        const { data: pwRes, error: invokeError } =
          await metahub.functions.invoke("update-user-password", {
            body: { userId: id, password: editForm.password },
          });
        if (invokeError) throw invokeError;
        if (!(pwRes as any)?.success) throw new Error("Şifre güncellenemedi");
      }

      toast.success("Kullanıcı güncellendi");
      setEditForm((p) => ({ ...p, password: "" }));
      await refetchAdmin();
    } catch (err: any) {
      console.error(err);
      toast.error("Kullanıcı güncellenirken hata: " + (err?.message ?? ""));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleSave = async () => {
    if (!user || !id) return;

    if (meId === user.id && selectedRole !== "admin") {
      toast.error("Kendi rolünüzü admin dışına düşüremezsiniz.");
      setSelectedRole(user.role);
      return;
    }

    try {
      await setUserRolesAdmin({ id, roles: [selectedRole] }).unwrap();
      toast.success("Rol güncellendi");
      await refetchAdmin();
    } catch (err: any) {
      console.error(err);
      toast.error(
        "Rol güncellenemedi: " +
          (err?.data?.message || err?.message || "")
      );
    }
  };

  const handleBalanceUpdate = async () => {
    if (!user || !id || !balanceAmount || toNum(balanceAmount) <= 0) {
      toast.error("Geçerli bir miktar girin");
      return;
    }
    try {
      setSaving(true);
      const amount = toNum(balanceAmount);
      const delta = balanceType === "add" ? amount : -amount;

      const res = await adjustWallet({
        id,
        amount: delta,
        description:
          balanceDescription ||
          `Admin tarafından ${
            balanceType === "add" ? "eklendi" : "çıkarıldı"
          }`,
      }).unwrap();

      // ✅ Güncel bakiye state'e yaz (BE değerini sakla)
      setUser((u) => (u ? { ...u, wallet_balance: res.balance } : u));

      toast.success(`Bakiye güncellendi: ₺${res.balance.toFixed(2)}`);
      setBalanceAmount("");
      setBalanceDescription("");
      await refetchAdmin();
      // NOT: adjustUserWallet invalidatesTags → walletTxns otomatik refetch
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.data?.message || "Bakiye güncellenirken hata oluştu"
      );
    } finally {
      setSaving(false);
    }
  };

  const isSelf = meId && user ? meId === user.id : false;

  const handleDeleteUser = async () => {
    if (!user) return;
    if (isSelf) {
      toast.error("Kendi hesabınızı silemezsiniz.");
      return;
    }
    try {
      setDeleting(true);
      await deleteUserAdmin({ id: user.id }).unwrap();
      toast.success("Kullanıcı başarıyla silindi");
      navigate("/admin/users");
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast.error(
        "Kullanıcı silinirken hata: " +
          (err?.data?.message || err?.message || "")
      );
    } finally {
      setDeleting(false);
    }
  };

  if (adminFetching || !user) {
    return (
      <AdminLayout title="Kullanıcı Düzenle">
        <div className="flex items-center justify-center py-8">
          <p>{adminError ? "Kullanıcı bulunamadı" : "Yükleniyor..."}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kullanıcı Düzenle">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleting || isSelf}
                title={
                  isSelf ? "Kendi hesabınızı silemezsiniz" : undefined
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isSelf
                  ? "Kendi hesabın"
                  : deleting
                  ? "Siliniyor..."
                  : "Kullanıcıyı Sil"}
              </Button>
            </AlertDialogTrigger>
            {!isSelf && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Kullanıcıyı Silmek İstediğinize Emin Misiniz?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Kullanıcının tüm verileri kalıcı
                    olarak silinecektir.
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
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          full_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Yeni Şifre (boş bırakılabilir)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={editForm.password}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          password: e.target.value,
                        })
                      }
                      placeholder="Şifreyi değiştirmek için girin"
                    />
                    <p className="text-xs text-muted-foreground">
                      Şifreyi değiştirmek istemiyorsanız boş bırakın
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Mevcut Rol</Label>
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {user.role === "admin"
                        ? "Admin"
                        : user.role === "moderator"
                        ? "Moderatör"
                        : "Kullanıcı"}
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
                      <span>
                        {editForm.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Kayıt Tarihi</Label>
                    <p>
                      {new Date(
                        user.created_at
                      ).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
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
                      onValueChange={(v) =>
                        setSelectedRole(v as RoleName)
                      }
                    >
                      <SelectTrigger id="roleSelect">
                        <SelectValue placeholder="Rol seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">
                          Moderatör
                        </SelectItem>
                        <SelectItem value="user">
                          Kullanıcı
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {meId === user.id && selectedRole !== "admin" && (
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
                      rolesSaving ||
                      user.role === selectedRole ||
                      (meId === user.id && selectedRole !== "admin")
                    }
                  >
                    {rolesSaving
                      ? "Rol Kaydediliyor..."
                      : "Rolü Kaydet"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRole(user.role)}
                    disabled={rolesSaving || selectedRole === user.role}
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
                    <p className="text-2xl font-bold">
                      ₺{displayBalance.toFixed(2)}
                    </p>
                    {walletTxLoading && (
                      <p className="text-xs text-muted-foreground">
                        Bakiye hesaplanıyor…
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balanceType">İşlem Tipi</Label>
                    <Select
                      value={balanceType}
                      onValueChange={(v) =>
                        setBalanceType(v as "add" | "subtract")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Bakiye Ekle</SelectItem>
                        <SelectItem value="subtract">
                          Bakiye Çıkar
                        </SelectItem>
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
                      onChange={(e) =>
                        setBalanceAmount(e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balanceDescription">
                    Açıklama (Opsiyonel)
                  </Label>
                  <Input
                    id="balanceDescription"
                    placeholder="İşlem açıklaması"
                    value={balanceDescription}
                    onChange={(e) =>
                      setBalanceDescription(e.target.value)
                    }
                  />
                </div>

                <Button
                  onClick={handleBalanceUpdate}
                  disabled={saving || adjusting || !balanceAmount}
                  variant={
                    balanceType === "add" ? "default" : "destructive"
                  }
                  className="w-full"
                >
                  {adjusting
                    ? "İşleniyor..."
                    : balanceType === "add"
                    ? "Bakiye Ekle"
                    : "Bakiye Çıkar"}
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
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4"
                        >
                          Sipariş bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((o) => (
                        <TableRow
                          key={o.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            navigate(`/admin/orders/${o.id}`)
                          }
                        >
                          <TableCell>{o.order_number}</TableCell>
                          <TableCell>
                            ₺{toNum(o.final_amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge>
                              {o.status === "completed"
                                ? "Tamamlandı"
                                : o.status === "pending"
                                ? "Beklemede"
                                : o.status === "processing"
                                ? "İşleniyor"
                                : o.status === "cancelled"
                                ? "İptal Edildi"
                                : o.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              o.created_at
                            ).toLocaleDateString("tr-TR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------- BAKİYE GECMİŞİ TAB ---------- */}
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bakiye İşlemleri</CardTitle>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Mevcut Bakiye
                    </p>
                    <p className="text-lg font-semibold">
                      ₺{displayBalance.toFixed(2)}
                    </p>
                    {walletTxLoading && (
                      <p className="text-[11px] text-muted-foreground">
                        Bakiye hesaplanıyor…
                      </p>
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
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground"
                        >
                          İşlemler yükleniyor…
                        </TableCell>
                      </TableRow>
                    ) : walletTxns.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4"
                        >
                          İşlem bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      walletTxns.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Badge>{t.type}</Badge>
                          </TableCell>
                          <TableCell
                            className={
                              t.amount > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {t.amount > 0 ? "+" : "-"}₺
                            {toNum(t.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{t.description || "-"}</TableCell>
                          <TableCell>
                            {new Date(
                              t.created_at
                            ).toLocaleString("tr-TR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------- DESTEK TALEPLERI TAB ---------- */}
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
                      <TableHead className="text-right">
                        İşlemler
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-4"
                        >
                          Destek talebi bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            {t.subject}
                          </TableCell>
                          <TableCell>
                            <Badge>
                              {t.status === "open"
                                ? "Açık"
                                : t.status === "closed"
                                ? "Kapalı"
                                : t.status === "in_progress"
                                ? "Devam Ediyor"
                                : t.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                t.priority === "high"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {t.priority === "high"
                                ? "Yüksek"
                                : t.priority === "medium"
                                ? "Orta"
                                : t.priority === "low"
                                ? "Düşük"
                                : t.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{t.category || "-"}</TableCell>
                          <TableCell>
                            {new Date(
                              t.created_at
                            ).toLocaleDateString("tr-TR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/admin/tickets/${t.id}`)
                              }
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
