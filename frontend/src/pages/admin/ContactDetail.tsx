// =============================================================
// FILE: src/pages/admin/contacts/ContactDetail.tsx
// =============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";

import {
  useGetContactAdminQuery,
  useUpdateContactAdminMutation,
  useRemoveContactAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/contacts_admin.endpoints";

import type {
  ContactView,
  ContactUpdateInput,
  ContactStatus,
} from "@/integrations/metahub/db/types/contacts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Save, CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "sonner";

/* ------------ Form tipi (sadece admin alanları) ------------ */
type FormState = {
  status: ContactStatus | "";
  is_resolved: boolean;
  admin_note: string;
};

const initialState: FormState = {
  status: "",
  is_resolved: false,
  admin_note: "",
};

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: contact,
    isFetching,
    isError,
  } = useGetContactAdminQuery(id as string, {
    skip: !id,
  });

  const [updateContact, { isLoading: updating }] =
    useUpdateContactAdminMutation();
  const [removeContact, { isLoading: deleting }] =
    useRemoveContactAdminMutation();

  const [formData, setFormData] = useState<FormState>(initialState);

  // ---- helper: field update ----
  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ---- contact geldiğinde formu doldur ----
  useEffect(() => {
    if (!contact) return;

    setFormData({
      status: contact.status ?? "new",
      is_resolved: contact.is_resolved ?? false,
      admin_note: contact.admin_note ?? "",
    });
  }, [contact]);

  // ---- Submit (durum / not güncelle) ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const patch: ContactUpdateInput = {
        ...(formData.status ? { status: formData.status } : {}),
        is_resolved: formData.is_resolved,
        admin_note: formData.admin_note || null,
      };

      await updateContact({ id, patch }).unwrap();
      toast.success("Mesaj bilgileri güncellendi.");
    } catch (err) {
      console.error(err);
      toast.error("Mesaj güncellenirken bir hata oluştu.");
    }
  };

  // ---- Silme ----
  const handleDelete = async () => {
    if (!id) return;

    if (
      !confirm(
        "Bu iletişim mesajını silmek istediğinizden emin misiniz?",
      )
    ) {
      return;
    }

    try {
      await removeContact(id).unwrap();
      toast.success("Mesaj silindi.");
      navigate("/admin/contacts");
    } catch (err) {
      console.error(err);
      toast.error("Mesaj silinirken bir hata oluştu.");
    }
  };

  // ---- Gösterim için yardımcı alanlar ----
  const displayName = (c: ContactView | undefined): string =>
    c?.name || "—";

  const displayEmail = (c: ContactView | undefined): string =>
    c?.email || "—";

  const displayPhone = (c: ContactView | undefined): string =>
    c?.phone || "—";

  const displaySubject = (c: ContactView | undefined): string =>
    c?.subject || "—";

  const displayMessage = (c: ContactView | undefined): string =>
    c?.message || "—";

  const createdAt = contact?.created_at
    ? new Date(contact.created_at).toLocaleString("tr-TR")
    : "—";

  const statusLabel: string =
    formData.status || contact?.status || "—";

  const loading = isFetching || updating || deleting;

  if (isFetching) {
    return (
      <AdminLayout title="İletişim Mesajı">
        <div>Yükleniyor...</div>
      </AdminLayout>
    );
  }

  if (isError || !contact) {
    return (
      <AdminLayout title="İletişim Mesajı">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/contacts")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <p className="text-sm text-destructive">
            Mesaj bulunamadı veya yüklenirken bir hata oluştu.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="İletişim Mesajı">
      <div className="space-y-6">
        {/* Üst bar: geri + sil */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/contacts")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div className="text-sm text-muted-foreground">
              Mesaj ID: <span className="font-mono">{contact.id}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Mesajı Sil
          </Button>
        </div>

        {/* 2 sütunlu layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* SOL: Kullanıcı mesajı */}
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Gönderilen Mesaj</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Kimden / Mail / Telefon */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Gönderen</Label>
                  <div className="rounded border bg-muted/30 px-3 py-2 text-sm break-words overflow-wrap:anywhere">
                    {displayName(contact)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>E-posta</Label>
                  <div className="rounded border bg-muted/30 px-3 py-2 text-sm break-words overflow-wrap:anywhere">
                    {displayEmail(contact)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Telefon</Label>
                  <div className="rounded border bg-muted/30 px-3 py-2 text-sm break-words overflow-wrap:anywhere">
                    {displayPhone(contact)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Oluşturulma Tarihi</Label>
                  <div className="inline-flex items-center gap-2 rounded border bg-muted/30 px-3 py-2 text-sm">
                    <Clock3 className="w-4 h-4 text-muted-foreground" />
                    <span>{createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Konu</Label>
                <div className="rounded border bg-muted/30 px-3 py-2 text-sm break-words overflow-wrap:anywhere">
                  {displaySubject(contact)}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Mesaj</Label>
                <div className="rounded border bg-background px-3 py-3 text-sm leading-relaxed max-h-[360px] overflow-auto break-words overflow-wrap:anywhere">
                  {displayMessage(contact)}
                </div>
              </div>

              {/* IP / User Agent / Website (opsiyonel gösterim) */}
              {contact.ip && (
                <div className="space-y-1">
                  <Label>IP Adresi</Label>
                  <div className="rounded border bg-muted/30 px-3 py-2 text-xs font-mono break-all">
                    {contact.ip}
                  </div>
                </div>
              )}

              {contact.user_agent && (
                <div className="space-y-1">
                  <Label>User Agent</Label>
                  <div className="rounded border bg-muted/30 px-3 py-2 text-xs break-words overflow-wrap:anywhere">
                    {contact.user_agent}
                  </div>
                </div>
              )}

              {contact.website && (
                <div className="space-y-1">
                  <Label>Website (honeypot)</Label>
                  <div className="rounded border bg-muted/30 px-3 py-2 text-xs break-all">
                    {contact.website}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SAĞ: Admin alanı */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Yönetim</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Durum + Çözüldü */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Durum</Label>
                    <Input
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        updateField(
                          "status",
                          e.target.value as ContactStatus | "",
                        )
                      }
                      placeholder="Örn: new, in_progress, closed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Backend&apos;deki <code>status</code> alanı ile
                      eşleşir. Boş bırakabilirsiniz.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_resolved"
                        checked={formData.is_resolved}
                        onCheckedChange={(checked) =>
                          updateField("is_resolved", checked)
                        }
                      />
                      <Label htmlFor="is_resolved">
                        Çözüldü olarak işaretle
                      </Label>
                    </div>

                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                        (formData.is_resolved
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300")
                      }
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {formData.is_resolved ? "Çözüldü" : "Beklemede"}
                    </span>
                  </div>
                </div>

                {/* Admin notu */}
                <div className="space-y-2">
                  <Label htmlFor="admin_note">
                    İç Not / Açıklama (sadece admin için)
                  </Label>
                  <Textarea
                    id="admin_note"
                    rows={5}
                    value={formData.admin_note}
                    onChange={(e) =>
                      updateField("admin_note", e.target.value)
                    }
                    placeholder="Müşteriyle telefonla görüşüldü, tekrar dönüş yapılacak..."
                  />
                </div>

                {/* Özet durum */}
                <div className="rounded border bg-muted/30 px-3 py-3 text-xs space-y-1">
                  <div>
                    <span className="font-semibold">Görünür Durum:</span>{" "}
                    {statusLabel}
                  </div>
                  <div>
                    <span className="font-semibold">Çözüldü:</span>{" "}
                    {formData.is_resolved ? "Evet" : "Hayır"}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/contacts")}
                  >
                    Geri
                  </Button>
                  <Button
                    type="submit"
                    className="gradient-primary"
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
