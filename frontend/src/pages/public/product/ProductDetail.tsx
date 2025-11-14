// =============================================================
// FILE: src/pages/public/ProductDetail.tsx
// =============================================================
import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { skipToken } from "@reduxjs/toolkit/query";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSeoSettings } from "@/hooks/useSeoSettings";

import {
  useGetProductBySlugQuery,
  useListProductsQuery,
} from "@/integrations/metahub/rtk/endpoints/products.endpoints";
import { useListProductReviewsQuery } from "@/integrations/metahub/rtk/endpoints/product_reviews.endpoints";
import { useListProductFaqsQuery } from "@/integrations/metahub/rtk/endpoints/product_faqs.endpoints";
import {
  useGetSiteSettingByKeyQuery,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";
import {
  useListCartItemsQuery,
  useCreateCartItemMutation,
  useUpdateCartItemMutation,
  type CartItem as UserCartItem,
} from "@/integrations/metahub/rtk/endpoints/cart_items.endpoints";

import type {
  Product,
  Review,
  FAQ,
  QuantityOption,
} from "./components/productDetail.types";

import ProductMediaSection from "./components/ProductMediaSection";
import ProductInfoSection from "./components/ProductInfoSection";
import ProductDetailTabs from "./components/ProductDetailTabs";
import SimilarProductsGrid from "./components/SimilarProductsGrid";
import ProductArticleSection from "./components/ProductArticleSection";
import ProductDemoModal from "./components/ProductDemoModal";
import ProductLoadingState from "./components/ProductLoadingState";
import ProductNotFoundState from "./components/ProductNotFoundState";

// ----------------- Helpers -----------------

// Aynı custom_fields mı? (API ürünleri için duplicate kontrolü)
const isSameCustomFields = (
  fields1: Record<string, string> | null | undefined,
  fields2: Record<string, string> | null | undefined
): boolean => {
  if (!fields1 && !fields2) return true;
  if (!fields1 || !fields2) return false;

  const keys1 = Object.keys(fields1).sort();
  const keys2 = Object.keys(fields2).sort();

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => fields1[key] === fields2[key]);
};

