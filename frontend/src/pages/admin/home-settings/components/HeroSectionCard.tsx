// =============================================================
// FILE: src/pages/admin/home-settings/HeroSectionCard.tsx
// =============================================================
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { HomeSettingsSectionProps } from './types';

import { toast } from 'sonner';
import { useCreateAssetAdminMutation } from '@/integrations/hooks';
import { CoverImageSection } from '@/components/common/CoverImageSection';

export function HeroSectionCard({ settings, onChange }: HomeSettingsSectionProps) {
  const [createAsset, { isLoading: isUploading }] = useCreateAssetAdminMutation();

  // Kapak upload handler'ı (CoverImageSection → onPickFile)
  const handlePickHeroFile = async (file: File) => {
    try {
      const asset = await createAsset({
        file,
        bucket: 'home', // storage_assets.bucket
        folder: 'home/hero', // storage_assets.folder
        metadata: { context: 'home_hero' },
      }).unwrap();

      // backend adminCreateAsset → url normalize edilmiş dönüyor
      onChange({ home_hero_image_url: asset.url ?? '' });
      toast.success("Hero görseli yüklendi. Kaydet'e basmayı unutma.");
    } catch (err) {
      console.error('Hero cover upload error:', err);
      toast.error('Hero görseli yüklenirken hata oluştu.');
    }
  };

  const handleRemoveHero = () => {
    onChange({ home_hero_image_url: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Bölümü</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metin alanları */}
        <div className="space-y-2">
          <Label htmlFor="header_top">Üst Rozet Yazısı</Label>
          <Input
            id="header_top"
            value={settings.home_header_top_text}
            onChange={(ev) => onChange({ home_header_top_text: ev.target.value })}
            placeholder="İndirim Sezonu Başladı"
          />
          <p className="text-xs text-muted-foreground">
            Hero bölümünün en üstünde görünen rozet metni
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="header_sub1">Ana Başlık - 1. Satır</Label>
          <Input
            id="header_sub1"
            value={settings.home_header_sub_text_1}
            onChange={(ev) => onChange({ home_header_sub_text_1: ev.target.value })}
            placeholder="Yeni Üyelere Özel"
          />
          <p className="text-xs text-muted-foreground">Hero başlığının ilk satırı (normal yazı)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="header_sub2">Ana Başlık - 2. Satır</Label>
          <Input
            id="header_sub2"
            value={settings.home_header_sub_text_2}
            onChange={(ev) => onChange({ home_header_sub_text_2: ev.target.value })}
            placeholder="%10 Fırsatı Dijimin'de!"
          />
          <p className="text-xs text-muted-foreground">
            Hero başlığının ikinci satırı (gradient efektli)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="header_bottom">Açıklama Metni</Label>
          <Textarea
            id="header_bottom"
            value={settings.home_header_bottom_text}
            onChange={(ev) => onChange({ home_header_bottom_text: ev.target.value })}
            rows={3}
            placeholder="It is a long established fact..."
          />
          <p className="text-xs text-muted-foreground">Hero başlığının altında görünen açıklama</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="button_text">Ana Buton Yazısı</Label>
          <Input
            id="button_text"
            value={settings.home_header_button_text}
            onChange={(ev) => onChange({ home_header_button_text: ev.target.value })}
            placeholder="Ürünleri İncele"
          />
          <p className="text-xs text-muted-foreground">Ana aksiyon butonundaki yazı</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              id="show_contact"
              checked={settings.home_header_show_contact}
              onCheckedChange={(checked) => onChange({ home_header_show_contact: checked })}
            />
            <Label htmlFor="show_contact">İletişime Geç Butonu Göster</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            İkinci buton (İletişime Geç) gösterilsin mi?
          </p>
        </div>

        {/* 🔥 Merkezi CoverImageSection ile Hero görseli */}
        <CoverImageSection
          title="Hero Arka Plan Görseli"
          coverId={undefined} // Şu an storage id'yi HomeSettings'e koymuyoruz
          stagedCoverId={undefined}
          imageUrl={settings.home_hero_image_url}
          alt={
            settings.home_header_top_text ||
            settings.home_header_sub_text_1 ||
            'Hero arka plan görseli'
          }
          saving={isUploading}
          onPickFile={handlePickHeroFile}
          onRemove={handleRemoveHero}
          onUrlChange={(url) => onChange({ home_hero_image_url: url })}
          onAltChange={(_alt) => {
            // İstersen ileride home_hero_image_alt field'ı da eklersin
          }}
          trigger="button"
          inputId="hero-cover-file"
        />

        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">📌 Kategoriler</p>
          <p className="text-xs text-muted-foreground">
            Hero bölümünde gösterilen kategori bilgileri, <strong>Kategoriler</strong> sayfasından
            &quot;Öne Çıkan&quot; olarak işaretlenen ilk kategori gösterilir. Kategorileri yönetmek
            için Kategoriler sayfasına gidin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
