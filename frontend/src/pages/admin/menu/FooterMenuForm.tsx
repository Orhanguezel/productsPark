// =============================================================
// FILE: FooterMenuForm.tsx
// FINAL — menu_item.ts single-source types compatible
// - Accepts MenuItem (normalized) for edit
// - Accepts Partial<UpsertMenuItemBody> for prefill
// - exactOptionalPropertyTypes: true safe
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

import type {
  FooterSection,
  MenuItem,
  MenuItemType,
  UpsertMenuItemBody,
} from '@/integrations/types';
import { availableIcons, type IconName } from './icons';

type Page = { id: string; title: string; slug: string };

export type FooterMenuFormProps = {
  open: boolean;
  loading: boolean;
  pages: Page[];
  sections: FooterSection[];

  /**
   * initial can be:
   * - MenuItem (edit, normalized)
   * - Partial<UpsertMenuItemBody> (prefill)
   * - null/undefined (create)
   */
  initial?: MenuItem | Partial<UpsertMenuItemBody> | null;

  /** purely for UI label/title */
  selectedItem?: MenuItem | null;

  defaultOrder: number;

  onClose: () => void;
  onSubmit: (payload: UpsertMenuItemBody) => Promise<void>;
};

function isMenuItem(x: unknown): x is MenuItem {
  return (
    !!x &&
    typeof x === 'object' &&
    'id' in (x as Record<string, unknown>) &&
    'type' in (x as Record<string, unknown>) &&
    'location' in (x as Record<string, unknown>)
  );
}

function isIconName(v: unknown): v is IconName {
  return typeof v === 'string' && availableIcons.some((i) => i.name === v);
}

const NONE = 'none' as const;

export default function FooterMenuForm({
  open,
  loading,
  pages,
  sections,
  initial,
  selectedItem,
  defaultOrder,
  onClose,
  onSubmit,
}: FooterMenuFormProps) {
  // ---------- initial snapshot ----------
  const initialTitle = React.useMemo(() => {
    if (isMenuItem(initial)) return initial.title ?? '';
    return (initial?.title ?? '') as string;
  }, [initial]);

  const initialType = React.useMemo<MenuItemType>(() => {
    if (isMenuItem(initial)) return initial.type ?? 'custom';
    const t = initial?.type;
    return t === 'page' || t === 'custom' ? t : 'custom';
  }, [initial]);

  const initialUrl = React.useMemo(() => {
    if (isMenuItem(initial)) return initial.url ?? '';
    return (initial?.url ?? '') as string;
  }, [initial]);

  const initialPageId = React.useMemo(() => {
    if (isMenuItem(initial)) return initial.page_id ?? '';
    return (initial?.page_id ?? '') as string;
  }, [initial]);

  const initialSectionId = React.useMemo(() => {
    const sec = isMenuItem(initial) ? initial.section_id : initial?.section_id;
    return typeof sec === 'string' && sec.trim() ? sec : NONE;
  }, [initial]);

  const initialIcon = React.useMemo(() => {
    const ic = isMenuItem(initial) ? initial.icon : initial?.icon;
    return isIconName(ic) ? ic : NONE;
  }, [initial]);

  const initialIsActive = React.useMemo(() => {
    const raw = isMenuItem(initial) ? initial.is_active : initial?.is_active;
    return typeof raw === 'boolean' ? raw : true;
  }, [initial]);

  // ---------- local state ----------
  const [type, setType] = React.useState<MenuItemType>(initialType);
  const [title, setTitle] = React.useState<string>(initialTitle);
  const [url, setUrl] = React.useState<string>(initialUrl);
  const [pageId, setPageId] = React.useState<string>(initialPageId);
  const [sectionId, setSectionId] = React.useState<string>(initialSectionId);
  const [iconSel, setIconSel] = React.useState<string>(initialIcon);
  const [isActive, setIsActive] = React.useState<boolean>(initialIsActive);

  React.useEffect(() => {
    setType(initialType);
    setTitle(initialTitle);
    setUrl(initialUrl);
    setPageId(initialPageId);
    setSectionId(initialSectionId);
    setIconSel(initialIcon);
    setIsActive(initialIsActive);
  }, [
    open,
    initialType,
    initialTitle,
    initialUrl,
    initialPageId,
    initialSectionId,
    initialIcon,
    initialIsActive,
  ]);

  const selectedPage = React.useMemo(
    () => pages.find((p) => p.id === pageId) ?? null,
    [pages, pageId],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const finalTitle = type === 'page' ? (selectedPage?.title ?? title).trim() : title.trim();

    const finalUrl =
      type === 'page' ? (selectedPage ? `/${selectedPage.slug}` : url.trim()) : url.trim();

    const body: UpsertMenuItemBody = {
      title: finalTitle,
      url: finalUrl,
      type,
      location: 'footer',
      parent_id: null,

      page_id: type === 'page' ? (pageId ? pageId : null) : null,
      section_id: sectionId === NONE ? null : sectionId,
      icon: iconSel === NONE ? null : iconSel,
      is_active: isActive,

      // create’de parent defaultOrder gönderiyor; edit’te de idempotent olsun diye gönderiyoruz
      display_order: defaultOrder,
    };

    await onSubmit(body);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedItem ? 'Menü Öğesini Düzenle' : 'Yeni Footer Öğesi'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TYPE */}
          <div className="space-y-2">
            <Label>Tip</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v === 'page' || v === 'custom' ? v : 'custom')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Sayfa</SelectItem>
                <SelectItem value="custom">Özel Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PAGE or CUSTOM */}
          {type === 'page' ? (
            <div className="space-y-2">
              <Label>Sayfa Seç</Label>
              <Select value={pageId} onValueChange={(v) => setPageId(v)}>
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

              <p className="text-xs text-muted-foreground">
                URL: {selectedPage ? `/${selectedPage.slug}` : '-'}
              </p>
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

          {/* SECTION */}
          <div className="space-y-2">
            <Label>Bölüm</Label>
            <Select value={sectionId} onValueChange={(v) => setSectionId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Bölüm seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Bölümsüz</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ICON */}
          <div className="space-y-2">
            <Label>Icon (Opsiyonel)</Label>
            <Select value={iconSel} onValueChange={(v) => setIconSel(v)}>
              <SelectTrigger>
                <SelectValue placeholder="İcon seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>İcon Yok</SelectItem>
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

          {/* ACTIVE */}
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
