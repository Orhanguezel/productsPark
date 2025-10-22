import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Filter, ArrowRight, ShoppingCart } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";
import { formatPrice } from "@/lib/utils";
import { useSeoSettings } from "@/hooks/useSeoSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  product_count?: number;
  image_url?: string | null;
  badges?: Array<{ text: string; active: boolean }>;
  article_content?: string | null;
  article_enabled?: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  rating: number;
  review_count: number;
  is_active: boolean;
  categories?: Category;
}

const Products = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { settings } = useSeoSettings();
  const isMobile = useIsMobile();

  // Pagination
  const itemsPerPage = 12;
  const currentPage = parseInt(searchParams.get('page') || '1');
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      // Set category from URL slug or param
      if (slug) {
        const category = categories.find(c => c.slug === slug);
        if (category) {
          setCurrentCategory(category);
          setSelectedCategory(slug);
          setCategoryNotFound(false);

          // Fetch subcategories
          fetchSubcategories(category.id);
        } else {
          setCategoryNotFound(true);
          setSelectedCategory("all");
        }
      } else {
        const categoryParam = searchParams.get("kategori");
        if (categoryParam) {
          const category = categories.find(c => c.slug === categoryParam);
          if (category) {
            setCurrentCategory(category);
            setSelectedCategory(categoryParam);
            setCategoryNotFound(false);
          }
        } else {
          setSelectedCategory("all");
          setCategoryNotFound(false);
        }
      }
    }
  }, [slug, searchParams, categories]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchProducts();
    }
  }, [selectedCategory, sortBy, categories, currentCategory, currentPage]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await metahub
        .from("categories")
        .select("id, name, slug, parent_id, description, icon, product_count, image_url, badges, article_content, article_enabled")
        .order("name");

      if (error) throw error;
      setCategories((data as any) || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async (parentId: string) => {
    try {
      const { data, error } = await metahub
        .from("categories")
        .select("id, name, slug, description, icon, product_count, image_url")
        .eq("parent_id", parentId)
        .order("name");

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // First, get total count
      let countQuery = metahub
        .from("products")
        .select("*", { count: 'exact', head: true })
        .eq("is_active", true);

      // Filter by category - prioritize currentCategory from URL
      const categoryToFilter = currentCategory || (selectedCategory !== "all" ? categories.find(c => c.slug === selectedCategory) : null);

      if (categoryToFilter) {
        countQuery = countQuery.eq("category_id", categoryToFilter.id);
      }

      const { count } = await countQuery;
      setTotalProducts(count || 0);

      // Then fetch paginated products
      let query = metahub
        .from("products")
        .select("*, categories(id, name, slug)")
        .eq("is_active", true);

      if (categoryToFilter) {
        query = query.eq("category_id", categoryToFilter.id);
      }

      // Sort
      if (sortBy === "price-asc") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price-desc") {
        query = query.order("price", { ascending: false });
      } else if (sortBy === "rating") {
        query = query.order("rating", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      query = query.range(startIndex, startIndex + itemsPerPage - 1);

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newSearchParams.delete('page');
    } else {
      newSearchParams.set('page', page.toString());
    }
    setSearchParams(newSearchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const colorMap: Record<string, string> = {
    "pubg": "from-orange-500 to-red-500",
    "uc": "from-yellow-500 to-orange-500",
    "mobile-legends": "from-blue-500 to-purple-500",
    "valorant": "from-red-500 to-pink-500",
    "steam": "from-gray-700 to-blue-500",
  };

  const generateItemListSchema = () => {
    if (products.length === 0) return null;

    return {
      "@context": "https://schema.org/",
      "@type": "ItemList",
      "itemListElement": products.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "url": `${window.location.origin}/urun/${product.slug}`,
          "image": product.image_url || "",
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "TRY"
          }
        }
      }))
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{settings.seo_products_title}</title>
        <meta name="description" content={settings.seo_products_description} />
        <meta property="og:title" content={settings.seo_products_title} />
        <meta property="og:description" content={settings.seo_products_description} />
        <meta property="og:type" content="website" />
        {currentPage > 1 && <meta name="robots" content="noindex, follow" />}
        {products.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(generateItemListSchema())}
          </script>
        )}
      </Helmet>
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold mb-4">{currentCategory?.name || "En Çok Satan Ürünlerimiz"}</h1>
            {currentCategory?.description && (
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                {currentCategory.description}
              </p>
            )}
            {currentCategory?.badges && currentCategory.badges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                {currentCategory.badges
                  .filter(badge => badge.active)
                  .map((badge, index) => (
                    <Badge key={index} variant="secondary" className="px-4 py-2 text-white bg-white/20">
                      {badge.text}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {categoryNotFound ? (
        <section className="py-12 flex-1">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Kategori Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              Aradığınız kategori mevcut değil.
            </p>
            <Button onClick={() => window.location.href = "/kategoriler"}>
              Tüm Kategorilere Dön
            </Button>
          </div>
        </section>
      ) : (
        <>
          {/* Subcategories as Cards - same style as main categories */}
          {subcategories.length > 0 ? (
            <section className="py-12 flex-1">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {subcategories.map((subcat) => {
                    const color = colorMap[subcat.slug] || "from-gray-500 to-gray-700";
                    const imageUrl = subcat.image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=400&fit=crop";

                    return (
                      <Card
                        key={subcat.id}
                        className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
                        onClick={() => window.location.href = `/kategoriler/${subcat.slug}`}
                      >
                        <div className="relative overflow-hidden aspect-[4/3]">
                          <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`} />
                          <img
                            src={imageUrl}
                            alt={subcat.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-smooth flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button size="sm" variant="secondary">
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Ürünleri Gör
                            </Button>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-1">
                            {subcat.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {subcat.description}
                          </p>
                        </CardContent>

                        <CardFooter className="p-4 pt-0">
                          <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all w-full justify-between">
                            <span>Ürünleri Görüntüle</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : (
            /* Products Section with Conditional Sidebar */
            <section className="py-12 flex-1">
              <div className="container mx-auto px-4">
                {/* Check if current category has subcategories that are NOT the current category */}
                {currentCategory && subcategories.length > 0 && subcategories.some(sub => sub.id !== currentCategory.id) ? (
                  /* Layout WITH Sidebar - when subcategories exist */
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block lg:col-span-1">
                      <Card className="sticky top-4">
                        <CardHeader>
                          <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Alt Kategoriler
                          </h2>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button
                            variant={selectedCategory === currentCategory.slug ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setSelectedCategory(currentCategory.slug)}
                          >
                            Tümü
                          </Button>
                          {subcategories.map((subcat) => (
                            <Button
                              key={subcat.id}
                              variant={selectedCategory === subcat.slug ? "default" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => setSelectedCategory(subcat.slug)}
                            >
                              {subcat.name}
                            </Button>
                          ))}
                        </CardContent>
                      </Card>
                    </aside>

                    {/* Mobile Filter Button */}
                    <div className="lg:hidden mb-4">
                      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Filter className="w-4 h-4 mr-2" />
                            Alt Kategoriler
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                          <SheetHeader>
                            <SheetTitle>Alt Kategoriler</SheetTitle>
                            <SheetDescription>
                              Kategoriyi seçin ve ürünleri filtreleyin
                            </SheetDescription>
                          </SheetHeader>
                          <div className="space-y-2 mt-4">
                            <Button
                              variant={selectedCategory === currentCategory.slug ? "default" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => {
                                setSelectedCategory(currentCategory.slug);
                                setMobileFilterOpen(false);
                              }}
                            >
                              Tümü
                            </Button>
                            {subcategories.map((subcat) => (
                              <Button
                                key={subcat.id}
                                variant={selectedCategory === subcat.slug ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => {
                                  setSelectedCategory(subcat.slug);
                                  setMobileFilterOpen(false);
                                }}
                              >
                                {subcat.name}
                              </Button>
                            ))}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>

                    {/* Products Grid with Sidebar */}
                    <div className="lg:col-span-3">
                      {/* Sort Options */}
                      <div className="flex justify-between items-center mb-6">
                        <p className="text-muted-foreground">
                          {totalProducts} ürün bulundu (Sayfa {currentPage} / {totalPages})
                        </p>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Sırala" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="featured">Öne Çıkanlar</SelectItem>
                            <SelectItem value="price-asc">Fiyat: Düşükten Yükseğe</SelectItem>
                            <SelectItem value="price-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
                            <SelectItem value="rating">En Yüksek Puanlı</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Products Grid */}
                      {loading ? (
                        <div className="text-center py-12">Yükleniyor...</div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">Bu kategoride ürün bulunamadı.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((product) => {
                              const discount = product.original_price
                                ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                                : null;

                              return (
                                <Card
                                  key={product.id}
                                  className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
                                  onClick={() => window.location.href = `/urun/${product.slug}`}
                                >
                                  <div className="relative overflow-hidden aspect-[4/3]">
                                    <img
                                      src={product.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop"}
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                                    />
                                    {discount && (
                                      <>
                                        <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                                          -{discount}%
                                        </Badge>
                                        <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
                                          İndirimde
                                        </Badge>
                                      </>
                                    )}
                                    {product.review_count > 100 && !discount && (
                                      <Badge className="absolute top-3 right-3 gradient-primary text-white">
                                        En Çok Satan
                                      </Badge>
                                    )}
                                  </div>

                                  <CardContent className="p-4">
                                    <Badge variant="outline" className="mb-2 text-xs">
                                      {product.categories?.name || "Genel"}
                                    </Badge>
                                    <h3 className="font-semibold mb-2 line-clamp-1">
                                      {product.name}
                                    </h3>
                                    <div className="flex items-center gap-1 mb-3">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-3 h-3 ${i < Math.floor(product.rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                              }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        ({product.review_count} Satış)
                                      </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-2xl font-bold text-primary">
                                        {formatPrice(product.price)}
                                      </span>
                                      {product.original_price && (
                                        <span className="text-sm text-muted-foreground line-through">
                                          {formatPrice(product.original_price)}
                                        </span>
                                      )}
                                    </div>
                                  </CardContent>

                                  <CardFooter className="p-4 pt-0 gap-2">
                                    <Button className="flex-1 gradient-primary text-white">
                                      <ShoppingCart className="w-4 h-4 mr-2" />
                                      Sepete Ekle
                                    </Button>
                                  </CardFooter>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="mt-8">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                  </PaginationItem>

                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                      page === 1 ||
                                      page === totalPages ||
                                      (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                      return (
                                        <PaginationItem key={page}>
                                          <PaginationLink
                                            onClick={() => handlePageChange(page)}
                                            isActive={currentPage === page}
                                            className="cursor-pointer"
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    } else if (
                                      page === currentPage - 2 ||
                                      page === currentPage + 2
                                    ) {
                                      return (
                                        <PaginationItem key={page}>
                                          <PaginationEllipsis />
                                        </PaginationItem>
                                      );
                                    }
                                    return null;
                                  })}

                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Layout WITHOUT Sidebar - when no subcategories */
                  <div>
                    {/* Sort Options */}
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-muted-foreground">
                        {totalProducts} ürün bulundu (Sayfa {currentPage} / {totalPages})
                      </p>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Sırala" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="featured">Öne Çıkanlar</SelectItem>
                          <SelectItem value="price-asc">Fiyat: Düşükten Yükseğe</SelectItem>
                          <SelectItem value="price-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
                          <SelectItem value="rating">En Yüksek Puanlı</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Products Grid - Full Width */}
                    {loading ? (
                      <div className="text-center py-12">Yükleniyor...</div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">Bu kategoride ürün bulunamadı.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {products.map((product) => (
                            <Card
                              key={product.id}
                              className="group hover:shadow-elegant transition-all duration-300 overflow-hidden cursor-pointer"
                              onClick={() => window.location.href = `/urun/${product.slug}`}
                            >
                              <CardHeader className="p-0 relative">
                                {product.original_price && product.original_price > product.price && (
                                  <>
                                    <Badge className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground">
                                      -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                                    </Badge>
                                    <Badge className="absolute top-4 right-4 z-10 bg-success text-success-foreground">
                                      İndirimde
                                    </Badge>
                                  </>
                                )}
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
                                  {product.categories?.name || "Genel"}
                                </p>
                                <h3 className="font-semibold text-lg mb-3 line-clamp-2">
                                  {product.name}
                                </h3>
                                <div className="flex items-center gap-1 mb-3">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${i < Math.floor(product.rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    ({product.review_count} Satış)
                                  </span>
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                                <div>
                                  {product.original_price && (
                                    <p className="text-sm text-muted-foreground line-through">
                                      {formatPrice(product.original_price)}
                                    </p>
                                  )}
                                  <p className="text-2xl font-bold text-primary">
                                    {formatPrice(product.price)}
                                  </p>
                                </div>
                                <Button className="gradient-primary">
                                  Satın Al
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="mt-8">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                  // Show first page, last page, current page, and pages around current
                                  if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                  ) {
                                    return (
                                      <PaginationItem key={page}>
                                        <PaginationLink
                                          onClick={() => handlePageChange(page)}
                                          isActive={currentPage === page}
                                          className="cursor-pointer"
                                        >
                                          {page}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                  ) {
                                    return (
                                      <PaginationItem key={page}>
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  }
                                  return null;
                                })}

                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}

                        {/* Article Content Section */}
                        {currentCategory?.article_enabled && currentCategory?.article_content && (
                          <div className="mt-12">
                            <div className="bg-muted/30 p-8 rounded-lg">
                              <ScrollArea className="h-[402px] w-full">
                                <div
                                  className="prose prose-sm max-w-none dark:prose-invert pr-4"
                                  dangerouslySetInnerHTML={{ __html: currentCategory.article_content }}
                                />
                              </ScrollArea>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      <Footer />
    </div>
  );
};

export default Products;