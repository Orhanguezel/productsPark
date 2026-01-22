// =============================================================
// FILE: src/pages/admin/email-templates/EmailTemplateList.tsx
// =============================================================
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Mail, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import {
  useListEmailTemplatesAdminQuery,
  useDeleteEmailTemplateAdminMutation,
} from "@/integrations/hooks";

import type { EmailTemplateAdminView } from '@/integrations/types';

export default function EmailTemplateList() {
  const navigate = useNavigate();

  const { data, isFetching, isError, error } = useListEmailTemplatesAdminQuery();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteEmailTemplateAdminMutation();

  useEffect(() => {
    if (isError) {
      const status = (error as { status?: number })?.status;
      toast.error(`Mail şablonları yüklenirken hata oluştu${status ? ` (HTTP ${status})` : ""}.`);
    }
  }, [isError, error]);

  const templates: EmailTemplateAdminView[] = data ?? [];

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Bu şablonu silmek istediğinizden emin misiniz?");
    if (!ok) return;
    try {
      await deleteTemplate(id).unwrap();
      toast.success("Şablon silindi");
    } catch (e) {
      console.error(e);
      toast.error("Şablon silinirken hata oluştu");
    }
  };

  return (
    <AdminLayout title="Mail Şablonları">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Mail Şablonları</h2>
            <p className="text-muted-foreground">Sistem mail şablonlarını yönetin</p>
          </div>
          <Button onClick={() => navigate("/admin/email-templates/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Şablon
          </Button>
        </div>

        {isFetching ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Yükleniyor...</p>
            </CardContent>
          </Card>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Henüz mail şablonu bulunmuyor</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Tüm Şablonlar</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şablon Adı</TableHead>
                    <TableHead>Anahtar</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-xs">{t.key}</code>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{t.subject}</TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? "default" : "secondary"}>
                          {t.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/email-templates/${t.id}`)}
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(t.id)}
                          disabled={isDeleting}
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
