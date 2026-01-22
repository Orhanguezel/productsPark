// =============================================================
// FILE: FooterSectionForm.tsx
// FINAL — footer.ts types compatible (no menu imports)
// =============================================================
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import type { FooterSection, UpsertFooterSectionBody } from '@/integrations/types';

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
  const [isActive, setIsActive] = React.useState<boolean>(initial?.is_active ?? true);

  React.useEffect(() => {
    setIsActive(initial?.is_active ?? true);
  }, [initial, open]);

  const titleInitial = initial?.title ?? '';
  const displayOrder = initial ? initial.display_order : defaultOrder;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const body: UpsertFooterSectionBody = {
      title: String(fd.get('title') ?? '').trim(),
      is_active: isActive,
      display_order: displayOrder,
      // links: intentionally NOT sent (menu_items manages links now)
    };

    await onSubmit(body);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Bölümü Düzenle' : 'Yeni Bölüm Ekle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Bölüm Adı</Label>
            <Input
              id="title"
              name="title"
              defaultValue={titleInitial}
              placeholder="Örn: Hızlı Erişim"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Aktif</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {initial ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
