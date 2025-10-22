import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count: number;
  parent_id: string | null;
  parent_category?: {
    name: string;
  };
}

export default function CategoryList() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "main" | "sub">("all");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await metahub
        .from("categories")
        .select(`
          *,
          parent_category:parent_id(name)
        `)
        .order("name");

      if (categoriesError) throw categoriesError;

      // Fetch actual product counts for each category
      const { data: productsData, error: productsError } = await metahub
        .from("products")
        .select("category_id");

      if (productsError) throw productsError;

      // Count products per category
      const productCounts = (productsData || []).reduce((acc, product) => {
        if (product.category_id) {
          acc[product.category_id] = (acc[product.category_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Update categories with actual product counts
      const categoriesWithCounts = (categoriesData || []).map(category => ({
        ...category,
        product_count: productCounts[category.id] || 0
      }));

      console.log("Categories with actual counts:", categoriesWithCounts);
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await metahub.from("categories").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Başarılı", description: "Kategori silindi." });
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Hata",
        description: "Kategori silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <AdminLayout title="Kategori Yönetimi"><div>Yükleniyor...</div></AdminLayout>;

  // Filter categories based on selected filter
  const filteredCategories = categories.filter((category) => {
    if (filter === "main") return category.parent_id === null;
    if (filter === "sub") return category.parent_id !== null;
    return true; // "all"
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout title="Kategori Yönetimi">
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Kategori Yönetimi</h3>
            <Button onClick={() => navigate("/admin/categories/new")} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kategori Ekle
            </Button>
          </div>

          <Tabs value={filter} onValueChange={(value) => {
            setFilter(value as "all" | "main" | "sub");
            setCurrentPage(1); // Reset to first page when filter changes
          }}>
            <TabsList>
              <TabsTrigger value="all">Tümü ({categories.length})</TabsTrigger>
              <TabsTrigger value="main">
                Ana Kategoriler ({categories.filter(c => c.parent_id === null).length})
              </TabsTrigger>
              <TabsTrigger value="sub">
                Alt Kategoriler ({categories.filter(c => c.parent_id !== null).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Üst Kategori</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Ürün Sayısı</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  {category.parent_category ? category.parent_category.name : "-"}
                </TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.product_count}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
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
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AdminLayout>
  );
}
