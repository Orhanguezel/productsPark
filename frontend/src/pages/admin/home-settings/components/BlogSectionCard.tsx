// =============================================================
// FILE: src/pages/admin/home-settings/BlogSectionCard.tsx
// =============================================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomeSettingsSectionProps } from "./types";

export function BlogSectionCard({ settings, onChange }: HomeSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blog Bölümü</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Rozet Yazısı</Label>
          <Input
            value={settings.home_blog_badge}
            onChange={(e) => onChange({ home_blog_badge: e.target.value })}
            placeholder="Blog Yazılarımız"
          />
        </div>
        <div className="space-y-2">
          <Label>Başlık</Label>
          <Input
            value={settings.home_blog_title}
            onChange={(e) => onChange({ home_blog_title: e.target.value })}
            placeholder="Güncel İçerikler"
          />
        </div>
        <div className="space-y-2">
          <Label>Alt Başlık</Label>
          <Input
            value={settings.home_blog_subtitle}
            onChange={(e) => onChange({ home_blog_subtitle: e.target.value })}
            placeholder="Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler"
          />
        </div>
        <div className="space-y-2">
          <Label>Buton Yazısı</Label>
          <Input
            value={settings.home_blog_button}
            onChange={(e) => onChange({ home_blog_button: e.target.value })}
            placeholder="Tüm Blog Yazıları"
          />
        </div>
      </CardContent>
    </Card>
  );
}
