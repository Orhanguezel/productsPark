// =============================================================
// FILE: src/pages/admin/popups/PopupForm.tsx
// =============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, Save, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  useGetPopupAdminByIdQuery,
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useDeletePopupAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/popups_admin.endpoints";

import {
  useUploadStorageAssetAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

type Frequency = "always" | "once" | "daily" | "weekly";
type DisplayPages = "all" | "home" | "products" | "categories";

type FormState = {
  title: string;
  content: string;

  // Görsel alanları
  image_url: string;
  image_asset_id: string;
  image_alt: string;

  product_id: string;
  coupon_code: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  start_date: Date | null;
  end_date: Date | null;
  display_frequency: Frequency;
  display_pages: DisplayPages;
  priority: number;
  delay_seconds: number;
  duration_seconds: number;
};

const defaults: FormState = {
  title: "",
  content: "",
  image_url: "",
  image_asset_id: "",
  image_alt: "",
  product_id: "",
  coupon_code: "",
  button_text: "",
  button_link: "",
  is_active: true,
  start_date: null,
  end_date: null,
  display_frequency: "always",
  display_pages: "all",
  priority: 0,
  delay_seconds: 2,
  duration_seconds: 0,
};

function slugify(v: string) {
  return (v || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "popup";
}

function errMsg(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const d = (e as { data?: { error?: { message?: string } } }).data;
    if (d?.error?.message) return d.error.message;
  }
  return "Beklenmeyen bir hata oluştu.";
}

export default function PopupForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const { data, isFetching, isLoading, isSuccess } = useGetPopupAdminByIdQuery(id as string, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });

  const [createPopup, { isLoading: isCreating }] = useCreatePopupAdminMutation();
  const [updatePopup, { isLoading: isUpdating }] = useUpdatePopupAdminMutation();
  const [deletePopup, { isLoading: isDeleting }] = useDeletePopupAdminMutation();

  const [uploadAsset, { isLoading: isUploading }] = useUploadStorageAssetAdminMutation();

  const [formData, setFormData] = useState<FormState>(defaults);
  const saving = isCreating || isUpdating;

  // File input referansı (aynı id ile çakışmasın)
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEdit) {
      setFormData(defaults);
      return;
    }
    if (isFetching || isLoading) return;
    if (isSuccess && data) {
      setFormData({
        title: data.title || "",
        content: data.content || "",

        image_url: data.image_url || "",
        image_asset_id: (data as { image_asset_id?: string | null }).image_asset_id ?? "",
        image_alt: (data as { image_alt?: string | null }).image_alt ?? "",

        product_id: data.product_id || "",
        coupon_code: data.coupon_code || "",
        button_text: data.button_text || "",
        button_link: data.button_link || "",
        is_active: !!data.is_active,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null,
        display_frequency: (data.display_frequency as Frequency) || "always",
        display_pages: (data.display_pages as DisplayPages) || "all",
        priority: data.priority ?? 0,
        delay_seconds: Number(data.delay_seconds ?? 0),
        duration_seconds: data.duration_seconds ?? 0,
      });
    }
  }, [isEdit, isFetching, isLoading, isSuccess, data]);

  const canSave = useMemo(
    () => !!formData.title && !!formData.content,
    [formData]
  );

  const handleSave = async () => {
    if (!canSave) {
      toast({ title: "Uyarı", description: "Zorunlu alanları doldurun.", variant: "destructive" });
      return;
    }

    const payload = {
      title: formData.title,
      content: formData.content,

      // Görsel alanları
      image_url: formData.image_url || null,
      image_asset_id: formData.image_asset_id || null,
      image_alt: formData.image_alt || null,

      button_text: formData.button_text || null,
      button_link: formData.button_link || null,
      is_active: formData.is_active,
      display_frequency: formData.display_frequency,
      delay_seconds: formData.delay_seconds,
      start_date: formData.start_date ? formData.start_date.toISOString() : null,
      end_date: formData.end_date ? formData.end_date.toISOString() : null,

      // BE ignore (ileride şema eklenirse hazır)
      product_id: formData.product_id || null,
      coupon_code: formData.coupon_code || null,
      display_pages: formData.display_pages,
      priority: formData.priority,
      duration_seconds: formData.duration_seconds,
    };

    try {
      if (isEdit && id) {
        await updatePopup({ id, body: payload }).unwrap();
        toast({ title: "Başarılı", description: "Popup güncellendi." });
      } else {
        await createPopup(payload).unwrap();
        toast({ title: "Başarılı", description: "Popup oluşturuldu." });
      }
      navigate("/admin/popups");
    } catch (e: unknown) {
      console.error(e);
      toast({ title: "Hata", description: errMsg(e), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    if (!window.confirm("Bu popup silinecek. Emin misiniz?")) return;
    try {
      await deletePopup(id).unwrap();
      toast({ title: "Silindi", description: "Popup silindi." });
      navigate("/admin/popups");
    } catch (e: unknown) {
      console.error(e);
      toast({ title: "Hata", description: errMsg(e), variant: "destructive" });
    }
  };

  // Görsel yükleme (storage → asset id + url)
  const [uploading, setUploading] = useState(false);
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // aynı dosyayı tekrar seçebilmek için temizle
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Geçersiz", description: "Lütfen görsel seçin.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Büyük Dosya", description: "Maksimum 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const safe = slugify(formData.title || "popup");
      const folder = `popups/${safe}/cover`;

      const asset = await uploadAsset({
        file,
        bucket: "popups",
        folder,
        metadata: { module: "popups", type: "cover" },
      }).unwrap();

      // asset: { id, url, ... } bekliyoruz (RTK storage endpoint’inle uyumlu)
      const url = (asset as { url?: string }).url ?? "";
      const id = (asset as { id?: string }).id ?? "";

      setFormData((s) => ({
        ...s,
        image_url: url || s.image_url,
        image_asset_id: id || s.image_asset_id,
      }));

      toast({ title: "Yüklendi", description: "Görsel başarıyla yüklendi." });
    } catch (e: unknown) {
      console.error(e);
      toast({ title: "Hata", description: errMsg(e), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setFormData((s) => ({
      ...s,
      image_url: "",
      image_asset_id: "",
      image_alt: "",
    }));
  };

  return (
    <AdminLayout title={isEdit ? "Popup Düzenle" : "Yeni Popup"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/popups")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{isEdit ? "Popup Düzenle" : "Yeni Popup"}</h1>
          {isEdit && (
            <Button variant="destructive" className="ml-auto" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Siliniyor..." : "Sil"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold">Popup İçeriği</h2>

              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">İçerik *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Popup Görseli</Label>

                {!formData.image_url ? (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onPickImage}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading || isUploading}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading || isUploading ? "Yükleniyor..." : "Görsel Yükle"}
                    </Button>
                    <p className="text-xs text-muted-foreground">PNG/JPG/WEBP, max 5MB</p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="relative border rounded-lg overflow-hidden">
                      <img
                        src={formData.image_url}
                        alt={formData.image_alt || "Önizleme"}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://placehold.co/600x400?text=Image";
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="image_alt">Alt Metin (SEO)</Label>
                        <Input
                          id="image_alt"
                          value={formData.image_alt}
                          onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                          placeholder='Örn: "Popup kampanya görseli"'
                        />
                        {formData.image_asset_id && (
                          <p className="text-xs text-muted-foreground">
                            Asset ID: {formData.image_asset_id}
                          </p>
                        )}
                      </div>
                      <div className="self-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploading || isUploading}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Farklı Görsel Yükle
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold">Ürün ve Kampanya</h2>

              {/* Ürün seçimi (opsiyonel, BE ignore) */}
              <div className="space-y-2">
                <Label htmlFor="product_id">Ürün (Opsiyonel)</Label>
                <Select
                  value={formData.product_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger><SelectValue placeholder="Ürün seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ürün Seçilmedi</SelectItem>
                    {/* Ürün listesi gerekiyorsa burada map'lersin */}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon_code">Kupon Kodu</Label>
                <Input
                  id="coupon_code"
                  value={formData.coupon_code}
                  onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
                  placeholder="INDIRIM25"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Buton Metni</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Hemen Al"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_link">Buton Linki</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="/urunler"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sağ */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold">Görünüm Ayarları</h2>

              <div className="space-y-2">
                <Label>Başlangıç Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left", !formData.start_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "dd.MM.yyyy") : "Tarih seçin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left", !formData.end_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "dd.MM.yyyy") : "Tarih seçin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_frequency">Görünüm Sıklığı</Label>
                <Select
                  value={formData.display_frequency}
                  onValueChange={(value) => setFormData({ ...formData, display_frequency: value as Frequency })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Her Zaman</SelectItem>
                    <SelectItem value="once">Bir Kez (Cookie)</SelectItem>
                    <SelectItem value="daily">Günde Bir</SelectItem>
                    <SelectItem value="weekly">Haftada Bir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_pages">Gösterilecek Sayfalar</Label>
                <Select
                  value={formData.display_pages}
                  onValueChange={(value) => setFormData({ ...formData, display_pages: value as DisplayPages })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Sayfalar</SelectItem>
                    <SelectItem value="home">Anasayfa</SelectItem>
                    <SelectItem value="products">Ürünler</SelectItem>
                    <SelectItem value="categories">Kategoriler</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik (0-100)</Label>
                <Input
                  id="priority" type="number" min={0} max={100}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Yüksek öncelik önce gösterilir</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay_seconds">Gecikme (sn)</Label>
                <Input
                  id="delay_seconds" type="number" min={0} max={60}
                  value={formData.delay_seconds}
                  onChange={(e) => setFormData({ ...formData, delay_seconds: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_seconds">Oto Kapanma (sn)</Label>
                <Input
                  id="duration_seconds" type="number" min={0} max={300}
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value, 10) || 0 })}
                />
                <p className="text-xs text-muted-foreground">0 = yok</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="text-base">Durum</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? "Popup aktif" : "Popup pasif"}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            {(formData.title || formData.content) && (
              <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Önizleme</h2>
                <div className="border rounded-lg overflow-hidden bg-background">
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt={formData.image_alt || "Önizleme"}
                      className="w-full h-32 object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="p-4 space-y-2">
                    {formData.title && <h3 className="font-bold text-sm">{formData.title}</h3>}
                    {formData.content && <p className="text-xs text-muted-foreground line-clamp-3">{formData.content}</p>}
                    {formData.coupon_code && (
                      <div className="bg-primary/10 border border-primary/20 rounded p-2 text-center">
                        <p className="text-xs font-mono font-bold text-primary">{formData.coupon_code}</p>
                      </div>
                    )}
                    {formData.button_text && <Button size="sm" className="w-full text-xs">{formData.button_text}</Button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving || !canSave}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/popups")}>
            İptal
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
