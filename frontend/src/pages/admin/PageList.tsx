// =============================================================
// FILE: src/pages/admin/custom-pages/PageList.tsx
// =============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

import {
  useListCustomPagesAdminQuery,
  useDeleteCustomPageAdminMutation,
  useGetCustomPageAdminByIdQuery,
} from "@/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints";
import type { CustomPageView } from "@/integrations/metahub/rtk/types/customPages";

/* ---------- Kapak Thumb: nokta atışı görsel seç ---------- */
function PageCoverThumb(props: {
  id: string;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  title?: string | null;
}) {
  const hasImg = !!props.featured_image;

  const { data: detail } = useGetCustomPageAdminByIdQuery(props.id, {
    skip: hasImg,
  });

  const src =
    props.featured_image ??
    (detail as any)?.featured_image ??
    (detail as any)?.image_url ??
    null;

  const alt =
    props.featured_image_alt ??
    (detail as any)?.featured_image_alt ??
    (detail as any)?.image_alt ??
    props.title ??
    "Kapak";

  if (!src) {
    return (
      <div className="h-10 w-16 rounded bg-muted/50 border flex items-center justify-center text-[10px] text-muted-foreground">
        Yok
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Kapak"}
      className="h-10 w-16 object-cover rounded border"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export default function PageList() {
  const navigate = useNavigate();

  const { data: list = [], isLoading } = useListCustomPagesAdminQuery();
  const [deletePage, { isLoading: deleting }] =
    useDeleteCustomPageAdminMutation();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const pages = useMemo(() => list as CustomPageView[], [list]);

  const totalPages = Math.ceil(pages.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPages = pages.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id: string) => {
    try {
      await deletePage(id).unwrap();
      toast.success("Sayfa silindi");
    } catch (err) {
      console.error(err);
      toast.error("Sayfa silinirken hata oluştu");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Sayfalar">
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

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
                  <TableHead>Görsel</TableHead>
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
                    <TableCell colSpan={6} className="text-center">
                      Henüz sayfa eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="py-2">
                        <PageCoverThumb
                          id={page.id}
                          featured_image={page.featured_image}
                          featured_image_alt={page.featured_image_alt}
                          title={page.title}
                        />
                      </TableCell>

                      <TableCell className="font-medium">
                        {page.title}
                      </TableCell>

                      <TableCell>
                        <code className="text-xs">/{page.slug}</code>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            page.is_published ? "default" : "secondary"
                          }
                        >
                          {page.is_published ? "Yayında" : "Taslak"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {page.created_at
                          ? new Date(
                            page.created_at,
                          ).toLocaleDateString("tr-TR")
                          : "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {page.is_published && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `/${page.slug}`,
                                  "_blank",
                                )
                              }
                              title="Sayfayı görüntüle"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/admin/pages/edit/${page.id}`,
                              )
                            }
                            title="Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deleting}
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Emin misiniz?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu sayfayı kalıcı olarak silmek
                                  üzeresiniz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  İptal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDelete(page.id)
                                  }
                                >
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
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1,
              ).map((page) => (
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
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1),
                    );
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
