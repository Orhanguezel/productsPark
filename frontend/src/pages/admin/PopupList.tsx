// =============================================================
// FILE: src/pages/admin/popups/PopupList.tsx
// =============================================================
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useListPopupsAdminQuery,
  useDeletePopupAdminMutation,
  useListProductsAdminQuery,
  useListCouponsAdminQuery,
} from "@/integrations/hooks";


function getFrequencyLabel(frequency: string) {
  const m: Record<string, string> = {
    always: "Her Zaman",
    once: "Bir Kez",
    daily: "Günde Bir",
    weekly: "Haftada Bir",
  };
  return m[frequency] || frequency;
}

function getPageLabel(pages: string) {
  const m: Record<string, string> = {
    all: "Tüm Sayfalar",
    home: "Anasayfa",
    products: "Ürünler",
    categories: "Kategoriler",
  };
  return m[pages] || pages;
}

function errMsg(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const d = (e as { data?: { error?: { message?: string } } }).data;
    if (d?.error?.message) return d.error.message;
  }
  return "Beklenmeyen bir hata oluştu.";
}

export default function PopupList() {
  const navigate = useNavigate();
  const { data: popups, isLoading, refetch } = useListPopupsAdminQuery();
  const [deletePopup] = useDeletePopupAdminMutation();

  // Ürün/kupon map (listeyi isimle göstermek için)
  const { data: products = [] } = useListProductsAdminQuery({ limit: 500, offset: 0 });
  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

  const { data: coupons = [] } = useListCouponsAdminQuery({ limit: 500, offset: 0 });
  const couponMap = Object.fromEntries(coupons.map(c => [c.code, c] as const));

  return (
    <AdminLayout title="Popup Yönetimi">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Popup Yönetimi</h1>
          <Button onClick={() => navigate("/admin/popups/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Popup
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : (
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Görsel</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Kupon</TableHead>
                  <TableHead>Görünüm</TableHead>
                  <TableHead>Sayfalar</TableHead>
                  <TableHead>Tarih Aralığı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popups && popups.length > 0 ? (
                  popups.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Badge variant="outline">{p.priority ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={(p as { image_alt?: string | null }).image_alt || p.title || "popup"}
                            className="h-8 w-8 rounded object-cover border"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded border bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>
                        {p.product_id ? (productMap[p.product_id] || `#${p.product_id}`) : "-"}
                      </TableCell>
                      <TableCell>
                        {p.coupon_code
                          ? <Badge>{couponMap[p.coupon_code]?.code || p.coupon_code}</Badge>
                          : "-"}
                      </TableCell>
                      <TableCell>{getFrequencyLabel(p.display_frequency)}</TableCell>
                      <TableCell>{getPageLabel(p.display_pages)}</TableCell>
                      <TableCell className="text-sm">
                        {p.start_date && <div>Başlangıç: {format(new Date(p.start_date), "dd.MM.yyyy")}</div>}
                        {p.end_date && <div>Bitiş: {format(new Date(p.end_date), "dd.MM.yyyy")}</div>}
                        {!p.start_date && !p.end_date && "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? "default" : "secondary"}>
                          {p.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/popups/edit/${p.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>Bu popup kalıcı olarak silinecektir.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    try {
                                      await deletePopup(p.id).unwrap();
                                      toast({ title: "Silindi", description: "Popup silindi." });
                                      refetch();
                                    } catch (e: unknown) {
                                      toast({ title: "Hata", description: errMsg(e), variant: "destructive" });
                                    }
                                  }}
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">Henüz popup bulunmuyor.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
