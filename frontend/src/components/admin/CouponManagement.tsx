import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_purchase: 0,
    max_uses: null as number | null,
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: null as string | null,
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data, error } = await metahub
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Kuponlar yüklenemedi");
      console.error(error);
    } else {
      setCoupons((data as Coupon[]) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCoupon) {
      const { error } = await metahub
        .from("coupons")
        .update(formData)
        .eq("id", editingCoupon.id);

      if (error) {
        toast.error("Kupon güncellenemedi");
        console.error(error);
      } else {
        toast.success("Kupon güncellendi");
        setDialogOpen(false);
        fetchCoupons();
        resetForm();
      }
    } else {
      const { error } = await metahub.from("coupons").insert([formData]);

      if (error) {
        toast.error("Kupon eklenemedi");
        console.error(error);
      } else {
        toast.success("Kupon eklendi");
        setDialogOpen(false);
        fetchCoupons();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kuponu silmek istediğinizden emin misiniz?")) return;

    const { error } = await metahub.from("coupons").delete().eq("id", id);

    if (error) {
      toast.error("Kupon silinemedi");
      console.error(error);
    } else {
      toast.success("Kupon silindi");
      fetchCoupons();
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_uses: coupon.max_uses,
      valid_from: coupon.valid_from.split("T")[0],
      valid_until: coupon.valid_until
        ? coupon.valid_until.split("T")[0]
        : null,
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase: 0,
      max_uses: null,
      valid_from: new Date().toISOString().split("T")[0],
      valid_until: null,
      is_active: true,
    });
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kupon Yönetimi</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Kupon Düzenle" : "Yeni Kupon Ekle"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kupon Kodu *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    required
                    placeholder="SUMMER2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">İndirim Türü</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    İndirim Değeri *
                    {formData.discount_type === "percentage" && " (%)"}
                    {formData.discount_type === "fixed" && " (₺)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value),
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_purchase">Minimum Alışveriş (₺)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_purchase: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_uses">
                    Maksimum Kullanım (boş = sınırsız)
                  </Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_uses: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_from">Başlangıç Tarihi</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">
                    Bitiş Tarihi (boş = süresiz)
                  </Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valid_until: e.target.value || null,
                      })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit">
                  {editingCoupon ? "Güncelle" : "Ekle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell className="font-mono font-bold">
                {coupon.code}
              </TableCell>
              <TableCell>
                {coupon.discount_type === "percentage"
                  ? `%${coupon.discount_value}`
                  : `₺${coupon.discount_value}`}
              </TableCell>
              <TableCell>₺{coupon.min_purchase}</TableCell>
              <TableCell>
                {coupon.used_count}
                {coupon.max_uses ? ` / ${coupon.max_uses}` : " / ∞"}
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  {new Date(coupon.valid_from).toLocaleDateString("tr-TR")}
                  {coupon.valid_until && (
                    <>
                      {" - "}
                      {new Date(coupon.valid_until).toLocaleDateString("tr-TR")}
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${coupon.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {coupon.is_active ? "Aktif" : "Pasif"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
