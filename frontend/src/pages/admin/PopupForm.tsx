import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { metahub } from "@/integrations/metahub/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const PopupForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    product_id: "",
    coupon_code: "",
    button_text: "",
    button_link: "",
    is_active: true,
    start_date: null as Date | null,
    end_date: null as Date | null,
    display_frequency: "always",
    display_pages: "all",
    priority: 0,
    delay_seconds: 2,
    duration_seconds: 0,
  });

  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: products } = useQuery({
    queryKey: ["products-for-popup"],
    queryFn: async () => {
      const { data, error } = await metahub
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: popup } = useQuery({
    queryKey: ["popup", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await metahub
        .from("popups")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (popup) {
      setFormData({
        title: popup.title || "",
        content: popup.content || "",
        image_url: popup.image_url || "",
        product_id: popup.product_id || "",
        coupon_code: popup.coupon_code || "",
        button_text: popup.button_text || "",
        button_link: popup.button_link || "",
        is_active: popup.is_active,
        start_date: popup.start_date ? new Date(popup.start_date) : null,
        end_date: popup.end_date ? new Date(popup.end_date) : null,
        display_frequency: popup.display_frequency,
        display_pages: popup.display_pages,
        priority: popup.priority || 0,
        delay_seconds: popup.delay_seconds || 2,
        duration_seconds: popup.duration_seconds || 0,
      });
    }
  }, [popup]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        product_id: data.product_id || null,
        start_date: data.start_date?.toISOString() || null,
        end_date: data.end_date?.toISOString() || null,
      };

      if (isEditMode) {
        const { error } = await metahub
          .from("popups")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await metahub.from("popups").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      toast({
        title: "Başarılı",
        description: `Popup başarıyla ${isEditMode ? "güncellendi" : "oluşturuldu"}.`,
      });
      navigate("/admin/popups");
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Geçersiz Dosya",
        description: "Lütfen bir görsel dosyası seçin.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Dosya Çok Büyük",
        description: "Görsel boyutu en fazla 5MB olabilir.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setImageFile(file);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `popup-images/${fileName}`;

      const { error: uploadError, data } = await metahub.storage
        .from("blog-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = metahub.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: urlData.publicUrl });

      toast({
        title: "Başarılı",
        description: "Görsel başarıyla yüklendi.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Hata",
        description: "Görsel yüklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: "" });
    setImageFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <AdminLayout title={isEditMode ? "Popup Düzenle" : "Yeni Popup"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/popups")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Popup Düzenle" : "Yeni Popup"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sol Kolon - Ana İçerik */}
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
                  <Label htmlFor="image_upload">Popup Görseli</Label>

                  {!formData.image_url ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="image_upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("image_upload")?.click()}
                          disabled={uploading}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? "Yükleniyor..." : "Görsel Yükle"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG veya WEBP formatında, maksimum 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative border rounded-lg overflow-hidden">
                        <img
                          src={formData.image_url}
                          alt="Yüklenen görsel"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/600x400?text=Görsel+Yüklenemedi";
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("image_upload")?.click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Farklı Görsel Yükle
                      </Button>
                      <Input
                        id="image_upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold">Ürün ve Kampanya</h2>

                <div className="space-y-2">
                  <Label htmlFor="product_id">Ürün (Opsiyonel)</Label>
                  <Select
                    value={formData.product_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ürün seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ürün Seçilmedi</SelectItem>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
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

            {/* Sağ Kolon - Ayarlar */}
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold">Görünüm Ayarları</h2>

                <div className="space-y-2">
                  <Label>Başlangıç Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground"
                        )}
                      >
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
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.end_date && "text-muted-foreground"
                        )}
                      >
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
                    onValueChange={(value) => setFormData({ ...formData, display_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    onValueChange={(value) => setFormData({ ...formData, display_pages: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Yüksek öncelikli popuplar önce gösterilir</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delay_seconds">Gecikme (Saniye)</Label>
                  <Input
                    id="delay_seconds"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.delay_seconds}
                    onChange={(e) => setFormData({ ...formData, delay_seconds: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Sayfa açıldıktan kaç saniye sonra popup gösterilsin</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_seconds">Otomatik Kapanma (Saniye)</Label>
                  <Input
                    id="duration_seconds"
                    type="number"
                    min="0"
                    max="300"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">0 = Otomatik kapanma yok</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
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

              {/* Önizleme */}
              {(formData.title || formData.content) && (
                <div className="bg-card border rounded-lg p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Önizleme</h2>
                  <div className="border rounded-lg overflow-hidden bg-background">
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Önizleme"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="p-4 space-y-2">
                      {formData.title && (
                        <h3 className="font-bold text-sm">{formData.title}</h3>
                      )}
                      {formData.content && (
                        <p className="text-xs text-muted-foreground line-clamp-3">{formData.content}</p>
                      )}
                      {formData.coupon_code && (
                        <div className="bg-primary/10 border border-primary/20 rounded p-2 text-center">
                          <p className="text-xs font-mono font-bold text-primary">{formData.coupon_code}</p>
                        </div>
                      )}
                      {formData.button_text && (
                        <Button size="sm" className="w-full text-xs">
                          {formData.button_text}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin/popups")}>
              İptal
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default PopupForm;
