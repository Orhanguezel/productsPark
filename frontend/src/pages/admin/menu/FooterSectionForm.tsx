// =============================================================
// FILE: FooterSectionForm.tsx
// =============================================================
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  FooterSection,
  UpsertFooterSectionBody,
} from "@/integrations/metahub/db/types/footer";

type Props = {
  open: boolean;
  loading: boolean;
  initial?: FooterSection | null;
  defaultOrder: number;
  onClose: () => void;
  onSubmit: (body: UpsertFooterSectionBody) => Promise<void>;
};

export default function FooterSectionForm({
  open,
  loading,
  initial,
  defaultOrder,
  onClose,
  onSubmit,
}: Props) {
  const [isActive, setIsActive] = useState<boolean>(
    initial?.is_active ?? true,
  );

  useEffect(() => {
    setIsActive(initial?.is_active ?? true);
  }, [initial, open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const body: UpsertFooterSectionBody = {
      title: String(fd.get("title") ?? ""),
      is_active: isActive,
      // create’de defaultOrder, edit’te mevcut sırayı koru
      display_order: initial ? initial.display_order : defaultOrder,
      // ❌ links gönderme – artık footer linkleri menu_items üzerinden yönetiliyor
    } as UpsertFooterSectionBody;

    await onSubmit(body);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial ? "Bölümü Düzenle" : "Yeni Bölüm Ekle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Bölüm Adı</Label>
            <Input
              name="title"
              defaultValue={initial?.title ?? ""}
              placeholder="Örn: Hızlı Erişim"
              required
            />
          </div>

          <input
            type="hidden"
            name="is_active"
            value={isActive ? "on" : ""}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label>Aktif</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {initial ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
