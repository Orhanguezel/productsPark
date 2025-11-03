import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { AdminLayout } from "@/components/admin/AdminLayout";

// RTK Admin endpoints
import {
  useListCouponsAdminQuery,
  useDeleteCouponAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/coupons_admin.endpoints";
import type { Coupon } from "@/integrations/metahub/db/types/coupon";

export default function CouponList() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useListCouponsAdminQuery();
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponAdminMutation();

  const coupons: Coupon[] = useMemo(() => data ?? [], [data]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil((coupons?.length ?? 0) / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCoupons = coupons.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kuponu silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteCoupon(id).unwrap();
      toast.success("Kupon silindi");
      refetch();
    } catch (e) {
      console.error(e);
      toast.error("Kupon silinemedi");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Kupon Yönetimi">
        <div>Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kupon Yönetimi">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Kupon Yönetimi</h2>
          <Button onClick={() => navigate("/admin/coupons/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kupon
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>İndirim</TableHead>
              <TableHead>Min. Alışveriş</TableHead>
              <TableHead>Kullanım</TableHead>
              <TableHead>Geçerlilik</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCoupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                <TableCell>
                  {coupon.discount_type === "percentage"
                    ? `%${coupon.discount_value}`
                    : `₺${coupon.discount_value}`}
                </TableCell>
                <TableCell>₺{coupon.min_purchase}</TableCell>
                <TableCell>
                  {(coupon.used_count ?? 0)}
                  {coupon.max_uses ? ` / ${coupon.max_uses}` : " / ∞"}
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    {coupon.valid_from
                      ? new Date(coupon.valid_from).toLocaleDateString("tr-TR")
                      : "-"}
                    {coupon.valid_until && (
                      <>
                        {" - "}
                        {new Date(coupon.valid_until).toLocaleDateString("tr-TR")}
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    coupon.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {coupon.is_active ? "Aktif" : "Pasif"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/coupons/edit/${coupon.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paginatedCoupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Kupon bulunamadı.
                </TableCell>
              </TableRow>
            )}
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
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
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
