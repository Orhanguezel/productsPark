// =============================================================
// FILE: src/pages/public/components/ProductDetailTabs.tsx
// FINAL — uses descriptionNode (no duplicate description rendering)
// - description tab renders the passed node
// - other tabs unchanged
// =============================================================

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Sparkles, ExternalLink } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import type { Product, ProductReview, ProductFaq } from '@/integrations/types';

interface ProductDetailTabsProps {
  product: Product;
  reviews: ProductReview[];
  faqs: ProductFaq[];
  descriptionNode: React.ReactNode;
}

const clampRating = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
};

const formatTrDate = (isoLike: string | null | undefined): string => {
  if (!isoLike) return '';
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR');
};

const ProductDetailTabs = ({ product, reviews, faqs, descriptionNode }: ProductDetailTabsProps) => {
  const showDemoTab = Boolean(product.demo_url && product.demo_embed_enabled);

  const showReviewsTab = Array.isArray(reviews) && reviews.length > 0;
  const showFaqsTab = Array.isArray(faqs) && faqs.length > 0;

  const tabCount = 1 + (showDemoTab ? 1 : 0) + (showReviewsTab ? 1 : 0) + (showFaqsTab ? 1 : 0);

  const gridColsClass =
    tabCount === 1
      ? 'grid-cols-1'
      : tabCount === 2
        ? 'grid-cols-2'
        : tabCount === 3
          ? 'grid-cols-3'
          : 'grid-cols-4';

  return (
    <div className="mb-16">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className={`grid w-full ${gridColsClass}`}>
          <TabsTrigger value="description">Ürün Açıklaması</TabsTrigger>

          {showDemoTab ? (
            <TabsTrigger value="demo">
              <Sparkles className="w-4 h-4 mr-2" />
              Canlı Demo
            </TabsTrigger>
          ) : null}

          {showReviewsTab ? (
            <TabsTrigger value="reviews">Müşteri Yorumları ({reviews.length})</TabsTrigger>
          ) : null}

          {showFaqsTab ? <TabsTrigger value="faqs">SSS ({faqs.length})</TabsTrigger> : null}
        </TabsList>

        {/* ✅ Açıklama: tek kaynak */}
        <TabsContent value="description" className="mt-6">
          <Card>
            <CardContent className="pt-6">{descriptionNode}</CardContent>
          </Card>
        </TabsContent>

        {/* Demo */}
        {showDemoTab ? (
          <TabsContent value="demo" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Canlı Demo Önizleme
                  </h3>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(product.demo_url as string, '_blank')}
                    disabled={!product.demo_url}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Yeni Sekmede Aç
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div
                  className="relative w-full rounded-lg overflow-hidden border bg-muted"
                  style={{ height: '600px' }}
                >
                  <iframe
                    src={product.demo_url ?? ''}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    title={`${product.name} - Canlı Demo`}
                    loading="lazy"
                  />
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  Bu, ürünün canlı demosudur; satın almadan önce incelemenizi sağlar.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {/* Reviews */}
        {showReviewsTab ? (
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Müşteri Yorumları</h3>
              </CardHeader>

              <CardContent className="space-y-4">
                {reviews.map((review) => {
                  const rating = clampRating(review.rating);
                  const dateLabel = formatTrDate(review.review_date);
                  const customerName = review.customer_name ?? 'Müşteri';
                  const comment = review.comment ?? '';

                  return (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{customerName}</span>

                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {dateLabel ? (
                          <span className="text-sm text-muted-foreground">{dateLabel}</span>
                        ) : null}
                      </div>

                      {comment ? <p className="text-muted-foreground">{comment}</p> : null}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {/* FAQs */}
        {showFaqsTab ? (
          <TabsContent value="faqs" className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Sıkça Sorulan Sorular</h3>
              </CardHeader>

              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={faq.id} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question ?? ''}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{faq.answer ?? ''}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
};

export default ProductDetailTabs;
