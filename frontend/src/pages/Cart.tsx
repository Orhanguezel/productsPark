import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  id: string;
  quantity: number;
  selected_options?: Record<string, string> | null;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    delivery_type?: string;
    stock_quantity?: number;
    custom_fields?: any[];
    quantity_options?: { quantity: number, price: number }[] | null;
    api_provider_id?: string | null;
    api_product_id?: string | null;
    api_quantity?: number | null;
    category_id?: string | null;
    categories?: {
      id: string;
      name: string;
    };
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  useEffect(() => {
    const checkGuestOrderAndLoadCart = async () => {
      if (!authLoading) {
        if (!user) {
          // Check if guest orders are enabled
          const { data } = await metahub
            .from("site_settings")
            .select("value")
            .eq("key", "guest_order_enabled")
            .maybeSingle();

          if (data?.value === true || data?.value === "true") {
            // Guest orders enabled, load from localStorage
            loadGuestCart();
          } else {
            // Guest orders disabled, redirect to login
            navigate("/giris");
          }
          return;
        }
        fetchCartItems();
      }
    };

    checkGuestOrderAndLoadCart();
  }, [user, authLoading, navigate]);

  const loadGuestCart = async () => {
    try {
      setLoading(true);
      const guestCartData = localStorage.getItem('guestCart');
      if (!guestCartData) {
        setCartItems([]);
        return;
      }

      const guestCart = JSON.parse(guestCartData);

      // Fetch product details for each item
      const productIds = guestCart.map((item: any) => item.productId);
      const { data: products, error } = await metahub
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          image_url,
          delivery_type,
          stock_quantity,
          custom_fields,
          quantity_options,
          api_provider_id,
          api_product_id,
          api_quantity,
          categories (name)
        `)
        .in("id", productIds);

      if (error) throw error;

      // Map to CartItem format
      const items: CartItem[] = guestCart.map((guestItem: any) => {
        const product = products?.find(p => p.id === guestItem.productId);
        if (!product) return null;

        return {
          id: guestItem.productId, // Use productId as id for guest cart
          quantity: guestItem.quantity,
          selected_options: guestItem.selected_options,
          products: product as any
        };
      }).filter(Boolean);

      setCartItems(items);
    } catch (error) {
      console.error("Error loading guest cart:", error);
      toast.error("Sepet yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("cart_items")
        .select(`
          id,
          quantity,
          selected_options,
          products (
            id,
            name,
            slug,
            price,
            image_url,
            delivery_type,
            stock_quantity,
            custom_fields,
            quantity_options,
            api_provider_id,
            api_product_id,
            api_quantity,
            category_id,
            categories (id, name)
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems((data || []) as unknown as CartItem[]);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Sepet yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (!user) {
      // Update guest cart in localStorage
      try {
        const guestCartData = localStorage.getItem('guestCart');
        if (!guestCartData) return;

        const guestCart = JSON.parse(guestCartData);
        const updatedCart = guestCart.map((item: any) =>
          item.productId === id ? { ...item, quantity: newQuantity } : item
        );
        localStorage.setItem('guestCart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('guestCartUpdated')); // Trigger cart count update

        setCartItems(items =>
          items.map(item =>
            item.id === id ? { ...item, quantity: newQuantity } : item
          )
        );
      } catch (error) {
        console.error("Error updating guest cart:", error);
        toast.error("Miktar güncellenirken bir hata oluştu");
      }
      return;
    }

    try {
      const { error } = await metahub
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", id);

      if (error) throw error;

      setCartItems(items =>
        items.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Miktar güncellenirken bir hata oluştu");
    }
  };

  const removeItem = async (id: string) => {
    if (!user) {
      // Remove from guest cart in localStorage
      try {
        const guestCartData = localStorage.getItem('guestCart');
        if (!guestCartData) return;

        const guestCart = JSON.parse(guestCartData);
        const updatedCart = guestCart.filter((item: any) => item.productId !== id);
        localStorage.setItem('guestCart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('guestCartUpdated')); // Trigger cart count update

        setCartItems(items => items.filter(item => item.id !== id));
        toast.success("Ürün sepetten kaldırıldı");
      } catch (error) {
        console.error("Error removing from guest cart:", error);
        toast.error("Ürün kaldırılırken bir hata oluştu");
      }
      return;
    }

    try {
      const { error } = await metahub
        .from("cart_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== id));
      toast.success("Ürün sepetten kaldırıldı");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Ürün kaldırılırken bir hata oluştu");
    }
  };

  const getItemPrice = (item: CartItem) => {
    // If product has quantity options, find the matching option
    if (item.products.quantity_options && Array.isArray(item.products.quantity_options)) {
      const matchingOption = item.products.quantity_options.find(
        opt => opt.quantity === item.quantity
      );
      if (matchingOption) {
        return matchingOption.price;
      }
    }
    // Otherwise use regular price * quantity
    return item.products.price * item.quantity;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item), 0);

  // Calculate discount only on applicable items
  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;

    let applicableTotal = 0;

    // Calculate total of items that match coupon criteria
    if (appliedCoupon.applicable_to === "category") {
      const categoryIds = appliedCoupon.category_ids || [];
      applicableTotal = cartItems
        .filter(item => item.products?.category_id && categoryIds.includes(item.products.category_id))
        .reduce((sum, item) => sum + getItemPrice(item), 0);
    } else if (appliedCoupon.applicable_to === "product") {
      const productIds = appliedCoupon.product_ids || [];
      applicableTotal = cartItems
        .filter(item => item.products?.id && productIds.includes(item.products.id))
        .reduce((sum, item) => sum + getItemPrice(item), 0);
    } else {
      // "all" - apply to everything
      applicableTotal = subtotal;
    }

    // Apply discount to applicable total
    if (appliedCoupon.discount_type === "percentage") {
      return (applicableTotal * appliedCoupon.discount_value) / 100;
    } else {
      return Math.min(appliedCoupon.discount_value, applicableTotal);
    }
  };

  const discount = getDiscountAmount();
  const total = subtotal - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Lütfen bir kupon kodu girin");
      return;
    }

    const { data, error } = await metahub
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast.error("Geçersiz kupon kodu");
      return;
    }

    console.log("Kupon verisi:", data);
    console.log("Sepet ürünleri:", cartItems);

    const now = new Date();
    const validFrom = new Date(data.valid_from);
    const validUntil = data.valid_until ? new Date(data.valid_until) : null;

    if (now < validFrom || (validUntil && now > validUntil)) {
      toast.error("Kupon geçerlilik süresi dışında");
      return;
    }

    if (data.max_uses && data.used_count >= data.max_uses) {
      toast.error("Kupon kullanım limiti dolmuş");
      return;
    }

    if (subtotal < data.min_purchase) {
      toast.error(`Minimum ${data.min_purchase} ₺ alışveriş gerekli`);
      return;
    }

    // Check applicable scope
    console.log("Kupon kapsamı:", data.applicable_to);
    console.log("Kategori ID'leri:", data.category_ids);
    console.log("Ürün ID'leri:", data.product_ids);

    if (data.applicable_to === "category") {
      const categoryIds = data.category_ids || [];
      console.log("Kontrol edilecek kategoriler:", categoryIds);

      const hasValidCategory = cartItems.some(item => {
        console.log("Ürün category_id:", item.products?.category_id);
        return item.products?.category_id && categoryIds.includes(item.products.category_id);
      });

      console.log("Geçerli kategori var mı?", hasValidCategory);

      if (!hasValidCategory) {
        toast.error("Bu kupon sepetinizdeki ürünler için geçerli değil");
        return;
      }
    } else if (data.applicable_to === "product") {
      const productIds = data.product_ids || [];
      console.log("Kontrol edilecek ürünler:", productIds);

      const hasValidProduct = cartItems.some(item => {
        console.log("Ürün ID:", item.products?.id);
        return item.products?.id && productIds.includes(item.products.id);
      });

      console.log("Geçerli ürün var mı?", hasValidProduct);

      if (!hasValidProduct) {
        toast.error("Bu kupon sepetinizdeki ürünler için geçerli değil");
        return;
      }
    }

    setAppliedCoupon(data);
    toast.success("Kupon kodu uygulandı!");
  };

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("Sepetinizde ürün bulunmuyor");
      return;
    }

    console.log("Cart items:", cartItems);
    console.log("Preparing checkout data...");

    // Store cart data in sessionStorage for checkout page
    try {
      const checkoutData = {
        cartItems,
        subtotal,
        discount,
        total,
        appliedCoupon
      };

      console.log("Checkout data to save:", checkoutData);
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      console.log("Checkout data saved successfully");
      console.log("Navigating to /odeme...");

      navigate("/odeme");
    } catch (error) {
      console.error("Error saving checkout data:", error);
      toast.error("Bir hata oluştu");
    }
  };

  // Check if has any query params for noindex
  const hasParams = Array.from(searchParams.keys()).length > 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          Yükleniyor...
        </div>
        <Footer />
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navbar />
        <div className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-8">Sepetim</h1>
            <Card className="text-center py-16">
              <CardContent>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Sepetiniz Boş</h2>
                <p className="text-muted-foreground mb-6">
                  Henüz sepetinize ürün eklemediniz
                </p>
                <Button
                  size="lg"
                  className="gradient-primary"
                  onClick={() => navigate("/urunler")}
                >
                  Alışverişe Başla
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Cart with items
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">
            Sepetim
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img
                        src={item.products.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=150&fit=crop"}
                        alt={item.products.name}
                        className="w-24 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {item.products.categories?.name}
                        </p>
                        <a
                          href={`/urun/${item.products.slug}`}
                          className="font-semibold text-lg mb-2 hover:text-primary transition-colors cursor-pointer block"
                        >
                          {item.products.name}
                        </a>
                        {item.products.quantity_options && Array.isArray(item.products.quantity_options) ? (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {item.quantity} Adet
                            </p>
                            <p className="text-xl font-bold text-primary">
                              {formatPrice(getItemPrice(item))}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xl font-bold text-primary">
                            {item.quantity === 1
                              ? formatPrice(item.products.price)
                              : `${formatPrice(item.products.price)} x ${item.quantity}`
                            }
                          </p>
                        )}
                        {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.products.custom_fields?.map((field: any) => {
                              const value = item.selected_options?.[field.id];
                              if (!value) return null;
                              return (
                                <p key={field.id} className="text-xs text-muted-foreground">
                                  <span className="font-medium">{field.label}:</span> {value}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        {/* Hide quantity controls for API products and products with quantity_options */}
                        {!item.products.quantity_options && item.products.delivery_type !== 'api' && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <h2 className="text-xl font-bold">Sipariş Özeti</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ara Toplam</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>İndirim</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Toplam</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kupon Kodu</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Kupon kodunuzu girin"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button variant="outline" onClick={applyCoupon}>
                        Uygula
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="w-full gradient-primary"
                    onClick={handleCheckout}
                  >
                    Devam Et
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/urunler")}
                  >
                    Alışverişe Devam Et
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;