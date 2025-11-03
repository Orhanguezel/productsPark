"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";

import HeaderMenuForm from "./HeaderMenuForm";
import FooterMenuForm from "./FooterMenuForm";
import FooterSectionForm from "./FooterSectionForm";
import HeaderMenuList from "./HeaderMenuList";
import FooterSectionList from "./FooterSectionList";
import FooterMenuList from "./FooterMenuList";

import {
  useListMenuItemsAdminQuery,
  useCreateMenuItemAdminMutation,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
  useReorderMenuItemsAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/menu_admin.endpoints";

import {
  useListFooterSectionsAdminQuery,
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
  useReorderFooterSectionsAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/footer_sections_admin.endpoints";

import type { MenuItemAdmin } from "@/integrations/metahub/db/types/menu";
import type { FooterSection, UpsertFooterSectionBody } from "@/integrations/metahub/db/types/footer";

type Page = { id: string; title: string; slug: string };

export default function MenuManagementPage() {
  // DATA
  const { data: allMenuItems = [], isLoading: menuLoading } = useListMenuItemsAdminQuery();
  const [createMenuItem] = useCreateMenuItemAdminMutation();
  const [updateMenuItem] = useUpdateMenuItemAdminMutation();
  const [deleteMenuItem] = useDeleteMenuItemAdminMutation();
  const [reorderMenuItems] = useReorderMenuItemsAdminMutation();

  const { data: allSections = [], isLoading: sectionsLoading } = useListFooterSectionsAdminQuery();
  const [createSection] = useCreateFooterSectionAdminMutation();
  const [updateSection] = useUpdateFooterSectionAdminMutation();
  const [deleteSection] = useDeleteFooterSectionAdminMutation();
  const [reorderSections] = useReorderFooterSectionsAdminMutation();

  const [pages, setPages] = useState<Page[]>([]);
  useEffect(() => {
    (async () => {
      const res = await metahub.from("custom_pages").select("id, title, slug").eq("is_published", true);
      if (!res.error) setPages((res.data ?? []) as Page[]);
    })();
  }, []);

  // NORMALIZE
  const normalizedMenu = useMemo(() => {
    return allMenuItems.map((i) => {
      const loc: "header" | "footer" | undefined = i.location ?? (i.section_id ? "footer" : undefined);
      const display_order = i.display_order ?? i.position ?? i.order_num ?? 0;
      return { ...i, location: loc, display_order };
    });
  }, [allMenuItems]);

  const headerItems = useMemo(
    () => normalizedMenu.filter((i) => i.location === "header").sort((a, b) => a.display_order - b.display_order),
    [normalizedMenu]
  );

  const footerItems = useMemo(
    () =>
      normalizedMenu
        .filter((i) => i.location === "footer" || i.section_id != null || i.location === undefined)
        .sort((a, b) => a.display_order - b.display_order),
    [normalizedMenu]
  );

  const footerSections = useMemo(
    () => (allSections || []).slice().sort((a, b) => a.display_order - b.display_order),
    [allSections]
  );

  // DIALOG STATE
  const [openHeaderForm, setOpenHeaderForm] = useState(false);
  const [openFooterForm, setOpenFooterForm] = useState(false);
  const [openSectionForm, setOpenSectionForm] = useState(false);

  const [editingItem, setEditingItem] = useState<MenuItemAdmin | null>(null);
  const [editingSection, setEditingSection] = useState<FooterSection | null>(null);

  const loading = menuLoading || sectionsLoading;

  // ACTIONS
  async function handleUpsertHeaderItem(body: Omit<MenuItemAdmin, "id" | "display_order">) {
    try {
      if (editingItem) {
        await updateMenuItem({ id: editingItem.id, body }).unwrap();
        toast.success("Menü öğesi güncellendi");
      } else {
        await createMenuItem({ ...body, display_order: headerItems.length }).unwrap();
        toast.success("Menü öğesi eklendi");
      }
      setEditingItem(null);
    } catch {
      toast.error("Kayıt sırasında hata oluştu");
    }
  }

  async function handleUpsertFooterItem(body: Omit<MenuItemAdmin, "id" | "display_order">) {
    try {
      if (editingItem) {
        await updateMenuItem({ id: editingItem.id, body }).unwrap();
        toast.success("Menü öğesi güncellendi");
      } else {
        await createMenuItem({ ...body, display_order: footerItems.length }).unwrap();
        toast.success("Menü öğesi eklendi");
      }
      setEditingItem(null);
    } catch {
      toast.error("Kayıt sırasında hata oluştu");
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Bu menü öğesini silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteMenuItem(id).unwrap();
      toast.success("Menü öğesi silindi");
    } catch {
      toast.error("Silme işlemi başarısız");
    }
  }

  async function handleReorderMenu(items: { id: string; display_order: number }[]) {
    try {
      await reorderMenuItems(items).unwrap();
      toast.success("Sıralama güncellendi");
    } catch {
      toast.error("Sıralama güncellenirken hata oluştu");
    }
  }

  async function handleUpsertSection(b: UpsertFooterSectionBody) {
    try {
      if (editingSection) {
        await updateSection({ id: editingSection.id, body: b }).unwrap();
        toast.success("Bölüm güncellendi");
      } else {
        await createSection(b).unwrap();
        toast.success("Bölüm eklendi");
      }
      setEditingSection(null);
    } catch {
      toast.error("Kayıt sırasında hata oluştu");
    }
  }

  async function handleDeleteSection(id: string) {
    if (!confirm("Bu bölümü silmek istediğinizden emin misiniz? Bölüme ait menü öğeleri bölümsüz olacaktır.")) return;
    try {
      await deleteSection(id).unwrap();
      toast.success("Bölüm silindi");
    } catch {
      toast.error("Silme işlemi başarısız");
    }
  }

  async function handleReorderSections(items: { id: string; display_order: number }[]) {
    try {
      await reorderSections(items).unwrap();
      toast.success("Bölüm sıralaması güncellendi");
    } catch {
      toast.error("Sıralama güncellenirken hata oluştu");
    }
  }

  return (
    <AdminLayout title="Menü Yönetimi">
      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="header">Header Menü</TabsTrigger>
          <TabsTrigger value="footer">Footer Menü</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingItem(null); setOpenHeaderForm(true); }}>
              <Plus className="mr-2 h-4 w-4" />Yeni Header Öğesi
            </Button>
          </div>

          <HeaderMenuList
            items={headerItems}
            onReorder={handleReorderMenu}
            onEdit={(i) => { setEditingItem(i); setOpenHeaderForm(true); }}
            onDelete={handleDeleteItem}
          />

          <HeaderMenuForm
            open={openHeaderForm}
            loading={loading}
            pages={pages}
            initial={editingItem ?? undefined}
            selectedItem={editingItem ?? undefined}
            defaultOrder={headerItems.length}
            onClose={() => { setOpenHeaderForm(false); }}
            onSubmit={handleUpsertHeaderItem}
          />
        </TabsContent>

        <TabsContent value="footer" className="mt-6 space-y-4">
          <FooterSectionList
            sections={footerSections}
            onReorder={handleReorderSections}
            onEdit={(s) => { setEditingSection(s); setOpenSectionForm(true); }}
            onDelete={handleDeleteSection}
            headerRight={
              <Button size="sm" onClick={() => { setEditingSection(null); setOpenSectionForm(true); }}>
                <Plus className="mr-2 h-4 w-4" />Yeni Bölüm
              </Button>
            }
          />

          <div className="flex justify-end">
            <Button onClick={() => { setEditingItem(null); setOpenFooterForm(true); }}>
              <Plus className="mr-2 h-4 w-4" />Yeni Footer Öğesi
            </Button>
          </div>

          <FooterMenuList
            sections={footerSections}
            items={footerItems}
            onReorder={handleReorderMenu}
            onEdit={(i) => { setEditingItem(i); setOpenFooterForm(true); }}
            onDelete={handleDeleteItem}
          />

          <FooterMenuForm
            open={openFooterForm}
            loading={loading}
            pages={pages}
            sections={footerSections}
            initial={editingItem ?? undefined}
            selectedItem={editingItem ?? undefined}
            defaultOrder={footerItems.length}
            onClose={() => { setOpenFooterForm(false); }}
            onSubmit={handleUpsertFooterItem}
          />

          <FooterSectionForm
            open={openSectionForm}
            loading={loading}
            initial={editingSection}
            defaultOrder={footerSections.length}
            onClose={() => { setOpenSectionForm(false); }}
            onSubmit={handleUpsertSection}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
