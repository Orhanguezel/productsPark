import { useEffect, useState } from "react";
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

interface UserProfile {
  id: string;
  full_name: string | null;
  wallet_balance: number;
  is_active: boolean;
  created_at: string;
  email: string;
  role: string;
}

interface UserEditFormData {
  full_name: string;
  email: string;
  password: string;
  is_active: boolean;
}

interface Order {
  id: string;
  order_number: string;
  final_amount: number;
  status: string;
  created_at: string;
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
}

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState<"add" | "subtract">("add");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [editForm, setEditForm] = useState<UserEditFormData>({
    full_name: "",
    email: "",
    password: "",
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchUserData();
      fetchOrders();
      fetchTransactions();
      fetchTickets();
    }
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: profileData, error: profileError } = await metahub
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;

      const { data: roleData } = await metahub
        .from("user_roles")
        .select("role")
        .eq("user_id", id!)
        .maybeSingle();

      setUser({
        ...profileData,
        email: profileData.email || "N/A",
        role: roleData?.role || "user",
        wallet_balance: parseFloat(profileData.wallet_balance?.toString() || "0"),
      });

      setEditForm({
        full_name: profileData.full_name || "",
        email: profileData.email || "",
        password: "",
        is_active: profileData.is_active,
      });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      toast.error("Kullanıcı yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await metahub
        .from("orders")
        .select("id, order_number, final_amount, status, created_at")
        .eq("user_id", id!)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await metahub
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", id!)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await metahub
        .from("support_tickets")
        .select("*")
        .eq("user_id", id!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Update profile including email
      const { error: profileError } = await metahub
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          is_active: editForm.is_active,
        })
        .eq("id", id!);

      if (profileError) throw profileError;

      // Update password if provided
      if (editForm.password) {
        console.log("Updating password for user:", id);
        const { data: sessionData } = await metahub.auth.getSession();

        const { data: passwordData, error: invokeError } = await metahub.functions.invoke("update-user-password", {
          body: {
            userId: id!,
            password: editForm.password
          },
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`
          }
        });

        console.log("Password update response:", { passwordData, invokeError });

        if (invokeError) {
          console.error("Invoke error:", invokeError);
          throw invokeError;
        }

        if (passwordData?.error) {
          console.error("Function returned error:", passwordData.error);
          throw new Error(passwordData.error);
        }

        if (!passwordData?.success) {
          console.error("Function did not return success");
          throw new Error("Şifre güncellenemedi");
        }

        console.log("Password updated successfully");
      }

      toast.success("Kullanıcı güncellendi");
      setEditForm(prev => ({ ...prev, password: "" })); // Clear password field
      fetchUserData();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Kullanıcı güncellenirken hata oluştu: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!user || !balanceAmount || parseFloat(balanceAmount) <= 0) {
      toast.error("Geçerli bir miktar girin");
      return;
    }

    try {
      setSaving(true);
      const amount = parseFloat(balanceAmount);
      const transactionAmount = balanceType === "add" ? amount : -amount;
      const newBalance = user.wallet_balance + transactionAmount;

      if (newBalance < 0) {
        toast.error("Bakiye sıfırın altına düşemez");
        return;
      }

      // Update wallet balance
      const { error: balanceError } = await metahub
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", id!);

      if (balanceError) throw balanceError;

      // Create transaction record
      const { error: transactionError } = await metahub
        .from("wallet_transactions")
        .insert({
          user_id: id!,
          amount: transactionAmount,
          type: balanceType === "add" ? "deposit" : "withdrawal",
          description: balanceDescription || `Admin tarafından ${balanceType === "add" ? "eklendi" : "çıkarıldı"}`,
        });

      if (transactionError) throw transactionError;

      toast.success("Bakiye güncellendi");
      setBalanceAmount("");
      setBalanceDescription("");
      fetchUserData();
      fetchTransactions();
    } catch (error: any) {
      console.error("Error updating balance:", error);
      toast.error("Bakiye güncellenirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    try {
      setDeleting(true);

      const { error } = await metahub.functions.invoke("delete-user", {
        body: { userId: id },
      });

      if (error) throw error;

      toast.success("Kullanıcı başarıyla silindi");
      navigate("/admin/users");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Kullanıcı silinirken hata oluştu: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Kullanıcı Düzenle">
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="Kullanıcı Düzenle">
        <div className="flex items-center justify-center py-8">
          <p>Kullanıcı bulunamadı</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kullanıcı Düzenle">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Siliniyor..." : "Kullanıcıyı Sil"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kullanıcıyı Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Kullanıcının tüm verileri (profil, siparişler, destek talepleri vb.) kalıcı olarak silinecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Evet, Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profil Bilgileri</TabsTrigger>
            <TabsTrigger value="orders">Siparişler</TabsTrigger>
            <TabsTrigger value="wallet">Bakiye Geçmişi</TabsTrigger>
            <TabsTrigger value="tickets">Destek Talepleri</TabsTrigger>
          </TabsList>

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
                    <p className="text-xs text-muted-foreground">Şifreyi değiştirmek istemiyorsanız boş bırakın</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Admin" : "Kullanıcı"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Bakiye</Label>
                    <p className="text-2xl font-bold">₺{user.wallet_balance.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_active">Hesap Durumu</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={editForm.is_active}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                      />
                      <span>{editForm.is_active ? "Aktif" : "Pasif"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Kayıt Tarihi</Label>
                    <p>{new Date(user.created_at).toLocaleDateString("tr-TR")}</p>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bakiye Yönetimi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="balanceType">İşlem Tipi</Label>
                    <Select
                      value={balanceType}
                      onValueChange={(value: "add" | "subtract") => setBalanceType(value)}
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
                  disabled={saving || !balanceAmount}
                  variant={balanceType === "add" ? "default" : "destructive"}
                  className="w-full"
                >
                  {balanceType === "add" ? "Bakiye Ekle" : "Bakiye Çıkar"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

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
                        <TableCell colSpan={4} className="text-center py-4">
                          Sipariş bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          <TableCell>{order.order_number}</TableCell>
                          <TableCell>₺{parseFloat(order.final_amount.toString()).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge>
                              {order.status === "completed" ? "Tamamlandı" :
                                order.status === "pending" ? "Beklemede" :
                                  order.status === "processing" ? "İşleniyor" :
                                    order.status === "cancelled" ? "İptal Edildi" : order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString("tr-TR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle>Bakiye İşlemleri</CardTitle>
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
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          İşlem bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Badge>{transaction.type}</Badge>
                          </TableCell>
                          <TableCell
                            className={
                              transaction.type === "deposit" ? "text-green-600" : "text-red-600"
                            }
                          >
                            {transaction.type === "deposit" ? "+" : "-"}₺
                            {parseFloat(transaction.amount.toString()).toFixed(2)}
                          </TableCell>
                          <TableCell>{transaction.description || "-"}</TableCell>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleString("tr-TR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

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
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Destek talebi bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.subject}</TableCell>
                          <TableCell>
                            <Badge>
                              {ticket.status === "open" ? "Açık" :
                                ticket.status === "closed" ? "Kapalı" :
                                  ticket.status === "in_progress" ? "Devam Ediyor" : ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ticket.priority === "high" ? "destructive" : "secondary"}>
                              {ticket.priority === "high" ? "Yüksek" :
                                ticket.priority === "medium" ? "Orta" :
                                  ticket.priority === "low" ? "Düşük" : ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket.category || "-"}</TableCell>
                          <TableCell>
                            {new Date(ticket.created_at).toLocaleDateString("tr-TR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
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
