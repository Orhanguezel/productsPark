// =============================================================
// FILE: src/pages/admin/home-settings/HowItWorksSectionCard.tsx
// =============================================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HomeSettingsSectionProps } from "./types";
import type { HomeSettings } from "./config";

export function HowItWorksSectionCard({
  settings,
  onChange,
}: HomeSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nasıl Çalışır Bölümü</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Başlık</Label>
          <Input
            value={settings.home_how_it_works_title}
            onChange={(e) => onChange({ home_how_it_works_title: e.target.value })}
            placeholder="Nasıl Çalışır?"
          />
        </div>
        <div className="space-y-2">
          <Label>Alt Başlık</Label>
          <Input
            value={settings.home_how_it_works_subtitle}
            onChange={(e) =>
              onChange({ home_how_it_works_subtitle: e.target.value })
            }
            placeholder="4 basit adımda dijital ürününüze sahip olun"
          />
        </div>

        {([1, 2, 3, 4] as const).map((n) => {
          const titleKey = `home_step_${n}_title` as keyof HomeSettings;
          const descKey = `home_step_${n}_desc` as keyof HomeSettings;

          const defaultTitle =
            n === 1
              ? "Ürünü Seçin"
              : n === 2
              ? "Güvenli Ödeme"
              : n === 3
              ? "Anında Teslimat"
              : "7/24 Destek";

          return (
            <div key={n} className="border-t pt-4 space-y-4">
              <h4 className="font-medium">{`Adım ${n}`}</h4>
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={settings[titleKey] as string}
                  onChange={(e) =>
                    onChange({ [titleKey]: e.target.value } as Partial<HomeSettings>)
                  }
                  placeholder={defaultTitle}
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={settings[descKey] as string}
                  onChange={(e) =>
                    onChange({ [descKey]: e.target.value } as Partial<HomeSettings>)
                  }
                  rows={2}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
