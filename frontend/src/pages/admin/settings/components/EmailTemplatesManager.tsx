// =============================================================
// FILE: src/components/admin/settings/EmailTemplatesManager.tsx
// =============================================================
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

import type { EmailTemplateAdminView } from '@/integrations/types';
import {
  useListEmailTemplatesAdminQuery,
  useCreateEmailTemplateAdminMutation,
  useUpdateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
} from "@/integrations/hooks";

type FormState = {
  template_name: string;
  template_key: string;
  subject: string;
  content: string;        // HTML/body
  variables: string[];
  is_active: boolean;
};

const emptyForm: FormState = {
  template_name: "",
  template_key: "",
  subject: "",
  content: "",
  variables: [],
  is_active: true,
};

export default function EmailTemplatesManager() {
  // List
  const { data: templates = [], isLoading } = useListEmailTemplatesAdminQuery();

  // CRUD mutations
  const [createTemplate, { isLoading: creating }] = useCreateEmailTemplateAdminMutation();
  const [updateTemplate, { isLoading: updating }] = useUpdateEmailTemplateAdminMutation();
  const [deleteTemplate, { isLoading: deleting }] = useDeleteEmailTemplateAdminMutation();

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<EmailTemplateAdminView | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name)),
    [templates]
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShow(true);
  }

  function openEdit(t: EmailTemplateAdminView) {
    setEditing(t);
    setForm({
      template_name: t.name,
      template_key: t.key,                // edit modunda değiştirilmeyecek
      subject: t.subject,
      content: t.content_html ?? "",
      variables: Array.isArray(t.variables) ? t.variables : [],
      is_active: !!t.is_active,
    });
    setShow(true);
  }

  async function handleSave() {
    if (!form.template_name || !form.subject || !form.content) {
      toast.error("Lütfen gerekli alanları doldurun");
      return;
    }

    try {
      if (editing) {
        await updateTemplate({
          id: editing.id,
          body: {
            // BE alan adları:
            template_name: form.template_name,
            subject: form.subject,
            content: form.content,
            variables: form.variables,
            is_active: form.is_active,
          },
        }).unwrap();
        toast.success("Şablon güncellendi");
      } else {
        if (!form.template_key) {
          toast.error("Şablon anahtarı zorunludur");
          return;
        }
        await createTemplate({
          template_key: form.template_key,
          template_name: form.template_name,
          subject: form.subject,
          content: form.content,
          variables: form.variables,
          is_active: form.is_active,
        }).unwrap();
        toast.success("Şablon oluşturuldu");
      }

      setShow(false); // invalidatesTags sayesinde liste otomatik tazelenecek
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string }; message?: string })?.data?.message ||
        (e as { message?: string })?.message ||
        "Şablon kaydedilemedi";
      toast.error(msg);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Silinsin mi?")) return;
    try {
      await deleteTemplate(id).unwrap();
      toast.success("Şablon silindi");
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string }; message?: string })?.data?.message ||
        (e as { message?: string })?.message ||
        "Şablon silinemedi";
      toast.error(msg);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mail Şablonları</CardTitle>
          <Button onClick={openNew} disabled={isLoading || creating || updating || deleting}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Şablon
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-6 text-sm text-muted-foreground">Yükleniyor…</div>
        ) : sortedTemplates.length === 0 ? (
          <div className="py-6 text-sm text-muted-foreground">Henüz şablon yok.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Anahtar</TableHead>
                <TableHead>Konu</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTemplates.map((t) => (
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Şablonu Düzenle" : "Yeni Şablon"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Şablon Adı *</Label>
              <Input
                value={form.template_name}
                onChange={(e) => setForm((f) => ({ ...f, template_name: e.target.value }))}
              />
            </div>

            {!editing && (
              <div className="space-y-2">
                <Label>Şablon Anahtarı *</Label>
                <Input
                  value={form.template_key}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      template_key: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                    }))
                  }
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Mail Konusu *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Mail İçeriği *</Label>
              <Textarea
                rows={8}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="font-mono text-sm"
                placeholder="HTML içeriği (ör. <p>Merhaba {{user_name}}</p>)"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Kullanılabilir Değişkenler</Label>
              <Input
                value={form.variables.join(", ")}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    variables: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="user_name, user_email, site_name"
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label>Aktif</Label>
            </div>

            <div className="flex justify-end md:col-span-2">
              <Button onClick={handleSave} disabled={creating || updating}>
                <Save className="w-4 h-4 mr-2" />
                {creating || updating ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
