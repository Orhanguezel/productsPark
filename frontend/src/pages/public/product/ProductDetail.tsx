// =============================================================
// FILE: src/pages/public/ProductDetail.tsx
// FINAL — Product Detail (SEO via SeoHelmet; NO duplicates; product-specific only)
// - Canonical/hreflang: RouteSeoLinks (global)
// - Global defaults: GlobalSeo (global)
// - Route SEO: SeoHelmet only
// - ogType: "website" (SeoHelmetProps contract)
// - JSON-LD builders are centralized in src/components/seo/jsonld.ts
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { skipToken } from '@reduxjs/toolkit/query';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SeoHelmet from '@/seo/SeoHelmet';

import { useAuth } from '@/hooks/useAuth';
import { useSeoSettings } from '@/hooks/useSeoSettings';

import {
  useCreateCartItemMutation,
  useGetProductBySlugQuery,
  useGetSiteSettingByKeyQuery,
  useListCartItemsQuery,
  useListProductFaqsQuery,
  useListProductReviewsQuery,
  useListProductsQuery,
  useUpdateCartItemMutation,
} from '@/integrations/hooks';

import type {
  CustomField,
  Product,
  ProductFaq,
  ProductReview,
  PublicCartItem,
  PublicCartItemProduct,
  QuantityOption,
} from '@/integrations/types';

import ProductMediaSection from './components/ProductMediaSection';
import ProductInfoSection from './components/ProductInfoSection';
import ProductDetailTabs from './components/ProductDetailTabs';
import SimilarProductsGrid from './components/SimilarProductsGrid';
import ProductArticleSection from './components/ProductArticleSection';
import ProductDemoModal from './components/ProductDemoModal';
import ProductLoadingState from './components/ProductLoadingState';
import ProductNotFoundState from './components/ProductNotFoundState';

import { ClampScrollHtml } from '@/components/common/ClampScrollHtml';

import { getOrigin, imgSrc, nonEmpty } from '@/integrations/types';
import { stripHtmlToText, truncateText } from '@/integrations/types';
import { buildFaqJsonLd, buildProductJsonLd } from '@/seo/jsonld';

/* ----------------------------- local helpers (non-SEO) ----------------------------- */

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const fieldKey = (field: Pick<CustomField, 'id' | 'label'>): string =>
  typeof field.id === 'string' && field.id.trim() ? field.id : field.label;

const isSameCustomFields = (
  fields1: Record<string, string> | null | undefined,
  fields2: Record<string, string> | null | undefined,
): boolean => {
  if (!fields1 && !fields2) return true;
  if (!fields1 || !fields2) return false;

  const keys1 = Object.keys(fields1).sort();
  const keys2 = Object.keys(fields2).sort();
  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => fields1[key] === fields2[key]);
};

const validateCustomFields = (product: Product, values: Record<string, string>): string | null => {
  if (!product.custom_fields || product.custom_fields.length === 0) return null;

  for (const field of product.custom_fields) {
    const key = fieldKey(field);
    const value = values[key];

    if (field.required && !value) return `${field.label} alanı zorunludur`;

    if (value) {
      if (field.type === 'email' && !value.includes('@')) {
        return `${field.label} geçerli bir e-posta adresi olmalıdır (@)`;
      }

      if (field.type === 'phone') {
        if (value.length < 10) return `${field.label} en az 10 karakter olmalıdır`;
        if (value.length > 15) return `${field.label} en fazla 15 karakter olmalıdır`;
      }

      if (field.type === 'url') {
        try {
          new URL(value);
        } catch {
          return `${field.label} geçerli bir URL olmalıdır (https:// ile başlamalı)`;
        }
      }

      if (field.type === 'text' && value.length > 130) {
        return `${field.label} en fazla 130 karakter olmalıdır`;
      }
    }
  }

  return null;
};

const toPublicCartItemProduct = (p: Product, effectivePrice: number): PublicCartItemProduct => {
  const categoriesMini =
    p.categories && (p.categories as any).id && (p.categories as any).name
      ? { id: (p.categories as any).id, name: (p.categories as any).name }
      : null;

  const customFieldsAsRecords: ReadonlyArray<Record<string, unknown>> | null = Array.isArray(
    (p as any).custom_fields,
  )
    ? ((p as any).custom_fields as ReadonlyArray<Record<string, unknown>>)
    : null;

  return {
    id: p.id,
    name: (p as any).name,
    slug: (p as any).slug,
    price: effectivePrice,
    image_url: (p as any).image_url ?? null,

    delivery_type: ((p as any).delivery_type ?? null) as string | null,
    stock_quantity: (p as any).stock_quantity ?? null,

    custom_fields: customFieldsAsRecords,
    quantity_options: (p as any).quantity_options ?? null,

    api_provider_id: (p as any).api_provider_id ?? null,
    api_product_id: (p as any).api_product_id ?? null,
    api_quantity: (p as any).api_quantity ?? null,

    category_id: (p as any).category_id ?? null,
    categories: categoriesMini,
  };
};

