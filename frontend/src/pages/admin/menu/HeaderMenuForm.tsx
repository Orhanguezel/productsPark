"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { MenuItemAdmin } from "@/integrations/metahub/rtk/types/menu";
import { availableIcons, type IconName } from "./icons";

type Page = { id: string; title: string; slug: string };

export type HeaderFormValues = {
  title: string;
  type: "page" | "custom";
  url: string;
  page_id: string;
  icon: "" | IconName;
  is_active: boolean;
};

export type HeaderMenuFormProps = {
  open: boolean;
  loading: boolean;
  pages: Page[];
  /** MenuItemAdmin de gelebilir */
  initial?: Partial<HeaderFormValues> | MenuItemAdmin;
  onClose: () => void;
  onSubmit: (payload: Omit<MenuItemAdmin, "id" | "display_order">) => Promise<void>;
  selectedItem?: MenuItemAdmin | null;
  defaultOrder: number;
};

function isMenuItemAdmin(x: unknown): x is MenuItemAdmin {
  return !!x && typeof x === "object" && "location" in (x as any) && "type" in (x as any);
}
function isIconName(v: unknown): v is IconName {
  return typeof v === "string" && availableIcons.some(i => i.name === v);
}

export default function HeaderMenuForm({
  open,
  loading,
  pages,
  initial,
  onClose,
  onSubmit,
  selectedItem,
  defaultOrder,
}: HeaderMenuFormProps) {
  const formSeed: HeaderFormValues = useMemo(() => {
    const raw = initial ?? {};
    const title = (isMenuItemAdmin(raw) ? raw.title : (raw as Partial<HeaderFormValues>).title) ?? "";
    const type = (isMenuItemAdmin(raw) ? raw.type : (raw as Partial<HeaderFormValues>).type) ?? "custom";
    const url = (isMenuItemAdmin(raw) ? raw.url : (raw as Partial<HeaderFormValues>).url) ?? "";
    const page_id = (isMenuItemAdmin(raw) ? (raw.page_id ?? "") : (raw as Partial<HeaderFormValues>).page_id) ?? "";
    const iconRaw = isMenuItemAdmin(raw) ? raw.icon : (raw as Partial<HeaderFormValues>).icon;
    const icon: "" | IconName = isIconName(iconRaw) ? iconRaw : "";
    const is_active = (isMenuItemAdmin(raw) ? raw.is_active : (raw as Partial<HeaderFormValues>).is_active) ?? true;
    return { title, type, url, page_id, icon, is_active };
  }, [initial]);

  const [isActive, setIsActive] = useState<boolean>(formSeed.is_active);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const type = String(fd.get("type")) as "page" | "custom";
    const page_id = String(fd.get("page_id") ?? "");
    const page = pages.find(p => p.id === page_id);

    const iconSel = String(fd.get("icon") ?? "");
    const icon = iconSel === "none" || iconSel === "" ? null : (iconSel as IconName);

    const payload: Omit<MenuItemAdmin, "id" | "display_order"> = {
      title: String(fd.get("title") ?? (page?.title ?? "")),
      type,
      url: type === "page" && page ? `/${page.slug}` : String(fd.get("url") ?? ""),
      page_id: type === "page" ? page_id : null,
      parent_id: null,
      location: "header",
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
          <DialogTitle>{selectedItem ? "Menü Öğesini Düzenle" : "Yeni Header Öğesi"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tip</Label>
            <Select name="type" defaultValue={formSeed.type}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Sayfa</SelectItem>
                <SelectItem value="custom">Özel Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formSeed.type === "page" ? (
            <div className="space-y-2">
              <Label>Sayfa Seç</Label>
              <Select name="page_id" defaultValue={formSeed.page_id}>
                <SelectTrigger><SelectValue placeholder="Sayfa seçin" /></SelectTrigger>
                <SelectContent>
                  {pages.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input name="title" defaultValue={formSeed.title} placeholder="Menü başlığı" required />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input name="url" defaultValue={formSeed.url} placeholder="/link veya https://example.com" required />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Icon (Opsiyonel)</Label>
            <Select name="icon" defaultValue={formSeed.icon || "none"}>
              <SelectTrigger><SelectValue placeholder="İcon seçin (opsiyonel)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">İcon Yok</SelectItem>
                {availableIcons.map(i => (
                  <SelectItem key={i.name} value={i.name}>
                    <div className="flex items-center gap-2"><i.Icon className="h-4 w-4" />{i.name}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* is_active */}
          <input type="hidden" name="is_active" value={isActive ? "on" : ""} />
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Aktif</Label>
          </div>

          <input type="hidden" name="display_order" value={String(defaultOrder)} />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading}>{selectedItem ? "Güncelle" : "Ekle"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
