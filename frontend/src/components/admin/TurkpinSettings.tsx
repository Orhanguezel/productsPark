// =============================================================
// FILE: src/components/products/TurkpinSettings.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { useListApiProvidersQuery } from "@/integrations/metahub/rtk/endpoints/api_providers.endpoints";
import type { ApiProvider } from "@/integrations/metahub/db/types/apiProviders";

interface TurkpinGame {
  id: string;
  name: string;
}

interface TurkpinProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  min_order: number;
  max_order: number;
  tax_type: number;
  pre_order: boolean;
  min_barem?: number;
  max_barem?: number;
  barem_step?: number;
}

type TurkpinGameListResult = {
  success: boolean;
  games?: TurkpinGame[];
  error?: string;
};

type TurkpinProductListResult = {
  success: boolean;
  products?: TurkpinProduct[];
  error?: string;
};

interface TurkpinSettingsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const TurkpinSettings = ({ formData, setFormData }: TurkpinSettingsProps) => {
  // ✅ Provider’ları RTK’dan çekiyoruz (aktif + isme göre)
  const { data: providers = [], isLoading: loadingProviders } = useListApiProvidersQuery({
    activeOnly: true,
    orderBy: { field: "name", asc: true },
  });

  const providerOptions = useMemo(
    () =>
      (providers as ApiProvider[]).filter(
        (p) => p.provider_type === "epin" || p.provider_type === "topup"
      ),
    [providers]
  );

  const [games, setGames] = useState<TurkpinGame[]>([]);
  const [products, setProducts] = useState<TurkpinProduct[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // product_type veya provider değişince oyunları getir
  useEffect(() => {
    if (formData.api_provider_id && formData.product_type) {
      fetchGames();
    } else {
      setGames([]);
    }
  }, [formData.api_provider_id, formData.product_type]);

  // oyun değişince ürünleri getir
  useEffect(() => {
    if (formData.api_provider_id && formData.epin_game_id && formData.product_type) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [formData.api_provider_id, formData.epin_game_id, formData.product_type]);

  const fetchGames = async () => {
    if (!formData.api_provider_id) return;
    setLoadingGames(true);
    try {
      const listType: "epin" | "topup" = formData.product_type === "epin" ? "epin" : "topup";

      // 🔒 data tipini sabitliyoruz
      const { data, error } = await metahub.functions.invoke<TurkpinGameListResult>(
        "turkpin-game-list",
        {
          body: {
            providerId: formData.api_provider_id,
            listType,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        setGames(data.games ?? []);
      } else {
        toast({
          title: "Hata",
          description: data?.error || "Oyun listesi alınamadı",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching games:", err);
      toast({
        title: "Hata",
        description: "Oyun listesi alınırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchProducts = async () => {
    if (!formData.api_provider_id || !formData.epin_game_id) return;
    setLoadingProducts(true);
    try {
      const listType: "epin" | "topup" = formData.product_type === "epin" ? "epin" : "topup";

      // 🔒 data tipini sabitliyoruz
      const { data, error } = await metahub.functions.invoke<TurkpinProductListResult>(
        "turkpin-product-list",
        {
          body: {
            providerId: formData.api_provider_id,
            gameId: formData.epin_game_id,
            listType,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        setProducts(data.products ?? []);
      } else {
        toast({
          title: "Hata",
          description: data?.error || "Ürün listesi alınamadı",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      toast({
        title: "Hata",
        description: "Ürün listesi alınırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const syncProductData = () => {
    const selectedProduct = products.find((p) => p.id === formData.epin_product_id);
    if (!selectedProduct) return;
    setFormData({
      ...formData,
      price: selectedProduct.price,
      stock_quantity: selectedProduct.stock,
      min_order: selectedProduct.min_order,
      max_order: selectedProduct.max_order || 0,
      tax_type: selectedProduct.tax_type,
      pre_order_enabled: selectedProduct.pre_order,
      min_barem: selectedProduct.min_barem,
      max_barem: selectedProduct.max_barem,
      barem_step: selectedProduct.barem_step,
    });
    toast({
      title: "Başarılı",
      description: "Ürün bilgileri senkronize edildi",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Turkpin API Ayarları</CardTitle>
          <CardDescription>
            {formData.product_type === "epin" ? "Epin" : "TopUp"} ürünü için API ayarlarını yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Sağlayıcı *</Label>
            <Select
              value={formData.api_provider_id}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  api_provider_id: value,
                  epin_game_id: "",
                  epin_product_id: "",
                });
                setGames([]);
                setProducts([]);
              }}
              disabled={loadingProviders}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProviders ? "Yükleniyor..." : "Sağlayıcı seçin"} />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name} ({provider.provider_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.api_provider_id && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Oyun *</Label>
                <Button type="button" variant="outline" size="sm" onClick={fetchGames} disabled={loadingGames}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${loadingGames ? "animate-spin" : ""}`} />
                  Yenile
                </Button>
              </div>
              <Select
                value={formData.epin_game_id}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    epin_game_id: value,
                    epin_product_id: "",
                  });
                  setProducts([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Oyun seçin" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.epin_game_id && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ürün *</Label>
                <Button type="button" variant="outline" size="sm" onClick={fetchProducts} disabled={loadingProducts}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${loadingProducts ? "animate-spin" : ""}`} />
                  Yenile
                </Button>
              </div>
              <Select
                value={formData.epin_product_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, epin_product_id: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ürün seçin" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₺{product.price} - Stok: {product.stock}
                      {product.pre_order && " (Ön Sipariş)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.epin_product_id && (
            <div className="pt-4 border-t">
              <Button type="button" onClick={syncProductData} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Fiyat ve Stok Bilgilerini Senkronize Et
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-4">
            <input
              type="checkbox"
              id="auto_delivery_enabled"
              checked={formData.auto_delivery_enabled || false}
              onChange={(e) => setFormData({ ...formData, auto_delivery_enabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="auto_delivery_enabled">Otomatik Teslimat Aktif</Label>
          </div>

          {formData.auto_delivery_enabled && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">Otomatik Teslimat Etkin</p>
              <p>
                Ödeme onaylandıktan sonra sipariş otomatik olarak Turkpin API'ye iletilecek ve epin kodları müşteriye
                anında teslim edilecektir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {formData.epin_product_id && products.find((p) => p.id === formData.epin_product_id) && (
        <Card>
          <CardHeader>
            <CardTitle>Ürün Detayları</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const product = products.find((p) => p.id === formData.epin_product_id);
              if (!product) return null;
              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fiyat:</span>
                    <span className="font-medium ml-2">₺{product.price}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stok:</span>
                    <span className="font-medium ml-2">{product.stock}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Sipariş:</span>
                    <span className="font-medium ml-2">{product.min_order}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Sipariş:</span>
                    <span className="font-medium ml-2">{product.max_order || "Sınırsız"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vergi Tipi:</span>
                    <span className="font-medium ml-2">{product.tax_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ön Sipariş:</span>
                    <span className="font-medium ml-2">{product.pre_order ? "Evet" : "Hayır"}</span>
                  </div>
                  {product.min_barem && (
                    <>
                      <div className="col-span-2 border-t pt-2 mt-2">
                        <span className="text-muted-foreground font-medium">Barem Bilgileri:</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min Barem:</span>
                        <span className="font-medium ml-2">{product.min_barem}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Barem:</span>
                        <span className="font-medium ml-2">{product.max_barem}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Barem Adımı:</span>
                        <span className="font-medium ml-2">{product.barem_step}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
