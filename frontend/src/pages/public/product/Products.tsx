// =============================================================
// FILE: src/pages/public/ProductsPage.tsx
// FINAL — Products List Page (SEO via SeoHelmet, NO DUPLICATES)
// - Canonical/hreflang: RouteSeoLinks (global)
// - Global defaults: GlobalSeo (global)
// - Route SEO: SeoHelmet only
// - NO JSON-LD HERE
// - RTK params are strictly typed (order: "asc" | "desc", sort: allowed union)
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SeoHelmet from '@/seo/SeoHelmet';

import type {
  Product,
  Category,
  SortOption,
  PageState,
  ProductsPublicListParams,
} from '@/integrations/types';

import { useListProductsWithMetaQuery, useListCategoriesQuery } from '@/integrations/hooks';
import { useSeoSettings } from '@/hooks/useSeoSettings';

import { nonEmpty, getOrigin } from '@/integrations/types';

import ProductsHero from './components/ProductsHero';
import CategoryNotFoundState from './components/CategoryNotFoundState';
import SubcategoryGrid from './components/SubcategoryGrid';
import ProductsSection from './components/ProductsSection';

type CategoryWithMeta = Category & {
  product_count?: number;
  badges?: Array<{ text: string; active: boolean }>;
};

const ITEMS_PER_PAGE = 12;

type PublicSortField = NonNullable<ProductsPublicListParams['sort']>;
type PublicOrder = NonNullable<ProductsPublicListParams['order']>;

const ProductsPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentCategory, setCurrentCategory] = useState<CategoryWithMeta | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // SEO (no fallbacks)
  const { flat, loading: seoLoading } = useSeoSettings({ seoOnly: true });

  const currentPage = useMemo(() => {
    const n = Number(searchParams.get('page') || '1');
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  }, [searchParams]);

  const hasQueryParams = useMemo(() => Array.from(searchParams.keys()).length > 0, [searchParams]);

  /* ---------------- Categories ---------------- */

  const {
    data: categoriesData = [],
    isLoading: catLoading,
    isFetching: catFetching,
  } = useListCategoriesQuery({
    parent_id: null,
    is_active: true,
    sort: 'display_order',
    order: 'asc',
  });

  const categories = categoriesData as CategoryWithMeta[];

  const {
    data: subcategoriesData = [],
    isLoading: subLoading,
    isFetching: subFetching,
  } = useListCategoriesQuery(
    currentCategory
      ? {
          parent_id: currentCategory.id,
          is_active: true,
          sort: 'display_order',
          order: 'asc',
        }
      : undefined,
    { skip: !currentCategory },
  );

  const subcategories = subcategoriesData as CategoryWithMeta[];

  const categoryToFilter = useMemo(() => {
    if (currentCategory) return currentCategory;
    if (selectedCategory !== 'all') {
      return categories.find((c) => c.slug === selectedCategory) ?? null;
    }
    return null;
  }, [currentCategory, selectedCategory, categories]);

  /* ---------------- Sorting (STRICT) ---------------- */

  const { sortField, sortOrder } = useMemo((): {
    sortField: PublicSortField;
    sortOrder: PublicOrder;
  } => {
    // IMPORTANT:
    // - return values MUST be literal "asc"/"desc" (not widened to string)
    // - sortField must match ProductsPublicListParams['sort'] union
    switch (sortBy) {
      case 'price-asc':
        return { sortField: 'price' as PublicSortField, sortOrder: 'asc' as const };
      case 'price-desc':
        return { sortField: 'price' as PublicSortField, sortOrder: 'desc' as const };
      case 'rating':
        return { sortField: 'rating' as PublicSortField, sortOrder: 'desc' as const };
      default:
        // "featured" vb. -> endpoint tarafında genelde created_at desc ile listeleniyor
        return { sortField: 'created_at' as PublicSortField, sortOrder: 'desc' as const };
    }
  }, [sortBy]);

  /* ---------------- Products (RTK params typed) ---------------- */

  const productsQueryArgs = useMemo<ProductsPublicListParams | void>(() => {
    if (categories.length === 0) return undefined;

    const base = {
      is_active: true as const,
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
      sort: sortField,
      order: sortOrder,
    } satisfies ProductsPublicListParams;

    // exactOptionalPropertyTypes-safe:
    // category_id undefined ise property yok
    return categoryToFilter?.id
      ? ({ ...base, category_id: categoryToFilter.id } satisfies ProductsPublicListParams)
      : base;
  }, [categories.length, categoryToFilter?.id, currentPage, sortField, sortOrder]);

  const {
    data: productsResult,
    isLoading: prodLoading,
    isFetching: prodFetching,
  } = useListProductsWithMetaQuery(productsQueryArgs, {
    skip: categories.length === 0,
  });

  const products = (productsResult?.items ?? []) as Product[];
  const totalProducts = productsResult?.total ?? 0;

  const loading =
    seoLoading ||
    catLoading ||
    catFetching ||
    subLoading ||
    subFetching ||
    prodLoading ||
    prodFetching;

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));

  const pageState: PageState = useMemo(() => {
    if (loading) return 'loading';
    if (categoryNotFound) return 'ready';
    return 'ready';
  }, [loading, categoryNotFound]);

  /* ---------------- URL → Category ---------------- */

  useEffect(() => {
    if (!categories.length) return;

    if (slug) {
      const c = categories.find((x) => x.slug === slug);
      if (c) {
        setCurrentCategory(c);
        setSelectedCategory(slug);
        setCategoryNotFound(false);
      } else {
        setCurrentCategory(null);
        setSelectedCategory('all');
        setCategoryNotFound(true);
      }
      return;
    }

    const qp = searchParams.get('kategori');
    if (qp) {
      const c = categories.find((x) => x.slug === qp);
      if (c) {
        setCurrentCategory(c);
        setSelectedCategory(qp);
        setCategoryNotFound(false);
        return;
      }
    }

    setCurrentCategory(null);
    setSelectedCategory('all');
    setCategoryNotFound(false);
  }, [slug, searchParams, categories]);

  /* ---------------- Pagination ---------------- */

  const handlePageChange = (page: number) => {
    const next = Math.max(1, Math.floor(page));
    const nextParams = new URLSearchParams(searchParams);

    if (next === 1) nextParams.delete('page');
    else nextParams.set('page', String(next));

    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------------- SEO (Blog ile birebir) ---------------- */

  const seoTitle = nonEmpty(flat?.seo_products_title);
  const seoDesc = nonEmpty(flat?.seo_products_description);

  const url = useMemo(() => {
    const origin = getOrigin();
    return origin ? `${origin}/urunler` : '';
  }, []);

  const robots = useMemo(() => {
    if (currentPage > 1) return 'noindex,follow';
    if (hasQueryParams) return 'noindex,follow';
    return null;
  }, [currentPage, hasQueryParams]);

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHelmet
        title={seoTitle || null}
        description={seoDesc || null}
        ogType="website"
        url={url || null}
        robots={robots}
      />

      <Navbar />

      <ProductsHero currentCategory={currentCategory} />

      {categoryNotFound ? (
        <CategoryNotFoundState />
      ) : pageState === 'ready' ? (
        subcategories.length > 0 ? (
          <SubcategoryGrid subcategories={subcategories} />
        ) : (
          <ProductsSection
            products={products}
            totalProducts={totalProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            loading={loading}
            sortBy={sortBy}
            onSortChange={(v) => setSortBy(v as SortOption)}
            selectedCategory={selectedCategory}
            onSelectedCategoryChange={setSelectedCategory}
            currentCategory={currentCategory}
            subcategories={subcategories}
            mobileFilterOpen={mobileFilterOpen}
            onMobileFilterOpenChange={setMobileFilterOpen}
            onPageChange={handlePageChange}
          />
        )
      ) : null}

      <Footer />
    </div>
  );
};

export default ProductsPage;
