// FILE: src/pages/admin/categories/CategoryList.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "@/hooks/use-toast";
import {
  useListCategoriesAdminQuery,
  useGetCategoryAdminByIdQuery,
  useDeleteCategoryAdminMutation,
  useToggleActiveCategoryAdminMutation,
  useToggleFeaturedCategoryAdminMutation,
} from "@/integrations/hooks";

import type { Category } from "@/integrations/types";
import { Switch } from "@/components/ui/switch";

type FilterTab = "all" | "main" | "sub";

/* basit slugify */
const slugify = (v: string): string =>
  (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Thumbnail – nokta atışı: önce list’ten gelen url, yoksa tekil kategoriden url */
type AssetThumbProps = {
  categoryId: string;
  imageUrl: string | null;
  alt: string;
  className?: string;
};

function AssetThumb({ categoryId, imageUrl, alt, className }: AssetThumbProps) {
  // list response image_url boşsa, tekil endpoint’ten tam satırı çek
  const { data: catDetail } = useGetCategoryAdminByIdQuery(categoryId, {
    skip: !!imageUrl, // imageUrl varsa ekstra istek atma
  });

  const src = imageUrl ?? catDetail?.image_url ?? null;

  if (!src) {
    return <div className="h-8 w-8 rounded border bg-muted" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        const el = e.currentTarget;
        el.onerror = null;
        el.src = "https://placehold.co/64x64?text=IMG";
      }}
    />
  );
}

export default function CategoryList() {
  const navigate = useNavigate();

  const { data = [], isLoading, isFetching, refetch } =
    useListCategoriesAdminQuery(undefined, {
      refetchOnMountOrArgChange: true,
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

  // UI güvenli kopya: slug & booleans & img alanı
  const rows: Category[] = useMemo(
    () =>
      (data as Category[]).map((c) => ({
        ...c,
        slug: c.slug && c.slug.trim() ? c.slug : slugify(c.name),
        is_active: c.is_active ?? true,
        is_featured: c.is_featured ?? false,
        image_url: c.image_url ?? null,
        image_asset_id: c.image_asset_id ?? null,
        image_alt: c.image_alt ?? null,
      })),
    [data]
  );

  const parentName = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [rows]);

  const filtered: Category[] = useMemo(() => {
    if (filter === "main") return rows.filter((c) => c.parent_id === null);
    if (filter === "sub") return rows.filter((c) => c.parent_id !== null);
    return rows;
  }, [rows, filter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pageItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => setCurrentPage(1), [filter]);

  const onDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?"))
      return;
    try {
      await delCat(id).unwrap();
      toast({
        title: "Başarılı",
        description: "Kategori silindi.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Hata",
        description: "Kategori silinemedi.",
        variant: "destructive",
      });
    }
  };

  const onToggleActive = async (c: Category) => {
    try {
      await toggleActive({
        id: c.id,
        is_active: !c.is_active,
      }).unwrap();
    } catch {
      toast({
        title: "Hata",
        description: "Aktif/Pasif işlemi başarısız.",
        variant: "destructive",
      });
    }
  };

  const onToggleFeatured = async (c: Category) => {
    try {
      await toggleFeatured({
        id: c.id,
        is_featured: !c.is_featured,
      }).unwrap();
    } catch {
      toast({
        title: "Hata",
        description: "Öne çıkarma işlemi başarısız.",
        variant: "destructive",
      });
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

        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as FilterTab)}
        >
          <TabsList>
            <TabsTrigger value="all">
              Tümü ({rows.length})
            </TabsTrigger>
            <TabsTrigger value="main">
              Ana Kategoriler (
              {rows.filter((c) => c.parent_id === null).length})
            </TabsTrigger>
            <TabsTrigger value="sub">
              Alt Kategoriler (
              {rows.filter((c) => c.parent_id !== null).length})
            </TabsTrigger>
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
                      <AssetThumb
                        categoryId={c.id}
                        imageUrl={c.image_url}
                        alt={c.image_alt || c.name}
                        className="h-8 w-8 rounded object-cover border"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {c.name}
                    </TableCell>
                    <TableCell>
                      {c.parent_id
                        ? parentName.get(c.parent_id) || "—"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {c.slug && c.slug.trim() ? c.slug : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={!!c.is_active}
                        onCheckedChange={() => onToggleActive(c)}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={!!c.is_featured}
                        onCheckedChange={() =>
                          onToggleFeatured(c)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/admin/categories/edit/${c.id}`
                          )
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(c.id)}
                      >
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
                  {Array.from(
                    { length: totalPages },
                    (_, i) => i + 1
                  ).map((p) => (
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
                        setCurrentPage((p) =>
                          Math.min(totalPages, p + 1)
                        );
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
