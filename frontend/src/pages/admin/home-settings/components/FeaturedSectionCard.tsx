// =============================================================
// FILE: src/pages/admin/home-settings/FeaturedSectionCard.tsx
// =============================================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomeSettingsSectionProps } from "./types";

export function FeaturedSectionCard({
  settings,
  onChange,
}: HomeSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Öne Çıkan Ürünler Bölümü</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Rozet Yazısı</Label>
          <Input
            value={settings.home_featured_badge}
            onChange={(e) => onChange({ home_featured_badge: e.target.value })}
            placeholder="Öne Çıkan Ürünler"
          />
        </div>
        <div className="space-y-2">
          <Label>Başlık</Label>
          <Input
            value={settings.home_featured_title}
            onChange={(e) => onChange({ home_featured_title: e.target.value })}
            placeholder="En çok satan ürünlerimize göz atın"
          />
        </div>
        <div className="space-y-2">
          <Label>Buton Yazısı</Label>
          <Input
            value={settings.home_featured_button}
            onChange={(e) => onChange({ home_featured_button: e.target.value })}
            placeholder="Tüm Ürünleri Görüntüle"
          />
        </div>

        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">📌 Öne Çıkan Ürünler</p>
          <p className="text-xs text-muted-foreground">
            Anasayfada hangi ürünlerin gösterileceğini belirlemek için{" "}
            <strong>Ürün Yönetimi</strong> sayfasından her ürünün
            detayında <strong>"Anasayfada Göster"</strong> seçeneğini
            aktif edin.
            <br />
            Ürünler satış sayısına göre sıralanır ve maksimum 8 ürün
            gösterilir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
