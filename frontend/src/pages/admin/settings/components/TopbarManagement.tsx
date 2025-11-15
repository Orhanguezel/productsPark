// =============================================================
// FILE: src/components/admin/topbar/TopbarManagement.tsx
// =============================================================
"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Save, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

import type { TopbarSetting } from "@/integrations/metahub/db/types/topbar";
import type { Coupon } from "@/integrations/metahub/db/types/coupon";

import {
  useListTopbarAdminQuery,
  useCreateTopbarAdminMutation,
  useUpdateTopbarAdminMutation,
  useDeleteTopbarAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/topbar_admin.endpoints";
import { useListCouponsAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/coupons_admin.endpoints";

const emptyToNull = (v: string | null | undefined) =>
  v == null ? null : v.trim() === "" ? null : v.trim();

type AdminTopbarRow = TopbarSetting & {
  coupon_id?: string | null;
  coupon_code?: string | null;
};

type FormState = {
  is_active: boolean;
  message: string;
  coupon_id: string | null;
  link_url: string;
  show_ticker: boolean;
};

const initialForm: FormState = {
  is_active: true,
  message: "",
  coupon_id: null,
  link_url: "",
  show_ticker: false,
};

// Sentinel değer: Radix Select için "boş" state
const NONE = "__none__";

export default function TopbarManagement() {
  const { data: items = [], isFetching } = useListTopbarAdminQuery({
    order: "desc",
    sort: "updated_at",
    limit: 100,
  });

  const { data: coupons = [], isLoading: couponsLoading, refetch: refetchCoupons } = useListCouponsAdminQuery();

  const couponIndex = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of coupons as Coupon[]) {
      m[c.id] = c.code;
    }
    return m;
  }, [coupons]);

  const couponCodeById = (id?: string | null) =>
    id ? couponIndex[id] ?? null : null;

  const [createTopbar, { isLoading: creating }] =
    useCreateTopbarAdminMutation();
  const [updateTopbar, { isLoading: updating }] =
    useUpdateTopbarAdminMutation();
  const [deleteTopbar, { isLoading: deleting }] =
    useDeleteTopbarAdminMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTopbarRow | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const list: AdminTopbarRow[] = items as AdminTopbarRow[];
  const active = useMemo(
    () => list.find((x) => x.is_active) || null,
    [list],
  );

  const disabled = isFetching || creating || updating || deleting;

  function openNew() {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  }

  function openEdit(item: AdminTopbarRow) {
    setEditing(item);
    setForm({
      is_active: !!item.is_active,
      message: item.message ?? "",
      coupon_id: item.coupon_id ?? null,
      link_url: item.link_url ?? "",
      show_ticker: !!item.show_ticker,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.message || form.message.trim() === "") {
      toast.error("Mesaj alanı zorunludur");
      return;
    }

    const body = {
      // UpsertTopbarBody ile birebir
      is_active: !!form.is_active,
      message: form.message.trim(),
      coupon_id: form.coupon_id ?? null,
      link_url: emptyToNull(form.link_url),
      show_ticker: !!form.show_ticker,
    };

    try {
      if (editing) {
        await updateTopbar({ id: editing.id, body }).unwrap();
        toast.success("Topbar güncellendi");
      } else {
        await createTopbar(body).unwrap();
        toast.success("Topbar oluşturuldu");
      }
      setOpen(false);
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string }; message?: string })?.data
          ?.message ||
        (e as { message?: string })?.message ||
        "Kaydedilemedi";
      toast.error(msg);
    }
  }

  async function del(id: string) {
    if (!confirm("Silinsin mi?")) return;
    try {
      await deleteTopbar(id).unwrap();
      toast.success("Silindi");
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string }; message?: string })?.data
          ?.message ||
        (e as { message?: string })?.message ||
        "Silinemedi";
      toast.error(msg);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Topbar Yönetimi</CardTitle>
          <Button onClick={openNew} disabled={disabled}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isFetching && (
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Durum</TableHead>
              <TableHead>Mesaj</TableHead>
              <TableHead>Kupon</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((t) => {
              const code =
                t.coupon_code ??
                couponCodeById(t.coupon_id) ??
                "-";
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <Badge
                      variant={t.is_active ? "default" : "secondary"}
                    >
                      {t.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-lg truncate">
                    {t.message}
                  </TableCell>
                  <TableCell className="font-mono">{code}</TableCell>
                  <TableCell>
                    {t.link_url ? (
                      <a
                        className="underline"
                        href={t.link_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.link_url}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(t)}
                        disabled={disabled}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => del(t.id)}
                        disabled={disabled}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {list.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Kayıt yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="max-w-2xl"
            aria-describedby="topbar-dialog-desc"
          >
            <DialogHeader>
              <DialogTitle>
                {editing ? "Topbarı Düzenle" : "Yeni Topbar"}
              </DialogTitle>
              <DialogDescription
                id="topbar-dialog-desc"
                className="sr-only"
              >
                Topbar ayarlarını burada düzenleyebilirsiniz.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!form.is_active}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, is_active: v }))
                  }
                />
                <Label>Aktif</Label>
              </div>

              <div className="space-y-2">
                <Label>Mesaj *</Label>
                <Textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      message: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Kupon</Label>
                <Select
                  value={form.coupon_id ?? NONE}
                  onValueChange={(val) =>
                    setForm((f) => ({
                      ...f,
                      coupon_id: val === NONE ? null : val,
                    }))
                  }
                  disabled={couponsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        couponsLoading
                          ? "Yükleniyor..."
                          : "Kupon seçin (opsiyonel)"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Kupon yok —</SelectItem>
                    {(coupons as Coupon[]).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code}{" "}
                        {c.discount_type === "percentage"
                          ? `(%${c.discount_value})`
                          : `(${c.discount_value})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!couponsLoading && coupons.length === 0 && (
                  <p className="text-xs text-destructive">
                    Kuponlar alınamadı (liste boş olabilir).
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={form.link_url}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      link_url: e.target.value,
                    }))
                  }
                  placeholder="/kampanyalar"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={!!form.show_ticker}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, show_ticker: v }))
                  }
                />
                <Label>Metni kayan yazı yap</Label>
              </div>

              <div className="flex justify-end">
                <Button onClick={save} disabled={creating || updating}>
                  <Save className="w-4 h-4 mr-2" />
                  {creating || updating
                    ? "Kaydediliyor..."
                    : "Kaydet"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {active && (
          <p className="text-xs text-muted-foreground mt-4">
            Aktif Topbar:{" "}
            <span className="font-medium">{active.message}</span>
            {active.coupon_id ? (
              <>
                {" "}
                — Kupon:{" "}
                <span className="font-mono">
                  {couponCodeById(active.coupon_id) ?? "-"}
                </span>
              </>
            ) : null}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
