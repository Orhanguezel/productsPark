import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, Minus, ShoppingCart, Zap, Check, Shield, Clock, Headphones, Sparkles, ExternalLink, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import { useSeoSettings } from "@/hooks/useSeoSettings";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  review_date: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

interface CustomField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  rating: number;
  review_count: number;
  features: string[] | null;
  custom_fields?: CustomField[];
  quantity_options?: { quantity: number, price: number }[] | null;
  product_type?: string;
  delivery_type?: string;
  demo_url?: string | null;
  demo_embed_enabled?: boolean;
  demo_button_text?: string | null;
  article_content?: string | null;
  article_enabled?: boolean;
  badges?: Array<{ text: string; icon: string; active: boolean }>;
  categories?: {
    id: string;
    name: string;
  };
}

// Helper function to compare custom fields
const isSameCustomFields = (fields1: Record<string, string> | null | undefined,
  fields2: Record<string, string> | null | undefined): boolean => {
  // Both empty are the same
  if (!fields1 && !fields2) return true;
  if (!fields1 || !fields2) return false;

  // Compare keys
  const keys1 = Object.keys(fields1).sort();
  const keys2 = Object.keys(fields2).sort();

  if (keys1.length !== keys2.length) return false;

  // Compare values
  return keys1.every(key => fields1[key] === fields2[key]);
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useSeoSettings();

  // Check if has any query params for noindex
  const hasParams = Array.from(searchParams.keys()).length > 0;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedQuantityOption, setSelectedQuantityOption] = useState<{ quantity: number, price: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [whatsappNumber, setWhatsappNumber] = useState("905555555555");
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProduct(slug);
    }
    fetchWhatsappNumber();
  }, [slug]);

  const fetchWhatsappNumber = async () => {
    try {
      const { data } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();

      if (data?.value) {
        setWhatsappNumber(String(data.value));
      }
    } catch (error) {
      console.error("Error fetching whatsapp number:", error);
    }
  };

  const fetchProduct = async (slug: string) => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("products")
        .select("*, categories(id, name)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProduct(data as unknown as Product);
        // Set first quantity option if available
        if ((data as any).quantity_options && Array.isArray((data as any).quantity_options) && (data as any).quantity_options.length > 0) {
          setSelectedQuantityOption((data as any).quantity_options[0]);
        }
        fetchSimilarProducts(data.category_id);
        fetchReviews(data.id);
        fetchFAQs(data.id);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Ürün bulunamadı");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId: string) => {
    try {
      const { data, error } = await metahub
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("review_date", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchFAQs = async (productId: string) => {
    try {
      const { data, error } = await metahub
        .from("product_faqs")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setFAQs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    }
  };

  const fetchSimilarProducts = async (categoryId: string | null) => {
    if (!categoryId) return;

    try {
      const { data, error } = await metahub
        .from("products")
        .select("*, categories(id, name)")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .limit(4);

      if (error) throw error;
      setSimilarProducts((data || []) as unknown as Product[]);
    } catch (error) {
      console.error("Error fetching similar products:", error);
    }
  };

  const handleWhatsAppPurchase = () => {
    if (!product) return;
    const effectivePrice = selectedQuantityOption ? selectedQuantityOption.price : product.price;
    const effectiveQuantity = selectedQuantityOption ? selectedQuantityOption.quantity : quantity;
    const message = encodeURIComponent(
      `Merhaba, ${product.name} ürününü satın almak istiyorum.\nMiktar: ${effectiveQuantity}\nFiyat: ${effectivePrice} TL`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const handleQuickBuy = async () => {
    if (!product) return;

    // Validate custom fields
    if (product.custom_fields && product.custom_fields.length > 0) {
      for (const field of product.custom_fields) {
        const value = customFieldValues[field.id];

        if (field.required && !value) {
          toast.error(`${field.label} alanı zorunludur`);
          return;
        }

        if (value) {
          if (field.type === 'email' && !value.includes('@')) {
            toast.error(`${field.label} geçerli bir e-posta adresi olmalıdır (@)`);
            return;
          }

          if (field.type === 'phone') {
            if (value.length < 10) {
              toast.error(`${field.label} en az 10 karakter olmalıdır`);
              return;
            }
            if (value.length > 15) {
              toast.error(`${field.label} en fazla 15 karakter olmalıdır`);
              return;
            }
          }

          if (field.type === 'url') {
            try {
              new URL(value);
            } catch {
              toast.error(`${field.label} geçerli bir URL olmalıdır (https:// ile başlamalı)`);
              return;
            }
          }

          if (field.type === 'text' && value.length > 130) {
            toast.error(`${field.label} en fazla 130 karakter olmalıdır`);
            return;
          }
        }
      }
    }

    // Handle guest users
    if (!user) {
      const { data } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "guest_order_enabled")
        .maybeSingle();

      if (data?.value !== true && data?.value !== "true") {
        toast.error("Hızlı satın alma için giriş yapmalısınız");
        window.location.href = "/giris";
        return;
      }

      try {
        // Add to guest cart
        const guestCartData = localStorage.getItem('guestCart');
        const guestCart = guestCartData ? JSON.parse(guestCartData) : [];

        const effectiveQty = selectedQuantityOption ? selectedQuantityOption.quantity : quantity;
        const effectivePrice = selectedQuantityOption ? selectedQuantityOption.price : product.price;

        // Check for duplicate API products with same custom_fields
        if (product.delivery_type === 'api' && product.custom_fields && product.custom_fields.length > 0) {
          const duplicateItem = guestCart.find((item: any) =>
            item.productId === product.id &&
            isSameCustomFields(item.selected_options, customFieldValues)
          );

          if (duplicateItem) {
            toast.error("Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin.");
            return;
          }
        }

        const existingItemIndex = guestCart.findIndex((item: any) =>
          item.productId === product.id &&
          isSameCustomFields(item.selected_options, customFieldValues)
        );

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity = effectiveQty;
          guestCart[existingItemIndex].selected_options = product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null;
        } else {
          guestCart.push({
            productId: product.id,
            quantity: effectiveQty,
            selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
          });
        }

        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        window.dispatchEvent(new Event('guestCartUpdated'));

        // Prepare checkout data for guest
        const cartItem = {
          id: `guest-${product.id}`,
          quantity: effectiveQty,
          selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
          products: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: effectivePrice,
            image_url: product.image_url,
            delivery_type: product.product_type,
            custom_fields: product.custom_fields,
            quantity_options: product.quantity_options,
            categories: product.categories
          }
        };

        const subtotal = effectivePrice * effectiveQty;
        const checkoutData = {
          cartItems: [cartItem],
          subtotal: subtotal,
          discount: 0,
          total: subtotal,
          appliedCoupon: null
        };

        sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
        toast.success("Ödeme sayfasına yönlendiriliyorsunuz...");
        setTimeout(() => navigate('/odeme'), 500);
      } catch (error) {
        console.error("Error in quick buy:", error);
        toast.error("Bir hata oluştu");
      }
      return;
    }

    try {
      // Check for duplicate API products with same custom_fields
      if (product.delivery_type === 'api' && product.custom_fields && product.custom_fields.length > 0) {
        const { data: existingItems, error: fetchError } = await metahub
          .from("cart_items")
          .select("id, selected_options, product_id")
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        if (fetchError) throw fetchError;

        const duplicateItem = existingItems?.find(item =>
          isSameCustomFields(item.selected_options as Record<string, string> | null, customFieldValues)
        );

        if (duplicateItem) {
          toast.error("Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin.");
          return;
        }
      }

      // Add to database cart
      if (product.delivery_type === 'api') {
        // For API products, always INSERT to allow multiple items with different custom_fields
        const { error } = await metahub
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: selectedQuantityOption ? selectedQuantityOption.quantity : quantity,
            selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
          });

        if (error) throw error;
      } else {
        // For manual delivery products, check if item exists and update or insert
        const { data: existingItem, error: fetchError } = await metahub
          .from("cart_items")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingItem) {
          // Update existing item
          const { error } = await metahub
            .from("cart_items")
            .update({
              quantity: selectedQuantityOption ? selectedQuantityOption.quantity : quantity,
              selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
            })
            .eq("id", existingItem.id);

          if (error) throw error;
        } else {
          // Insert new item
          const { error } = await metahub
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: product.id,
              quantity: selectedQuantityOption ? selectedQuantityOption.quantity : quantity,
              selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
            });

          if (error) throw error;
        }
      }

      // Fetch cart items to prepare checkout data
      const { data: cartItems, error: fetchError } = await metahub
        .from("cart_items")
        .select(`
          id,
          quantity,
          selected_options,
          products:product_id (
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
            categories:category_id (
              name
            )
          )
        `)
        .eq("user_id", user.id);

      if (fetchError) throw fetchError;

      // Calculate totals
      const subtotal = cartItems?.reduce((sum, item: any) => {
        const itemPrice = item.products.quantity_options && Array.isArray(item.products.quantity_options)
          ? item.products.quantity_options.find((opt: any) => opt.quantity === item.quantity)?.price || item.products.price
          : item.products.price;
        return sum + itemPrice * item.quantity;
      }, 0) || 0;

      const checkoutData = {
        cartItems,
        subtotal,
        discount: 0,
        total: subtotal,
        appliedCoupon: null
      };

      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      toast.success("Ödeme sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => navigate('/odeme'), 500);
    } catch (error) {
      console.error("Error in quick buy:", error);
      toast.error("Bir hata oluştu");
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Validate custom fields
    if (product.custom_fields && product.custom_fields.length > 0) {
      for (const field of product.custom_fields) {
        const value = customFieldValues[field.id];

        if (field.required && !value) {
          toast.error(`${field.label} alanı zorunludur`);
          return;
        }

        if (value) {
          // Email validation
          if (field.type === 'email' && !value.includes('@')) {
            toast.error(`${field.label} geçerli bir e-posta adresi olmalıdır (@)`);
            return;
          }

          // Phone validation
          if (field.type === 'phone') {
            if (value.length < 10) {
              toast.error(`${field.label} en az 10 karakter olmalıdır`);
              return;
            }
            if (value.length > 15) {
              toast.error(`${field.label} en fazla 15 karakter olmalıdır`);
              return;
            }
          }

          // URL validation
          if (field.type === 'url') {
            try {
              new URL(value);
            } catch {
              toast.error(`${field.label} geçerli bir URL olmalıdır (https:// ile başlamalı)`);
              return;
            }
          }

          // Text validation
          if (field.type === 'text' && value.length > 130) {
            toast.error(`${field.label} en fazla 130 karakter olmalıdır`);
            return;
          }
        }
      }
    }

    // Handle guest users
    if (!user) {
      // Check if guest orders are enabled
      const { data } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "guest_order_enabled")
        .maybeSingle();

      if (data?.value !== true && data?.value !== "true") {
        toast.error("Sepete eklemek için giriş yapmalısınız");
        window.location.href = "/giris";
        return;
      }

      // Add to guest cart in localStorage
      try {
        const guestCartData = localStorage.getItem('guestCart');
        const guestCart = guestCartData ? JSON.parse(guestCartData) : [];

        const effectiveQty = selectedQuantityOption ? selectedQuantityOption.quantity : quantity;

        // Check for duplicate API products with same custom_fields
        if (product.delivery_type === 'api' && product.custom_fields && product.custom_fields.length > 0) {
          const duplicateItem = guestCart.find((item: any) =>
            item.productId === product.id &&
            isSameCustomFields(item.selected_options, customFieldValues)
          );

          if (duplicateItem) {
            toast.error("Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin.");
            return;
          }
        }

        const existingItemIndex = guestCart.findIndex((item: any) =>
          item.productId === product.id &&
          isSameCustomFields(item.selected_options, customFieldValues)
        );

        if (existingItemIndex > -1) {
          // Update existing item
          guestCart[existingItemIndex].quantity = effectiveQty;
          guestCart[existingItemIndex].selected_options = product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null;
        } else {
          // Add new item
          guestCart.push({
            productId: product.id,
            quantity: effectiveQty,
            selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
          });
        }

        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        window.dispatchEvent(new Event('guestCartUpdated')); // Trigger cart count update
        window.dispatchEvent(new Event('cartItemAdded')); // Open cart drawer
        toast.success(`${effectiveQty} adet ürün sepete eklendi!`);
        setCustomFieldValues({});
      } catch (error) {
        console.error("Error adding to guest cart:", error);
        toast.error("Sepete eklenirken bir hata oluştu");
      }
      return;
    }

    try {
      // Check for duplicate API products with same custom_fields
      if (product.delivery_type === 'api' && product.custom_fields && product.custom_fields.length > 0) {
        const { data: existingItems, error: fetchError } = await metahub
          .from("cart_items")
          .select("id, selected_options, product_id")
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        if (fetchError) throw fetchError;

        const duplicateItem = existingItems?.find(item =>
          isSameCustomFields(item.selected_options as Record<string, string> | null, customFieldValues)
        );

        if (duplicateItem) {
          toast.error("Bu ürün için girdiğiniz bilgilerle zaten sepetinizde bir sipariş var. Lütfen farklı bilgiler girin veya sepetteki ürünü düzenleyin.");
          return;
        }
      }

      // Add to database cart
      if (product.delivery_type === 'api') {
        // For API products, always INSERT to allow multiple items with different custom_fields
        const { error } = await metahub
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: selectedQuantityOption ? selectedQuantityOption.quantity : quantity,
            selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
          });

        if (error) throw error;
      } else {
        // For manual delivery products, check if item exists and update or insert
        const { data: existingItem, error: fetchError } = await metahub
          .from("cart_items")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingItem) {
          // Update existing item
          const { error } = await metahub
            .from("cart_items")
            .update({
              quantity: selectedQuantityOption ? selectedQuantityOption.quantity : quantity,
              selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
            })
            .eq("id", existingItem.id);

          if (error) throw error;
        } else {
          // Insert new item
          const { error } = await metahub
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: product.id,
              quantity: selectedQuantityOption ? selectedQuantityOption.quantity : quantity,
              selected_options: product.custom_fields && product.custom_fields.length > 0 ? customFieldValues : null,
            });

          if (error) throw error;
        }
      }

      const effectiveQty = selectedQuantityOption ? selectedQuantityOption.quantity : quantity;
      window.dispatchEvent(new Event('cartItemAdded')); // Open cart drawer
      toast.success(`${effectiveQty} adet ürün sepete eklendi!`);
      setCustomFieldValues({});
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Sepete eklenirken bir hata oluştu");
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          Yükleniyor...
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ürün Bulunamadı</h2>
            <Button onClick={() => window.location.href = "/urunler"}>
              Ürünlere Dön
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const gallery = product.gallery_urls || [product.image_url];

  const generateProductSchema = () => {
    const schema: any = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.short_description || product.description,
      "image": product.image_url ? [product.image_url] : [],
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": settings.site_title
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "TRY",
        "price": product.price,
        "availability": "https://schema.org/InStock",
        "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }
    };

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      schema["aggregateRating"] = {
        "@type": "AggregateRating",
        "ratingValue": (totalRating / reviews.length).toFixed(1),
        "reviewCount": reviews.length
      };

      schema["review"] = reviews.map(review => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": review.customer_name
        },
        "datePublished": review.review_date,
        "reviewBody": review.comment
      }));
    }

    return schema;
  };

  const generateFAQSchema = () => {
    if (faqs.length === 0) return null;

    return {
      "@context": "https://schema.org/",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{product.name} | Ürün Detay</title>
        <meta name="description" content={product.short_description || product.description || product.name} />
        {hasParams && <meta name="robots" content="noindex, follow" />}
        <script type="application/ld+json">
          {JSON.stringify(generateProductSchema())}
        </script>
        {faqs.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(generateFAQSchema())}
          </script>
        )}
      </Helmet>
      <Navbar />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="text-sm text-muted-foreground mb-6">
            <a href="/" className="hover:text-primary">Ana Sayfa</a>
            {" / "}
            <a href="/urunler" className="hover:text-primary">Ürünler</a>
            {" / "}
            <span className="text-foreground">{product.categories?.name}</span>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-card">
                {product.original_price && (
                  <Badge className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground">
                    İndirimde
                  </Badge>
                )}
                <img
                  src={gallery[selectedImage] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {gallery.length > 1 && (
                <div className="grid grid-cols-3 gap-4">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                          ? "border-primary shadow-elegant"
                          : "border-border hover:border-primary/50"
                        }`}
                    >
                      <img src={img || ""} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {/* Product Badges */}
              {product.badges && product.badges.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {product.badges
                    .filter(badge => badge.active)
                    .map((badge, index) => {
                      const iconMap: Record<string, any> = {
                        Zap,
                        Shield,
                        Clock,
                        Headphones,
                        Sparkles
                      };
                      const Icon = iconMap[badge.icon] || Zap;
                      return (
                        <div
                          key={index}
                          className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:scale-105"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {badge.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{product.categories?.name}</p>
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < product.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.review_count} Değerlendirme)
                  </span>
                </div>
              </div>

              <Separator />

              {/* Price */}
              <div className="space-y-2">
                {product.original_price && (
                  <p className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </p>
                )}
                <p className="text-4xl font-bold text-primary">
                  {selectedQuantityOption
                    ? formatPrice(selectedQuantityOption.price)
                    : formatPrice(product.price)}
                </p>
                {product.original_price && (
                  <Badge variant="secondary" className="text-sm">
                    %{Math.round(((product.original_price - product.price) / product.original_price) * 100)} İndirim
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Quantity Selection */}
              {product.quantity_options && product.quantity_options.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adet Seçiniz *</label>
                  <Select
                    value={selectedQuantityOption ? `${selectedQuantityOption.quantity}-${selectedQuantityOption.price}` : ""}
                    onValueChange={(value) => {
                      const [qty, price] = value.split('-').map(Number);
                      setSelectedQuantityOption({ quantity: qty, price: price });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adet seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.quantity_options.map((option, idx) => (
                        <SelectItem key={idx} value={`${option.quantity}-${option.price}`}>
                          {option.quantity} Adet - {formatPrice(option.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : product.delivery_type !== 'api' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adet</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-semibold w-12 text-center">
                      {quantity}
                    </span>
                    <Button variant="outline" size="icon" onClick={increaseQuantity}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <div className="ml-auto">
                      <p className="text-sm text-muted-foreground">Toplam</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(product.price * quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Custom Fields */}
              {product.custom_fields && product.custom_fields.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Ürün Bilgileri</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.custom_fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {field.type !== "textarea" ? (
                          <Input
                            id={field.id}
                            type={field.type === 'phone' ? 'tel' : field.type}
                            placeholder={field.placeholder}
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Phone validation
                              if (field.type === 'phone' && value.length <= 15) {
                                setCustomFieldValues({
                                  ...customFieldValues,
                                  [field.id]: value,
                                });
                              }
                              // Text validation
                              else if (field.type === 'text' && value.length <= 130) {
                                setCustomFieldValues({
                                  ...customFieldValues,
                                  [field.id]: value,
                                });
                              }
                              // Email and other types
                              else if (field.type !== 'phone' && field.type !== 'text') {
                                setCustomFieldValues({
                                  ...customFieldValues,
                                  [field.id]: value,
                                });
                              }
                            }}
                            required={field.required}
                            maxLength={field.type === 'text' ? 130 : field.type === 'phone' ? 15 : undefined}
                          />
                        ) : (
                          <Textarea
                            id={field.id}
                            placeholder={field.placeholder}
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 130) {
                                setCustomFieldValues({
                                  ...customFieldValues,
                                  [field.id]: value,
                                });
                              }
                            }}
                            required={field.required}
                            maxLength={130}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Demo Button - Show if demo_url exists */}
              {product.demo_url && (
                <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-semibold">Canlı Demo Mevcut</p>
                          <p className="text-sm text-muted-foreground">Satın almadan önce deneyin</p>
                        </div>
                      </div>
                      <Button
                        size="lg"
                        variant="default"
                        className="gradient-primary"
                        onClick={() => {
                          if (product.demo_embed_enabled) {
                            setShowDemoModal(true);
                          } else {
                            window.open(product.demo_url!, '_blank');
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {product.demo_button_text || "Demoyu İncele"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full gradient-primary text-lg"
                  onClick={handleQuickBuy}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Hızlı Satın Al
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Sepete Ekle
                </Button>
                <Button
                  size="lg"
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white text-lg"
                  onClick={handleWhatsAppPurchase}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp ile Satın Al
                </Button>
              </div>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      {product.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Product Details Tabs */}
          <Tabs defaultValue="description" className="mb-16">
            <TabsList className={`grid w-full ${product.demo_url && product.demo_embed_enabled ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="description">Ürün Açıklaması</TabsTrigger>
              {product.demo_url && product.demo_embed_enabled && (
                <TabsTrigger value="demo">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Canlı Demo
                </TabsTrigger>
              )}
              {reviews.length > 0 && <TabsTrigger value="reviews">Müşteri Yorumları ({reviews.length})</TabsTrigger>}
              {faqs.length > 0 && <TabsTrigger value="faqs">SSS ({faqs.length})</TabsTrigger>}
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description || "" }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {product.demo_url && product.demo_embed_enabled && (
              <TabsContent value="demo" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent" />
                        Canlı Demo Önizleme
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(product.demo_url!, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Yeni Sekmede Aç
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full rounded-lg overflow-hidden border bg-muted" style={{ height: '600px' }}>
                      <iframe
                        src={product.demo_url}
                        className="w-full h-full"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        title={`${product.name} - Canlı Demo`}
                        loading="lazy"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      ℹ️ Bu, ürünün tam işlevsel canlı demosu olup satın almadan önce incelemenizi sağlar.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {reviews.length > 0 && (
              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Müşteri Değerlendirmeleri</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.customer_name}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.review_date).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {faqs.length > 0 && (
              <TabsContent value="faqs" className="mt-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Sıkça Sorulan Sorular</h3>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
                        <AccordionItem key={faq.id} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground">{faq.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-8">Benzer Ürünler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group hover:shadow-elegant transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => window.location.href = `/urun/${product.slug}`}
                  >
                    <CardHeader className="p-0">
                      <div className="relative overflow-hidden aspect-video">
                        <img
                          src={product.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        {product.categories?.name}
                      </p>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < product.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex items-center justify-between">
                      <div>
                        {product.original_price && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.original_price)}
                          </p>
                        )}
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Article Content Section */}
          {product?.article_enabled && product?.article_content && (
            <div className="mt-12">
              <div className="bg-muted/30 p-8 rounded-lg">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert scroll-content"
                  dangerouslySetInnerHTML={{ __html: product.article_content }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Demo Modal */}
      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              {product?.name} - Canlı Demo
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full flex-1 rounded-lg overflow-hidden border">
            {product?.demo_url && (
              <iframe
                src={product.demo_url}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title={`${product.name} - Demo`}
                loading="lazy"
              />
            )}
          </div>
          <div className="flex justify-between items-center pt-6 mt-4 border-t">
            <p className="text-sm text-muted-foreground">
              ℹ️ Canlı demo önizlemesi - satın almadan önce ürünü tam olarak deneyimleyin
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(product?.demo_url || '', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Yeni Sekmede Aç
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;