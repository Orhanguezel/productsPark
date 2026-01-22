// =============================================================
// FILE: HeaderMenuForm.tsx
// FINAL — menu_item.ts compatible (MenuItem + UpsertMenuItemBody)
// - Controlled shadcn Select (no name/defaultValue misuse)
// - exactOptionalPropertyTypes safe
// =============================================================
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import type { MenuItem, MenuItemType, UpsertMenuItemBody } from '@/integrations/types';
import { availableIcons, type IconName } from './icons';

type Page = { id: string; title: string; slug: string };

export type HeaderMenuFormProps = {
  open: boolean;
  loading: boolean;
  pages: Page[];

  /** edit için MenuItem (normalized) gelir */
  initial?: MenuItem | null;

  onClose: () => void;

  /** Form sadece UpsertMenuItemBody üretir; create’de display_order parent’ta set edilir */
  onSubmit: (payload: UpsertMenuItemBody) => Promise<void>;

  selectedItem?: MenuItem | null;
  defaultOrder: number; // UI’da hidden göstermek istersen var, create’de parent kullanır
};

function isIconName(v: unknown): v is IconName {
  return typeof v === 'string' && availableIcons.some((i) => i.name === v);
}

export default function HeaderMenuForm({
  open,
  loading,
  pages,
  initial,
  onClose,
  onSubmit,
  selectedItem,
}: HeaderMenuFormProps) {
  // ---- seed values (from MenuItem) ----
  const seedType: MenuItemType = initial?.type ?? 'custom';
  const seedPageId = initial?.page_id ?? '';
  const seedTitle = initial?.title ?? '';
  const seedUrl = initial?.url ?? '';
  const seedIcon: '' | IconName = isIconName(initial?.icon) ? (initial!.icon as IconName) : '';
  const seedIsActive = initial?.is_active ?? true;

  // ---- controlled state ----
  const [type, setType] = React.useState<MenuItemType>(seedType);
  const [pageId, setPageId] = React.useState<string>(seedPageId);
  const [title, setTitle] = React.useState<string>(seedTitle);
  const [url, setUrl] = React.useState<string>(seedUrl);
  const [iconSel, setIconSel] = React.useState<string>(seedIcon || 'none');
  const [isActive, setIsActive] = React.useState<boolean>(seedIsActive);

  React.useEffect(() => {
    const t: MenuItemType = initial?.type ?? 'custom';
    const pId = initial?.page_id ?? '';
    const ic: '' | IconName = isIconName(initial?.icon) ? (initial!.icon as IconName) : '';
    setType(t);
    setPageId(pId);
    setTitle(initial?.title ?? '');
    setUrl(initial?.url ?? '');
    setIconSel(ic || 'none');
    setIsActive(initial?.is_active ?? true);
  }, [initial, open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const selectedPage = type === 'page' ? pages.find((p) => p.id === pageId) : undefined;

    const icon: string | null = iconSel === 'none' || iconSel === '' ? null : (iconSel as IconName);

    const payload: UpsertMenuItemBody = {
      title: type === 'page' ? String(selectedPage?.title ?? title ?? '').trim() : title.trim(),
      type,
      url: type === 'page' && selectedPage ? `/${selectedPage.slug}` : url.trim(),
      page_id: type === 'page' ? (pageId ? pageId : null) : null,

      parent_id: null,
      location: 'header',

      icon,
      section_id: null,

      is_active: isActive,
    };

    await onSubmit(payload);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedItem ? 'Menü Öğesini Düzenle' : 'Yeni Header Öğesi'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* type */}
          <div className="space-y-2">
            <Label>Tip</Label>
            <Select value={type} onValueChange={(v) => setType(v as MenuItemType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Sayfa</SelectItem>
                <SelectItem value="custom">Özel Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* page or custom */}
          {type === 'page' ? (
            <div className="space-y-2">
              <Label>Sayfa Seç</Label>
              <Select value={pageId} onValueChange={setPageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sayfa seçin" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Menü başlığı"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/link veya https://example.com"
                  required
                />
              </div>
            </>
          )}

          {/* icon */}
          <div className="space-y-2">
            <Label>Icon (Opsiyonel)</Label>
            <Select value={iconSel} onValueChange={setIconSel}>
              <SelectTrigger>
                <SelectValue placeholder="İcon seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">İcon Yok</SelectItem>
                {availableIcons.map((i) => (
                  <SelectItem key={i.name} value={i.name}>
                    <div className="flex items-center gap-2">
                      <i.Icon className="h-4 w-4" />
                      {i.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* is_active */}
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Aktif</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {selectedItem ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
