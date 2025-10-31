// =============================================================
// FILE: src/pages/admin/email-templates/EmailTemplateForm.tsx
// =============================================================
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  useGetEmailTemplateAdminByIdQuery,
  useCreateEmailTemplateAdminMutation,
  useUpdateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/email_templates_admin.endpoints";

type FormState = {
  key: string;
  name: string;
  subject: string;
  content_html: string;
  variables: string[];
  is_active: boolean;
  locale?: string | null;
};

const defaultTemplate: FormState = {
  key: "",
  name: "",
  subject: "",
  content_html: "",
  variables: [],
  is_active: true,
  locale: null,
};

export default function EmailTemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";

  const { data, isFetching } = useGetEmailTemplateAdminByIdQuery(id as string, {
    skip: !isEdit,
  });

  const [createTemplate, { isLoading: isCreating }] = useCreateEmailTemplateAdminMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateAdminMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteEmailTemplateAdminMutation();

  const [template, setTemplate] = useState<FormState>(defaultTemplate);
  const saving = isCreating || isUpdating;

  useEffect(() => {
    if (isEdit && data) {
      setTemplate({
        key: data.key,
        name: data.name,
        subject: data.subject,
        content_html: data.content_html,
        variables: data.variables,
        is_active: data.is_active,
        locale: data.locale ?? null,
      });
    } else if (!isEdit) {
      setTemplate(defaultTemplate);
    }
  }, [isEdit, data]);

  const canSave = useMemo(
    () => !!template.name && !!template.subject && !!template.content_html && (!isEdit ? !!template.key : true),
    [template, isEdit]
  );

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }
    try {
      if (isEdit) {
        await updateTemplate({
          id: id as string,
          body: {
            // BE alan adları
            template_name: template.name,
            subject: template.subject,
            content: template.content_html,
            variables: template.variables, // array göndermek OK
            is_active: template.is_active,
            locale: template.locale ?? null,
          },
        }).unwrap();
        toast.success("Şablon güncellendi");
      } else {
        await createTemplate({
          // BE alan adları
          template_key: template.key.toLowerCase().replace(/\s+/g, "_"),
          template_name: template.name,
          subject: template.subject,
          content: template.content_html,
          variables: template.variables,
          is_active: template.is_active,
          locale: template.locale ?? null,
        }).unwrap();
        toast.success("Şablon oluşturuldu");
      }
      navigate("/admin/email-templates");
    } catch (e) {
      console.error(e);
      toast.error("Şablon kaydedilirken hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    const ok = window.confirm("Bu şablonu silmek istediğinizden emin misiniz?");
    if (!ok) return;
    try {
      await deleteTemplate(id as string).unwrap();
      toast.success("Şablon silindi");
      navigate("/admin/email-templates");
    } catch (e) {
      console.error(e);
      toast.error("Şablon silinirken hata oluştu");
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <AdminLayout title={isEdit ? "Mail Şablonu Düzenle" : "Yeni Mail Şablonu"}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/email-templates")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </div>
          {isEdit && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Siliniyor..." : "Sil"}
            </Button>
          )}
        </div>

        {isEdit && isFetching ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Yükleniyor...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Şablon Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Şablon Adı *</Label>
                  <Input
                    id="name"
                    value={template.name}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    placeholder="Örn: Hoşgeldin Maili"
                  />
                </div>

                {!isEdit && (
                  <div className="space-y-2">
                    <Label htmlFor="key">Şablon Anahtarı *</Label>
                    <Input
                      id="key"
                      value={template.key}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          key: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                        })
                      }
                      placeholder="Örn: welcome"
                    />
                    <p className="text-xs text-muted-foreground">Kod içinde kullanılacak benzersiz anahtar</p>
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="subject">Mail Konusu *</Label>
                  <Input
                    id="subject"
                    value={template.subject}
                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                    placeholder="Örn: Hoş Geldiniz - {{site_name}}"
                  />
                  <p className="text-xs text-muted-foreground">Değişkenler için {'{{degisken_adi}}'} formatını kullanın</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="content">Mail İçeriği *</Label>
                  <div className="border rounded-md">
                    <ReactQuill
                      theme="snow"
                      value={template.content_html}
                      onChange={(value) => setTemplate({ ...template, content_html: value })}
                      modules={modules}
                      className="bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    HTML yazın. Değişkenler: {'{{user_name}}, {{site_name}}'} vb.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="variables">Kullanılabilir Değişkenler</Label>
                  <Input
                    id="variables"
                    value={template.variables.join(", ")}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        variables: e.target.value
                          .split(",")
                          .map((v) => v.trim())
                          .filter((v) => v.length > 0),
                      })
                    }
                    placeholder="user_name, user_email, site_name"
                  />
                  <p className="text-xs text-muted-foreground">Virgülle ayırın</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={template.is_active}
                      onCheckedChange={(checked) => setTemplate({ ...template, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => navigate("/admin/email-templates")}>
                  İptal
                </Button>
                <Button onClick={handleSave} disabled={saving || !canSave}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
