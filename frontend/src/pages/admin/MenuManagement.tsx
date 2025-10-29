// =============================================================
// FILE: src/app/admin/menu/page.tsx
// (projenizdeki admin menü sayfası dosya yolunuza birebir koyun)
// =============================================================
"use client";

import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus, GripVertical, Pencil, Trash2, ExternalLink, FileText, Home, ShoppingBag, Grid3x3, Info, Mail, BookOpen, LifeBuoy, Settings, User, Instagram, Youtube, Facebook, Twitter, Linkedin, Twitch, Music, Music2, Gamepad2, Heart, Chrome, Send, MessageSquare, Camera, Pin, Crosshair, Waves,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  type: "page" | "custom";
  page_id: string | null;
  parent_id: string | null;
  display_order: number;
  location: "header" | "footer";
  is_active: boolean;
  icon: string | null;
  section_id: string | null;
}

interface FooterSection {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

interface Page {
  id: string;
  title: string;
  slug: string;
}

const availableIcons = [
  { name: "Home", Icon: Home },
  { name: "ShoppingBag", Icon: ShoppingBag },
  { name: "Grid3x3", Icon: Grid3x3 },
  { name: "Info", Icon: Info },
  { name: "Mail", Icon: Mail },
  { name: "BookOpen", Icon: BookOpen },
  { name: "LifeBuoy", Icon: LifeBuoy },
  { name: "Settings", Icon: Settings },
  { name: "User", Icon: User },
  { name: "Instagram", Icon: Instagram },
  { name: "TikTok", Icon: Music2 },
  { name: "YouTube", Icon: Youtube },
  { name: "Facebook", Icon: Facebook },
  { name: "Twitter", Icon: Twitter },
  { name: "Snapchat", Icon: Camera },
  { name: "Reddit", Icon: MessageSquare },
  { name: "Spotify", Icon: Music },
  { name: "Telegram", Icon: Send },
  { name: "Discord", Icon: MessageSquare },
  { name: "Kick", Icon: Twitch },
  { name: "Twitch", Icon: Twitch },
  { name: "X", Icon: Twitter },
  { name: "Pinterest", Icon: Pin },
  { name: "Linkedin", Icon: Linkedin },
  { name: "PUBG", Icon: Gamepad2 },
  { name: "Valorant", Icon: Crosshair },
  { name: "LOL", Icon: Gamepad2 },
  { name: "CS2", Icon: Crosshair },
  { name: "SoundCloud", Icon: Waves },
  { name: "Tinder", Icon: Heart },
  { name: "Google", Icon: Chrome },
  { name: "Gmail", Icon: Mail },
];

function SortableMenuItem({ item, onEdit, onDelete }: { item: MenuItem; onEdit: (item: MenuItem) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return null;
    const iconData = availableIcons.find(i => i.name === iconName);
    return iconData ? iconData.Icon : null;
  };
  const IconComponent = getIconComponent(item.icon);

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="h-4 w-4 text-primary" />}
          {!IconComponent && (item.type === "page" ? <FileText className="h-4 w-4 text-primary" /> : <ExternalLink className="h-4 w-4 text-primary" />)}
          <span className="font-medium">{item.title}</span>
          {!item.is_active && <Badge variant="secondary">Pasif</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{item.url}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    </div>
  );
}

