// =============================================================
// FILE: src/pages/admin/contacts/ContactsList.tsx
// =============================================================

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useListContactsAdminQuery,
  useRemoveContactAdminMutation,
  useUpdateContactAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/contacts_admin.endpoints";
import type {
  ContactView,
  ContactStatus,
  ContactUpdateInput,
} from "@/integrations/metahub/rtk/types/contacts";
import { Button } from "@/components/ui/button";
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
import { Eye, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/* ---- Durum için label & renk haritaları ---- */

const STATUS_LABELS: Record<ContactStatus, string> = {
  new: "Yeni",
  in_progress: "İşlemde",
  closed: "Kapalı",
};

const STATUS_CLASSES: Record<ContactStatus, string> = {
  new: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  closed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function ContactsList() {
  const navigate = useNavigate();

  // Listeyi çek
  const {
    data: contacts = [],
    isFetching,
  } = useListContactsAdminQuery(
    { limit: 200, offset: 0, orderBy: "created_at", order: "desc" },
    { refetchOnMountOrArgChange: true },
  );

  const [removeContact, { isLoading: deleting }] =
    useRemoveContactAdminMutation();

  const [updateContact, { isLoading: updating }] =
    useUpdateContactAdminMutation();

  // Basit sayfalama (FE tarafı)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(contacts.length / itemsPerPage)),
    [contacts.length],
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = contacts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Çözüldü / beklemede toggle
  const handleToggleResolved = async (contact: ContactView) => {
    try {
      const next = !contact.is_resolved;
      const patch: ContactUpdateInput = {
        is_resolved: next,
      };

      await updateContact({
        id: contact.id,
        patch,
      }).unwrap();

      toast.success(
        next
          ? "Mesaj çözüldü olarak işaretlendi."
          : "Mesaj tekrar beklemede olarak işaretlendi.",
      );
    } catch (err) {
      console.error(err);
      toast.error("Durum güncellenirken bir hata oluştu.");
    }
  };

  // Silme
  const handleDelete = async (id: string) => {
    if (!confirm("Bu iletişim mesajını silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await removeContact(id).unwrap();
      toast.success("Mesaj silindi.");
    } catch (err) {
      console.error(err);
      toast.error("Mesaj silinirken bir hata oluştu.");
    }
  };

  if (isFetching) {
    return (
      <AdminLayout title="İletişim Mesajları">
        <div>Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="İletişim Mesajları">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">İletişim Mesajları</h3>
        </div>

        {/* Tabloyu yatayda güvene al */}
        <div className="overflow-x-auto rounded border">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">Gönderen</TableHead>
                <TableHead className="w-1/5">E-posta</TableHead>
                <TableHead className="w-1/3">Konu / Mesaj</TableHead>
                <TableHead className="w-[160px]">Durum / Çözüm</TableHead>
                <TableHead className="w-[150px]">Tarih</TableHead>
                <TableHead className="text-right w-[140px]">
                  İşlemler
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedContacts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Henüz iletişim mesajı yok.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedContacts.map((contact: ContactView) => {
                  const name = contact.name || "—";
                  const email = contact.email || "—";

                  const messagePreview =
                    contact.message?.slice(0, 60) || "";
                  const subject =
                    contact.subject || messagePreview || "—";

                  const createdAt = contact.created_at
                    ? new Date(contact.created_at).toLocaleString("tr-TR")
                    : "—";

                  const status = contact.status;
                  const isResolved = contact.is_resolved;

                  return (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium break-words overflow-wrap:anywhere">
                        {name}
                      </TableCell>

                      <TableCell className="break-words overflow-wrap:anywhere">
                        {email}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground break-words overflow-wrap:anywhere">
                        {subject}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {/* Ana durum (status) */}
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                              STATUS_CLASSES[status]
                            }
                          >
                            {STATUS_LABELS[status]}
                          </span>

                          {/* Çözüldü / Beklemede */}
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium " +
                              (isResolved
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300")
                            }
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {isResolved ? "Çözüldü" : "Beklemede"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {createdAt}
                      </TableCell>

                      <TableCell className="text-right">
                        {/* Detay (okuma) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/contacts/${contact.id}`)
                          }
                          title="Mesajı Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Çözüldü toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updating}
                          onClick={() => handleToggleResolved(contact)}
                          title={
                            isResolved
                              ? "Tekrar beklemede olarak işaretle"
                              : "Çözüldü olarak işaretle"
                          }
                        >
                          <CheckCircle2
                            className={
                              "w-4 h-4 " +
                              (isResolved
                                ? "text-emerald-600"
                                : "text-muted-foreground")
                            }
                          />
                        </Button>

                        {/* Sil */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleting}
                          onClick={() => handleDelete(contact.id)}
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
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
                ),
              )}
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
