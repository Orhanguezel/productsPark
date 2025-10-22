import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { metahub } from "@/integrations/metahub/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PopupManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: popups, isLoading } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: async () => {
      const { data, error } = await metahub
        .from("popups")
        .select("*, products(name)")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await metahub.from("popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      toast({
        title: "Başarılı",
        description: "Popup başarıyla silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Popup silinirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });

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
                        <Badge variant="outline">{popup.priority}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{popup.title}</TableCell>
                      <TableCell>
                        {popup.products?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {popup.coupon_code ? (
                          <Badge>{popup.coupon_code}</Badge>
                        ) : (
                          "-"
                        )}
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
                        <Badge
                          variant={popup.is_active ? "default" : "secondary"}
                        >
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
                              <Button variant="ghost" size="icon">
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
                                  onClick={() => deleteMutation.mutate(popup.id)}
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
                    <TableCell colSpan={9} className="text-center py-8">
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