function SortableSection({ section, onEdit, onDelete }: { section: FooterSection; onEdit: (section: FooterSection) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{section.title}</span>
          {!section.is_active && <Badge variant="secondary">Pasif</Badge>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(section)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(section.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    </div>
  );
}

export default function MenuManagement() {
  const [headerItems, setHeaderItems] = useState<MenuItem[]>([]);
  const [footerItems, setFooterItems] = useState<MenuItem[]>([]);
  const [footerSections, setFooterSections] = useState<FooterSection[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingSection, setEditingSection] = useState<FooterSection | null>(null);
  const [activeLocation, setActiveLocation] = useState<"header" | "footer">("header");

  const [formData, setFormData] = useState({
    title: "",
    type: "custom" as "page" | "custom",
    url: "",
    page_id: "",
    icon: "",
    is_active: true,
    section_id: "",
  });

  const [sectionFormData, setSectionFormData] = useState({
    title: "",
    is_active: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, pagesRes, sectionsRes] = await Promise.all([
        metahub.from("menu_items").select("*").order("order_num", { ascending: true }),
        metahub.from("custom_pages").select("id, title, slug").eq("is_published", true),
        metahub.from("footer_sections").select("*").order("display_order", { ascending: true }),
      ]);

      if (menuRes.error) throw menuRes.error;
      if (pagesRes.error) throw pagesRes.error;
      if (sectionsRes.error) throw sectionsRes.error;

      // public GET location döndürmeyebilir → derive et
      const items = (menuRes.data || []).map((r: any) => ({
        ...r,
        display_order: r.display_order ?? r.order_num ?? r.position ?? 0,
        location: r.location ?? (r.section_id ? "footer" : "header"),
      })) as MenuItem[];

      setHeaderItems(items.filter((i) => i.location === "header"));
      setFooterItems(items.filter((i) => i.location === "footer"));
      setPages(pagesRes.data || []);
      setFooterSections(sectionsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, location: "header" | "footer") => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = location === "header" ? headerItems : footerItems;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      display_order: index,
    }));

    if (location === "header") setHeaderItems(reorderedItems);
    else setFooterItems(reorderedItems);

    try {
      const updates = reorderedItems.map((item) =>
        metahub.from("menu_items")
          // public API çoğunlukla order_num/position kullanıyor
          .update({ order_num: item.display_order, position: item.display_order })
          .eq("id", item.id)
      );
      await Promise.all(updates);
      toast.success("Sıralama güncellendi");
    } catch (error) {
      toast.error("Sıralama güncellenirken hata oluştu");
      fetchData();
    }
  };

  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = footerSections.findIndex((section) => section.id === active.id);
    const newIndex = footerSections.findIndex((section) => section.id === over.id);

    const reorderedSections = arrayMove(footerSections, oldIndex, newIndex).map((section, index) => ({
      ...section,
      display_order: index,
    }));

    setFooterSections(reorderedSections);

    try {
      const updates = reorderedSections.map((section) =>
        metahub.from("footer_sections").update({ display_order: section.display_order }).eq("id", section.id)
      );
      await Promise.all(updates);
      toast.success("Bölüm sıralaması güncellendi");
    } catch (error) {
      toast.error("Sıralama güncellenirken hata oluştu");
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedPage = pages.find((p) => p.id === formData.page_id);

      // public API ile uyumlu outbound (order_num/position)
      const itemData: any = {
        title: formData.title,
        type: formData.type,
        url: formData.type === "page" && selectedPage ? `/${selectedPage.slug}` : formData.url,
        page_id: formData.type === "page" ? formData.page_id : null,
        icon: formData.icon || null,
        is_active: formData.is_active,
        section_id: activeLocation === "footer" && formData.section_id ? formData.section_id : null,
      };

      const nextOrder = activeLocation === "header" ? headerItems.length : footerItems.length;
      itemData.order_num = nextOrder;
      itemData.position = nextOrder;

      if (editingItem) {
        const { error } = await metahub.from("menu_items").update(itemData).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Menü öğesi güncellendi");
      } else {
        const { error } = await metahub.from("menu_items").insert([itemData]);
        if (error) throw error;
        toast.success("Menü öğesi eklendi");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      toast.error("Kayıt sırasında hata oluştu");
    }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sectionData = {
        title: sectionFormData.title,
        is_active: sectionFormData.is_active,
        display_order: editingSection ? editingSection.display_order : footerSections.length,
      };

      if (editingSection) {
        const { error } = await metahub.from("footer_sections").update(sectionData).eq("id", editingSection.id);
        if (error) throw error;
        toast.success("Bölüm güncellendi");
      } else {
        const { error } = await metahub.from("footer_sections").insert([sectionData]);
        if (error) throw error;
        toast.success("Bölüm eklendi");
      }

      setSectionDialogOpen(false);
      resetSectionForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving section:", error);
      toast.error("Kayıt sırasında hata oluştu");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      type: item.type,
      url: item.url,
      page_id: item.page_id || "",
      icon: item.icon || "",
      is_active: item.is_active,
      section_id: item.section_id || "",
    });
    setActiveLocation(item.location);
    setDialogOpen(true);
  };

  const handleEditSection = (section: FooterSection) => {
    setEditingSection(section);
    setSectionFormData({ title: section.title, is_active: section.is_active });
    setSectionDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu menü öğesini silmek istediğinizden emin misiniz?")) return;
    try {
      const { error } = await metahub.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Menü öğesi silindi");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting menu item:", error);
      toast.error("Silme işlemi başarısız");
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Bu bölümü silmek istediğinizden emin misiniz? Bölüme ait menü öğeleri bölümsüz olacaktır.")) return;
    try {
      const { error } = await metahub.from("footer_sections").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bölüm silindi");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting section:", error);
      toast.error("Silme işlemi başarısız");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      type: "custom",
      url: "",
      page_id: "",
      icon: "",
      is_active: true,
      section_id: "",
    });
  };

  const resetSectionForm = () => {
    setEditingSection(null);
    setSectionFormData({ title: "", is_active: true });
  };

  if (loading) {
    return (
      <AdminLayout title="Menü Yönetimi">
        <div className="flex items-center justify-center py-12"><p>Yükleniyor...</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Menü Yönetimi">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Menü Yönetimi</h2>
            <p className="text-muted-foreground">Header ve Footer menülerini sürükle-bırak ile yönetin</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Yeni Menü Öğesi</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingItem ? "Menü Öğesini Düzenle" : "Yeni Menü Öğesi Ekle"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Konum</Label>
                  <Select value={activeLocation} onValueChange={(v: "header" | "footer") => setActiveLocation(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tip</Label>
                  <Select value={formData.type} onValueChange={(v: "page" | "custom") => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">Sayfa</SelectItem>
                      <SelectItem value="custom">Özel Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "page" ? (
                  <div className="space-y-2">
                    <Label>Sayfa Seç</Label>
                    <Select
                      value={formData.page_id}
                      onValueChange={(value) => {
                        const page = pages.find((p) => p.id === value);
                        setFormData({ ...formData, page_id: value, title: page?.title || "" });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Sayfa seçin" /></SelectTrigger>
                      <SelectContent>
                        {pages.map((page) => (<SelectItem key={page.id} value={page.id}>{page.title}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Başlık</Label>
                      <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Menü başlığı" required />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="/link veya https://example.com" required />
                    </div>
                  </>
                )}

                {activeLocation === "footer" && (
                  <div className="space-y-2">
                    <Label>Bölüm</Label>
                    <Select
                      value={formData.section_id || "none"}
                      onValueChange={(value) => setFormData({ ...formData, section_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger><SelectValue placeholder="Bölüm seçin (opsiyonel)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Bölümsüz</SelectItem>
                        {footerSections.filter(s => s.is_active).map((section) => (
                          <SelectItem key={section.id} value={section.id}>{section.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Icon (Opsiyonel)</Label>
                  <Select value={formData.icon || "none"} onValueChange={(value) => setFormData({ ...formData, icon: value === "none" ? "" : value })}>
                    <SelectTrigger><SelectValue placeholder="İcon seçin (opsiyonel)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">İcon Yok</SelectItem>
                      {availableIcons.map((icon) => (
                        <SelectItem key={icon.name} value={icon.name}>
                          <div className="flex items-center gap-2"><icon.Icon className="h-4 w-4" />{icon.name}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                  <Label>Aktif</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                  <Button type="submit">{editingItem ? "Güncelle" : "Ekle"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="header" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="header">Header Menü</TabsTrigger>
            <TabsTrigger value="footer">Footer Menü</TabsTrigger>
          </TabsList>

          <TabsContent value="header" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Header Menü Öğeleri</CardTitle></CardHeader>
              <CardContent>
                {headerItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz header menü öğesi eklenmemiş</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(event, "header")}>
                    <SortableContext items={headerItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {headerItems.map((item) => (
                          <SortableMenuItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Footer Bölümleri</CardTitle>
                <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
                  <DialogTrigger asChild><Button size="sm" onClick={resetSectionForm}><Plus className="mr-2 h-4 w-4" />Yeni Bölüm</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{editingSection ? "Bölümü Düzenle" : "Yeni Bölüm Ekle"}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSectionSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Bölüm Adı</Label>
                        <Input value={sectionFormData.title} onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })} placeholder="Örn: Hızlı Erişim, Müşteri Hizmetleri" required />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={sectionFormData.is_active} onCheckedChange={(checked) => setSectionFormData({ ...sectionFormData, is_active: checked })} />
                        <Label>Aktif</Label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => { setSectionDialogOpen(false); resetSectionForm(); }}>İptal</Button>
                        <Button type="submit">{editingSection ? "Güncelle" : "Ekle"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {footerSections.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Henüz bölüm eklenmemiş</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                    <SortableContext items={footerSections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {footerSections.map((section) => (
                          <SortableSection key={section.id} section={section} onEdit={handleEditSection} onDelete={handleDeleteSection} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Footer Menü Öğeleri</CardTitle></CardHeader>
              <CardContent>
                {footerItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz footer menü öğesi eklenmemiş</p>
                ) : (
                  <div className="space-y-4">
                    {footerSections.filter(s => s.is_active).map((section) => {
                      const sectionItems = footerItems.filter(item => item.section_id === section.id);
                      if (sectionItems.length === 0) return null;
                      return (
                        <div key={section.id} className="space-y-2">
                          <h4 className="font-semibold text-sm text-muted-foreground">{section.title}</h4>
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(event, "footer")}>
                            <SortableContext items={sectionItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2 pl-4 border-l-2 border-border">
                                {sectionItems.map((item) => (
                                  <SortableMenuItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      );
                    })}

                    {footerItems.filter(item => !item.section_id).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">Bölümsüz Öğeler</h4>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(event, "footer")}>
                          <SortableContext items={footerItems.filter(item => !item.section_id).map((item) => item.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                              {footerItems.filter(item => !item.section_id).map((item) => (
                                <SortableMenuItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
