// =============================================================
// FILE: src/pages/public/components/ProductArticleSection.tsx
// =============================================================
import type { Product } from "./productDetail.types";

interface ProductArticleSectionProps {
  product: Product;
}

const ProductArticleSection = ({
  product,
}: ProductArticleSectionProps) => {
  if (!product.article_enabled || !product.article_content) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="bg-muted/30 p-8 rounded-lg">
        <div
          className="prose prose-sm max-w-none dark:prose-invert scroll-content"
          dangerouslySetInnerHTML={{
            __html: product.article_content,
          }}
        />
      </div>
    </div>
  );
};

export default ProductArticleSection;
