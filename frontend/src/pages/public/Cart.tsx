// =============================================================
// FILE: src/pages/public/Cart.tsx
// =============================================================
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { skipToken } from "@reduxjs/toolkit/query";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";


import {
  useGetSiteSettingByKeyQuery,
  useListCartItemsQuery,
  useUpdateCartItemMutation,
  useDeleteCartItemMutation,
  useGetCouponByCodeQuery,
  useListProductsQuery,
} from "@/integrations/hooks";

import type { PublicCartItem } from '@/integrations/types';

type GuestStoredItem = {
  productId: string;
  quantity: number;
  selected_options?: Record<string, unknown> | null;
};

const Cart = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Guest sepeti için local raw state
  const [guestStoredItems, setGuestStoredItems] = useState<GuestStoredItem[]>([]);
  const [guestLoading, setGuestLoading] = useState(true);

  // Kupon / checkout için UI state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const normalizedCouponCode = couponCode.trim().toUpperCase();

  // Site setting: guest_order_enabled (RTK)
  const {
    data: guestOrderSetting,
    isLoading: guestOrderLoading,
  } = useGetSiteSettingByKeyQuery("guest_order_enabled");

  // Logged-in kullanıcı için RTK cart_items
  const {
    data: userCartItems = [],
    isLoading: isCartItemsLoading,
  } = useListCartItemsQuery(
    user
      ? {
          user_id: user.id,
          with: "products",
          sort: "created_at",
          order: "desc",
        }
      : skipToken
  );

  const [updateCartItemMutation] = useUpdateCartItemMutation();
  const [deleteCartItemMutation] = useDeleteCartItemMutation();

  // Guest stored items → product ids
  const guestProductIds = useMemo(
    () => guestStoredItems.map((i) => i.productId),
    [guestStoredItems]
  );

  // Guest ürün detayları da RTK'den
  const {
    data: guestProducts = [],
    isLoading: isGuestProductsLoading,
  } = useListProductsQuery(
    !user && guestProductIds.length > 0
      ? {
          ids: guestProductIds,
          limit: guestProductIds.length,
          is_active: true,
        }
      : skipToken
  );

  // Kupon da RTK'den
  const {
    data: couponFromCode,
    isFetching: isCouponFetching,
  } = useGetCouponByCodeQuery(
    normalizedCouponCode ? normalizedCouponCode : skipToken
  );

  // Guest sepetini sadece localStorage'dan oku (ürünler RTK'den gelecek)
  const loadGuestCart = () => {
    try {
      setGuestLoading(true);
      const guestCartData = localStorage.getItem("guestCart");
      if (!guestCartData) {
        setGuestStoredItems([]);
        return;
      }

      const guestCart = JSON.parse(guestCartData);
      if (!Array.isArray(guestCart) || guestCart.length === 0) {
        setGuestStoredItems([]);
        return;
      }

      const normalized: GuestStoredItem[] = guestCart.map((item: any) => ({
        productId: String(item.productId),
        quantity: Number(item.quantity) || 1,
        selected_options:
          item.selected_options && typeof item.selected_options === "object"
            ? item.selected_options
            : null,
      }));

      setGuestStoredItems(normalized);
    } catch (error) {
      console.error("Error loading guest cart:", error);
      toast.error("Sepet yüklenirken bir hata oluştu");
      setGuestStoredItems([]);
    } finally {
      setGuestLoading(false);
    }
  };

  // Guest / user durumuna göre sepeti yükleme / yönlendirme
  useEffect(() => {
    if (authLoading) return;

    // Logged-in kullanıcı → RTK query zaten çalışıyor
    if (user) {
      setGuestLoading(false);
      return;
    }

    // Guest kullanıcı → önce ayarı bekle
    if (guestOrderLoading) return;

    const v = guestOrderSetting?.value;
    const guestEnabled =
      v === true || v === "true" || v === undefined || v === null;

    if (!guestEnabled) {
      navigate("/giris");
      return;
    }

    loadGuestCart();
  }, [authLoading, user, guestOrderLoading, guestOrderSetting, navigate]);

  // Guest stored + ürünler → CartItem[]
  const guestCartItems: PublicCartItem[] = useMemo(() => {
    if (user) return [];
    if (!guestStoredItems.length) return [];

    return guestStoredItems
      .map((stored) => {
        const product = guestProducts.find((p) => p.id === stored.productId);
        if (!product) return null;

        const item: PublicCartItem = {
          id: stored.productId,
          user_id: null,
          product_id: stored.productId,
          quantity: stored.quantity,
          selected_options: (stored.selected_options ?? null) as Record<string, unknown> | null,
          created_at: null,
          updated_at: null,
          products: (product as unknown) as PublicCartItem["products"],
        };

        return item;
      })
      .filter(Boolean) as PublicCartItem[];
  }, [user, guestStoredItems, guestProducts]);

  // Ortak sepet listesi (user: RTK, guest: derived)
  const cartItems: PublicCartItem[] = user
    ? ((userCartItems as PublicCartItem[]) || [])
    : guestCartItems;

  // Genel loading state
  const loading =
    authLoading ||
    (user ? isCartItemsLoading : guestLoading || isGuestProductsLoading);

  // --- Helpers ---

  const getItemPrice = (item: PublicCartItem) => {
    const product = item.products;
    if (!product) return 0;

    // quantity_options varsa, miktara göre özel fiyat
    if (product.quantity_options && Array.isArray(product.quantity_options)) {
      const matchingOption = product.quantity_options.find(
        (opt) => opt.quantity === item.quantity
      );
      if (matchingOption) {
        return matchingOption.price;
      }
    }

    // yoksa product.price * quantity
    return (product.price || 0) * item.quantity;
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item),
    0
  );

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;

    let applicableTotal = 0;

    if (appliedCoupon.applicable_to === "category") {
      const categoryIds = appliedCoupon.category_ids || [];
      applicableTotal = cartItems
        .filter(
          (item) =>
            item.products?.category_id &&
            categoryIds.includes(item.products.category_id)
        )
        .reduce((sum, item) => sum + getItemPrice(item), 0);
    } else if (appliedCoupon.applicable_to === "product") {
      const productIds = appliedCoupon.product_ids || [];
      applicableTotal = cartItems
        .filter(
          (item) =>
            item.products?.id && productIds.includes(item.products.id)
        )
        .reduce((sum, item) => sum + getItemPrice(item), 0);
    } else {
      // "all"
      applicableTotal = subtotal;
    }

    let discount =
      appliedCoupon.discount_type === "percentage"
        ? (applicableTotal * appliedCoupon.discount_value) / 100
        : appliedCoupon.discount_value;

    if (appliedCoupon.max_discount != null) {
      discount = Math.min(discount, appliedCoupon.max_discount);
    }

    if (discount < 0) discount = 0;
    if (discount > applicableTotal) discount = applicableTotal;

    return discount;
  };

  const discount = getDiscountAmount();
  const total = subtotal - discount;

  // --- Actions ---

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Guest sepeti → localStorage + guestStoredItems
    if (!user) {
      try {
        const guestCartData = localStorage.getItem("guestCart");
        if (!guestCartData) return;

        const guestCart = JSON.parse(guestCartData);
        const updatedCart = guestCart.map((item: any) =>
          item.productId === id ? { ...item, quantity: newQuantity } : item
        );

        localStorage.setItem("guestCart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("guestCartUpdated"));

        setGuestStoredItems((items) =>
          items.map((item) =>
            item.productId === id
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      } catch (error) {
        console.error("Error updating guest cart:", error);
        toast.error("Miktar güncellenirken bir hata oluştu");
      }
      return;
    }

    // Logged-in sepeti (RTK /cart_items PATCH)
    try {
      await updateCartItemMutation({ id, quantity: newQuantity }).unwrap();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Miktar güncellenirken bir hata oluştu");
    }
  };

  const removeItem = async (id: string) => {
    // Guest sepeti
    if (!user) {
      try {
        const guestCartData = localStorage.getItem("guestCart");
        if (!guestCartData) return;

        const guestCart = JSON.parse(guestCartData);
        const updatedCart = guestCart.filter(
          (item: any) => item.productId !== id
        );
        localStorage.setItem("guestCart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("guestCartUpdated"));

        setGuestStoredItems((items) =>
          items.filter((item) => item.productId !== id)
        );
        toast.success("Ürün sepetten kaldırıldı");
      } catch (error) {
        console.error("Error removing from guest cart:", error);
        toast.error("Ürün kaldırılırken bir hata oluştu");
      }
      return;
    }

    // Logged-in sepeti (RTK /cart_items DELETE)
    try {
      await deleteCartItemMutation(id).unwrap();
      toast.success("Ürün sepetten kaldırıldı");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Ürün kaldırılırken bir hata oluştu");
    }
  };

  const applyCoupon = () => {
    if (!normalizedCouponCode) {
      toast.error("Lütfen bir kupon kodu girin");
      return;
    }

    if (isCouponFetching) {
      toast.error("Kupon kontrol ediliyor, lütfen bekleyin");
      return;
    }

    const data = couponFromCode;
    if (!data) {
      toast.error("Geçersiz kupon kodu");
      return;
    }

    const now = new Date();
    const validFrom = data.valid_from ? new Date(data.valid_from) : null;
    const validUntil = data.valid_until ? new Date(data.valid_until) : null;

    if (!data.is_active) {
      toast.error("Kupon aktif değil");
      return;
    }

    if (
      (validFrom && now < validFrom) ||
      (validUntil && now > validUntil)
    ) {
      toast.error("Kupon geçerlilik süresi dışında");
      return;
    }

    const usedCount = Number.isFinite(data.used_count as number)
      ? (data.used_count as number)
      : 0;
    if (data.max_uses != null && usedCount >= data.max_uses) {
      toast.error("Kupon kullanım limiti dolmuş");
      return;
    }

    if (subtotal < (data.min_purchase ?? 0)) {
      toast.error(`Minimum ${data.min_purchase} ₺ alışveriş gerekli`);
      return;
    }

    if (data.applicable_to === "category") {
      const categoryIds = data.category_ids || [];

      const hasValidCategory = cartItems.some(
        (item) =>
          item.products?.category_id &&
          categoryIds.includes(item.products.category_id)
      );

      if (!hasValidCategory) {
        toast.error("Bu kupon sepetinizdeki ürünler için geçerli değil");
        return;
      }
    } else if (data.applicable_to === "product") {
      const productIds = data.product_ids || [];

      const hasValidProduct = cartItems.some(
        (item) =>
          item.products?.id && productIds.includes(item.products.id)
      );

      if (!hasValidProduct) {
        toast.error("Bu kupon sepetinizdeki ürünler için geçerli değil");
        return;
      }
    }

    setAppliedCoupon(data);
    setCouponCode(data.code || normalizedCouponCode);
    toast.success("Kupon kodu uygulandı!");
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success("Kupon kaldırıldı");
  };

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("Sepetinizde ürün bulunmuyor");
      return;
    }

    try {
      const checkoutData = {
        cartItems,
        subtotal,
        discount,
        total,
        appliedCoupon,
      };

      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      navigate("/odeme");
    } catch (error) {
      console.error("Error saving checkout data:", error);
      toast.error("Bir hata oluştu");
    }
  };

  // Query param varsa noindex
  const hasParams = Array.from(searchParams.keys()).length > 0;

  // Loading state
  if (loading) {
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

  // Empty cart
  if (!cartItems || cartItems.length === 0) {
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
        {hasParams && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Sepetim</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = item.products;
                if (!product) return null;

                const selectedOptions =
                  (item.selected_options as Record<string, string> | null) ??
                  null;

                return (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={
                            product.image_url ||
                            "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=150&fit=crop"
                          }
                          alt={product.name}
                          className="w-24 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">
                            {product.categories?.name}
                          </p>
                          <a
                            href={`/urun/${product.slug}`}
                            className="font-semibold text-lg mb-2 hover:text-primary transition-colors cursor-pointer block"
                          >
                            {product.name}
                          </a>

                          {product.quantity_options &&
                          Array.isArray(product.quantity_options) ? (
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
                                ? formatPrice(product.price)
                                : `${formatPrice(product.price)} x ${
                                    item.quantity
                                  }`}
                            </p>
                          )}

                          {selectedOptions &&
                            Object.keys(selectedOptions).length > 0 &&
                            product.custom_fields && (
                              <div className="mt-2 space-y-1">
                                {product.custom_fields.map((field: any) => {
                                  const value = selectedOptions[field.id];
                                  if (!value) return null;
                                  return (
                                    <p
                                      key={field.id}
                                      className="text-xs text-muted-foreground"
                                    >
                                      <span className="font-medium">
                                        {field.label}:
                                      </span>{" "}
                                      {value}
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

                          {/* API ürünleri ve quantity_options olanlar için qty kontrolü gösterme */}
                          {!product.quantity_options &&
                            product.delivery_type !== "api" && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
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
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
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
                    <span className="text-primary">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kupon Kodu</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Kupon kodunuzu girin"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                      />
                      <Button
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={!!appliedCoupon}
                      >
                        Uygula
                      </Button>
                      {appliedCoupon && (
                        <Button variant="ghost" onClick={clearCoupon}>
                          Kaldır
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <div className="text-xs text-muted-foreground">
                        Uygulanan kupon: {appliedCoupon.code}
                      </div>
                    )}
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
