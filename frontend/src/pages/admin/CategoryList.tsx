import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "@/hooks/use-toast";
import {
  useListCategoriesAdminQuery,
  useDeleteCategoryAdminMutation,
  useToggleActiveCategoryAdminMutation,
  useToggleFeaturedCategoryAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";
import type { Category } from "@/integrations/metahub/db/types/categories";
import { Switch } from "@/components/ui/switch";

type FilterTab = "all" | "main" | "sub";

export default function CategoryList() {
  const navigate = useNavigate();

  const {
    data: categories = [],
    isLoading,
    isFetching,
    refetch,
  } = useListCategoriesAdminQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    refetch();
  }, []);

  const [delCat] = useDeleteCategoryAdminMutation();
  const [toggleActive] = useToggleActiveCategoryAdminMutation();
  const [toggleFeatured] = useToggleFeaturedCategoryAdminMutation();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const parentName = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filtered: Category[] = useMemo(() => {
    if (filter === "main") return categories.filter((c) => c.parent_id === null);
    if (filter === "sub") return categories.filter((c) => c.parent_id !== null);
    return categories;
  }, [categories, filter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => setCurrentPage(1), [filter]);

  const onDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;
    try {
      await delCat(id).unwrap();
      toast({ title: "Başarılı", description: "Kategori silindi." });
    } catch (e) {
      console.error(e);
      toast({ title: "Hata", description: "Kategori silinemedi.", variant: "destructive" });
    }
  };

  const onToggleActive = async (c: Category) => {
    try {
      await toggleActive({ id: c.id, is_active: !c.is_active }).unwrap();
    } catch {
      toast({ title: "Hata", description: "Aktif/Pasif işlemi başarısız.", variant: "destructive" });
    }
  };

  const onToggleFeatured = async (c: Category) => {
    try {
      await toggleFeatured({ id: c.id, is_featured: !c.is_featured }).unwrap();
    } catch {
      toast({ title: "Hata", description: "Öne çıkarma işlemi başarısız.", variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Kategori Yönetimi">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Kategori Yönetimi</h3>
          <Button onClick={() => navigate("/admin/categories/new")}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Kategori Ekle
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">Tümü ({categories.length})</TabsTrigger>
            <TabsTrigger value="main">Ana Kategoriler ({categories.filter(c => c.parent_id === null).length})</TabsTrigger>
            <TabsTrigger value="sub">Alt Kategoriler ({categories.filter(c => c.parent_id !== null).length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading && !isFetching ? (
          <div>Yükleniyor…</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Görsel</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Üst Kategori</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead>Öne Çıkan</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt={c.image_alt || c.name}
                          className="h-8 w-8 rounded object-cover border"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded border bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.parent_id ? parentName.get(c.parent_id) || "—" : "—"}</TableCell>
                    <TableCell>{(c.slug && c.slug.trim()) ? c.slug : "—"}</TableCell>
                    <TableCell>
                      <Switch checked={!!c.is_active} onCheckedChange={() => onToggleActive(c)} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!c.is_featured} onCheckedChange={() => onToggleFeatured(c)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/categories/edit/${c.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === p}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
