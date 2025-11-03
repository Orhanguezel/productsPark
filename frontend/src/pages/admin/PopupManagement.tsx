// =============================================================
// FILE: src/components/admin/PopupManagement.tsx (RTK sürümü)
// =============================================================
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  useListPopupsAdminQuery,
  useDeletePopupAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/popups_admin.endpoints";

const getFrequencyLabel = (frequency: string) => {
  const labels: Record<string, string> = {
    always: "Her Zaman",
    once: "Bir Kez",
    daily: "Günde Bir",
    weekly: "Haftada Bir",
  };
  return labels[frequency] || frequency;
};

const getPageLabel = (pages: string) => {
  const labels: Record<string, string> = {
    all: "Tüm Sayfalar",
    home: "Anasayfa",
    products: "Ürünler",
    categories: "Kategoriler",
  };
  return labels[pages] || pages;
};

function errMsg(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const d = (e as { data?: { error?: { message?: string } } }).data;
    if (d?.error?.message) return d.error.message;
  }
  return "Beklenmeyen bir hata oluştu.";
}

const PopupManagement = () => {
  const navigate = useNavigate();

  const { data: popups, isLoading, refetch } = useListPopupsAdminQuery();
  const [deletePopup, { isLoading: isDeleting }] = useDeletePopupAdminMutation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Popup Yönetimi</CardTitle>
        <Button onClick={() => navigate("/admin/popups/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Popup
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : (
          <div className="rounded-lg border">
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
                  popups.map((popup) => (
                    <TableRow key={popup.id}>
                      <TableCell>
                        <Badge variant="outline">{popup.priority ?? 0}</Badge>
                      </TableCell>

                      <TableCell>
                        {popup.image_url ? (
                          <img
                            src={popup.image_url}
                            alt={(popup as { image_alt?: string | null }).image_alt || popup.title || "popup"}
                            className="h-8 w-8 rounded object-cover border"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded border bg-muted" />
                        )}
                      </TableCell>

                      <TableCell className="font-medium">{popup.title}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {popup.coupon_code ? <Badge>{popup.coupon_code}</Badge> : "-"}
                      </TableCell>

                      <TableCell>{getFrequencyLabel(popup.display_frequency)}</TableCell>
                      <TableCell>{getPageLabel(popup.display_pages)}</TableCell>

                      <TableCell className="text-sm">
                        {popup.start_date && (
                          <div>Başlangıç: {format(new Date(popup.start_date), "dd.MM.yyyy")}</div>
                        )}
                        {popup.end_date && (
                          <div>Bitiş: {format(new Date(popup.end_date), "dd.MM.yyyy")}</div>
                        )}
                        {!popup.start_date && !popup.end_date && "-"}
                      </TableCell>

                      <TableCell>
                        <Badge variant={popup.is_active ? "default" : "secondary"}>
                          {popup.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/popups/edit/${popup.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isDeleting}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu popup kalıcı olarak silinecektir.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    try {
                                      await deletePopup(popup.id).unwrap();
                                      toast({ title: "Başarılı", description: "Popup silindi." });
                                      refetch();
                                    } catch (e: unknown) {
                                      toast({
                                        title: "Hata",
                                        description: errMsg(e),
                                        variant: "destructive",
                                      });
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
                    <TableCell colSpan={10} className="text-center py-8">
                      Henüz popup bulunmuyor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopupManagement;
