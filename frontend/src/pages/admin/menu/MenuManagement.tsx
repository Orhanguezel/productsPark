// =============================================================
// FILE: MenuManagementPage.tsx
// FINAL — menu_item.ts + footer.ts + RTK endpoints compatible
// - Uses MenuItem[] (normalized) from RTK
// - Uses UpsertMenuItemBody for create/update
// - Uses UpsertFooterSectionBody for footer section create/update
// =============================================================
'use client';

import * as React from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import HeaderMenuForm from './HeaderMenuForm';
import FooterMenuForm from './FooterMenuForm';
import FooterSectionForm from './FooterSectionForm';

import HeaderMenuList from './HeaderMenuList';
import FooterSectionList from './FooterSectionList';
import FooterMenuList from './FooterMenuList';

import {
  useListMenuItemsAdminQuery,
  useCreateMenuItemAdminMutation,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
  useReorderMenuItemsAdminMutation,
  useListFooterSectionsAdminQuery,
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
  useReorderFooterSectionsAdminMutation,
  useListCustomPagesAdminQuery,
} from '@/integrations/hooks';

import type {
  FooterSection,
  MenuItem,
  UpsertFooterSectionBody,
  UpsertMenuItemBody,
} from '@/integrations/types';

type Page = { id: string; title: string; slug: string };

