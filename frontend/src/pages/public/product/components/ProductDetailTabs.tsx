// =============================================================
// FILE: src/pages/public/components/ProductDetailTabs.tsx
// =============================================================
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import type { Product, Review, FAQ } from "./productDetail.types";

interface ProductDetailTabsProps {
  product: Product;
  reviews: Review[];
  faqs: FAQ[];
}

const ProductDetailTabs = ({
  product,
  reviews,
  faqs,
}: ProductDetailTabsProps) => {
  const showDemoTab = Boolean(product.demo_url && product.demo_embed_enabled);

  return (
    <div className="mb-16">
      <Tabs
        defaultValue="description"
        className="w-full"
      >
        <TabsList
          className={`grid w-full ${
            showDemoTab ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          <TabsTrigger value="description">Ürün Açıklaması</TabsTrigger>

          {showDemoTab && (
            <TabsTrigger value="demo">
              <Sparkles className="w-4 h-4 mr-2" />
              Canlı Demo
            </TabsTrigger>
          )}

          {reviews.length > 0 && (
            <TabsTrigger value="reviews">
              Müşteri Yorumları ({reviews.length})
            </TabsTrigger>
          )}

          {faqs.length > 0 && (
            <TabsTrigger value="faqs">
              SSS ({faqs.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Açıklama */}
        <TabsContent value="description" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: product.description || "",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demo Embed */}
        {showDemoTab && (
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
                    onClick={() =>
                      window.open(product.demo_url!, "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Yeni Sekmede Aç
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="relative w-full rounded-lg overflow-hidden border bg-muted"
                  style={{ height: "600px" }}
                >
                  <iframe
                    src={product.demo_url || ""}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    title={`${product.name} - Canlı Demo`}
                    loading="lazy"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  ℹ️ Bu, ürünün tam işlevsel canlı demosu olup satın almadan
                  önce incelemenizi sağlar.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Yorumlar */}
        {reviews.length > 0 && (
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">
                  Müşteri Değerlendirmeleri
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {review.customer_name}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(
                          review.review_date
                        ).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* SSS */}
        {faqs.length > 0 && (
          <TabsContent value="faqs" className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">
                  Sıkça Sorulan Sorular
                </h3>
              </CardHeader>
              <CardContent>
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                >
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={faq.id}
                      value={`item-${index}`}
                    >
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProductDetailTabs;