const buildGallery = (p: Product): string[] => {
  const cover = toStr((p as any).featured_image ?? (p as any).image_url).trim();
  const gal = Array.isArray((p as any).gallery_urls) ? ((p as any).gallery_urls as unknown[]) : [];

  const all = [cover, ...gal.map((x) => toStr(x).trim())].filter((x): x is string => !!x);

  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const url of all) {
    if (seen.has(url)) continue;
    seen.add(url);
    uniq.push(url);
  }
  return uniq;
};

const clampIndex = (idx: number, len: number): number => {
  if (len <= 0) return 0;
  return Math.min(Math.max(0, idx), len - 1);
};

/* ----------------------------- SEO helpers (small; no JSON-LD here) ----------------------------- */

function computeSeoTitle(p: Product | undefined, siteTitle: string): string {
  const metaTitle = nonEmpty((p as any)?.meta_title);
  if (metaTitle) return metaTitle;

  const name = nonEmpty((p as any)?.name);
  if (!name) return siteTitle || 'Ürün';

  return siteTitle ? `${name} | ${siteTitle}` : name;
}

function computeSeoDescription(p: Product | undefined): string {
  const metaDesc = nonEmpty((p as any)?.meta_description);
  if (metaDesc) return metaDesc;

  const shortDesc = nonEmpty((p as any)?.short_description);
  if (shortDesc) return truncateText(shortDesc, 160);

  const descHtml = nonEmpty((p as any)?.description);
  if (descHtml) {
    const text = nonEmpty(stripHtmlToText(descHtml));
    return text ? truncateText(text, 160) : '';
  }

  const name = nonEmpty((p as any)?.name);
  return name ? truncateText(name, 160) : '';
}

