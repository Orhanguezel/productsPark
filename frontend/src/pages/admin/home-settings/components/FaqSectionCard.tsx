// =============================================================
// FILE: src/pages/admin/home-settings/FaqSectionCard.tsx
// =============================================================
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { HomeSettingsSectionProps } from "./types";

import {
  useListFaqsAdminQuery,
  useCreateFaqAdminMutation,
  useUpdateFaqAdminMutation,
  useRemoveFaqAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/faqs_admin.endpoints";
import type { Faq } from "@/integrations/metahub/rtk/types/faqs";
import { toast } from "sonner";

/** FE içinde kullanılacak lokal Faq modeli */
interface EditableFaq {
  id?: string;
  question: string;
  answer: string;
  slug: string;
  category?: string | null;
  is_active?: boolean;
  display_order?: number;
  _localId: string; // React key için
  _isNew?: boolean;
  _isDirty?: boolean;
}

/** Basit slug helper (Türkçe karakterleri normalize edecek kadar yeterli) */
const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const mapFaqToEditable = (faq: Faq): EditableFaq => ({
  id: faq.id,
  question: faq.question,
  answer: faq.answer,
  slug: faq.slug,
  category: faq.category ?? null,
  is_active: faq.is_active,
  display_order: faq.display_order,
  _localId: faq.id,
  _isNew: false,
  _isDirty: false,
});

export function FaqSectionCard({
  settings,
  onChange,
}: HomeSettingsSectionProps) {
  // ---- RTK: faqs listesi ----
  const {
    data: faqList = [],
    isLoading: isFaqLoading,
    isError: isFaqError,
  } = useListFaqsAdminQuery({
    // aktif filtresi verme -> tüm kayıtlar gelsin
    limit: 100,
    offset: 0,
    orderBy: "display_order",
    order: "asc",
  });

  const [createFaq, { isLoading: isCreating }] = useCreateFaqAdminMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqAdminMutation();
  const [removeFaq, { isLoading: isRemoving }] = useRemoveFaqAdminMutation();

  // Lokal editable state
  const [rows, setRows] = useState<EditableFaq[]>([]);

  // RTK'dan gelen listeyi lokalde hydrate et
  useEffect(() => {
    setRows(faqList.map(mapFaqToEditable));
  }, [faqList]);

  const handleItemChange = (
    localId: string,
    field: "question" | "answer" | "category" | "display_order",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row._localId === localId
          ? {
            ...row,
            [field]:
              field === "display_order" ? Number(value) || 0 : value,
            _isDirty: true,
          }
          : row
      )
    );
  };

  const handleAdd = () => {
    const nextOrder =
      rows.length > 0
        ? Math.max(
          ...rows
            .map((r) => r.display_order ?? 0)
            .filter((n) => Number.isFinite(n))
        ) + 1
        : 1;

    const localId = `new-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    setRows((prev) => [
      ...prev,
      {
        _localId: localId,
        _isNew: true,
        _isDirty: true,
        question: "",
        answer: "",
        slug: "",
        category: "Genel",
        is_active: true,
        display_order: nextOrder,
      },
    ]);
  };

  const handleSaveRow = async (row: EditableFaq) => {
    const question = row.question.trim();
    const answer = row.answer.trim();

    if (!question || !answer) {
      toast.error("Soru ve cevap boş olamaz.");
      return;
    }

    const slug = row.slug?.trim() || slugify(question);
    const category = row.category ?? "Genel";
    const display_order = row.display_order ?? 0;

    try {
      if (row._isNew) {
        await createFaq({
          question,
          answer,
          slug,
          category,
          is_active: true,
          display_order,
        }).unwrap();
        toast.success("SSS başarıyla oluşturuldu.");
      } else if (row.id) {
        await updateFaq({
          id: row.id,
          patch: {
            question,
            answer,
            slug,
            category,
            display_order,
          },
        }).unwrap();
        toast.success("SSS güncellendi.");
      }
      // invalidate + refetch ile liste yenilenecek, effect tekrar hydrate edecek
    } catch (err) {
      console.error("FAQ save error:", err);
      toast.error("SSS kaydedilirken hata oluştu.");
    }
  };

  /** Hard DELETE: kayıt tamamen silinir */
  const handleRemove = async (row: EditableFaq) => {
    // Henüz BE'ye gitmemiş yeni satır ise sadece lokalde kaldır
    if (row._isNew && !row.id) {
      setRows((prev) => prev.filter((r) => r._localId !== row._localId));
      return;
    }

    if (!row.id) return;

    if (
      !window.confirm(
        "Bu SSS kaydını kalıcı olarak silmek istiyor musunuz?"
      )
    ) {
      return;
    }

    try {
      await removeFaq(row.id).unwrap();

      // Optimistic: localden de çıkar
      setRows((prev) => prev.filter((r) => r._localId !== row._localId));

      toast.success("SSS kalıcı olarak silindi.");
    } catch (err) {
      console.error("FAQ remove error:", err);
      toast.error("SSS silinirken hata oluştu.");
    }
  };

  const isMutating = isCreating || isUpdating || isRemoving;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SSS Bölümü</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ---- Başlık / Alt Başlık (site_settings) ---- */}
        <div className="space-y-2">
          <Label>Başlık</Label>
          <Input
            value={settings.home_faq_title}
            onChange={(e) => onChange({ home_faq_title: e.target.value })}
            placeholder="Sıkça Sorulan Sorular"
          />
        </div>
        <div className="space-y-2">
          <Label>Alt Başlık</Label>
          <Input
            value={settings.home_faq_subtitle}
            onChange={(e) => onChange({ home_faq_subtitle: e.target.value })}
            placeholder="Merak ettiklerinizin cevaplarını burada bulabilirsiniz"
          />
        </div>

        {/* ---- CTA alanları (site_settings) ---- */}
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium">CTA Bölümü</h4>
          <div className="space-y-2">
            <Label>CTA Başlık</Label>
            <Input
              value={settings.home_faq_cta_title}
              onChange={(e) =>
                onChange({ home_faq_cta_title: e.target.value })
              }
              placeholder="Başka sorunuz mu var?"
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Alt Yazı</Label>
            <Input
              value={settings.home_faq_cta_subtitle}
              onChange={(e) =>
                onChange({ home_faq_cta_subtitle: e.target.value })
              }
              placeholder="Destek ekibimiz size yardımcı olmak için hazır"
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Buton Yazısı</Label>
            <Input
              value={settings.home_faq_cta_button}
              onChange={(e) =>
                onChange({ home_faq_cta_button: e.target.value })
              }
              placeholder="Bize Ulaşın →"
            />
          </div>
        </div>

        {/* ---- SSS CRUD (RTK /admin/faqs) ---- */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">SSS Kayıtları (DB)</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
            >
              + SSS Ekle
            </Button>
          </div>

          {isFaqLoading && (
            <p className="text-sm text-muted-foreground">
              SSS kayıtları yükleniyor...
            </p>
          )}

          {isFaqError && (
            <p className="text-sm text-destructive">
              SSS kayıtları yüklenirken hata oluştu.
            </p>
          )}

          {!isFaqLoading && !rows.length && (
            <p className="text-sm text-muted-foreground">
              Henüz SSS kaydı bulunmuyor. Yukarıdaki butonla yeni kayıt
              ekleyebilirsiniz.
            </p>
          )}

          {rows.map((faq) => (
            <div
              key={faq._localId}
              className="p-4 border rounded-lg space-y-3 bg-muted/40"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Soru</Label>
                  <Input
                    value={faq.question}
                    onChange={(e) =>
                      handleItemChange(
                        faq._localId,
                        "question",
                        e.target.value
                      )
                    }
                    placeholder="Soru girin"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kategori (isteğe bağlı)</Label>
                  <Input
                    value={faq.category ?? ""}
                    onChange={(e) =>
                      handleItemChange(
                        faq._localId,
                        "category",
                        e.target.value
                      )
                    }
                    placeholder="Örn: Genel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cevap</Label>
                <Textarea
                  value={faq.answer}
                  onChange={(e) =>
                    handleItemChange(
                      faq._localId,
                      "answer",
                      e.target.value
                    )
                  }
                  placeholder="Cevap girin"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                <div className="space-y-2 max-w-[200px]">
                  <Label>Sıra</Label>
                  <Input
                    type="number"
                    value={faq.display_order ?? 0}
                    onChange={(e) =>
                      handleItemChange(
                        faq._localId,
                        "display_order",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isMutating || !faq._isDirty}
                    onClick={() => handleSaveRow(faq)}
                  >
                    Kaydet
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => handleRemove(faq)}
                  >
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
