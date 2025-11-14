// =============================================================
// FILE: src/components/admin/products/ProductList.tsx
// =============================================================
"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, ImageOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { AdminLayout } from "@/components/admin/AdminLayout";

// RTK Admin endpoints (core ürün list/delete)
import {
  useListProductsAdminQuery,
  useDeleteProductAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints";
import { useListCategoriesAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

// Types
import type {
  ProductAdmin,
  CategoryRow,
} from "@/integrations/metahub/db/types/products";

const formatTRY = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n ?? 0);

export default function ProductList() {
  const navigate = useNavigate();

  // server data
  const { data: productsData = [], isFetching: loadingProducts } =
    useListProductsAdminQuery();
  const { data: categories = [], isFetching: loadingCategories } =
    useListCategoriesAdminQuery();

  const [deleteProduct, { isLoading: deleting }] =
    useDeleteProductAdminMutation();

  // ui state
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const getThumb = (p: ProductAdmin): string | null => {
    // Storage-first → legacy → gallery fallback
    return (
      (typeof p.featured_image === "string" && p.featured_image) ||
      (typeof p.image_url === "string" && p.image_url) ||
      (Array.isArray(p.gallery_urls) && p.gallery_urls[0]) ||
      null
    );
  };

  const getCategoryName = (
    p: ProductAdmin,
    cats: Pick<CategoryRow, "id" | "name">[]
  ): string | null => {
    // Prefer embedded relation; else look up by category_id from list
    if (p.categories?.name) return p.categories.name;
    if (p.category_id) {
      const m = cats.find((c) => c.id === p.category_id);
      if (m) return m.name;
    }
    return null;
  };

  // filters
  const filteredProducts = useMemo(() => {
    let list = [...productsData] as ProductAdmin[];

    if (filterCategory !== "all") {
      list = list.filter((p) => (p.category_id ?? "") === filterCategory);
    }

    if (filterStatus !== "all") {
      list = list.filter(
        (p) => !!p.is_active === (filterStatus === "active")
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name ?? "").toLowerCase().includes(q) ||
          (p.slug ?? "").toLowerCase().includes(q) ||
          (getCategoryName(p, categories)?.toLowerCase().includes(q) ??
            false)
      );
    }

    // created_at desc (client-side)
    list.sort((a, b) => {
      const da = new Date(String(a.created_at || 0)).getTime();
      const db = new Date(String(b.created_at || 0)).getTime();
      return db - da;
    });

    return list;
  }, [productsData, filterCategory, filterStatus, searchQuery, categories]);

  // pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => handlePageChange(1)}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2)
        items.push(<PaginationEllipsis key="ellipsis-start" />);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1)
        items.push(<PaginationEllipsis key="ellipsis-end" />);
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const onDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteProduct(id).unwrap();
      toast({ title: "Başarılı", description: "Ürün silindi." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const loading = loadingProducts || loadingCategories || deleting;

  return (
    <AdminLayout title="Ürün Yönetimi">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <h3 className="text-lg font-semibold">Ürün Yönetimi</h3>
          {/* sidebarda aktiflik için bu rota: /admin/products/new */}
          <Button
            onClick={() => navigate("/admin/products/new")}
            className="gradient-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ürün
          </Button>
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Ürün ara (isim, slug, kategori)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            value={filterCategory}
            onValueChange={(v) => {
              setFilterCategory(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Pasif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Yükleniyor...</div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              Toplam {filteredProducts.length} ürün bulundu
              {filteredProducts.length > itemsPerPage &&
                ` (Sayfa ${currentPage}/${totalPages})`}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Görsel</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => {
                  const thumb = getThumb(product);
                  const catName = getCategoryName(product, categories);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-14 h-14 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.name ?? "Ürün görseli"}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <ImageOff className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="line-clamp-1">
                            {product.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /{product.slug}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {catName ? (
                          catName
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {formatTRY(Number(product.price || 0))}
                      </TableCell>

                      <TableCell>{product.stock_quantity ?? 0}</TableCell>

                      <TableCell>
                        {product.is_active ? (
                          <span className="text-green-600">Aktif</span>
                        ) : (
                          <span className="text-red-600">Pasif</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/products/edit/${product.id}`)
                          }
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(product.id)}
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {currentProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      Kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          currentPage > 1 &&
                          handlePageChange(currentPage - 1)
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {renderPaginationItems()}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          currentPage < totalPages &&
                          handlePageChange(currentPage + 1)
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
