import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { metahub } from "@/integrations/metahub/client";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface EmailTemplate {
  template_key: string;
  template_name: string;
  subject: string;
  content: string;
  variables: string[];
  is_active: boolean;
}

const defaultTemplate: EmailTemplate = {
  template_key: "",
  template_name: "",
  subject: "",
  content: "",
  variables: [],
  is_active: true,
};

export default function EmailTemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<EmailTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && id !== "new") {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        const variables = Array.isArray(data.variables)
          ? data.variables.filter((v): v is string => typeof v === 'string')
          : [];

        setTemplate({
          template_key: data.template_key,
          template_name: data.template_name,
          subject: data.subject,
          content: data.content,
          variables,
          is_active: data.is_active,
        });
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      toast.error("Şablon yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template.template_name || !template.subject || !template.content) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    try {
      setSaving(true);

      if (id && id !== "new") {
        const { error } = await metahub
          .from("email_templates")
          .update({
            template_name: template.template_name,
            subject: template.subject,
            content: template.content,
            variables: template.variables,
            is_active: template.is_active,
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("Şablon güncellendi");
      } else {
        const { error } = await metahub.from("email_templates").insert({
          template_key: template.template_key,
          template_name: template.template_name,
          subject: template.subject,
          content: template.content,
          variables: template.variables,
          is_active: template.is_active,
        });

        if (error) throw error;
        toast.success("Şablon oluşturuldu");
      }

      navigate("/admin/email-templates");
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error("Şablon kaydedilirken hata oluştu: " + error.message);
    } finally {
      setSaving(false);
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
    <AdminLayout
      title={id && id !== "new" ? "Mail Şablonu Düzenle" : "Yeni Mail Şablonu"}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/email-templates")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        {loading ? (
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
                  <Label htmlFor="template_name">Şablon Adı *</Label>
                  <Input
                    id="template_name"
                    value={template.template_name}
                    onChange={(e) =>
                      setTemplate({ ...template, template_name: e.target.value })
                    }
                    placeholder="Örn: Hoşgeldin Maili"
                  />
                </div>

                {(!id || id === "new") && (
                  <div className="space-y-2">
                    <Label htmlFor="template_key">Şablon Anahtarı *</Label>
                    <Input
                      id="template_key"
                      value={template.template_key}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          template_key: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                        })
                      }
                      placeholder="Örn: welcome"
                    />
                    <p className="text-xs text-muted-foreground">
                      Kod içinde kullanılacak benzersiz anahtar
                    </p>
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="subject">Mail Konusu *</Label>
                  <Input
                    id="subject"
                    value={template.subject}
                    onChange={(e) =>
                      setTemplate({ ...template, subject: e.target.value })
                    }
                    placeholder="Örn: Hoş Geldiniz - {'{'}{'{'site_name}'}'}'"
                  />
                  <p className="text-xs text-muted-foreground">
                    Değişkenler için {'{{değişken_adı}}'} formatını kullanın
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="content">Mail İçeriği *</Label>
                  <div className="border rounded-md">
                    <ReactQuill
                      theme="snow"
                      value={template.content}
                      onChange={(value) => setTemplate({ ...template, content: value })}
                      modules={modules}
                      className="bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    HTML formatında yazabilirsiniz. Değişkenler: {'{{user_name}}, {{site_name}}'} vb.
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
                          .filter((v) => v),
                      })
                    }
                    placeholder="user_name, user_email, site_name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Virgülle ayırarak yazın
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={template.is_active}
                      onCheckedChange={(checked) =>
                        setTemplate({ ...template, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pasif şablonlar mail gönderiminde kullanılmaz
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => navigate("/admin/email-templates")}>
                  İptal
                </Button>
                <Button onClick={handleSave} disabled={saving}>
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
