"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { MenuItemAdmin } from "@/integrations/metahub/db/types/menu";
import type { FooterSection } from "@/integrations/metahub/db/types/footer";
import { availableIcons, type IconName } from "./icons";

type Page = { id: string; title: string; slug: string };

export type FooterFormValues = {
  title: string;
  type: "page" | "custom";
  url: string;
  page_id: string;
  icon: "" | IconName;
  is_active: boolean;
  section_id: string;
};

export type FooterMenuFormProps = {
  open: boolean;
  loading: boolean;
  pages: Page[];
  sections: FooterSection[];
  /** MenuItemAdmin de gelebilir */
  initial?: Partial<FooterFormValues> | MenuItemAdmin;
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

export default function FooterMenuForm({
  open,
  loading,
  pages,
  sections,
  initial,
  onClose,
  onSubmit,
  selectedItem,
  defaultOrder,
}: FooterMenuFormProps) {
  const title = (isMenuItemAdmin(initial) ? initial.title : (initial as Partial<FooterFormValues>)?.title) ?? "";
  const type = (isMenuItemAdmin(initial) ? initial.type : (initial as Partial<FooterFormValues>)?.type) ?? "custom";
  const url = (isMenuItemAdmin(initial) ? initial.url : (initial as Partial<FooterFormValues>)?.url) ?? "";
  const page_id = (isMenuItemAdmin(initial) ? (initial.page_id ?? "") : (initial as Partial<FooterFormValues>)?.page_id) ?? "";
  const iconRaw = isMenuItemAdmin(initial) ? initial.icon : (initial as Partial<FooterFormValues>)?.icon;
  const icon: "" | IconName = isIconName(iconRaw) ? iconRaw : "";
  const section_id = (isMenuItemAdmin(initial) ? (initial.section_id ?? "") : (initial as Partial<FooterFormValues>)?.section_id) ?? "";
  const [isActive, setIsActive] = useState<boolean>((isMenuItemAdmin(initial) ? initial.is_active : (initial as Partial<FooterFormValues>)?.is_active) ?? true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const t = String(fd.get("type")) as "page" | "custom";
    const pid = String(fd.get("page_id") ?? "");
    const page = pages.find(p => p.id === pid);

    const sec = String(fd.get("section_id") ?? "");
    const iconSel = String(fd.get("icon") ?? "");
    const iconName = iconSel === "none" || iconSel === "" ? null : (iconSel as IconName);

    const payload: Omit<MenuItemAdmin, "id" | "display_order"> = {
      title: String(fd.get("title") ?? (page?.title ?? "")),
      type: t,
      url: t === "page" && page ? `/${page.slug}` : String(fd.get("url") ?? ""),
      page_id: t === "page" ? pid : null,
      parent_id: null,
      location: "footer",
      icon: iconName,
      section_id: sec || null,
      is_active: isActive,
    };
    await onSubmit(payload);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedItem ? "Menü Öğesini Düzenle" : "Yeni Footer Öğesi"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tip</Label>
            <Select name="type" defaultValue={type}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Sayfa</SelectItem>
                <SelectItem value="custom">Özel Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "page" ? (
            <div className="space-y-2">
              <Label>Sayfa Seç</Label>
              <Select name="page_id" defaultValue={page_id}>
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
                <Input name="title" defaultValue={title} placeholder="Menü başlığı" required />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input name="url" defaultValue={url} placeholder="/link veya https://example.com" required />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Bölüm</Label>
            <Select name="section_id" defaultValue={section_id || "none"}>
              <SelectTrigger><SelectValue placeholder="Bölüm seçin (opsiyonel)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bölümsüz</SelectItem>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Icon (Opsiyonel)</Label>
            <Select name="icon" defaultValue={icon || "none"}>
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
