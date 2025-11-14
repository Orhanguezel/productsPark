// src/pages/admin/BlogList.tsx

import { useNavigate } from "react-router-dom";
import {
  useListBlogPostsAdminQuery,
  useDeleteBlogPostAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/blog_admin.endpoints";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
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
import { toast } from "sonner";
import { useMemo, useState } from "react";
import "@/styles/richtext.css";

export default function BlogList() {
  const navigate = useNavigate();
  const { data: posts = [], isFetching } = useListBlogPostsAdminQuery(
    { sort: "created_at", order: "desc", limit: 200, offset: 0 },
    { refetchOnMountOrArgChange: true },
  );
  const [delPost, { isLoading: deleting }] =
    useDeleteBlogPostAdminMutation();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(posts.length / itemsPerPage)),
    [posts.length],
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPosts = posts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Bu blog yazısını silmek istediğinizden emin misiniz?",
      )
    )
      return;
    try {
      await delPost(id).unwrap();
      toast.success("Blog yazısı silindi.");
    } catch (err: any) {
      console.error(err);
      toast.error("Blog yazısı silinirken bir hata oluştu.");
    }
  };

  if (isFetching) {
    return (
      <AdminLayout title="Blog Yazıları">
        <div>Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Blog Yazıları">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Blog Yazıları</h3>
          <Button
            onClick={() => navigate("/admin/blog/new")}
            className="gradient-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Blog Yazısı
          </Button>
        </div>

        {/* Tabloyu yatayda güvene al */}
        <div className="overflow-x-auto rounded border">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Kapak</TableHead>
                <TableHead className="w-1/3">Başlık</TableHead>
                <TableHead className="w-1/6">Yazar</TableHead>
                <TableHead className="w-1/6">Durum</TableHead>
                <TableHead className="w-1/6">Tarih</TableHead>
                <TableHead className="text-right w-[120px]">
                  İşlemler
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPosts.map((post: any) => (
                <TableRow key={post.id}>
                  {/* Kapak görseli */}
                  <TableCell>
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.image_alt || post.title || "Kapak"}
                        className="h-12 w-16 rounded object-cover border bg-muted"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        —
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="font-medium break-words overflow-wrap:anywhere">
                    {post.title}
                  </TableCell>

                  <TableCell className="break-words overflow-wrap:anywhere">
                    {post.author_name || "—"}
                  </TableCell>

                  <TableCell>
                    {post.is_published ? (
                      <span className="text-green-600">Yayında</span>
                    ) : (
                      <span className="text-yellow-600">Taslak</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {post.created_at
                      ? new Date(
                          post.created_at,
                        ).toLocaleDateString("tr-TR")
                      : "—"}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/blog/edit/${post.id}`)
                      }
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleting}
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1)
                      setCurrentPage(currentPage - 1);
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
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
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
