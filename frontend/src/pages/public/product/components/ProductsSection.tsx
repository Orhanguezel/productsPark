// =============================================================
// FILE: src/pages/public/components/ProductsSection.tsx
// =============================================================
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Filter, ShoppingCart } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product } from "@/integrations/metahub/db/types/products";
import type { CategoryRow } from "@/integrations/metahub/db/types/categories";

import { formatPrice } from "@/lib/utils";
import type { SortOption } from "../Products";

type CategoryWithMeta = CategoryRow & {
  badges?: Array<{ text: string; active: boolean }>;
  article_content?: string | null;
  article_enabled?: boolean | null;
};

interface ProductsSectionProps {
  products: Product[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;

  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;

  selectedCategory: string;
  onSelectedCategoryChange: (slug: string) => void;

  currentCategory: CategoryWithMeta | null;
  subcategories: CategoryWithMeta[];

  mobileFilterOpen: boolean;
  onMobileFilterOpenChange: (open: boolean) => void;

  onPageChange: (page: number) => void;
}

const ProductsSection = ({
  products,
  totalProducts,
  currentPage,
  totalPages,
  loading,
  sortBy,
  onSortChange,
  selectedCategory,
  onSelectedCategoryChange,
  currentCategory,
  subcategories,
  mobileFilterOpen,
  onMobileFilterOpenChange,
  onPageChange,
}: ProductsSectionProps) => {
  const renderSortBar = () => (
    <div className="flex justify-between items-center mb-6">
      <p className="text-muted-foreground">
        {totalProducts} ürün bulundu (Sayfa {currentPage} / {totalPages || 1})
      </p>
      <Select
        value={sortBy}
        onValueChange={(value) => onSortChange(value as SortOption)}
      >
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
  );

  const renderPagination = () =>
    totalPages > 1 && (
      <div className="mt-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  currentPage > 1 && onPageChange(currentPage - 1)
                }
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
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
                onClick={() =>
                  currentPage < totalPages && onPageChange(currentPage + 1)
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );

  const renderProductCardPrimary = (product: Product) => {
    const discount = product.original_price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100
        )
      : null;

    return (
      <Card
        key={product.id}
        className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
        onClick={() => (window.location.href = `/urun/${product.slug}`)}
      >
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={
              product.image_url ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop"
            }
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
          <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
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
  };

  const renderProductCardCompact = (product: Product) => {
    const hasDiscount =
      product.original_price && product.original_price > product.price;

    return (
      <Card
        key={product.id}
        className="group hover:shadow-elegant transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={() => (window.location.href = `/urun/${product.slug}`)}
      >
        <CardHeader className="p-0 relative">
          {hasDiscount && (
            <>
              <Badge className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground">
                -
                {Math.round(
                  ((product.original_price! - product.price) /
                    product.original_price!) *
                    100
                )}
                %
              </Badge>
              <Badge className="absolute top-4 right-4 z-10 bg-success text-success-foreground">
                İndirimde
              </Badge>
            </>
          )}
          <div className="relative overflow-hidden aspect-video">
            <img
              src={
                product.image_url ||
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop"
              }
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
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
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
          <Button className="gradient-primary">Satın Al</Button>
        </CardFooter>
      </Card>
    );
  };

  const renderArticle = () =>
    currentCategory?.article_enabled && currentCategory.article_content && (
      <div className="mt-12">
        <div className="bg-muted/30 p-8 rounded-lg">
          <ScrollArea className="h-[402px] w-full">
            <div
              className="prose prose-sm max-w-none dark:prose-invert pr-4"
              dangerouslySetInnerHTML={{
                __html: currentCategory.article_content || "",
              }}
            />
          </ScrollArea>
        </div>
      </div>
    );

  /* ------------ Layout: WITH sidebar (alt kategori filtre) ------------ */

  const renderWithSidebar = () => (
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
              variant={
                selectedCategory === currentCategory?.slug ? "default" : "ghost"
              }
              className="w-full justify-start"
              onClick={() =>
                currentCategory?.slug &&
                onSelectedCategoryChange(currentCategory.slug)
              }
            >
              Tümü
            </Button>
            {subcategories.map((subcat) => (
              <Button
                key={subcat.id}
                variant={selectedCategory === subcat.slug ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onSelectedCategoryChange(subcat.slug)}
              >
                {subcat.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      </aside>

      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Sheet
          open={mobileFilterOpen}
          onOpenChange={onMobileFilterOpenChange}
        >
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
                variant={
                  selectedCategory === currentCategory?.slug
                    ? "default"
                    : "ghost"
                }
                className="w-full justify-start"
                onClick={() => {
                  if (currentCategory?.slug) {
                    onSelectedCategoryChange(currentCategory.slug);
                  }
                  onMobileFilterOpenChange(false);
                }}
              >
                Tümü
              </Button>
              {subcategories.map((subcat) => (
                <Button
                  key={subcat.id}
                  variant={
                    selectedCategory === subcat.slug ? "default" : "ghost"
                  }
                  className="w-full justify-start"
                  onClick={() => {
                    onSelectedCategoryChange(subcat.slug);
                    onMobileFilterOpenChange(false);
                  }}
                >
                  {subcat.name}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Products Grid */}
      <div className="lg:col-span-3">
        {renderSortBar()}

        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Bu kategoride ürün bulunamadı.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => renderProductCardPrimary(product))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );

  /* ------------ Layout: WITHOUT sidebar ------------ */

  const renderWithoutSidebar = () => (
    <div>
      {renderSortBar()}

      {loading ? (
        <div className="text-center py-12">Yükleniyor...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Bu kategoride ürün bulunamadı.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => renderProductCardCompact(product))}
          </div>

          {renderPagination()}

          {renderArticle()}
        </>
      )}
    </div>
  );

  const shouldUseSidebar =
    currentCategory &&
    subcategories.length > 0 &&
    subcategories.some((sub) => sub.id !== currentCategory.id);

  return (
    <section className="py-12 flex-1">
      <div className="container mx-auto px-4">
        {shouldUseSidebar ? renderWithSidebar() : renderWithoutSidebar()}
      </div>
    </section>
  );
};

export default ProductsSection;
