// src/pages/admin/fake-orders/index.tsx
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useListFakeOrderNotificationsQuery,
  useDeleteFakeOrderNotificationMutation,
} from "@/integrations/metahub/rtk/endpoints/fake_notifications.endpoints";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function FakeOrdersPage() {
  const nav = useNavigate();
  const { data = [], isLoading } = useListFakeOrderNotificationsQuery({ order: "created_at.desc" });
  const [del, { isLoading: deleting }] = useDeleteFakeOrderNotificationMutation();
  const [busy, setBusy] = useState<string | null>(null);

  const onDelete = async (id: string) => {
    if (!confirm("Silinsin mi?")) return;
    setBusy(id);
    try {
      await del(id).unwrap();
      toast.success("Silindi");
    } catch (e) {
      console.error(e);
      toast.error("Silme başarısız");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout title="Fake Sipariş Bildirimleri">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste</CardTitle>
          <Button onClick={() => nav("/admin/fake-orders/new")}><Plus className="w-4 h-4 mr-2" />Yeni</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? "Yükleniyor..." : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Konum</TableHead>
                  <TableHead>Zaman</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.product_name}</TableCell>
                    <TableCell>{r.customer}</TableCell>
                    <TableCell>{r.location ?? "-"}</TableCell>
                    <TableCell>{r.time_ago}</TableCell>
                    <TableCell>{r.is_active ? "Evet" : "Hayır"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => nav(`/admin/fake-orders/${r.id}`)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(r.id)} disabled={busy === r.id || deleting}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
