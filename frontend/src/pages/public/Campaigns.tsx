// =============================================================
// FILE: src/pages/public/Campaigns.tsx
// Aktif kuponları / kampanyaları listeler
// =============================================================

import { Copy, Check, Tag } from "lucide-react";
import { useState } from "react";
import SeoHelmet from "@/seo/SeoHelmet";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useListCouponsQuery } from "@/integrations/hooks";
import { useSeoSettings } from "@/hooks/useSeoSettings";

function CouponCard({ coupon }: { coupon: any }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast({ title: "Kopyalandı!", description: `${coupon.code} kodunu ödeme sayfasında kullanın.` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const discountLabel =
    coupon.discount_type === "percentage"
      ? `%${coupon.discount_value} İndirim`
      : `${coupon.discount_value} ₺ İndirim`;

  const validUntilLabel = coupon.valid_until
    ? `Son: ${new Date(coupon.valid_until).toLocaleDateString("tr-TR")}`
    : "Süresiz";

  return (
    <Card className="flex flex-col h-full border-2 hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{coupon.title || coupon.code}</CardTitle>
          <Badge variant="secondary" className="shrink-0 text-xs font-semibold">
            {discountLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1">
        {/* İçerik */}
        {coupon.content_html && (
          <div
            className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert [&_ul]:pl-4 [&_li]:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: coupon.content_html }}
          />
        )}

        {/* Bilgiler */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto">
          {coupon.min_purchase > 0 && (
            <span className="bg-muted rounded px-2 py-0.5">
              Min. {coupon.min_purchase.toLocaleString("tr-TR")} ₺
            </span>
          )}
          {coupon.max_discount && (
            <span className="bg-muted rounded px-2 py-0.5">
              Max. {coupon.max_discount.toLocaleString("tr-TR")} ₺
            </span>
          )}
          <span className="bg-muted rounded px-2 py-0.5">{validUntilLabel}</span>
          {coupon.usage_limit && (
            <span className="bg-muted rounded px-2 py-0.5">
              {coupon.usage_limit - (coupon.used_count || 0)} kullanım kaldı
            </span>
          )}
        </div>

        {/* Kupon kodu + kopyala */}
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <Tag className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="flex-1 font-mono font-bold text-primary tracking-wider text-sm">
            {coupon.code}
          </span>
          <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 gap-1 text-xs">
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            {copied ? "Kopyalandı" : "Kopyala"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Campaigns() {
  const { settings } = useSeoSettings();
  // FE'de is_active filtresi de uygula (backend validation geçiş güvencesi)
  const { data: rawCoupons = [], isLoading } = useListCouponsQuery({ is_active: 1 });
  const coupons = rawCoupons.filter((c: any) => c.is_active);

  return (
    <>
      <SeoHelmet
        title={settings.seo_campaigns_title}
        description={settings.seo_campaigns_description}
        ogType="website"
      />
      <Navbar />

      <main className="min-h-[60vh] bg-background">
        {/* Hero */}
        <div className="bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-10 text-center">
            <h1 className="text-3xl font-bold mb-2">Kampanyalar & Kuponlar</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Aktif indirim kuponlarını kopyalayın, ödeme sayfasında kullanarak tasarruf edin.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && coupons.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              Şu an aktif kampanya bulunmuyor.
            </div>
          )}

          {!isLoading && coupons.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon: any) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
