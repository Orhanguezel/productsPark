// =============================================================
// FILE: src/pages/public/ProductsPage.tsx
// =============================================================
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import type { Product } from "@/integrations/metahub/rtk/types/products";
import type { Category } from "@/integrations/metahub/rtk/types/categories";

import {
  useListProductsWithMetaQuery,
} from "@/integrations/metahub/rtk/endpoints/products.endpoints";
import { useListCategoriesQuery } from "@/integrations/metahub/rtk/endpoints/categories.endpoints";

import { useSeoSettings } from "@/hooks/useSeoSettings";

import ProductsHero from "./components/ProductsHero";
import CategoryNotFoundState from "./components/CategoryNotFoundState";
import SubcategoryGrid from "./components/SubcategoryGrid";
import ProductsSection from "./components/ProductsSection";

type CategoryWithMeta = Category & {
  // BE'den gelen ekstra alanlar
  product_count?: number;
  badges?: Array<{ text: string; active: boolean }>;
};

// Sort tipini ortak tanımlayalım
export type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

const ITEMS_PER_PAGE = 12;

const ProductsPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentCategory, setCurrentCategory] =
    useState<CategoryWithMeta | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { settings } = useSeoSettings();

  // Pagination
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  /* -------------------- RTK Query: Categories -------------------- */

  // Ana kategoriler (parent_id = null)
  const {
    data: categoriesData = [],
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
  } = useListCategoriesQuery({
    parent_id: null,
    is_active: true,
    sort: "display_order",
    order: "asc",
  });

  const categories = categoriesData as CategoryWithMeta[];

  // Alt kategoriler (seçili ana kategoriye göre)
  const {
    data: subcategoriesData = [],
    isLoading: isSubcategoriesLoading,
    isFetching: isSubcategoriesFetching,
  } = useListCategoriesQuery(
    currentCategory
      ? {
        parent_id: currentCategory.id,
        is_active: true,
        sort: "display_order",
        order: "asc",
      }
      : undefined,
    { skip: !currentCategory }
  );

  const subcategories = subcategoriesData as CategoryWithMeta[];

  /* -------------------- Derived values -------------------- */

  // Seçili kategori objesi (URL slug + state’e göre)
  const categoryToFilter = useMemo(() => {
    if (currentCategory) return currentCategory;
    if (selectedCategory !== "all") {
      return categories.find((c) => c.slug === selectedCategory) ?? null;
    }
    return null;
  }, [currentCategory, selectedCategory, categories]);

  // Sort mapping (RTK endpoint params için)
  const { sortField, sortOrder } = useMemo(() => {
    let sortField: "price" | "rating" | "created_at" | undefined;
    let sortOrder: "asc" | "desc" | undefined;

    switch (sortBy) {
      case "price-asc":
        sortField = "price";
        sortOrder = "asc";
        break;
      case "price-desc":
        sortField = "price";
        sortOrder = "desc";
        break;
      case "rating":
        sortField = "rating";
        sortOrder = "desc";
        break;
      default:
        sortField = "created_at";
        sortOrder = "desc";
    }

    return { sortField, sortOrder };
  }, [sortBy]);

  /* -------------------- RTK Query: Product List (items + total) -------------------- */

  const {
    data: productsResult,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useListProductsWithMetaQuery(
    categories.length === 0
      ? undefined
      : {
        category_id: categoryToFilter?.id,
        is_active: true,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        sort: sortField,
        order: sortOrder,
      },
    {
      // kategori listesi gelmeden ürün sorgusunu tetikleme
      skip: categories.length === 0,
    }
  );

  const products = (productsResult?.items ?? []) as Product[];
  const totalProducts = productsResult?.total ?? 0;

  const loading =
    isCategoriesLoading ||
    isCategoriesFetching ||
    isSubcategoriesLoading ||
    isSubcategoriesFetching ||
    isProductsLoading ||
    isProductsFetching;

  // totalPages artık RTK result’tan
  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));

  /* -------------------- Effects -------------------- */

  // URL slug / query param -> currentCategory
  useEffect(() => {
    if (categories.length === 0) return;

    if (slug) {
      const category = categories.find((c) => c.slug === slug);
      if (category) {
        setCurrentCategory(category);
        setSelectedCategory(slug);
        setCategoryNotFound(false);
      } else {
        setCategoryNotFound(true);
        setSelectedCategory("all");
      }
    } else {
      const categoryParam = searchParams.get("kategori");
      if (categoryParam) {
        const category = categories.find((c) => c.slug === categoryParam);
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
  }, [slug, searchParams, categories]);

  /* -------------------- Helpers -------------------- */

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newSearchParams.delete("page");
    } else {
      newSearchParams.set("page", page.toString());
    }
    setSearchParams(newSearchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generateItemListSchema = () => {
    if (!products || products.length === 0) return null;

    return {
      "@context": "https://schema.org/",
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          url: `${window.location.origin}/urun/${product.slug}`,
          image: product.image_url || "",
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "TRY",
          },
        },
      })),
    };
  };

  const itemListSchema = generateItemListSchema();

  /* -------------------- Render -------------------- */

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{settings.seo_products_title}</title>
        <meta
          name="description"
          content={settings.seo_products_description}
        />
        <meta property="og:title" content={settings.seo_products_title} />
        <meta
          property="og:description"
          content={settings.seo_products_description}
        />
        <meta property="og:type" content="website" />
        {currentPage > 1 && <meta name="robots" content="noindex, follow" />}
        {itemListSchema && (
          <script type="application/ld+json">
            {JSON.stringify(itemListSchema)}
          </script>
        )}
      </Helmet>

      <Navbar />

      {/* Hero */}
      <ProductsHero currentCategory={currentCategory} />

      {/* İçerik */}
      {categoryNotFound ? (
        <CategoryNotFoundState />
      ) : (
        <>
          {subcategories.length > 0 ? (
            // Alt kategoriler grid
            <SubcategoryGrid subcategories={subcategories} />
          ) : (
            // Ürün listesi / sort / pagination / article
            <ProductsSection
              products={products}
              totalProducts={totalProducts}
              currentPage={currentPage}
              totalPages={totalPages}
              loading={loading}
              sortBy={sortBy}
              onSortChange={(value) =>
                setSortBy(value as SortOption) // Select string -> union
              }
              selectedCategory={selectedCategory}
              onSelectedCategoryChange={setSelectedCategory}
              currentCategory={currentCategory}
              subcategories={subcategories}
              mobileFilterOpen={mobileFilterOpen}
              onMobileFilterOpenChange={setMobileFilterOpen}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <Footer />
    </div>
  );
};

export default ProductsPage;