/* ----------------------------- component ----------------------------- */

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { flat } = useSeoSettings({ seoOnly: true });

  const hasParams = useMemo(() => Array.from(searchParams.keys()).length > 0, [searchParams]);

  const [quantity, setQuantity] = useState(1);
  const [selectedQuantityOption, setSelectedQuantityOption] = useState<QuantityOption | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [whatsappNumber, setWhatsappNumber] = useState('905555555555');
  const [showDemoModal, setShowDemoModal] = useState(false);

  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
  } = useGetProductBySlugQuery(slug ?? '', { skip: !slug });

  const product = productData as Product | undefined;

  useEffect(() => {
    if (isProductError) toast.error('Ürün bulunamadı');
  }, [isProductError]);

  const origin = useMemo(() => {
    const base = nonEmpty((flat as any)?.canonical_base_url);
    return base || getOrigin();
  }, [flat]);

  const canonicalUrl = useMemo(() => {
    const s = nonEmpty(slug);
    if (!origin || !s) return '';
    return `${origin}/urun/${encodeURIComponent(s)}`;
  }, [origin, slug]);

  const siteTitle = nonEmpty((flat as any)?.site_title);

  const gallery = useMemo(() => (product ? buildGallery(product) : []), [product]);

  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0);
    setCustomFieldValues({});
    setSelectedQuantityOption(null);
  }, [product?.id]);

  useEffect(() => {
    setSelectedImage((prev) => clampIndex(prev, gallery.length));
  }, [gallery.length]);

  useEffect(() => {
    const opts = (product as any)?.quantity_options;
    const first: QuantityOption | null =
      Array.isArray(opts) && opts.length > 0 ? (opts[0] ?? null) : null;

    if (first) setSelectedQuantityOption((prev) => prev ?? first);
    else setSelectedQuantityOption(null);
  }, [product, (product as any)?.id]);

  const { data: reviewsData = [] } = useListProductReviewsQuery(
    product ? { product_id: (product as any).id, only_active: true } : undefined,
    { skip: !product },
  );
  const reviews = reviewsData as ProductReview[];

  const { data: faqsData = [] } = useListProductFaqsQuery(
    product ? { product_id: (product as any).id, only_active: true } : undefined,
    { skip: !product },
  );
  const faqs = faqsData as ProductFaq[];

  const similarProductsArgs = useMemo(() => {
    const catId = (product as any)?.category_id;
    if (!catId) return undefined;

    return {
      category_id: catId,
      is_active: true as const,
      limit: 4,
      offset: 0,
      sort: 'created_at' as const,
      order: 'desc' as const,
    };
  }, [product]);

  const { data: similarProductsData = [] } = useListProductsQuery(similarProductsArgs, {
    skip: !(product as any)?.category_id,
  });
  const similarProducts = (similarProductsData as Product[]).filter(
    (p) => (p as any).id !== (product as any)?.id,
  );

  const { data: whatsappSetting } = useGetSiteSettingByKeyQuery('whatsapp_number');
  const { data: guestOrderSetting } = useGetSiteSettingByKeyQuery('guest_order_enabled');

  useEffect(() => {
    if (whatsappSetting?.value != null) setWhatsappNumber(toStr(whatsappSetting.value));
  }, [whatsappSetting]);

  const guestOrderEnabled = useMemo(() => {
    const v = guestOrderSetting?.value;
    if (v === true || v === 'true') return true;
    if (v === false || v === 'false') return false;
    return true;
  }, [guestOrderSetting]);

  const { data: cartItemsData = [], refetch: refetchCartItems } = useListCartItemsQuery(
    user
      ? { user_id: (user as any).id, with: 'products', sort: 'created_at', order: 'desc' }
      : skipToken,
  );

  const [createCartItem] = useCreateCartItemMutation();
  const [updateCartItem] = useUpdateCartItemMutation();

  const handleWhatsAppPurchase = () => {
    if (!product) return;

    const effectivePrice = selectedQuantityOption
      ? (selectedQuantityOption as any).price
      : (product as any).price;
    const effectiveQuantity = selectedQuantityOption
      ? (selectedQuantityOption as any).quantity
      : quantity;

    const message = encodeURIComponent(
      `Merhaba, ${(product as any).name} ürününü satın almak istiyorum.\nMiktar: ${effectiveQuantity}\nFiyat: ${effectivePrice} TL`,
    );

    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  // QuickBuy + AddToCart akışlarını değiştirmiyorum; SEO ile ilgili değil.
  const handleQuickBuy = async () => {
    if (!product) return;

    const validationError = validateCustomFields(product, customFieldValues);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const effectiveQty = selectedQuantityOption
      ? (selectedQuantityOption as any).quantity
      : quantity;

    const selectedOptionsPayload =
      (product as any).custom_fields && (product as any).custom_fields.length > 0
        ? (customFieldValues as Record<string, unknown>)
        : null;

    if (!user) {
      if (!guestOrderEnabled) {
        toast.error('Hızlı satın alma için giriş yapmalısınız');
        window.location.href = '/giris';
        return;
      }

      try {
        const guestCartData = localStorage.getItem('guestCart');
        const guestCart: any[] = guestCartData ? JSON.parse(guestCartData) : [];

        const effectivePrice = selectedQuantityOption
          ? (selectedQuantityOption as any).price
          : (product as any).price;

        if ((product as any).delivery_type === 'api' && (product as any).custom_fields?.length) {
          const duplicateItem = guestCart.find(
            (item) =>
              item.productId === (product as any).id &&
              isSameCustomFields(item.selected_options, customFieldValues),
          );
          if (duplicateItem) {
            toast.error(
              'Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin.',
            );
            return;
          }
        }

        const existingItemIndex = guestCart.findIndex(
          (item) =>
            item.productId === (product as any).id &&
            isSameCustomFields(item.selected_options, customFieldValues),
        );

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity = effectiveQty;
          guestCart[existingItemIndex].selected_options = selectedOptionsPayload;
        } else {
          guestCart.push({
            productId: (product as any).id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          });
        }

        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        window.dispatchEvent(new Event('guestCartUpdated'));

        const productsForCart = toPublicCartItemProduct(product, effectivePrice);

        const cartItem: PublicCartItem = {
          id: `guest-${(product as any).id}`,
          user_id: null,
          product_id: (product as any).id,
          quantity: effectiveQty,
          selected_options: selectedOptionsPayload,
          created_at: null,
          updated_at: null,
          products: productsForCart,
        };

        const subtotal = (effectivePrice || 0) * effectiveQty;
        const checkoutData = {
          cartItems: [cartItem],
          subtotal,
          discount: 0,
          total: subtotal,
          appliedCoupon: null,
        };

        sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
        toast.success('Ödeme sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/odeme'), 500);
      } catch (e) {
        console.error('Error in quick buy:', e);
        toast.error('Bir hata oluştu');
      }
      return;
    }

    try {
      const currentCartItems = (cartItemsData as PublicCartItem[]) || [];

      if ((product as any).delivery_type === 'api' && (product as any).custom_fields?.length) {
        const duplicateItem = currentCartItems.find(
          (item) =>
            (item as any).product_id === (product as any).id &&
            isSameCustomFields(
              ((item as any).selected_options as Record<string, string> | null) ?? null,
              customFieldValues,
            ),
        );
        if (duplicateItem) {
          toast.error(
            'Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin.',
          );
          return;
        }
      }

      if ((product as any).delivery_type === 'api') {
        await createCartItem({
          user_id: (user as any).id,
          product_id: (product as any).id,
          quantity: effectiveQty,
          selected_options: selectedOptionsPayload,
        }).unwrap();
      } else {
        const existingItem = currentCartItems.find(
          (item) =>
            (item as any).product_id === (product as any).id &&
            isSameCustomFields(
              ((item as any).selected_options as Record<string, string> | null) ?? null,
              (selectedOptionsPayload as Record<string, string> | null) ?? null,
            ),
        );

        if (existingItem) {
          await updateCartItem({
            id: (existingItem as any).id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          }).unwrap();
        } else {
          await createCartItem({
            user_id: (user as any).id,
            product_id: (product as any).id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          }).unwrap();
        }
      }

      const result = await refetchCartItems();
      const updatedCartItems =
        (result.data as PublicCartItem[]) || (cartItemsData as PublicCartItem[]);

      const subtotal =
        updatedCartItems?.reduce((sum: number, item) => {
          const qty = (item as any).quantity ?? 0;
          const p = (item as any).products;
          if (!p) return sum;

          const itemPrice =
            Array.isArray(p.quantity_options) && p.quantity_options.length > 0
              ? (p.quantity_options.find((opt: any) => opt.quantity === qty)?.price ?? p.price)
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
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      toast.success('Ödeme sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/odeme'), 500);
    } catch (e) {
      console.error('Error in quick buy:', e);
      toast.error('Bir hata oluştu');
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
      ? (selectedQuantityOption as any).quantity
      : quantity;

    const selectedOptionsPayload =
      (product as any).custom_fields && (product as any).custom_fields.length > 0
        ? (customFieldValues as Record<string, unknown>)
        : null;

    if (!user) {
      if (!guestOrderEnabled) {
        toast.error('Sepete eklemek için giriş yapmalısınız');
        window.location.href = '/giris';
        return;
      }

      try {
        const guestCartData = localStorage.getItem('guestCart');
        const guestCart: any[] = guestCartData ? JSON.parse(guestCartData) : [];

        if ((product as any).delivery_type === 'api' && (product as any).custom_fields?.length) {
          const duplicateItem = guestCart.find(
            (item) =>
              item.productId === (product as any).id &&
              isSameCustomFields(item.selected_options, customFieldValues),
          );
          if (duplicateItem) {
            toast.error(
              'Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin.',
            );
            return;
          }
        }

        const existingItemIndex = guestCart.findIndex(
          (item) =>
            item.productId === (product as any).id &&
            isSameCustomFields(item.selected_options, customFieldValues),
        );

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity = effectiveQty;
          guestCart[existingItemIndex].selected_options = selectedOptionsPayload;
        } else {
          guestCart.push({
            productId: (product as any).id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          });
        }

        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        window.dispatchEvent(new Event('guestCartUpdated'));
        toast.success('Sepete eklendi');
      } catch (e) {
        console.error('Error add to cart (guest):', e);
        toast.error('Bir hata oluştu');
      }
      return;
    }

    try {
      const currentCartItems = (cartItemsData as PublicCartItem[]) || [];

      if ((product as any).delivery_type === 'api' && (product as any).custom_fields?.length) {
        const duplicateItem = currentCartItems.find(
          (item) =>
            (item as any).product_id === (product as any).id &&
            isSameCustomFields(
              ((item as any).selected_options as Record<string, string> | null) ?? null,
              customFieldValues,
            ),
        );
        if (duplicateItem) {
          toast.error(
            'Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin.',
          );
          return;
        }
      }

      if ((product as any).delivery_type === 'api') {
        await createCartItem({
          user_id: (user as any).id,
          product_id: (product as any).id,
          quantity: effectiveQty,
          selected_options: selectedOptionsPayload,
        }).unwrap();
      } else {
        const existingItem = currentCartItems.find(
          (item) =>
            (item as any).product_id === (product as any).id &&
            isSameCustomFields(
              ((item as any).selected_options as Record<string, string> | null) ?? null,
              (selectedOptionsPayload as Record<string, string> | null) ?? null,
            ),
        );

        if (existingItem) {
          await updateCartItem({
            id: (existingItem as any).id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          }).unwrap();
        } else {
          await createCartItem({
            user_id: (user as any).id,
            product_id: (product as any).id,
            quantity: effectiveQty,
            selected_options: selectedOptionsPayload,
          }).unwrap();
        }
      }

      await refetchCartItems();
      toast.success('Sepete eklendi');
    } catch (e) {
      console.error('Error add to cart:', e);
      toast.error('Bir hata oluştu');
    }
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  /* ----------------------------- SEO (route-level; minimal) ----------------------------- */

  const seoTitle = useMemo(() => computeSeoTitle(product, siteTitle), [product, siteTitle]);
  const seoDesc = useMemo(() => computeSeoDescription(product), [product]);

  const ogImage = useMemo(() => {
    // no fallback: only emit if product has image_url
    const u = imgSrc((product as any)?.image_url);
    return u || null;
  }, [product]);

  const robots = useMemo(() => {
    if (hasParams) return 'noindex,follow';

    const isPublished =
      typeof (product as any)?.is_published === 'boolean' ? (product as any).is_published : true;
    const isActive =
      typeof (product as any)?.is_active === 'boolean' ? (product as any).is_active : true;

    if (!isPublished || !isActive) return 'noindex,nofollow';
    return null;
  }, [hasParams, product]);

  const imagesForSchema = useMemo(() => {
    const imgs = gallery.map((u) => imgSrc(u)).filter(Boolean) as string[];
    if (imgs.length) return imgs;

    const single = imgSrc((product as any)?.image_url);
    return single ? [single] : [];
  }, [gallery, product]);

  const productJsonLd = useMemo(() => {
    if (!product || !canonicalUrl) return null;
    return buildProductJsonLd({
      product,
      canonicalUrl,
      siteName: siteTitle || null,
      images: imagesForSchema,
      reviews,
    });
  }, [product, canonicalUrl, siteTitle, imagesForSchema, reviews]);

  const faqJsonLd = useMemo(() => buildFaqJsonLd(faqs), [faqs]);

  const jsonLd = useMemo(() => {
    const arr = [productJsonLd, faqJsonLd].filter(Boolean) as Array<Record<string, unknown>>;
    return arr.length ? (arr.length === 1 ? arr[0] : arr) : null;
  }, [productJsonLd, faqJsonLd]);

  /* ----------------------------- render guards ----------------------------- */

  if (isProductLoading) return <ProductLoadingState />;
  if (!product) return <ProductNotFoundState />;

  const descriptionNode = (
    <ClampScrollHtml
      title="Ürün Açıklaması"
      html={toStr((product as any)?.description)}
      maxHeight={360}
    />
  );

  const categoryName = nonEmpty((product as any)?.categories?.name);

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHelmet
        title={seoTitle || null}
        description={seoDesc || null}
        ogType="website"
        url={canonicalUrl || null}
        imageUrl={ogImage}
        robots={robots}
        jsonLd={jsonLd ?? null} // ✅ exactOptionalPropertyTypes fix
      />

      <Navbar />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="text-sm text-muted-foreground mb-6">
            <a href="/" className="hover:text-primary">
              Ana Sayfa
            </a>
            {' / '}
            <a href="/urunler" className="hover:text-primary">
              Ürünler
            </a>
            {categoryName ? (
              <>
                {' / '}
                <span className="text-foreground">{categoryName}</span>
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
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

          <ProductDetailTabs
            product={product}
            reviews={reviews}
            faqs={faqs}
            descriptionNode={descriptionNode}
          />

          <SimilarProductsGrid products={similarProducts} />
          <ProductArticleSection product={product} />
        </div>
      </div>

      <Footer />

      <ProductDemoModal product={product} open={showDemoModal} onOpenChange={setShowDemoModal} />
    </div>
  );
};

export default ProductDetail;