export default function MenuManagementPage() {
  // ===================== MENU ITEMS (normalized MenuItem[]) =====================
  const {
    data: allMenuItems = [],
    isLoading: menuLoading,
    refetch: refetchMenu,
  } = useListMenuItemsAdminQuery();

  const [createMenuItem] = useCreateMenuItemAdminMutation();
  const [updateMenuItem] = useUpdateMenuItemAdminMutation();
  const [deleteMenuItem] = useDeleteMenuItemAdminMutation();
  const [reorderMenuItems] = useReorderMenuItemsAdminMutation();

  // ===================== FOOTER SECTIONS =====================
  const {
    data: allSections = [],
    isLoading: sectionsLoading,
    refetch: refetchSections,
  } = useListFooterSectionsAdminQuery();

  const [createSection] = useCreateFooterSectionAdminMutation();
  const [updateSection] = useUpdateFooterSectionAdminMutation();
  const [deleteSection] = useDeleteFooterSectionAdminMutation();
  const [reorderSections] = useReorderFooterSectionsAdminMutation();

  // ===================== CUSTOM PAGES =====================
  const { data: customPages = [], isLoading: pagesLoading } = useListCustomPagesAdminQuery();

  const pages: Page[] = React.useMemo(() => {
    return (customPages || []).map((p: any) => ({
      id: String(p?.id ?? ''),
      title: String(p?.title ?? ''),
      slug: String(p?.slug ?? ''),
    }));
  }, [customPages]);

  // ===================== DERIVED LISTS =====================
  const headerItems: MenuItem[] = React.useMemo(() => {
    return allMenuItems
      .filter((i) => i.location === 'header')
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [allMenuItems]);

  const footerItems: MenuItem[] = React.useMemo(() => {
    // legacy safety: bazı kayıtlar section_id dolu ama location hatalı/null gelebilir
    return allMenuItems
      .filter((i) => i.location === 'footer' || i.section_id != null)
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [allMenuItems]);

  const footerSections: FooterSection[] = React.useMemo(() => {
    return (allSections || [])
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [allSections]);

  // ===================== DIALOG STATES =====================
  const [openHeaderForm, setOpenHeaderForm] = React.useState(false);
  const [openFooterForm, setOpenFooterForm] = React.useState(false);
  const [openSectionForm, setOpenSectionForm] = React.useState(false);

  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const [editingSection, setEditingSection] = React.useState<FooterSection | null>(null);

  const loading = menuLoading || sectionsLoading || pagesLoading;

  // ===================== ACTIONS: MENU ITEMS =====================
  async function handleUpsertHeaderItem(body: UpsertMenuItemBody) {
    try {
      if (editingItem) {
        await updateMenuItem({ id: editingItem.id, body }).unwrap();
        toast.success('Menü öğesi güncellendi');
      } else {
        await createMenuItem({ ...body, display_order: headerItems.length }).unwrap();
        toast.success('Menü öğesi eklendi');
      }

      setEditingItem(null);
      refetchMenu();
    } catch {
      toast.error('Kayıt sırasında hata oluştu');
    }
  }

  async function handleUpsertFooterItem(body: UpsertMenuItemBody) {
    try {
      if (editingItem) {
        await updateMenuItem({ id: editingItem.id, body }).unwrap();
        toast.success('Menü öğesi güncellendi');
      } else {
        await createMenuItem({ ...body, display_order: footerItems.length }).unwrap();
        toast.success('Menü öğesi eklendi');
      }

      setEditingItem(null);
      refetchMenu();
    } catch {
      toast.error('Kayıt sırasında hata oluştu');
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Bu menü öğesini silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteMenuItem(id).unwrap();
      toast.success('Menü öğesi silindi');
      refetchMenu();
    } catch {
      toast.error('Silme işlemi başarısız');
    }
  }

  async function handleReorderMenu(items: Array<{ id: string; display_order: number }>) {
    try {
      await reorderMenuItems(items).unwrap();
      toast.success('Sıralama güncellendi');
      refetchMenu();
    } catch {
      toast.error('Sıralama güncellenirken hata oluştu');
    }
  }

  // ===================== ACTIONS: FOOTER SECTIONS =====================
  async function handleUpsertSection(body: UpsertFooterSectionBody) {
    try {
      if (editingSection) {
        await updateSection({ id: editingSection.id, body }).unwrap();
        toast.success('Bölüm güncellendi');
      } else {
        await createSection(body).unwrap();
        toast.success('Bölüm eklendi');
      }

      setEditingSection(null);
      refetchSections();
    } catch {
      toast.error('Kayıt sırasında hata oluştu');
    }
  }

  async function handleDeleteSection(id: string) {
    if (
      !confirm(
        'Bu bölümü silmek istediğinizden emin misiniz? Bölüme ait menü öğeleri bölümsüz olacaktır.',
      )
    )
      return;

    try {
      await deleteSection(id).unwrap();
      toast.success('Bölüm silindi');
      refetchSections();
      refetchMenu(); // section_id null’a dönen menu item’lar olabilir
    } catch {
      toast.error('Silme işlemi başarısız');
    }
  }

  async function handleReorderSections(items: Array<{ id: string; display_order: number }>) {
    try {
      await reorderSections(items).unwrap();
      toast.success('Bölüm sıralaması güncellendi');
      refetchSections();
    } catch {
      toast.error('Sıralama güncellenirken hata oluştu');
    }
  }

  // ===================== RENDER =====================
  return (
    <AdminLayout title="Menü Yönetimi">
      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="header">Header Menü</TabsTrigger>
          <TabsTrigger value="footer">Footer Menü</TabsTrigger>
        </TabsList>

        {/* ===================== HEADER ===================== */}
        <TabsContent value="header" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingItem(null);
                setOpenHeaderForm(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Header Öğesi
            </Button>
          </div>

          <HeaderMenuList
            items={headerItems}
            onReorder={handleReorderMenu}
            onEdit={(i) => {
              setEditingItem(i);
              setOpenHeaderForm(true);
            }}
            onDelete={handleDeleteItem}
          />

          <HeaderMenuForm
            open={openHeaderForm}
            loading={loading}
            pages={pages}
            initial={editingItem}
            selectedItem={editingItem}
            defaultOrder={headerItems.length}
            onClose={() => setOpenHeaderForm(false)}
            onSubmit={handleUpsertHeaderItem}
          />
        </TabsContent>

        {/* ===================== FOOTER ===================== */}
        <TabsContent value="footer" className="mt-6 space-y-4">
          <FooterSectionList
            sections={footerSections}
            onReorder={handleReorderSections}
            onEdit={(s) => {
              setEditingSection(s);
              setOpenSectionForm(true);
            }}
            onDelete={handleDeleteSection}
            headerRight={
              <Button
                size="sm"
                onClick={() => {
                  setEditingSection(null);
                  setOpenSectionForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Yeni Bölüm
              </Button>
            }
          />

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingItem(null);
                setOpenFooterForm(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Footer Öğesi
            </Button>
          </div>

          <FooterMenuList
            sections={footerSections}
            items={footerItems}
            onReorder={handleReorderMenu}
            onEdit={(i) => {
              setEditingItem(i);
              setOpenFooterForm(true);
            }}
            onDelete={handleDeleteItem}
          />

          <FooterMenuForm
            open={openFooterForm}
            loading={loading}
            pages={pages}
            sections={footerSections}
            initial={editingItem}
            selectedItem={editingItem}
            defaultOrder={footerItems.length}
            onClose={() => setOpenFooterForm(false)}
            onSubmit={handleUpsertFooterItem}
          />

          <FooterSectionForm
            open={openSectionForm}
            loading={loading}
            initial={editingSection}
            defaultOrder={footerSections.length}
            onClose={() => setOpenSectionForm(false)}
            onSubmit={handleUpsertSection}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
