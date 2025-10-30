import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  created_at: string;
}

export default function PageList() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("custom_pages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPages((data || []) as CustomPage[]);
    } catch (error: any) {
      console.error("Error fetching pages:", error);
      toast.error("Sayfalar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await metahub.from("custom_pages").delete().eq("id", id);

      if (error) throw error;
      toast.success("Sayfa silindi");
      fetchPages();
    } catch (error: any) {
      console.error("Error deleting page:", error);
      toast.error("Sayfa silinirken hata oluştu");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Sayfalar">
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  const totalPages = Math.ceil(pages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPages = pages.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout title="Sayfalar">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Özel sayfalar oluşturun (site.com/sayfa-adi)
          </p>
          <Button onClick={() => navigate("/admin/pages/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Sayfa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sayfa Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Henüz sayfa eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell>
                        <code className="text-xs">/{page.slug}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.is_published ? "default" : "secondary"}>
                          {page.is_published ? "Yayında" : "Taslak"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(page.created_at).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {page.is_published && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/${page.slug}`, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/pages/edit/${page.id}`)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu sayfayı silmek istediğinizden emin misiniz?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(page.id)}>
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
