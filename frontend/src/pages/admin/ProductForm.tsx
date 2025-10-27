import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Plus, Zap, Shield, Clock, Headphones, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TurkpinSettings } from "@/components/admin/TurkpinSettings";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface Category {
  id: string;
  name: string;
  is_featured?: boolean;
  parent_id?: string | null;
}

interface Review {
  id?: string;
  customer_name: string;
  rating: number;
  comment: string;
  review_date: string;
  is_active: boolean;
}

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

interface CustomField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface Badge {
  text: string;
  icon: string;
  active: boolean;
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [quantityOptions, setQuantityOptions] = useState<{ quantity: number, price: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockList, setStockList] = useState("");
  const [usedStock, setUsedStock] = useState<any[]>([]);
  const [apiProviders, setApiProviders] = useState<any[]>([]);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    price: 0,
    original_price: 0,
    stock_quantity: 0,
    category_id: "",
    image_url: "",
    short_description: "",
    description: "",
    is_active: true,
    show_on_homepage: false,
    delivery_type: "manual",
    file_url: "",
    api_provider_id: "",
    api_product_id: "",
    api_quantity: 1,
    demo_enabled: false,
    demo_url: "",
    demo_embed_enabled: false,
    demo_button_text: "Demoyu İncele",
    epin_game_id: "",
    epin_product_id: "",
    auto_delivery_enabled: false,
    min_order: 1,
    max_order: 0,
    min_barem: 0,
    max_barem: 0,
    barem_step: 0,
    pre_order_enabled: false,
    tax_type: 0,
    review_count: 0,
    article_content: "",
    article_enabled: false,
  });

  useEffect(() => {
    fetchCategories();
    fetchApiProviders();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchApiProviders = async () => {
    try {
      const { data, error } = await metahub
        .from("api_providers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setApiProviders(data || []);
    } catch (error) {
      console.error("Error fetching API providers:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await metahub
        .from("categories")
        .select("id, name, is_featured, parent_id")
        .order("name");

      if (error) throw error;
      setCategories(data || []);

      const parents = (data || []).filter(cat => !cat.parent_id);
      setParentCategories(parents);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async (parentId: string) => {
    try {
      const { data, error } = await metahub
        .from("categories")
        .select("id, name, is_featured, parent_id")
        .eq("parent_id", parentId)
        .order("name");

      if (error) throw error;
      setSubCategories(data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        // Önce formu doldur
        setFormData({
          name: data.name || "",
          slug: data.slug || "",
          price: Number(data.price) || 0,
          original_price: Number(data.original_price) || 0,
          stock_quantity: Number(data.stock_quantity) || 0,
          category_id: data.category_id || "",
          image_url: data.image_url || "",
          short_description: data.short_description || "",
          description: data.description || "",
          is_active: data.is_active !== undefined ? data.is_active : true,
          show_on_homepage: data.show_on_homepage || false,
          delivery_type: data.delivery_type || "manual",
          file_url: data.file_url || "",
          api_provider_id: data.api_provider_id || "",
          api_product_id: data.api_product_id || "",
          api_quantity: Number(data.api_quantity) || 1,
          demo_enabled: !!(data.demo_url),
          demo_url: data.demo_url || "",
          demo_embed_enabled: data.demo_embed_enabled || false,
          demo_button_text: data.demo_button_text || "Demoyu İncele",
          epin_game_id: data.epin_game_id || "",
          epin_product_id: data.epin_product_id || "",
          auto_delivery_enabled: data.auto_delivery_enabled || false,
          min_order: Number(data.min_order) || 1,
          max_order: Number(data.max_order) || 0,
          min_barem: Number(data.min_barem) || 0,
          max_barem: Number(data.max_barem) || 0,
          barem_step: Number(data.barem_step) || 0,
          pre_order_enabled: data.pre_order_enabled || false,
          tax_type: Number(data.tax_type) || 0,
          review_count: Number(data.review_count) || 0,
          article_content: data.article_content || "",
          article_enabled: data.article_enabled || false,
        });

        console.log("Form data yüklendi:", data.name, data.price, data.original_price);
      }

      if (data.delivery_type === "auto_stock") {
        const { data: stockData } = await metahub
          .from("product_stock")
          .select("stock_content")
          .eq("product_id", id)
          .eq("is_used", false);

        if (stockData) {
          setStockList(stockData.map(s => s.stock_content).join("\n"));
        }

        // Kullanılan stokları da çek - sipariş ve müşteri bilgisiyle birlikte
        const { data: usedStockData } = await metahub
          .from("product_stock")
          .select(`
            *,
            order_items!inner (
              id,
              order_id,
              orders!inner (
                id,
                order_number,
                customer_name,
                customer_email
              )
            )
          `)
          .eq("product_id", id)
          .eq("is_used", true)
          .order("used_at", { ascending: false });

        if (usedStockData) {
          setUsedStock(usedStockData);
        }
      }

      if (data.category_id && categories.length > 0) {
        const selectedCat = categories.find(c => c.id === data.category_id);
        if (selectedCat?.parent_id) {
          setSelectedParentId(selectedCat.parent_id);
          await fetchSubCategories(selectedCat.parent_id);
        }
      }

      const { data: reviewsData } = await metahub
        .from("product_reviews")
        .select("*")
        .eq("product_id", id)
        .order("review_date", { ascending: false });
      if (reviewsData) setReviews(reviewsData);

      const { data: faqsData } = await metahub
        .from("product_faqs")
        .select("*")
        .eq("product_id", id)
        .order("display_order");
      if (faqsData) setFAQs(faqsData);

      if (data.custom_fields && Array.isArray(data.custom_fields)) {
        setCustomFields(data.custom_fields as unknown as CustomField[]);
      }

      if ((data as any).quantity_options && Array.isArray((data as any).quantity_options)) {
        setQuantityOptions((data as any).quantity_options as { quantity: number, price: number }[]);
      }

      if ((data as any).badges && Array.isArray((data as any).badges)) {
        setBadges((data as any).badges as Badge[]);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Hata",
        description: "Ürün yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalCategoryId = formData.category_id || selectedParentId || null;

      const productData: any = {
        name: formData.name,
        slug: formData.slug,
        price: formData.price,
        original_price: formData.original_price || null,
        stock_quantity: formData.stock_quantity,
        category_id: finalCategoryId,
        image_url: formData.image_url || null,
        short_description: formData.short_description || null,
        description: formData.description || null,
        is_active: formData.is_active,
        show_on_homepage: formData.show_on_homepage,
        delivery_type: formData.delivery_type,
        file_url: formData.file_url || null,
        api_provider_id: formData.api_provider_id || null,
        api_product_id: formData.api_product_id || null,
        api_quantity: formData.api_quantity || 1,
        stock_list: [],
        gallery_urls: null,
        features: null,
        custom_fields: customFields,
        badges: badges.length > 0 ? badges : [],
        quantity_options: quantityOptions.length > 0 ? quantityOptions : null,
        demo_url: formData.demo_url || null,
        demo_embed_enabled: formData.demo_embed_enabled,
        demo_button_text: formData.demo_button_text || "Demoyu İncele",
        review_count: formData.review_count || 0,
      };

      let productId = id;

      if (id && !isCopyMode) {
        const { error } = await metahub
          .from("products")
          .update(productData)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { data: newProduct, error } = await metahub
          .from("products")
          .insert([productData])
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;
      }

      if (formData.delivery_type === "auto_stock" && stockList.trim() && productId) {
        // Önce eski stokları sil
        await metahub.from("product_stock").delete().eq("product_id", productId).eq("is_used", false);

        const stockItems = stockList.trim().split("\n").filter(s => s.trim());
        const stockRecords = stockItems.map(content => ({
          product_id: productId,
          stock_content: content.trim(),
        }));

        if (stockRecords.length > 0) {
          await metahub.from("product_stock").insert(stockRecords);

          // Stok sayısını güncelle - sadece kullanılmamış stokları say
          const { count } = await metahub
            .from("product_stock")
            .select("*", { count: 'exact', head: true })
            .eq("product_id", productId)
            .eq("is_used", false);

          await metahub
            .from("products")
            .update({ stock_quantity: count || 0 })
            .eq("id", productId);
        }
      }

      if (productId) {
        await metahub.from("product_reviews").delete().eq("product_id", productId);

        const reviewsToInsert = reviews.map(r => ({
          product_id: productId,
          customer_name: r.customer_name,
          rating: r.rating,
          comment: r.comment,
          review_date: r.review_date,
          is_active: r.is_active,
        }));

        if (reviewsToInsert.length > 0) {
          await metahub.from("product_reviews").insert(reviewsToInsert);
        }

        await metahub.from("product_faqs").delete().eq("product_id", productId);

        const faqsToInsert = faqs.map(f => ({
          product_id: productId,
          question: f.question,
          answer: f.answer,
          display_order: f.display_order,
          is_active: f.is_active,
        }));

        if (faqsToInsert.length > 0) {
          await metahub.from("product_faqs").insert(faqsToInsert);
        }
      }

      toast({ title: "Başarılı", description: (id && !isCopyMode) ? "Ürün güncellendi." : "Ürün oluşturuldu." });
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Hata",
        description: "Ürün kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyProduct = () => {
    setIsCopyMode(true);
    const timestamp = Date.now();
    setFormData({
      ...formData,
      slug: `${formData.slug}-kopya-${timestamp}`,
      name: `${formData.name} (Kopya)`
    });
    toast({
      title: "Kopyalama Modu",
      description: "Ürün kopyalandı. İstediğiniz değişiklikleri yapıp kaydedebilirsiniz.",
    });
  };

  return (
    <AdminLayout title={isCopyMode ? "Ürünü Kopyala" : (id ? "Ürünü Düzenle" : "Yeni Ürün Ekle")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          {id && !isCopyMode && (
            <Button type="button" variant="outline" onClick={handleCopyProduct}>
              Ürünü Kopyala
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ürün Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const newSlug = newName
                        .toLowerCase()
                        .replace(/ğ/g, 'g')
                        .replace(/ü/g, 'u')
                        .replace(/ş/g, 's')
                        .replace(/ı/g, 'i')
                        .replace(/ö/g, 'o')
                        .replace(/ç/g, 'c')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                      setFormData({ ...formData, name: newName, slug: newSlug });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Fiyat (₺) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    disabled={quantityOptions.length > 0}
                  />
                  {quantityOptions.length > 0 && (
                    <p className="text-xs text-muted-foreground">Adet seçenekleri kullanılıyor</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_price">Eski Fiyat (₺)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stok Miktarı *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                    required
                    disabled={formData.delivery_type === "auto_stock"}
                  />
                  {formData.delivery_type === "auto_stock" && (
                    <p className="text-xs text-muted-foreground">Otomatik stok kullanıldığında stok sayısı otomatik hesaplanır</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review_count">Satış Sayısı</Label>
                  <Input
                    id="review_count"
                    type="number"
                    min="0"
                    value={formData.review_count}
                    onChange={(e) => setFormData({ ...formData, review_count: parseInt(e.target.value) || 0 })}
                    placeholder="Örn: 150"
                  />
                  <p className="text-xs text-muted-foreground">Ürün kartında gösterilir</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_category">Üst Kategori</Label>
                <Select
                  value={selectedParentId}
                  onValueChange={(value) => {
                    setSelectedParentId(value);
                    setFormData({ ...formData, category_id: "" });
                    setSubCategories([]);
                    if (value) {
                      fetchSubCategories(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Üst kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedParentId && (
                <div className="space-y-2">
                  <Label htmlFor="category_id">Alt Kategori (Opsiyonel)</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alt kategori seçin veya üst kategori kullan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={selectedParentId}>
                        {parentCategories.find(c => c.id === selectedParentId)?.name} (Üst Kategori)
                      </SelectItem>
                      {subCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="image_upload">Ürün Görseli</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Önerilen boyut: 800x600 piksel (4:3 oran)
                </p>
                <Input
                  id="image_upload"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await metahub.storage
                      .from('product-images')
                      .upload(filePath, file);

                    if (uploadError) {
                      toast({ title: "Hata", description: "Görsel yüklenirken hata oluştu.", variant: "destructive" });
                      return;
                    }

                    const { data } = metahub.storage.from('product-images').getPublicUrl(filePath);
                    setFormData({ ...formData, image_url: data.publicUrl });
                    toast({ title: "Başarılı", description: "Görsel yüklendi." });
                  }}
                />
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded border" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Kısa Açıklama</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Detaylı Açıklama</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  className="bg-background"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      [{ color: [] }, { background: [] }],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_on_homepage"
                    checked={formData.show_on_homepage}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_on_homepage: checked })}
                  />
                  <Label htmlFor="show_on_homepage">
                    Anasayfada Göster
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-8">
                  Aktif olursa bu ürün anasayfadaki "Öne Çıkan Ürünler" bölümünde görünür
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <Tabs defaultValue="customization" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="customization">Ürün Özelleştirme</TabsTrigger>
                  <TabsTrigger value="demo">Demo & Önizleme</TabsTrigger>
                  <TabsTrigger value="faq">Sıkça Sorulan Sorular</TabsTrigger>
                  <TabsTrigger value="reviews">Müşteri Yorumları</TabsTrigger>
                  <TabsTrigger value="delivery">Teslimat Ayarları</TabsTrigger>
                  <TabsTrigger value="turkpin">EPIN</TabsTrigger>
                  <TabsTrigger value="article">Makale Ayarı</TabsTrigger>
                </TabsList>

                <TabsContent value="customization" className="space-y-6 mt-6">
                  <div>
                    <h3 className="font-semibold mb-4">Minimum Sipariş Adet Seçenekleri</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ürün için belirli adetler ve özel fiyatlar tanımlayın. Müşteriler bu adetlerden seçim yapacaktır.
                    </p>

                    {quantityOptions.map((option, index) => (
                      <div key={index} className="p-3 border rounded-lg mb-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Adet</Label>
                            <Input
                              type="number"
                              min="1"
                              value={option.quantity}
                              onChange={(e) => {
                                const newOptions = [...quantityOptions];
                                newOptions[index].quantity = parseInt(e.target.value) || 0;
                                setQuantityOptions(newOptions);
                              }}
                              placeholder="Örn: 10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fiyat (₺)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={option.price}
                              onChange={(e) => {
                                const newOptions = [...quantityOptions];
                                newOptions[index].price = parseFloat(e.target.value) || 0;
                                setQuantityOptions(newOptions);
                              }}
                              placeholder="Örn: 100"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setQuantityOptions(quantityOptions.filter((_, i) => i !== index))}
                            >
                              Sil
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setQuantityOptions([
                          ...quantityOptions,
                          { quantity: 0, price: 0 },
                        ])
                      }
                    >
                      Yeni Adet Seçeneği Ekle
                    </Button>

                    {quantityOptions.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-4">
                        <p className="font-medium">Önizleme:</p>
                        {quantityOptions.map((opt, idx) => (
                          <p key={idx}>• {opt.quantity} adet - {opt.price.toFixed(2)} ₺</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Özel Müşteri Bilgi Alanları</h3>
                    {customFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg space-y-3 mb-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Alan Adı</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => {
                                const newFields = [...customFields];
                                newFields[index].label = e.target.value;
                                setCustomFields(newFields);
                              }}
                              placeholder="Örn: Mail Adresi"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Alan Tipi</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) => {
                                const newFields = [...customFields];
                                newFields[index].type = value;
                                setCustomFields(newFields);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Metin</SelectItem>
                                <SelectItem value="email">E-Posta</SelectItem>
                                <SelectItem value="phone">Telefon</SelectItem>
                                <SelectItem value="url">Link/URL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2 pt-8">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) => {
                                const newFields = [...customFields];
                                newFields[index].required = checked;
                                setCustomFields(newFields);
                              }}
                            />
                            <Label>Zorunlu</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Placeholder (Yönlendirici Metin)</Label>
                          <Input
                            value={field.placeholder}
                            onChange={(e) => {
                              const newFields = [...customFields];
                              newFields[index].placeholder = e.target.value;
                              setCustomFields(newFields);
                            }}
                            placeholder="Örn: Davet atılacak mail adresini yazınız"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                        >
                          Sil
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setCustomFields([
                          ...customFields,
                          {
                            id: `field_${Date.now()}`,
                            label: "",
                            type: "text",
                            placeholder: "",
                            required: false,
                          },
                        ])
                      }
                    >
                      Yeni Alan Ekle
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Ürün Badge'leri</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ürün detay sayfasında gösterilecek özel badge'ler ekleyin
                    </p>
                    {badges.map((badge, index) => {
                      const iconOptions = [
                        { name: "Zap", icon: Zap },
                        { name: "Shield", icon: Shield },
                        { name: "Clock", icon: Clock },
                        { name: "Headphones", icon: Headphones },
                        { name: "Sparkles", icon: Sparkles },
                      ];
                      const SelectedIcon = iconOptions.find(opt => opt.name === badge.icon)?.icon || Zap;

                      return (
                        <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-2">
                              <Label>Badge Metni</Label>
                              <Input
                                value={badge.text}
                                onChange={(e) => {
                                  const newBadges = [...badges];
                                  newBadges[index].text = e.target.value;
                                  setBadges(newBadges);
                                }}
                                placeholder="Örn: Anında Teslimat"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>İkon</Label>
                              <Select
                                value={badge.icon}
                                onValueChange={(value) => {
                                  const newBadges = [...badges];
                                  newBadges[index].icon = value;
                                  setBadges(newBadges);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {iconOptions.map((opt) => (
                                    <SelectItem key={opt.name} value={opt.name}>
                                      <div className="flex items-center gap-2">
                                        <opt.icon className="w-4 h-4" />
                                        {opt.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Önizleme</Label>
                              <div className="flex items-center gap-2 p-2 border rounded bg-muted/50">
                                <SelectedIcon className="w-4 h-4 text-primary" />
                                <span className="text-sm">{badge.text || "Badge Metni"}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Durum</Label>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={badge.active}
                                  onCheckedChange={(checked) => {
                                    const newBadges = [...badges];
                                    newBadges[index].active = checked;
                                    setBadges(newBadges);
                                  }}
                                />
                                <Label className="text-sm">{badge.active ? "Aktif" : "Pasif"}</Label>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setBadges(badges.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setBadges([
                          ...badges,
                          {
                            text: "",
                            icon: "Zap",
                            active: true,
                          },
                        ])
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Badge Ekle
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="faq" className="space-y-4 mt-6">
                  <div>
                    <h3 className="font-semibold mb-4">SSS Yönetimi</h3>
                    {faqs.map((faq, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Soru</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) => {
                                const newFAQs = [...faqs];
                                newFAQs[index].question = e.target.value;
                                setFAQs(newFAQs);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Sıralama</Label>
                            <Input
                              type="number"
                              value={faq.display_order}
                              onChange={(e) => {
                                const newFAQs = [...faqs];
                                newFAQs[index].display_order = parseInt(e.target.value);
                                setFAQs(newFAQs);
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Cevap</Label>
                          <Textarea
                            value={faq.answer}
                            onChange={(e) => {
                              const newFAQs = [...faqs];
                              newFAQs[index].answer = e.target.value;
                              setFAQs(newFAQs);
                            }}
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={faq.is_active}
                              onCheckedChange={(checked) => {
                                const newFAQs = [...faqs];
                                newFAQs[index].is_active = checked;
                                setFAQs(newFAQs);
                              }}
                            />
                            <Label>Aktif</Label>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setFAQs(faqs.filter((_, i) => i !== index))}
                          >
                            Sil
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFAQs([
                          ...faqs,
                          {
                            question: "",
                            answer: "",
                            display_order: faqs.length,
                            is_active: true,
                          },
                        ])
                      }
                    >
                      Yeni SSS Ekle
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="demo" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Demo & Önizleme Ayarları</h3>
                        <p className="text-sm text-muted-foreground">
                          Ürününüz için canlı demo gösterimini yapılandırın.
                        </p>
                      </div>
                      <Switch
                        id="demo_active"
                        checked={formData.demo_enabled}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            demo_enabled: checked,
                            ...(!checked && {
                              demo_url: "",
                              demo_embed_enabled: false,
                              demo_button_text: "Demoyu İncele"
                            })
                          });
                        }}
                      />
                    </div>

                    {formData.demo_enabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="demo_url">Demo URL</Label>
                          <Input
                            id="demo_url"
                            type="url"
                            placeholder="https://demo.example.com"
                            value={formData.demo_url}
                            onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Ürünün canlı demosunun gösterildiği URL'yi girin
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="demo_embed_enabled"
                            checked={formData.demo_embed_enabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, demo_embed_enabled: checked })}
                          />
                          <Label htmlFor="demo_embed_enabled">Sayfada iframe ile göster</Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="demo_button_text">Demo Buton Metni</Label>
                          <Input
                            id="demo_button_text"
                            placeholder="Demoyu İncele"
                            value={formData.demo_button_text}
                            onChange={(e) => setFormData({ ...formData, demo_button_text: e.target.value })}
                          />
                        </div>

                        {formData.demo_embed_enabled && formData.demo_url && (
                          <div className="space-y-2">
                            <Label>Demo Önizleme</Label>
                            <div className="border rounded-lg overflow-hidden bg-muted">
                              <iframe
                                src={formData.demo_url}
                                className="w-full h-[400px]"
                                sandbox="allow-scripts allow-same-origin"
                                title="Demo Önizleme"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Bu önizleme, müşterilerin ürün detay sayfasında göreceği demo görünümüdür
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4 mt-6">
                  <div>
                    <h3 className="font-semibold mb-4">Yorum Yönetimi</h3>
                    {reviews.map((review, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Müşteri Adı</Label>
                            <Input
                              value={review.customer_name}
                              onChange={(e) => {
                                const newReviews = [...reviews];
                                newReviews[index].customer_name = e.target.value;
                                setReviews(newReviews);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Puan (1-5)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={review.rating}
                              onChange={(e) => {
                                const newReviews = [...reviews];
                                newReviews[index].rating = parseInt(e.target.value);
                                setReviews(newReviews);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tarih</Label>
                            <Input
                              type="date"
                              value={review.review_date}
                              onChange={(e) => {
                                const newReviews = [...reviews];
                                newReviews[index].review_date = e.target.value;
                                setReviews(newReviews);
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Yorum</Label>
                          <Textarea
                            value={review.comment}
                            onChange={(e) => {
                              const newReviews = [...reviews];
                              newReviews[index].comment = e.target.value;
                              setReviews(newReviews);
                            }}
                            rows={2}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={review.is_active}
                              onCheckedChange={(checked) => {
                                const newReviews = [...reviews];
                                newReviews[index].is_active = checked;
                                setReviews(newReviews);
                              }}
                            />
                            <Label>Aktif</Label>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setReviews(reviews.filter((_, i) => i !== index))}
                          >
                            Sil
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setReviews([
                          ...reviews,
                          {
                            customer_name: "",
                            rating: 5,
                            comment: "",
                            review_date: new Date().toISOString().split("T")[0],
                            is_active: true,
                          },
                        ])
                      }
                    >
                      Yeni Yorum Ekle
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="delivery" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Teslimat Tipi *</Label>
                      <Select
                        value={formData.delivery_type}
                        onValueChange={(value) => setFormData({ ...formData, delivery_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manuel Teslimat</SelectItem>
                          <SelectItem value="auto_stock">Otomatik (Stok Listesi)</SelectItem>
                          <SelectItem value="file">Dosya İndirme</SelectItem>
                          <SelectItem value="api">API Entegrasyonu</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {formData.delivery_type === "manual" && "Admin manuel olarak teslim eder"}
                        {formData.delivery_type === "auto_stock" && "Stoktan otomatik teslim edilir"}
                        {formData.delivery_type === "file" && "Müşteri dosya indirebilir"}
                        {formData.delivery_type === "api" && "API üzerinden otomatik teslim edilir"}
                      </p>
                    </div>

                    {formData.delivery_type === "auto_stock" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Stok Listesi (Her satıra bir adet)</Label>
                          <Textarea
                            value={stockList}
                            onChange={(e) => setStockList(e.target.value)}
                            placeholder="account1:password1&#10;account2:password2&#10;XXXXX-XXXXX-XXXXX"
                            rows={8}
                          />
                          <p className="text-xs text-muted-foreground">
                            {stockList.split("\n").filter(s => s.trim()).length} adet stok girildi
                          </p>
                        </div>

                        {id && usedStock.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Kullanılan Stoklar</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm mb-3">
                                  <span className="text-muted-foreground">Toplam teslim edilen:</span>
                                  <span className="font-semibold">{usedStock.length} adet</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto space-y-2">
                                  {usedStock.map((stock, index) => {
                                    const order = (stock as any).order_items?.orders;
                                    return (
                                      <div
                                        key={stock.id}
                                        className="p-3 bg-muted rounded-lg border text-sm space-y-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono text-xs">#{index + 1}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(stock.used_at).toLocaleString('tr-TR')}
                                          </span>
                                        </div>

                                        {order && (
                                          <div className="text-xs space-y-1 border-t pt-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">Sipariş No:</span>
                                              <span className="font-semibold">{order.order_number}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">Müşteri:</span>
                                              <span className="font-medium">{order.customer_name}</span>
                                            </div>
                                            {order.customer_email && (
                                              <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">E-posta:</span>
                                                <span className="text-xs">{order.customer_email}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        <pre className="text-xs font-mono bg-background p-2 rounded border overflow-x-auto">
                                          {stock.stock_content}
                                        </pre>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {formData.delivery_type === "file" && (
                      <div className="space-y-2">
                        <Label>Ürün Dosyası (ZIP, RAR vb.)</Label>
                        <Input
                          type="file"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const fileExt = file.name.split('.').pop();
                            const fileName = `${Date.now()}.${fileExt}`;
                            const filePath = `${fileName}`;

                            const { error: uploadError } = await metahub.storage
                              .from('product-images')
                              .upload(filePath, file);

                            if (uploadError) {
                              toast({ title: "Hata", description: "Dosya yüklenirken hata oluştu.", variant: "destructive" });
                              return;
                            }

                            const { data } = metahub.storage.from('product-images').getPublicUrl(filePath);
                            setFormData({ ...formData, file_url: data.publicUrl });
                            toast({ title: "Başarılı", description: "Dosya yüklendi." });
                          }}
                        />
                        {formData.file_url && (
                          <p className="text-sm text-green-600">✓ Dosya yüklendi</p>
                        )}
                      </div>
                    )}

                    {formData.delivery_type === "api" && (
                      <>
                        <div className="space-y-2">
                          <Label>API Sağlayıcı *</Label>
                          <Select
                            value={formData.api_provider_id}
                            onValueChange={(value) => setFormData({ ...formData, api_provider_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="API sağlayıcı seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {apiProviders.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            SMM panel sağlayıcınızı seçin
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>API Ürün ID (Service ID) *</Label>
                          <Input
                            value={formData.api_product_id}
                            onChange={(e) => setFormData({ ...formData, api_product_id: e.target.value })}
                            placeholder="Örn: 1234"
                          />
                          <p className="text-xs text-muted-foreground">
                            API'deki service ID numarası
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>API'ye Gönderilecek Adet *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.api_quantity}
                            onChange={(e) => setFormData({ ...formData, api_quantity: parseInt(e.target.value) || 1 })}
                            placeholder="Örn: 100"
                          />
                          <p className="text-xs text-muted-foreground">
                            Her sipariş için API'ye gönderilecek sabit miktar (örn: 100 takipçi)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="turkpin" className="space-y-6 mt-6">
                  <TurkpinSettings formData={formData} setFormData={setFormData} />
                </TabsContent>

                <TabsContent value="article" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="article_enabled"
                        checked={formData.article_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, article_enabled: checked })}
                      />
                      <Label htmlFor="article_enabled">Makale Alanını Aktif Et</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ürün sayfasında scroll edilebilir makale içeriği gösterir
                    </p>

                    {formData.article_enabled && (
                      <div className="space-y-2">
                        <Label>Makale İçeriği</Label>
                        <ReactQuill
                          theme="snow"
                          value={formData.article_content}
                          onChange={(value) => setFormData({ ...formData, article_content: value })}
                          className="bg-background"
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, 4, 5, 6, false] }],
                              ["bold", "italic", "underline", "strike"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              [{ color: [] }, { background: [] }],
                              ["link", "image"],
                              ["clean"],
                            ],
                          }}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
            >
              İptal
            </Button>
            <Button type="submit" className="gradient-primary" disabled={loading}>
              {loading ? "Kaydediliyor..." : id ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