// Custom field validation (hem Sepete Ekle hem Hızlı Satın Al için ortak)
const validateCustomFields = (
  product: Product,
  customFieldValues: Record<string, string>
): string | null => {
  if (!product.custom_fields || product.custom_fields.length === 0) return null;

  for (const field of product.custom_fields) {
    const value = customFieldValues[field.id];

    if (field.required && !value) {
      return `${field.label} alanı zorunludur`;
    }

    if (value) {
      if (field.type === "email" && !value.includes("@")) {
        return `${field.label} geçerli bir e-posta adresi olmalıdır (@)`;
      }

      if (field.type === "phone") {
        if (value.length < 10) {
          return `${field.label} en az 10 karakter olmalıdır`;
        }
        if (value.length > 15) {
          return `${field.label} en fazla 15 karakter olmalıdır`;
        }
      }

      if (field.type === "url") {
        try {
          new URL(value);
        } catch {
          return `${field.label} geçerli bir URL olmalıdır (https:// ile başlamalı)`;
        }
      }

      if (field.type === "text" && value.length > 130) {
        return `${field.label} en fazla 130 karakter olmalıdır`;
      }
    }
  }

  return null;
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSeoSettings();

  const hasParams = useMemo(
    () => Array.from(searchParams.keys()).length > 0,
    [searchParams]
  );

  // --------- Local UI state ---------
  const [quantity, setQuantity] = useState(1);
  const [selectedQuantityOption, setSelectedQuantityOption] =
    useState<QuantityOption | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string>
  >({});
  const [whatsappNumber, setWhatsappNumber] = useState("905555555555");
  const [showDemoModal, setShowDemoModal] = useState(false);

  // ----------------- RTK: Product -----------------

  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
  } = useGetProductBySlugQuery(slug ?? "", {
    skip: !slug,
  });

  const product = productData as Product | undefined;

  useEffect(() => {
    if (isProductError) {
      toast.error("Ürün bulunamadı");
    }
  }, [isProductError]);

  // Quantity options default seçimi (ürün değiştiğinde)
  useEffect(() => {
    if (
      product &&
      product.quantity_options &&
      Array.isArray(product.quantity_options) &&
      product.quantity_options.length > 0
    ) {
      setSelectedQuantityOption((prev) => prev ?? product.quantity_options![0]);
    } else {
      setSelectedQuantityOption(null);
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Slug değişince bazı state'leri resetle
  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0);
    setCustomFieldValues({});
  }, [slug]);

  // ----------------- RTK: Reviews & FAQs -----------------

  const {
    data: reviewsData = [],
  } = useListProductReviewsQuery(
    product ? { product_id: product.id, only_active: true } : undefined,
    { skip: !product }
  );

  const reviews = reviewsData as Review[];

  const {
    data: faqsData = [],
  } = useListProductFaqsQuery(
    product ? { product_id: product.id, only_active: true } : undefined,
    { skip: !product }
  );

  const faqs = faqsData as FAQ[];

  // ----------------- RTK: Similar Products -----------------

  const { data: similarProductsData = [] } = useListProductsQuery(
    product?.category_id
      ? {
          category_id: product.category_id,
          is_active: true,
          limit: 4,
          offset: 0,
          sort: "created_at",
          order: "desc",
        }
      : undefined,
    { skip: !product?.category_id }
  );

  const similarProducts = (similarProductsData as Product[]).filter(
    (p) => p.id !== product?.id
  );

  // ----------------- RTK: Site Settings -----------------

  const { data: whatsappSetting } =
    useGetSiteSettingByKeyQuery("whatsapp_number");

  const { data: guestOrderSetting } =
    useGetSiteSettingByKeyQuery("guest_order_enabled");

  useEffect(() => {
    if (whatsappSetting?.value != null) {
      setWhatsappNumber(String(whatsappSetting.value));
    }
  }, [whatsappSetting]);

  const guestOrderEnabled = useMemo(() => {
    const v = guestOrderSetting?.value;
    if (v === true || v === "true") return true;
    if (v === false || v === "false") return false;
    // Ayar yoksa/donanıksa default: açık
    return true;
  }, [guestOrderSetting]);

  // ----------------- RTK: Cart Items (logged-in) -----------------

  const {
    data: cartItemsData = [],
    refetch: refetchCartItems,
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

  const [createCartItem] = useCreateCartItemMutation();
  const [updateCartItem] = useUpdateCartItemMutation();

  // ----------------- Actions -----------------

  const handleWhatsAppPurchase = () => {
    if (!product) return;

    const effectivePrice = selectedQuantityOption
      ? selectedQuantityOption.price
      : product.price;
    const effectiveQuantity = selectedQuantityOption
      ? selectedQuantityOption.quantity
      : quantity;

    const message = encodeURIComponent(
      `Merhaba, ${product.name} ürününü satın almak istiyorum.\nMiktar: ${effectiveQuantity}\nFiyat: ${effectivePrice} TL`
    );

    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const handleQuickBuy = async () => {
    if (!product) return;

    const validationError = validateCustomFields(product, customFieldValues);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const effectiveQty = selectedQuantityOption
      ? selectedQuantityOption.quantity
      : quantity;
    const selectedOptionsPayload =
      product.custom_fields && product.custom_fields.length > 0
        ? (customFieldValues as Record<string, unknown>)
        : null;

    // GUEST USER
    if (!user) {
      if (!guestOrderEnabled) {
        toast.error("Hızlı satın alma için giriş yapmalısınız");
        window.location.href = "/giris";
        return;
      }

      try {
        const guestCartData = localStorage.getItem("guestCart");
        const guestCart = guestCartData ? JSON.parse(guestCartData) : [];

        const effectivePrice = selectedQuantityOption
          ? selectedQuantityOption.price
          : product.price;

        // API ürünleri için aynı custom_fields ile duplicate engelle
        if (
          product.delivery_type === "api" &&
          product.custom_fields &&
          product.custom_fields.length > 0
        ) {
          const duplicateItem = guestCart.find(
            (item: any) =>
              item.productId === product.id &&
              isSameCustomFields(item.selected_options, customFieldValues)
          );

          if (duplicateItem) {
            toast.error(
              "Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin."
            );
            return;
          }
        }

        const existingItemIndex = guestCart.findIndex(
          (item: any) =>
            item.productId === product.id &&
            isSameCustomFields(item.selected_options, customFieldValues)
        );

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity = effectiveQty;
          guestCart[existingItemIndex].selected_options = selectedOptionsPayload;
        } else {
          guestCart.push({
            productId: product.id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          });
        }

        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        window.dispatchEvent(new Event("guestCartUpdated"));

        const cartItem = {
          id: `guest-${product.id}`,
          quantity: effectiveQty,
          selected_options: selectedOptionsPayload,
          products: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: effectivePrice,
            image_url: product.image_url,
            // eski implementation product_type kullanıyordu
            delivery_type: product.product_type,
            custom_fields: product.custom_fields,
            quantity_options: product.quantity_options,
            categories: product.categories,
          },
        };

        const subtotal = effectivePrice * effectiveQty;
        const checkoutData = {
          cartItems: [cartItem],
          subtotal,
          discount: 0,
          total: subtotal,
          appliedCoupon: null,
        };

        sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
        toast.success("Ödeme sayfasına yönlendiriliyorsunuz...");
        setTimeout(() => navigate("/odeme"), 500);
      } catch (error) {
        console.error("Error in quick buy:", error);
        toast.error("Bir hata oluştu");
      }

      return;
    }

    // LOGGED-IN USER
    try {
      const currentCartItems = (cartItemsData as UserCartItem[]) || [];

      // API + custom_fields → duplicate engelle
      if (
        product.delivery_type === "api" &&
        product.custom_fields &&
        product.custom_fields.length > 0
      ) {
        const duplicateItem = currentCartItems.find(
          (item) =>
            item.product_id === product.id &&
            isSameCustomFields(
              (item.selected_options as Record<string, string> | null) ?? null,
              customFieldValues
            )
        );

        if (duplicateItem) {
          toast.error(
            "Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin."
          );
          return;
        }
      }

      if (product.delivery_type === "api") {
        // API ürünleri: her seferinde yeni satır (duplicate kontrolü yukarıda)
        await createCartItem({
          user_id: user.id,
          product_id: product.id,
          quantity: effectiveQty,
          selected_options: selectedOptionsPayload,
        }).unwrap();
      } else {
        // Normal ürünlerde: aynı product_id + aynı custom_fields için upsert
        const existingItem = currentCartItems.find(
          (item) =>
            item.product_id === product.id &&
            isSameCustomFields(
              (item.selected_options as Record<string, string> | null) ?? null,
              selectedOptionsPayload as Record<string, string> | null
            )
        );

        if (existingItem) {
          await updateCartItem({
            id: existingItem.id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          }).unwrap();
        } else {
          await createCartItem({
            user_id: user.id,
            product_id: product.id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          }).unwrap();
        }
      }

      // Sepeti RTK üzerinden tekrar çek → checkoutData hazırla
      const result = await refetchCartItems();
      const updatedCartItems =
        (result.data as UserCartItem[]) ||
        (cartItemsData as UserCartItem[]);

      const subtotal =
        updatedCartItems?.reduce((sum: number, item) => {
          const qty = item.quantity ?? 0;
          const p = item.products;
          if (!p) return sum;

          const itemPrice =
            p.quantity_options && Array.isArray(p.quantity_options)
              ? p.quantity_options.find((opt) => opt.quantity === qty)
                  ?.price ?? p.price
              : p.price;

          return sum + (itemPrice || 0) * qty;
        }, 0) || 0;

      const checkoutData = {
        cartItems: updatedCartItems,
        subtotal,
        discount: 0,
        total: subtotal,
        appliedCoupon: null,
      };

      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      toast.success("Ödeme sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => navigate("/odeme"), 500);
    } catch (error) {
      console.error("Error in quick buy:", error);
      toast.error("Bir hata oluştu");
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const validationError = validateCustomFields(product, customFieldValues);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const effectiveQty = selectedQuantityOption
      ? selectedQuantityOption.quantity
      : quantity;
    const selectedOptionsPayload =
      product.custom_fields && product.custom_fields.length > 0
        ? (customFieldValues as Record<string, unknown>)
        : null;

    // GUEST USER
    if (!user) {
      if (!guestOrderEnabled) {
        toast.error("Sepete eklemek için giriş yapmalısınız");
        window.location.href = "/giris";
        return;
      }

      try {
        const guestCartData = localStorage.getItem("guestCart");
        const guestCart = guestCartData ? JSON.parse(guestCartData) : [];

        if (
          product.delivery_type === "api" &&
          product.custom_fields &&
          product.custom_fields.length > 0
        ) {
          const duplicateItem = guestCart.find(
            (item: any) =>
              item.productId === product.id &&
              isSameCustomFields(item.selected_options, customFieldValues)
          );

          if (duplicateItem) {
            toast.error(
              "Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin."
            );
            return;
          }
        }

        const existingItemIndex = guestCart.findIndex(
          (item: any) =>
            item.productId === product.id &&
            isSameCustomFields(item.selected_options, customFieldValues)
        );

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity = effectiveQty;
          guestCart[existingItemIndex].selected_options = selectedOptionsPayload;
        } else {
          guestCart.push({
            productId: product.id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          });
        }

        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        window.dispatchEvent(new Event("guestCartUpdated"));
        window.dispatchEvent(new Event("cartItemAdded"));
        toast.success(`${effectiveQty} adet ürün sepete eklendi!`);
        setCustomFieldValues({});
      } catch (error) {
        console.error("Error adding to guest cart:", error);
        toast.error("Sepete eklenirken bir hata oluştu");
      }

      return;
    }

    // LOGGED-IN USER
    try {
      const currentCartItems = (cartItemsData as UserCartItem[]) || [];

      if (
        product.delivery_type === "api" &&
        product.custom_fields &&
        product.custom_fields.length > 0
      ) {
        const duplicateItem = currentCartItems.find(
          (item) =>
            item.product_id === product.id &&
            isSameCustomFields(
              (item.selected_options as Record<string, string> | null) ?? null,
              customFieldValues
            )
        );

        if (duplicateItem) {
          toast.error(
            "Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin."
          );
          return;
        }
      }

      if (product.delivery_type === "api") {
        // API ürünleri: her seferinde yeni satır, duplicate check yukarıda
        await createCartItem({
          user_id: user.id,
          product_id: product.id,
          quantity: effectiveQty,
          selected_options: selectedOptionsPayload,
        }).unwrap();
      } else {
        // Normal ürün: eski davranışa yakın - product_id bazlı upsert
        const existingItem = currentCartItems.find(
          (item) => item.product_id === product.id
        );

        if (existingItem) {
          await updateCartItem({
            id: existingItem.id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          }).unwrap();
        } else {
          await createCartItem({
            user_id: user.id,
            product_id: product.id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          }).unwrap();
        }
      }

      window.dispatchEvent(new Event("cartItemAdded"));
      toast.success(`${effectiveQty} adet ürün sepete eklendi!`);
      setCustomFieldValues({});
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Sepete eklenirken bir hata oluştu");
    }
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // ----------------- Schema.org -----------------

  const generateProductSchema = () => {
    if (!product) return null;

    const schema: any = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      description: product.short_description || product.description,
      image: product.image_url ? [product.image_url] : [],
      sku: product.id,
      brand: {
        "@type": "Brand",
        name: settings.site_title,
      },
      offers: {
        "@type": "Offer",
        url: window.location.href,
        priceCurrency: "TRY",
        price: product.price,
        availability: "https://schema.org/InStock",
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        )
          .toISOString()
          .split("T")[0],
      },
    };

    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );

      schema["aggregateRating"] = {
        "@type": "AggregateRating",
        ratingValue: (totalRating / reviews.length).toFixed(1),
        reviewCount: reviews.length,
      };

      schema["review"] = reviews.map((review) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: review.customer_name,
        },
        datePublished: review.review_date,
        reviewBody: review.comment,
      }));
    }

    return schema;
  };

  const generateFAQSchema = () => {
    if (faqs.length === 0) return null;
    return {
      "@context": "https://schema.org/",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  };

  const productSchema = generateProductSchema();
  const faqSchema = generateFAQSchema();

  // ----------------- Render -----------------

  if (isProductLoading) {
    return <ProductLoadingState />;
  }

  if (!product) {
    return <ProductNotFoundState />;
  }

  const gallery =
    product.gallery_urls && product.gallery_urls.length > 0
      ? product.gallery_urls
      : [product.image_url];

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{product.name} | Ürün Detay</title>
        <meta
          name="description"
          content={
            product.short_description || product.description || product.name
          }
        />
        {hasParams && <meta name="robots" content="noindex, follow" />}
        {productSchema && (
          <script type="application/ld+json">
            {JSON.stringify(productSchema)}
          </script>
        )}
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>

      <Navbar />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="text-sm text-muted-foreground mb-6">
            <a href="/" className="hover:text-primary">
              Ana Sayfa
            </a>
            {" / "}
            <a href="/urunler" className="hover:text-primary">
              Ürünler
            </a>
            {" / "}
            <span className="text-foreground">
              {product.categories?.name}
            </span>
          </div>

          {/* Üst kısım: Görsel + Bilgi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <ProductMediaSection
              product={product}
              gallery={gallery}
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
            />

            <ProductInfoSection
              product={product}
              quantity={quantity}
              onIncreaseQuantity={increaseQuantity}
              onDecreaseQuantity={decreaseQuantity}
              selectedQuantityOption={selectedQuantityOption}
              onSelectQuantityOption={setSelectedQuantityOption}
              customFieldValues={customFieldValues}
              onCustomFieldValuesChange={setCustomFieldValues}
              onQuickBuy={handleQuickBuy}
              onAddToCart={handleAddToCart}
              onWhatsAppPurchase={handleWhatsAppPurchase}
              onOpenDemoModal={() => setShowDemoModal(true)}
            />
          </div>

          {/* Tabs: Açıklama, Demo, Yorumlar, SSS */}
          <ProductDetailTabs
            product={product}
            reviews={reviews}
            faqs={faqs}
          />

          {/* Benzer Ürünler */}
          <SimilarProductsGrid products={similarProducts} />

          {/* Article Content */}
          <ProductArticleSection product={product} />
        </div>
      </div>

      <Footer />

      {/* Demo Modal */}
      <ProductDemoModal
        product={product}
        open={showDemoModal}
        onOpenChange={setShowDemoModal}
      />
    </div>
  );
};

export default ProductDetail;
