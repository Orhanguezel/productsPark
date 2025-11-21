// =============================================================
// FILE: src/pages/admin/DeleteUserOrders.tsx
// =============================================================
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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
import { useDeleteUserOrdersMutation } from "@/integrations/metahub/rtk/endpoints/functions.endpoints";

export default function DeleteUserOrders() {
  const [email, setEmail] = useState("kececimelih@gmail.com");

  const [deleteUserOrders, { isLoading: isDeleting }] =
    useDeleteUserOrdersMutation();

  const handleDelete = async () => {
    if (!email) {
      toast.error("Lütfen bir e-posta adresi girin");
      return;
    }

    try {
      const res = await deleteUserOrders({ email }).unwrap();

      if (res.success) {
        toast.success(res.message || "Siparişler başarıyla silindi");
        setEmail("");
      } else {
        toast.error(res.error || "Bir hata oluştu");
      }
    } catch (error: any) {
      console.error("Error deleting orders:", error);
      toast.error(
        error?.message || "Siparişler silinirken bir hata oluştu"
      );
    }
  };

  return (
    <AdminLayout title="Kullanıcı Siparişlerini Sil">
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Siparişlerini Sil</CardTitle>
          <CardDescription>
            Bir kullanıcıya ait tüm siparişleri ve sipariş öğelerini kalıcı
            olarak silin. Bu işlem geri alınamaz!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Kullanıcı E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="kullanici@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!email || isDeleting}
                className="w-full"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Tüm Siparişleri Sil
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{email}</strong> adresine sahip kullanıcının tüm
                  siparişleri silinecek. Bu işlem geri alınamaz ve tüm
                  sipariş verileri kalıcı olarak kaybolacak.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Evet, Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
