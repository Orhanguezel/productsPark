// =============================================================
// FILE: src/pages/public/CouponDetailPage.tsx
// =============================================================
"use client";

import { useSearchParams, Link } from "react-router-dom";
import { Copy, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  useGetCouponByCodeQuery,
} from "@/integrations/metahub/rtk/endpoints/coupons.endpoints";

export default function CouponDetailPage() {
  const [searchParams] = useSearchParams();
  const code = (searchParams.get("coupon") || "").trim();
  const { toast } = useToast();

  const {
    data: coupon,
    isLoading,
    isError,
  } = useGetCouponByCodeQuery(code, { skip: !code });

  const handleCopy = async () => {
    if (!coupon?.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast({
        title: "Kupon kodu kopyalandı!",
        description: coupon.code,
      });
    } catch {
      // sessizce yut
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-[60vh] bg-background">
        <div className="container mx-auto max-w-2xl py-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anasayfa
              </Link>
            </div>
          </div>

          {!code && (
            <Card>
              <CardHeader>
                <CardTitle>Kupon bulunamadı</CardTitle>
              </CardHeader>
              <CardContent>
                Geçerli bir kupon bağlantısı üzerinden gelmediniz.
              </CardContent>
            </Card>
          )}

          {code && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle>Kupon Detayı</CardTitle>
                  {coupon && (
                    <Badge
                      variant={coupon.is_active ? "default" : "secondary"}
                    >
                      {coupon.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Kod */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">
                      Kupon Kodu
                    </div>
                    <div className="text-2xl font-mono font-bold tracking-widest">
                      {coupon?.code || code}
                    </div>
                  </div>
                  {coupon && (
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-1" />
                      Kopyala
                    </Button>
                  )}
                </div>

                {/* Başlık + içerik */}
                {coupon?.title && (
                  <div>
                    <h2 className="text-lg font-semibold mb-1">
                      {coupon.title}
                    </h2>
                  </div>
                )}
                {coupon?.content_html && (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: coupon.content_html }}
                  />
                )}

                {/* Özet bilgiler */}
                {coupon && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        İndirim
                      </div>
                      <div className="font-medium">
                        {coupon.discount_type === "percentage"
                          ? `%${coupon.discount_value}`
                          : `${coupon.discount_value} ₺`}
                      </div>
                    </div>

                    {coupon.min_purchase && coupon.min_purchase > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Minimum Alışveriş
                        </div>
                        <div className="font-medium">
                          {coupon.min_purchase.toLocaleString("tr-TR")} ₺
                        </div>
                      </div>
                    )}

                    {coupon.valid_from && (
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Geçerlilik Başlangıcı
                        </div>
                        <div className="font-medium">
                          {new Date(coupon.valid_from).toLocaleDateString(
                            "tr-TR",
                          )}
                        </div>
                      </div>
                    )}

                    {coupon.valid_until && (
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Son Kullanma Tarihi
                        </div>
                        <div className="font-medium">
                          {new Date(coupon.valid_until).toLocaleDateString(
                            "tr-TR",
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isLoading && (
                  <p className="text-sm text-muted-foreground">Yükleniyor…</p>
                )}
                {isError && (
                  <p className="text-sm text-destructive">
                    Kupon bilgileri alınamadı.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
